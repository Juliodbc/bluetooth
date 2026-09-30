import { describe, expect, it } from 'vitest';

import { deserializarMensagem, fragmentarMensagem, parseMensagem, serializarMensagem } from '@/transport/protocolo';

describe('protocolo de mensagens', () => {
  it('valida uma mensagem correta e preserva o payload', () => {
    const mensagem = {
      tipo: 'PARTIDA_INICIADA',
      partidaId: 'partida-01',
      jogadorId: 'jogador-01',
      versao: 1,
      seq: 2,
      payload: {
        ordemJogadores: ['jogador-01', 'jogador-02'],
        jogadorAtual: 'jogador-01',
        rodada: 1,
      },
    };

    const parsed = parseMensagem(mensagem);
    expect(parsed.tipo).toBe('PARTIDA_INICIADA');
    expect(parsed.payload.ordemJogadores).toHaveLength(2);
  });

  it('rejeita mensagens malformadas', () => {
    expect(() => parseMensagem({
      tipo: 'ERRO',
      partidaId: 'p-1',
      jogadorId: 'j-1',
      versao: 1,
    })).toThrow();
  });

  it('serializa e desserializa o mesmo objeto', () => {
    const mensagem = {
      tipo: 'JOGADA',
      partidaId: 'partida-01',
      jogadorId: 'jogador-01',
      versao: 1,
      seq: 5,
      payload: {
        carta: { id: '7-copas', valor: '7', naipe: 'copas' },
        paraJogadorId: 'jogador-02',
        confirma: true,
      },
    };

    const texto = serializarMensagem(mensagem);
    const retorno = deserializarMensagem(texto);

    expect(retorno.tipo).toBe('JOGADA');
    expect(retorno.payload.carta.valor).toBe('7');
  });

  it('fragmenta e restaura mensagens grandes', () => {
    const mensagem = {
      tipo: 'JOGADA',
      partidaId: 'partida-01',
      jogadorId: 'jogador-01',
      versao: 1,
      seq: 11,
      payload: {
        carta: { id: 'carta-01', valor: '10', naipe: 'espadas' },
        paraJogadorId: 'jogador-02',
        confirma: true,
      },
    };

    const partes = fragmentarMensagem(mensagem, 30);
    expect(partes.length).toBeGreaterThan(1);

    const restaurada = deserializarMensagem(partes.join(''));
    expect(restaurada.payload.paraJogadorId).toBe('jogador-02');
  });
});
