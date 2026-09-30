import type { Mensagem } from '@/types';
import type { PartidaDescoberta, TransporteBluetooth } from './TransporteBluetooth';

export class TransporteMock implements TransporteBluetooth {
  private ouvintes = new Set<(mensagem: Mensagem) => void>();
  private ouvintesDesconexao = new Set<(motivo: string, jogadorId?: string) => void>();
  private conectado = false;

  async iniciarAnfitriao(partidaId?: string): Promise<void> {
    void partidaId;
    this.conectado = true;
  }

  async procurarPartidas(): Promise<PartidaDescoberta[]> {
    return [
      {
        id: 'partida-mock-01',
        nome: 'Partida de teste',
        jogadoresConectados: 1,
        sinal: 4,
      },
    ];
  }

  async conectar(partidaId: string, jogadorId: string): Promise<string> {
    void jogadorId;
    this.conectado = true;
    return partidaId;
  }

  async enviar(_idDestino: string, mensagem: Mensagem): Promise<void> {
    for (const callback of this.ouvintes) {
      callback(mensagem);
    }
  }

  aoReceber(callback: (mensagem: Mensagem, origemId?: string) => void): () => void {
    this.ouvintes.add(callback);

    return () => {
      this.ouvintes.delete(callback);
    };
  }

  aoDesconectar(callback: (motivo: string, jogadorId?: string) => void): () => void {
    this.ouvintesDesconexao.add(callback);

    return () => {
      this.ouvintesDesconexao.delete(callback);
    };
  }

  async desconectar(idDestino?: string): Promise<void> {
    void idDestino;
    this.conectado = false;

    for (const callback of this.ouvintesDesconexao) {
      callback('desconectado');
    }
  }
}
