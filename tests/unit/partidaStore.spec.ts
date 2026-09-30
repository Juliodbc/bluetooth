import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { criarJogador, criarPartida } from '@/domain/burro';
import { usePartidaStore } from '@/stores/partidaStore';

describe('store de partida', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('sincroniza somente a mão do jogador destinatário', () => {
    const store = usePartidaStore();
    const partida = criarPartida('p1', 'Partida', 'j1');
    const ana = criarJogador('j1', 'Ana', 0);
    const beto = criarJogador('j2', 'Beto', 1);
    ana.mao = [{ id: 'c1', valor: '7', naipe: 'copas' }];
    beto.mao = [{ id: 'c2', valor: '9', naipe: 'ouros' }];
    partida.jogadores = [ana, beto];
    store.partidaAtual = partida;

    const snapshot = store.snapshotPrivado('j2') as { partida: typeof partida };

    expect(snapshot.partida.jogadores[0].mao).toEqual([]);
    expect(snapshot.partida.jogadores[1].mao).toEqual(beto.mao);
    expect(partida.jogadores[0].mao).toEqual(ana.mao);
  });
});
