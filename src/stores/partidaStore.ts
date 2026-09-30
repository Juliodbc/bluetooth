import { Capacitor } from '@capacitor/core';
import { defineStore } from 'pinia';

import {
  adicionarJogador,
  atualizarStatusDeDesconexao,
  criarJogador,
  criarPartida,
  distribuirCartas,
  fazerJogada,
  getJogadorAtual,
  getProximoJogador,
  processarBatida,
} from '@/domain/burro';
import { RepositorioHistoricoSQLite } from '@/db/RepositorioHistorico';
import type { Carta, HistoricoPartida, Mensagem, Partida, ResultadoRodada } from '@/types';
import { VERSAO_PROTOCOLO } from '@/types';
import { TransporteBluetoothReal, TransporteMock } from '@/transport';
import type { PartidaDescoberta, TransporteBluetooth } from '@/transport/TransporteBluetooth';

let transporte: TransporteBluetooth | undefined;
let cancelarRecepcao: (() => void) | undefined;
let cancelarDesconexao: (() => void) | undefined;
let sequencia = 0;
const repositorio = new RepositorioHistoricoSQLite();

function novoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function criarTransporte(papel: 'anfitriao' | 'convidado'): TransporteBluetooth {
  return Capacitor.isNativePlatform() ? new TransporteBluetoothReal(papel) : new TransporteMock();
}

function criarMensagem<T extends Mensagem['tipo']>(
  tipo: T,
  partidaId: string,
  jogadorId: string,
  payload: Extract<Mensagem, { tipo: T }>['payload'],
): Extract<Mensagem, { tipo: T }> {
  sequencia += 1;
  return { tipo, partidaId, jogadorId, versao: VERSAO_PROTOCOLO, seq: sequencia, payload } as Extract<Mensagem, { tipo: T }>;
}

export const usePartidaStore = defineStore('partida', {
  state: () => ({
    partidaAtual: null as Partida | null,
    jogadorLocalId: '',
    statusConexao: 'desconectado' as 'desconectado' | 'conectando' | 'conectado' | 'reconectando',
    erro: null as string | null,
    salasDisponiveis: [] as PartidaDescoberta[],
    anfitriao: false,
    carregando: false,
    resultadoRodada: null as ResultadoRodada | null,
    dispositivoSalaId: '',
    historico: [] as HistoricoPartida[],
  }),
  getters: {
    jogadorLocal: (state) => state.partidaAtual?.jogadores.find((jogador) => jogador.id === state.jogadorLocalId),
    jogadorAtual: (state) => state.partidaAtual ? getJogadorAtual(state.partidaAtual) : undefined,
    proximoJogadorLocal: (state) => state.partidaAtual
      ? getProximoJogador(state.partidaAtual, state.jogadorLocalId)
      : undefined,
  },
  actions: {
    definirJogadorLocal(id: string) {
      this.jogadorLocalId = id;
    },

    atualizarStatusConexao(status: 'desconectado' | 'conectado' | 'conectando' | 'reconectando') {
      this.statusConexao = status;
    },

    async criarSala(nomeJogador: string) {
      await this.limparTransporte();
      this.erro = null;
      this.carregando = true;
      this.anfitriao = true;
      const id = novoId();
      const partida = criarPartida(id, `Partida de ${nomeJogador}`, id);
      const jogador = criarJogador(id, nomeJogador, 0);
      adicionarJogador(partida, jogador);
      this.partidaAtual = partida;
      this.jogadorLocalId = id;
      transporte = criarTransporte('anfitriao');
      this.escutarTransporte();

      try {
        await transporte.iniciarAnfitriao(id);
        this.statusConexao = 'conectado';
      } catch (erro) {
        this.erro = erro instanceof Error ? erro.message : 'Não foi possível iniciar o Bluetooth';
        this.statusConexao = 'desconectado';
      } finally {
        this.carregando = false;
      }
    },

    async buscarSalas() {
      await this.limparTransporte();
      this.erro = null;
      this.carregando = true;
      this.salasDisponiveis = [];
      transporte = criarTransporte('convidado');
      try {
        this.salasDisponiveis = await transporte.procurarPartidas();
      } catch (erro) {
        this.erro = erro instanceof Error ? erro.message : 'Não foi possível buscar partidas';
      } finally {
        this.carregando = false;
      }
    },

    async entrarNaSala(sala: PartidaDescoberta, nomeJogador: string) {
      this.erro = null;
      this.carregando = true;
      this.anfitriao = false;
      const jogadorId = novoId();
      this.jogadorLocalId = jogadorId;
      this.dispositivoSalaId = sala.id;
      this.statusConexao = 'conectando';
      transporte ??= criarTransporte('convidado');
      this.escutarTransporte();

      try {
        const idPartida = await transporte.conectar(sala.id, jogadorId);
        this.partidaAtual = criarPartida(idPartida, sala.nome, idPartida);
        adicionarJogador(this.partidaAtual, criarJogador('anfitriao', 'Anfitrião', 0));
        adicionarJogador(this.partidaAtual, criarJogador(jogadorId, nomeJogador, 1));
        this.statusConexao = 'conectado';
        await this.enviar('anfitriao', criarMensagem('SOLICITACAO_ENTRADA', idPartida, jogadorId, { nome: nomeJogador }));
      } catch (erro) {
        this.statusConexao = 'desconectado';
        this.erro = erro instanceof Error ? erro.message : 'Não foi possível conectar à partida';
      } finally {
        this.carregando = false;
      }
    },

    async iniciarPartida() {
      const partida = this.partidaAtual;
      if (!partida || !this.anfitriao || partida.jogadores.length < 2) {
        this.erro = 'A partida precisa de pelo menos dois jogadores conectados';
        return false;
      }

      distribuirCartas(partida);
      this.erro = null;
      for (const jogador of partida.jogadores) {
        if (jogador.id === this.jogadorLocalId) continue;
        await this.enviar(jogador.id, criarMensagem('PARTIDA_INICIADA', partida.id, this.jogadorLocalId, {
          ordemJogadores: partida.jogadores.map((item) => item.id),
          jogadorAtual: partida.jogadores[partida.vezAtual].id,
          rodada: partida.rodadaAtual,
        }));
        await this.enviar(jogador.id, criarMensagem('ESTADO_SINCRONIZADO', partida.id, this.jogadorLocalId, {
          partidaId: partida.id,
          jogadorId: jogador.id,
          estado: this.snapshotPrivado(jogador.id),
        }));
      }
      return true;
    },

    async passarCarta(carta: Carta) {
      const partida = this.partidaAtual;
      const jogadorAtual = this.jogadorAtual;
      const destino = this.proximoJogadorLocal;
      if (!partida || !jogadorAtual || !destino || jogadorAtual.id !== this.jogadorLocalId) {
        this.erro = 'Ainda não é a sua vez';
        return false;
      }

      if (!this.anfitriao) {
        await this.enviar('anfitriao', criarMensagem('JOGADA', partida.id, this.jogadorLocalId, {
          carta,
          paraJogadorId: destino.id,
          confirma: true,
        }));
        return true;
      }

      if (!fazerJogada(partida, this.jogadorLocalId, carta.id, destino.id)) {
        this.erro = 'A jogada não é válida';
        return false;
      }
      await this.sincronizarJogadores();
      return true;
    },

    async bater() {
      const partida = this.partidaAtual;
      if (!partida) return false;
      if (!this.anfitriao) {
        const carta = this.jogadorLocal?.mao[0];
        if (!carta) {
          this.erro = 'Não há carta para validar a batida';
          return false;
        }
        await this.enviar('anfitriao', criarMensagem('JOGADOR_COMPLETOU', partida.id, this.jogadorLocalId, {
          jogadorId: this.jogadorLocalId,
          carta,
        }));
        return true;
      }

      const resultado = processarBatida(partida, this.jogadorLocalId);
      if (!resultado.encerrouRodada) {
        this.erro = 'Você ainda não tem quatro cartas iguais';
        return false;
      }
      this.resultadoRodada = {
        vencedorId: resultado.vencedorId,
        penalizadoId: resultado.penalizadoId,
        motivoPenalidade: resultado.motivo,
        rodada: partida.rodadaAtual,
      };
      if (partida.status === 'finalizada') {
        await this.finalizarPartida();
      } else {
        await this.sincronizarJogadores();
      }
      return true;
    },

    async receberMensagem(mensagem: Mensagem, origemId?: string) {
      const partida = this.partidaAtual;
      if (!partida || mensagem.partidaId !== partida.id || mensagem.jogadorId === this.jogadorLocalId) return;

      if (mensagem.tipo === 'SOLICITACAO_ENTRADA' && this.anfitriao) {
        if (partida.status !== 'aguardando') {
          await this.enviar(mensagem.jogadorId, criarMensagem('ENTRADA_RECUSADA', partida.id, this.jogadorLocalId, {
            codigo: 'PARTIDA_INICIADA', mensagem: 'Esta partida já começou',
          }));
          return;
        }
        const jogador = criarJogador(mensagem.jogadorId, mensagem.payload.nome, partida.jogadores.length);
        if (!adicionarJogador(partida, jogador)) {
          await this.enviar(mensagem.jogadorId, criarMensagem('ENTRADA_RECUSADA', partida.id, this.jogadorLocalId, {
            codigo: 'SALA_CHEIA', mensagem: 'Não foi possível entrar nesta partida',
          }));
          return;
        }
        const jogadorEntrou = criarMensagem('JOGADOR_ENTROU', partida.id, this.jogadorLocalId, {
          jogadorId: jogador.id,
          nome: jogador.nome,
          ordem: jogador.ordem,
          conectado: true,
        });
        await Promise.all(partida.jogadores
          .filter((item) => item.id !== this.jogadorLocalId)
          .map((item) => this.enviar(item.id, jogadorEntrou).catch(() => undefined)));
        return;
      }

      if (mensagem.tipo === 'JOGADA' && this.anfitriao) {
        if (mensagem.payload.confirma && fazerJogada(partida, mensagem.jogadorId, mensagem.payload.carta.id, mensagem.payload.paraJogadorId)) {
          await this.sincronizarJogadores();
        }
        return;
      }

      if (mensagem.tipo === 'JOGADOR_COMPLETOU' && this.anfitriao) {
        const resultado = processarBatida(partida, mensagem.jogadorId);
        if (!resultado.encerrouRodada) return;
        this.resultadoRodada = {
          vencedorId: resultado.vencedorId,
          penalizadoId: resultado.penalizadoId,
          motivoPenalidade: resultado.motivo,
          rodada: partida.rodadaAtual,
        };
        if (partida.status === 'finalizada') await this.finalizarPartida();
        else await this.sincronizarJogadores();
        return;
      }

      if (mensagem.tipo === 'JOGADOR_ENTROU' && !this.anfitriao) {
        const recebido = mensagem.payload;
        if (!partida.jogadores.some((jogador) => jogador.id === recebido.jogadorId)) {
          adicionarJogador(partida, criarJogador(recebido.jogadorId, recebido.nome, recebido.ordem));
        }
        return;
      }

      if (mensagem.tipo === 'ENTRADA_RECUSADA') {
        this.erro = mensagem.payload.mensagem;
        return;
      }

      if (mensagem.tipo === 'SAIDA_SALA' && this.anfitriao) {
        atualizarStatusDeDesconexao(partida, mensagem.jogadorId, false);
        await this.sincronizarJogadores();
        return;
      }

      if (mensagem.tipo === 'ESTADO_SINCRONIZADO' && !this.anfitriao) {
        const estado = mensagem.payload.estado as { partida?: Partida; resultadoRodada?: ResultadoRodada | null };
        if (estado.partida) this.partidaAtual = estado.partida;
        this.resultadoRodada = estado.resultadoRodada ?? null;
        return;
      }

      if (mensagem.tipo === 'PARTIDA_FINALIZADA') {
        partida.status = 'finalizada';
        this.resultadoRodada = {
          vencedorId: mensagem.payload.vencedorId ?? '',
          penalizadoId: mensagem.payload.penalizadoId ?? '',
          motivoPenalidade: mensagem.payload.motivo,
          rodada: partida.rodadaAtual,
        };
        await this.gravarHistorico(mensagem.payload.vencedorId, mensagem.payload.penalizadoId);
      }

      void origemId;
    },

    async sairDaSala() {
      if (this.partidaAtual) {
        await this.enviar('', criarMensagem('SAIDA_SALA', this.partidaAtual.id, this.jogadorLocalId, { motivo: 'jogador saiu da sala' }));
      }
      await this.limparTransporte();
      this.limpar();
    },

    async carregarHistorico() {
      this.historico = await repositorio.listar();
    },

    async limparTransporte() {
      cancelarRecepcao?.();
      cancelarDesconexao?.();
      cancelarRecepcao = undefined;
      cancelarDesconexao = undefined;
      if (transporte) await transporte.desconectar(this.dispositivoSalaId).catch(() => undefined);
      transporte = undefined;
      sequencia = 0;
    },

    async enviar(destinoId: string, mensagem: Mensagem) {
      if (!transporte) throw new Error('O transporte Bluetooth não está inicializado');
      await transporte.enviar(destinoId, mensagem);
    },

    escutarTransporte() {
      cancelarRecepcao?.();
      cancelarDesconexao?.();
      cancelarRecepcao = transporte?.aoReceber((mensagem, origemId) => {
        void this.receberMensagem(mensagem, origemId);
      });
      cancelarDesconexao = transporte?.aoDesconectar((motivo, jogadorId) => {
        if (this.anfitriao && jogadorId && this.partidaAtual) {
          atualizarStatusDeDesconexao(this.partidaAtual, jogadorId, false);
          this.erro = `${motivo}; o anfitrião pode continuar a partida`;
          return;
        }
        this.statusConexao = 'desconectado';
        this.erro = motivo;
      });
    },

    snapshotPrivado(jogadorId: string) {
      if (!this.partidaAtual) return {};
      const partida: Partida = {
        ...this.partidaAtual,
        jogadores: this.partidaAtual.jogadores.map((jogador) => ({
          ...jogador,
          mao: jogador.id === jogadorId ? jogador.mao.map((carta) => ({ ...carta })) : [],
          letrasBurro: [...jogador.letrasBurro],
        })),
      };
      return { partida, resultadoRodada: this.resultadoRodada };
    },

    async sincronizarJogadores() {
      const partida = this.partidaAtual;
      if (!partida) return;
      for (const jogador of partida.jogadores) {
        if (jogador.id === this.jogadorLocalId) continue;
        await this.enviar(jogador.id, criarMensagem('ESTADO_SINCRONIZADO', partida.id, this.jogadorLocalId, {
          partidaId: partida.id,
          jogadorId: jogador.id,
          estado: this.snapshotPrivado(jogador.id),
        })).catch(() => undefined);
      }
    },

    async finalizarPartida() {
      const partida = this.partidaAtual;
      if (!partida || !this.resultadoRodada) return;
      await this.sincronizarJogadores();
      for (const jogador of partida.jogadores) {
        if (jogador.id === this.jogadorLocalId) continue;
        await this.enviar(jogador.id, criarMensagem('PARTIDA_FINALIZADA', partida.id, this.jogadorLocalId, {
          vencedorId: this.resultadoRodada.vencedorId,
          penalizadoId: this.resultadoRodada.penalizadoId,
          motivo: this.resultadoRodada.motivoPenalidade,
          status: 'VITORIA',
        })).catch(() => undefined);
      }
      await this.gravarHistorico(this.resultadoRodada.vencedorId, this.resultadoRodada.penalizadoId);
    },

    async gravarHistorico(vencedorId?: string, penalizadoId?: string) {
      const partida = this.partidaAtual;
      if (!partida) return;
      const registro: HistoricoPartida = {
        id: partida.id,
        partidaId: partida.id,
        dataInicio: partida.dataInicio,
        dataFim: new Date().toISOString(),
        jogadores: partida.jogadores.map((jogador) => jogador.nome),
        vencedor: partida.jogadores.find((jogador) => jogador.id === vencedorId)?.nome,
        penalizado: partida.jogadores.find((jogador) => jogador.id === penalizadoId)?.nome,
        resultadoLocal: this.resultadoRodada?.motivoPenalidade,
        status: 'finalizada',
      };
      await repositorio.salvar(registro);
    },

    limpar() {
      this.partidaAtual = null;
      this.jogadorLocalId = '';
      this.statusConexao = 'desconectado';
      this.erro = null;
      this.salasDisponiveis = [];
      this.anfitriao = false;
      this.carregando = false;
      this.resultadoRodada = null;
      this.dispositivoSalaId = '';
      this.historico = [];
    },
  },
});