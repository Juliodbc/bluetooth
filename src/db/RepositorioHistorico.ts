import { CapacitorSQLite } from '@capacitor-community/sqlite';

import type { HistoricoPartida } from '@/types';

export interface RepositorioHistorico {
  salvar(partida: HistoricoPartida): Promise<void>;
  listar(): Promise<HistoricoPartida[]>;
  obterPorId(id: string): Promise<HistoricoPartida | null>;
  excluir(id: string): Promise<void>;
  limparTudo(): Promise<void>;
}

export class RepositorioHistoricoMock implements RepositorioHistorico {
  private readonly itens = new Map<string, HistoricoPartida>();

  async salvar(partida: HistoricoPartida): Promise<void> {
    this.itens.set(partida.id, { ...partida });
  }

  async listar(): Promise<HistoricoPartida[]> {
    return [...this.itens.values()].map((item) => ({ ...item }));
  }

  async obterPorId(id: string): Promise<HistoricoPartida | null> {
    const item = this.itens.get(id);
    return item ? { ...item } : null;
  }

  async excluir(id: string): Promise<void> {
    this.itens.delete(id);
  }

  async limparTudo(): Promise<void> {
    this.itens.clear();
  }
}

export class RepositorioHistoricoSQLite implements RepositorioHistorico {
  private readonly fallback = new RepositorioHistoricoMock();

  constructor(private readonly dbName = 'burro_historico.db') {}

  private async runWithFallback<T>(exec: () => Promise<T>, fallbackValue: T): Promise<T> {
    try {
      return await exec();
    } catch {
      return fallbackValue;
    }
  }

  private async ensureSchema(): Promise<void> {
    const sqlite = (CapacitorSQLite as any);
    if (!sqlite || typeof sqlite.createConnection !== 'function') {
      return;
    }

    await sqlite.createConnection({ database: this.dbName, version: 1, encrypted: false, mode: 'no-encryption' });
    await sqlite.open({ database: this.dbName });
    await sqlite.execute({
      database: this.dbName,
      statements: [
        `CREATE TABLE IF NOT EXISTS historico_partidas (
          id TEXT PRIMARY KEY,
          partidaId TEXT NOT NULL,
          dataInicio TEXT NOT NULL,
          dataFim TEXT,
          jogadores TEXT NOT NULL,
          vencedor TEXT,
          penalizado TEXT,
          resultadoLocal TEXT,
          motivoEncerramento TEXT,
          status TEXT NOT NULL
        );`,
      ],
    });
  }

  async salvar(partida: HistoricoPartida): Promise<void> {
    const fallback = async () => this.fallback.salvar(partida);

    return this.runWithFallback(async () => {
      await this.ensureSchema();
      const sqlite = (CapacitorSQLite as any);
      if (!sqlite || typeof sqlite.run !== 'function') {
        return fallback();
      }

      await sqlite.run({
        database: this.dbName,
        statement: `INSERT OR REPLACE INTO historico_partidas (id, partidaId, dataInicio, dataFim, jogadores, vencedor, penalizado, resultadoLocal, motivoEncerramento, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          partida.id,
          partida.partidaId,
          partida.dataInicio,
          partida.dataFim ?? null,
          JSON.stringify(partida.jogadores),
          partida.vencedor ?? null,
          partida.penalizado ?? null,
          partida.resultadoLocal ?? null,
          partida.motivoEncerramento ?? null,
          partida.status,
        ],
      });
    }, undefined as never).then(() => undefined);
  }

  async listar(): Promise<HistoricoPartida[]> {
    return this.runWithFallback(async () => {
      await this.ensureSchema();
      const sqlite = (CapacitorSQLite as any);
      if (!sqlite || typeof sqlite.query !== 'function') {
        return this.fallback.listar();
      }

      const resposta = await sqlite.query({
        database: this.dbName,
        statement: 'SELECT * FROM historico_partidas ORDER BY dataInicio DESC',
      });

      const linhas = Array.isArray(resposta.values) ? resposta.values : [];
      return linhas.map((linha: any) => ({
        id: linha.id,
        partidaId: linha.partidaId,
        dataInicio: linha.dataInicio,
        dataFim: linha.dataFim ?? undefined,
        jogadores: JSON.parse(linha.jogadores ?? '[]'),
        vencedor: linha.vencedor ?? undefined,
        penalizado: linha.penalizado ?? undefined,
        resultadoLocal: linha.resultadoLocal ?? undefined,
        motivoEncerramento: linha.motivoEncerramento ?? undefined,
        status: linha.status,
      }));
    }, [] as HistoricoPartida[]);
  }

  async obterPorId(id: string): Promise<HistoricoPartida | null> {
    return this.runWithFallback(async () => {
      await this.ensureSchema();
      const sqlite = (CapacitorSQLite as any);
      if (!sqlite || typeof sqlite.query !== 'function') {
        return this.fallback.obterPorId(id);
      }

      const resposta = await sqlite.query({
        database: this.dbName,
        statement: 'SELECT * FROM historico_partidas WHERE id = ?',
        values: [id],
      });

      const linha = Array.isArray(resposta.values) && resposta.values.length > 0 ? resposta.values[0] : null;
      if (!linha) {
        return null;
      }

      return {
        id: linha.id,
        partidaId: linha.partidaId,
        dataInicio: linha.dataInicio,
        dataFim: linha.dataFim ?? undefined,
        jogadores: JSON.parse(linha.jogadores ?? '[]'),
        vencedor: linha.vencedor ?? undefined,
        penalizado: linha.penalizado ?? undefined,
        resultadoLocal: linha.resultadoLocal ?? undefined,
        motivoEncerramento: linha.motivoEncerramento ?? undefined,
        status: linha.status,
      };
    }, null as HistoricoPartida | null);
  }

  async excluir(id: string): Promise<void> {
    return this.runWithFallback(async () => {
      await this.ensureSchema();
      const sqlite = (CapacitorSQLite as any);
      if (!sqlite || typeof sqlite.run !== 'function') {
        return this.fallback.excluir(id);
      }

      await sqlite.run({
        database: this.dbName,
        statement: 'DELETE FROM historico_partidas WHERE id = ?',
        values: [id],
      });
    }, undefined as never).then(() => undefined);
  }

  async limparTudo(): Promise<void> {
    return this.runWithFallback(async () => {
      await this.ensureSchema();
      const sqlite = (CapacitorSQLite as any);
      if (!sqlite || typeof sqlite.run !== 'function') {
        return this.fallback.limparTudo();
      }

      await sqlite.run({
        database: this.dbName,
        statement: 'DELETE FROM historico_partidas',
      });
    }, undefined as never).then(() => undefined);
  }
}
