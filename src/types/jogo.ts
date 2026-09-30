export type Naipe = 'ouros' | 'paus' | 'copas' | 'espadas';

export type ValorCarta = string;

export interface Carta {
  id: string;
  valor: ValorCarta;
  naipe: Naipe;
}

export interface Jogador {
  id: string;
  nome: string;
  ordem: number;
  conectado: boolean;
  mao: Carta[];
  letrasBurro: string[];
  ultimaSeqRecebida: number;
  ultimaCartaPassada?: Carta | null;
  ultimaCartaRecebida?: Carta | null;
}

export type StatusPartida =
  | 'aguardando'
  | 'em_andamento'
  | 'finalizada'
  | 'cancelada'
  | 'interrompida';

export type MotivoEncerramento =
  | 'VITORIA'
  | 'ABANDONO'
  | 'DESCONEXAO'
  | 'CANCELADA'
  | 'INTERROMPIDA';

export interface Partida {
  id: string;
  nome: string;
  anfitriaoId: string;
  jogadores: Jogador[];
  rodadaAtual: number;
  vezAtual: number;
  status: StatusPartida;
  dataInicio: string;
  dataFim?: string;
}

export interface ResultadoRodada {
  vencedorId: string;
  penalizadoId: string;
  motivoPenalidade: string;
  rodada: number;
}

export interface HistoricoPartida {
  id: string;
  partidaId: string;
  dataInicio: string;
  dataFim?: string;
  jogadores: string[];
  vencedor?: string;
  penalizado?: string;
  resultadoLocal?: string;
  motivoEncerramento?: MotivoEncerramento;
  status: StatusPartida;
}
