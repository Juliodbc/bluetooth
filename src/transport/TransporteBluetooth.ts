import type { Mensagem } from '@/types';

export interface PartidaDescoberta {
  id: string;
  partidaId?: string;
  nome: string;
  jogadoresConectados: number;
  sinal?: number;
}

export interface TransporteBluetooth {
  iniciarAnfitriao(partidaId?: string): Promise<void>;
  procurarPartidas(): Promise<PartidaDescoberta[]>;
  conectar(dispositivoId: string, jogadorId: string): Promise<string>;
  enviar(idDestino: string, mensagem: Mensagem): Promise<void>;
  aoReceber(callback: (mensagem: Mensagem, origemId?: string) => void): () => void;
  aoDesconectar(callback: (motivo: string, jogadorId?: string) => void): () => void;
  desconectar(idDestino?: string): Promise<void>;
}
