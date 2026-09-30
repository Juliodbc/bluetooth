import type { Carta, Jogador, Naipe, Partida } from '@/types';

const NAIPES: Naipe[] = ['ouros', 'paus', 'copas', 'espadas'];
const LETRAS_BURRO = ['B', 'U', 'R', 'R', 'O'];

export function criarJogador(id: string, nome: string, ordem: number): Jogador {
  return {
    id,
    nome,
    ordem,
    conectado: true,
    mao: [],
    letrasBurro: [],
    ultimaSeqRecebida: 0,
    ultimaCartaPassada: null,
    ultimaCartaRecebida: null,
  };
}

export function criarPartida(id: string, nome: string, anfitriaoId: string): Partida {
  return {
    id,
    nome,
    anfitriaoId,
    jogadores: [],
    rodadaAtual: 1,
    vezAtual: 0,
    status: 'aguardando',
    dataInicio: new Date().toISOString(),
  };
}

export function adicionarJogador(partida: Partida, jogador: Jogador): boolean {
  if (partida.jogadores.length >= 6) {
    return false;
  }

  if (partida.jogadores.some((item) => item.id === jogador.id)) {
    return false;
  }

  partida.jogadores.push(jogador);
  partida.jogadores = [...partida.jogadores].sort((a, b) => a.ordem - b.ordem);

  return true;
}

export function removerJogador(partida: Partida, jogadorId: string): boolean {
  const indiceInicial = partida.jogadores.findIndex((j) => j.id === jogadorId);

  if (indiceInicial === -1) {
    return false;
  }

  partida.jogadores.splice(indiceInicial, 1);

  if (partida.jogadores.length === 0) {
    partida.status = 'cancelada';
  }

  if (partida.vezAtual >= partida.jogadores.length) {
    partida.vezAtual = 0;
  }

  return true;
}

export function criarBaralho(qtdJogadores: number): Carta[] {
  const valores = Array.from({ length: Math.max(1, qtdJogadores) }, (_, index) => String(index + 1));
  const baralho: Carta[] = [];

  valores.forEach((valor, valorIndex) => {
    NAIPES.forEach((naipe, naipeIndex) => {
      baralho.push({
        id: `${valor}-${naipe}-${valorIndex}-${naipeIndex}`,
        valor,
        naipe,
      });
    });
  });

  if (baralho.length > 0) {
    baralho.push({
      id: `${baralho[0].valor}-extra-${Date.now()}`,
      valor: baralho[0].valor,
      naipe: baralho[0].naipe,
    });
  }

  return baralho;
}

export function embaralharBaralho(baralho: Carta[]): Carta[] {
  const copia = [...baralho];

  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

export function distribuirCartas(partida: Partida): Carta[] {
  if (partida.jogadores.length === 0) {
    return [];
  }

  const baralho = embaralharBaralho(criarBaralho(partida.jogadores.length));
  const distribuicao: Carta[] = [];

  partida.jogadores.forEach((jogador) => {
    jogador.mao = [];
  });

  for (let i = 0; i < 4; i += 1) {
    partida.jogadores.forEach((jogador) => {
      const carta = baralho.shift();
      if (carta) {
        jogador.mao.push(carta);
        distribuicao.push(carta);
      }
    });
  }

  const primeiroJogador = partida.jogadores[0];
  const cartaExtra = baralho.shift();
  if (primeiroJogador && cartaExtra) {
    primeiroJogador.mao.push(cartaExtra);
    distribuicao.push(cartaExtra);
  }

  partida.status = 'em_andamento';
  partida.vezAtual = 0;

  return distribuicao;
}

export function getJogadorAtual(partida: Partida): Jogador | undefined {
  return partida.jogadores[partida.vezAtual];
}

export function getProximoJogador(partida: Partida, jogadorId: string): Jogador | undefined {
  const indiceAtual = partida.jogadores.findIndex((j) => j.id === jogadorId);
  if (indiceAtual === -1) {
    return undefined;
  }

  const indiceProximo = (indiceAtual + 1) % partida.jogadores.length;
  return partida.jogadores[indiceProximo];
}

export function fazerJogada(partida: Partida, jogadorId: string, cartaId: string, destinoJogadorId: string): boolean {
  const jogadorAtual = getJogadorAtual(partida);
  if (!jogadorAtual || jogadorAtual.id !== jogadorId) {
    return false;
  }

  const destino = partida.jogadores.find((j) => j.id === destinoJogadorId);
  if (!destino) {
    return false;
  }

  const carta = jogadorAtual.mao.find((c) => c.id === cartaId);
  if (!carta) {
    return false;
  }

  const proximoEsperado = getProximoJogador(partida, jogadorId);
  if (!proximoEsperado || proximoEsperado.id !== destinoJogadorId) {
    return false;
  }

  jogadorAtual.mao = jogadorAtual.mao.filter((item) => item.id !== cartaId);
  destino.mao.push(carta);
  jogadorAtual.ultimaCartaPassada = carta;
  destino.ultimaCartaRecebida = carta;

  const indiceAtual = partida.jogadores.findIndex((j) => j.id === jogadorId);
  const indiceProximo = (indiceAtual + 1) % partida.jogadores.length;
  partida.vezAtual = indiceProximo;

  return true;
}

export function recomporCartasPorTroca(partida: Partida, origemId: string, destinoId: string, cartaId: string): boolean {
  const origem = partida.jogadores.find((jogador) => jogador.id === origemId);
  const destino = partida.jogadores.find((jogador) => jogador.id === destinoId);

  if (!origem || !destino) {
    return false;
  }

  const cartaNaOrigem = origem.mao.find((item) => item.id === cartaId);
  if (cartaNaOrigem) {
    return true;
  }

  return origem.ultimaCartaPassada?.id === cartaId || destino.ultimaCartaRecebida?.id === cartaId;
}

export function formarGrupoDeQuatro(mao: Carta[]): boolean {
  const contagem = new Map<string, number>();

  mao.forEach((carta) => {
    contagem.set(carta.valor, (contagem.get(carta.valor) ?? 0) + 1);
  });

  return Array.from(contagem.values()).some((quantidade) => quantidade >= 4);
}

export function obterPenalizadoDaRodada(
  partida: Partida,
  jogadorQueBateuId: string,
  jogadores: Jogador[] = partida.jogadores,
): { penalizadoId: string; motivo: string } {
  const grupoPorJogador = jogadores.map((jogador) => {
    const contagem = new Map<string, number>();
    jogador.mao.forEach((carta) => {
      contagem.set(carta.valor, (contagem.get(carta.valor) ?? 0) + 1);
    });

    const maiorGrupo = Math.max(0, ...Array.from(contagem.values()));
    const ultimoEnvio = jogador.ultimaCartaPassada ? 1 : 0;
    return {
      jogador,
      maiorGrupo,
      ultimoEnvio,
    };
  });

  const menorGrupo = Math.min(...grupoPorJogador.map((item) => item.maiorGrupo));
  const candidatos = grupoPorJogador.filter((item) => item.maiorGrupo === menorGrupo);

  if (candidatos.length === 1) {
    return {
      penalizadoId: candidatos[0].jogador.id,
      motivo: `maior grupo de ${candidatos[0].maiorGrupo}`,
    };
  }

  const candidatoMaisRecente = candidatos.sort((a, b) => b.ultimoEnvio - a.ultimoEnvio)[0];
  if (candidatoMaisRecente) {
    return {
      penalizadoId: candidatoMaisRecente.jogador.id,
      motivo: `desempate por última carta antes da batida`,
    };
  }

  const ordemFinal = [...candidatos].sort((a, b) => a.jogador.ordem - b.jogador.ordem)[0];
  return {
    penalizadoId: ordemFinal.jogador.id,
    motivo: 'desempate por ordem',
  };
}

export function processarBatida(partida: Partida, jogadorId: string): {
  encerrouRodada: boolean;
  vencedorId: string;
  penalizadoId: string;
  motivo: string;
  proximoStatus?: string;
} {
  const jogador = partida.jogadores.find((item) => item.id === jogadorId);
  if (!jogador) {
    return {
      encerrouRodada: false,
      vencedorId: '',
      penalizadoId: '',
      motivo: 'jogador inexistente',
    };
  }

  if (!formarGrupoDeQuatro(jogador.mao)) {
    return {
      encerrouRodada: false,
      vencedorId: '',
      penalizadoId: '',
      motivo: 'sem grupo de 4',
    };
  }

  const penalizado = obterPenalizadoDaRodada(partida, jogadorId);

  jogador.letrasBurro.push(...LETRAS_BURRO.slice(jogador.letrasBurro.length, jogador.letrasBurro.length + 1));
  if (jogador.letrasBurro.length >= 5) {
    partida.status = 'finalizada';
  }

  const penalizadoJogador = partida.jogadores.find((item) => item.id === penalizado.penalizadoId);
  if (penalizadoJogador) {
    const letrasAtuais = penalizadoJogador.letrasBurro.length;
    const restante = LETRAS_BURRO.slice(letrasAtuais, letrasAtuais + 1);
    if (restante.length > 0) {
      penalizadoJogador.letrasBurro.push(restante[0]);
    }
  }

  return {
    encerrouRodada: true,
    vencedorId: jogadorId,
    penalizadoId: penalizado.penalizadoId,
    motivo: penalizado.motivo,
    proximoStatus: partida.status,
  };
}

export function atualizarStatusDeDesconexao(partida: Partida, jogadorId: string, conectado: boolean): boolean {
  const jogador = partida.jogadores.find((item) => item.id === jogadorId);
  if (!jogador) {
    return false;
  }

  jogador.conectado = conectado;
  return true;
}

export function iniciarReconexao(partida: Partida, jogadorId: string): boolean {
  return atualizarStatusDeDesconexao(partida, jogadorId, true);
}

export function deveEncerrarPartida(partida: Partida): boolean {
  return partida.status === 'finalizada' || partida.status === 'cancelada' || partida.status === 'interrompida';
}
