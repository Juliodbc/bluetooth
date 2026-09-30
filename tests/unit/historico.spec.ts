import { describe, expect, it } from 'vitest';

import { RepositorioHistoricoMock } from '@/db';

describe('histórico local', () => {
  it('salva, lista, consulta e exclui uma partida', async () => {
    const repo = new RepositorioHistoricoMock();

    await repo.salvar({
      id: 'h-1',
      partidaId: 'partida-1',
      dataInicio: '2026-09-30T10:00:00.000Z',
      jogadores: ['Ana', 'Beto', 'Cleo'],
      vencedor: 'Ana',
      penalizado: 'Beto',
      motivoEncerramento: 'VITORIA',
      status: 'finalizada',
    });

    expect((await repo.listar()).length).toBe(1);
    expect(await repo.obterPorId('h-1')).toMatchObject({ partidaId: 'partida-1' });

    await repo.excluir('h-1');
    expect(await repo.obterPorId('h-1')).toBeNull();
  });

  it('limpa todo o histórico', async () => {
    const repo = new RepositorioHistoricoMock();

    await repo.salvar({
      id: 'h-2',
      partidaId: 'partida-2',
      dataInicio: '2026-09-30T11:00:00.000Z',
      jogadores: ['Ana'],
      status: 'cancelada',
    });

    await repo.limparTudo();
    expect(await repo.listar()).toEqual([]);
  });
});
