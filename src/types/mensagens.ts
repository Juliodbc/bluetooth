import type { Carta } from './jogo';

export const VERSAO_PROTOCOLO = 1;

export type TipoMensagem =
  | 'SOLICITACAO_ENTRADA'
  | 'JOGADOR_ENTROU'
  | 'PARTIDA_INICIADA'
  | 'JOGADA'
  | 'TROCA_REALIZADA'
  | 'JOGADOR_COMPLETOU'
  | 'PARTIDA_FINALIZADA'
  | 'JOGADOR_DESCONECTADO'
  | 'RECONEXAO'
  | 'ENTRADA_RECUSADA'
  | 'ESTADO_SINCRONIZADO'
  | 'ERRO'
  | 'SAIDA_SALA';

export interface MensagemBase {
  tipo: TipoMensagem;
  partidaId: string;
  jogadorId: string;
  versao: number;
  seq: number;
}

export interface SolicitaçãoEntradaPayload {
  nome: string;
}

export interface JogadorEntrouPayload {
  jogadorId: string;
  nome: string;
  ordem: number;
  conectado: boolean;
}

export interface PartidaIniciadaPayload {
  ordemJogadores: string[];
  jogadorAtual: string;
  rodada: number;
}

export interface JogadaPayload {
  carta: Carta;
  paraJogadorId: string;
  confirma: boolean;
}

export interface TrocaRealizadaPayload {
  origemJogadorId: string;
  destinoJogadorId: string;
  cartaEnviada: Carta;
  cartaRecebida?: Carta;
}

export interface JogadorCompletouPayload {
  jogadorId: string;
  carta: Carta;
}

export interface PartidaFinalizadaPayload {
  vencedorId?: string;
  penalizadoId?: string;
  motivo: string;
  status: 'VITORIA' | 'ABANDONO' | 'DESCONEXAO' | 'CANCELADA' | 'INTERROMPIDA';
}

export interface JogadorDesconectadoPayload {
  jogadorId: string;
  motivo: string;
}

export interface ReconexaoPayload {
  jogadorId: string;
  ultimaSeqRecebida: number;
}

export interface EstadoSincronizadoPayload {
  partidaId: string;
  jogadorId: string;
  estado: Record<string, unknown>;
}

export interface ErroPayload {
  codigo: string;
  mensagem: string;
}

export interface MensagemSolicitacaoEntrada extends MensagemBase {
  tipo: 'SOLICITACAO_ENTRADA';
  payload: SolicitaçãoEntradaPayload;
}

export interface MensagemJogadorEntrou extends MensagemBase {
  tipo: 'JOGADOR_ENTROU';
  payload: JogadorEntrouPayload;
}

export interface MensagemPartidaIniciada extends MensagemBase {
  tipo: 'PARTIDA_INICIADA';
  payload: PartidaIniciadaPayload;
}

export interface MensagemJogada extends MensagemBase {
  tipo: 'JOGADA';
  payload: JogadaPayload;
}

export interface MensagemTrocaRealizada extends MensagemBase {
  tipo: 'TROCA_REALIZADA';
  payload: TrocaRealizadaPayload;
}

export interface MensagemJogadorCompletou extends MensagemBase {
  tipo: 'JOGADOR_COMPLETOU';
  payload: JogadorCompletouPayload;
}

export interface MensagemPartidaFinalizada extends MensagemBase {
  tipo: 'PARTIDA_FINALIZADA';
  payload: PartidaFinalizadaPayload;
}

export interface MensagemJogadorDesconectado extends MensagemBase {
  tipo: 'JOGADOR_DESCONECTADO';
  payload: JogadorDesconectadoPayload;
}

export interface MensagemReconexao extends MensagemBase {
  tipo: 'RECONEXAO';
  payload: ReconexaoPayload;
}

export interface MensagemEntradaRecusada extends MensagemBase {
  tipo: 'ENTRADA_RECUSADA';
  payload: ErroPayload;
}

export interface MensagemEstadoSincronizado extends MensagemBase {
  tipo: 'ESTADO_SINCRONIZADO';
  payload: EstadoSincronizadoPayload;
}

export interface MensagemErro extends MensagemBase {
  tipo: 'ERRO';
  payload: ErroPayload;
}

export interface MensagemSaidaSala extends MensagemBase {
  tipo: 'SAIDA_SALA';
  payload: { motivo: string };
}

export type Mensagem =
  | MensagemSolicitacaoEntrada
  | MensagemJogadorEntrou
  | MensagemPartidaIniciada
  | MensagemJogada
  | MensagemTrocaRealizada
  | MensagemJogadorCompletou
  | MensagemPartidaFinalizada
  | MensagemJogadorDesconectado
  | MensagemReconexao
  | MensagemEntradaRecusada
  | MensagemEstadoSincronizado
  | MensagemErro
  | MensagemSaidaSala;
