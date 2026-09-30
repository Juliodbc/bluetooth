import { describe, expect, it } from 'vitest';

import {
  adicionarJogador,
  criarBaralho,
  criarJogador,
  criarPartida,
  distribuirCartas,
  fazerJogada,
  formarGrupoDeQuatro,
  getJogadorAtual,
  getProximoJogador,
  obterPenalizadoDaRodada,
  processarBatida,
  recomporCartasPorTroca,
  removerJogador,
} from '@/domain/burro';

describe('dominio do burro', () => {
  it('cria um baralho com N valores e 4 naipes', () => {
    const baralho = criarBaralho(4);
    expect(baralho).toHaveLength(17);
    const valores = [...new Set(baralho.map((c) => c.valor))];
    expect(valores).toHaveLength(4);
    expect(baralho.every((c) => c.naipe)).toBe(true);
  });

  it('cria uma partida e permite entrada de 2 e de varios jogadores', () => {
    const partida = criarPartida('p1', 'Partida 1', 'host-1');

    const j1 = criarJogador('j1', 'Ana', 0);
    const j2 = criarJogador('j2', 'Beto', 1);
    const j3 = criarJogador('j3', 'Cleo', 2);
    const j4 = criarJogador('j4', 'Dani', 3);

    expect(adicionarJogador(partida, j1)).toBe(true);
    expect(adicionarJogador(partida, j2)).toBe(true);
    expect(adicionarJogador(partida, j3)).toBe(true);
    expect(adicionarJogador(partida, j4)).toBe(true);
    expect(partida.jogadores).toHaveLength(4);
    expect(partida.status).toBe('aguardando');
  });

  it('recusa entrada quando a partida está cheia ou o jogador já existe', () => {
    const partida = criarPartida('p2', 'Partida 2', 'host-1');

    for (let i = 0; i < 6; i += 1) {
      const jogador = criarJogador(`j-${i}`, `Jogador ${i}`, i);
      adicionarJogador(partida, jogador);
    }

    expect(adicionarJogador(partida, criarJogador('j-7', 'Novo', 6))).toBe(false);
    expect(adicionarJogador(partida, criarJogador('j-0', 'Duplicado', 0))).toBe(false);
  });

  it('distribui cartas e fixa o primeiro jogador com 5 cartas', () => {
    const partida = criarPartida('p3', 'Partida 3', 'host-1');

    ['j1', 'j2', 'j3', 'j4'].forEach((id, index) => {
      adicionarJogador(partida, criarJogador(id, `Jogador ${index + 1}`, index));
    });

    distribuirCartas(partida);

    expect(partida.jogadores.every((j) => j.mao.length >= 4)).toBe(true);
    expect(getJogadorAtual(partida)?.mao.length).toBe(5);
  });

  it('realiza troca de cartas e mantém a ordem', () => {
    const partida = criarPartida('p4', 'Partida 4', 'host-1');
    ['j1', 'j2', 'j3', 'j4'].forEach((id, index) => {
      adicionarJogador(partida, criarJogador(id, `Jogador ${index + 1}`, index));
    });

    distribuirCartas(partida);
    const atual = getJogadorAtual(partida)!;
    const carta = atual.mao[0];
    const proximo = getProximoJogador(partida, atual.id)!;

    const ok = fazerJogada(partida, atual.id, carta.id, proximo.id);

    expect(ok).toBe(true);
    expect(recomporCartasPorTroca(partida, atual.id, proximo.id, carta.id)).toBeTruthy();
    expect(partida.vezAtual).toBe(1);
  });

  it('bloqueia jogada fora do turno', () => {
    const partida = criarPartida('p5', 'Partida 5', 'host-1');
    ['j1', 'j2', 'j3', 'j4'].forEach((id, index) => {
      adicionarJogador(partida, criarJogador(id, `Jogador ${index + 1}`, index));
    });

    distribuirCartas(partida);
    const atual = getJogadorAtual(partida)!;
    const jogadorForaTurno = partida.jogadores.find((j) => j.id !== atual.id)!;
    const carta = jogadorForaTurno.mao[0];

    expect(fazerJogada(partida, jogadorForaTurno.id, carta.id, atual.id)).toBe(false);
  });

  it('detecta formacao de 4 iguais e encerra rodada', () => {
    const partida = criarPartida('p6', 'Partida 6', 'host-1');
    ['j1', 'j2', 'j3', 'j4'].forEach((id, index) => {
      adicionarJogador(partida, criarJogador(id, `Jogador ${index + 1}`, index));
    });

    const jogador = partida.jogadores[0];
    jogador.mao = [
      { id: 'c1', valor: '7', naipe: 'copas' },
      { id: 'c2', valor: '7', naipe: 'ouros' },
      { id: 'c3', valor: '7', naipe: 'paus' },
      { id: 'c4', valor: '7', naipe: 'espadas' },
    ];

    expect(formarGrupoDeQuatro(jogador.mao)).toBe(true);

    const resultado = processarBatida(partida, jogador.id);
    expect(resultado.encerrouRodada).toBe(true);
    expect(resultado.vencedorId).toBe(jogador.id);
  });

  it('aplica a penalidade deterministica do burro', () => {
    const partida = criarPartida('p7', 'Partida 7', 'host-1');
    ['j1', 'j2', 'j3'].forEach((id, index) => {
      adicionarJogador(partida, criarJogador(id, `Jogador ${index + 1}`, index));
    });

    const j1 = partida.jogadores[0];
    const j2 = partida.jogadores[1];
    const j3 = partida.jogadores[2];

    j1.mao = [
      { id: 'a1', valor: '5', naipe: 'copas' },
      { id: 'a2', valor: '5', naipe: 'ouros' },
      { id: 'a3', valor: '8', naipe: 'paus' },
    ];
    j2.mao = [
      { id: 'b1', valor: '9', naipe: 'copas' },
      { id: 'b2', valor: '9', naipe: 'ouros' },
      { id: 'b3', valor: '9', naipe: 'paus' },
    ];
    j3.mao = [
      { id: 'c1', valor: '2', naipe: 'copas' },
      { id: 'c2', valor: '2', naipe: 'ouros' },
      { id: 'c3', valor: '2', naipe: 'paus' },
    ];

    const resultado = obterPenalizadoDaRodada(partida, j2.id, [j1, j2, j3]);
    expect(resultado.penalizadoId).toBe('j1');
  });

  it('remove jogador e permite reconexão', () => {
    const partida = criarPartida('p8', 'Partida 8', 'host-1');
    adicionarJogador(partida, criarJogador('j1', 'Ana', 0));
    adicionarJogador(partida, criarJogador('j2', 'Beto', 1));

    expect(removerJogador(partida, 'j2')).toBe(true);
    expect(partida.jogadores).toHaveLength(1);
  });
});
