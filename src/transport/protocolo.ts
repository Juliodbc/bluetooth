import { z } from 'zod';

import type { Mensagem } from '@/types';

const cartaSchema = z.object({
  id: z.string(),
  valor: z.string(),
  naipe: z.enum(['ouros', 'paus', 'copas', 'espadas']),
});

const baseSchema = z.object({
  tipo: z.enum([
    'SOLICITACAO_ENTRADA',
    'JOGADOR_ENTROU',
    'PARTIDA_INICIADA',
    'JOGADA',
    'TROCA_REALIZADA',
    'JOGADOR_COMPLETOU',
    'PARTIDA_FINALIZADA',
    'JOGADOR_DESCONECTADO',
    'RECONEXAO',
    'ENTRADA_RECUSADA',
    'ESTADO_SINCRONIZADO',
    'ERRO',
    'SAIDA_SALA',
  ]),
  partidaId: z.string().min(1),
  jogadorId: z.string().min(1),
  versao: z.number().int().positive(),
  seq: z.number().int().nonnegative(),
});

const esquemaMensagem = z.discriminatedUnion('tipo', [
  baseSchema.extend({
    tipo: z.literal('SOLICITACAO_ENTRADA'),
    payload: z.object({
      nome: z.string().min(1),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('JOGADOR_ENTROU'),
    payload: z.object({
      jogadorId: z.string().min(1),
      nome: z.string().min(1),
      ordem: z.number().int().nonnegative(),
      conectado: z.boolean(),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('PARTIDA_INICIADA'),
    payload: z.object({
      ordemJogadores: z.array(z.string().min(1)),
      jogadorAtual: z.string().min(1),
      rodada: z.number().int().positive(),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('JOGADA'),
    payload: z.object({
      carta: cartaSchema,
      paraJogadorId: z.string().min(1),
      confirma: z.boolean(),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('TROCA_REALIZADA'),
    payload: z.object({
      origemJogadorId: z.string().min(1),
      destinoJogadorId: z.string().min(1),
      cartaEnviada: cartaSchema,
      cartaRecebida: cartaSchema.optional(),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('JOGADOR_COMPLETOU'),
    payload: z.object({
      jogadorId: z.string().min(1),
      carta: cartaSchema,
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('PARTIDA_FINALIZADA'),
    payload: z.object({
      vencedorId: z.string().min(1).optional(),
      penalizadoId: z.string().min(1).optional(),
      motivo: z.string().min(1),
      status: z.enum(['VITORIA', 'ABANDONO', 'DESCONEXAO', 'CANCELADA', 'INTERROMPIDA']),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('JOGADOR_DESCONECTADO'),
    payload: z.object({
      jogadorId: z.string().min(1),
      motivo: z.string().min(1),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('RECONEXAO'),
    payload: z.object({
      jogadorId: z.string().min(1),
      ultimaSeqRecebida: z.number().int().nonnegative(),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('ENTRADA_RECUSADA'),
    payload: z.object({
      codigo: z.string().min(1),
      mensagem: z.string().min(1),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('ESTADO_SINCRONIZADO'),
    payload: z.object({
      partidaId: z.string().min(1),
      jogadorId: z.string().min(1),
      estado: z.record(z.unknown()),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('ERRO'),
    payload: z.object({
      codigo: z.string().min(1),
      mensagem: z.string().min(1),
    }),
  }),
  baseSchema.extend({
    tipo: z.literal('SAIDA_SALA'),
    payload: z.object({
      motivo: z.string().min(1),
    }),
  }),
]);

export function parseMensagem(raw: unknown): Mensagem {
  const parsed = esquemaMensagem.parse(raw);
  return parsed as Mensagem;
}

export function serializarMensagem(mensagem: Mensagem): string {
  return JSON.stringify(mensagem);
}

export function deserializarMensagem(raw: string): Mensagem {
  const texto = raw.trim();

  if (texto.startsWith('f:')) {
    const blocos = [...texto.matchAll(/f:(\d+)\/(\d+):([\s\S]*?)(?=f:\d+\/\d+:|$)/g)];

    if (blocos.length === 0) {
      throw new Error('Fragmento de mensagem inválido');
    }

    const ordem = [...blocos].sort((a, b) => Number(a[1]) - Number(b[1]));
    const combinado = ordem.map((item) => item[3]).join('');
    return parseMensagem(JSON.parse(combinado));
  }

  return parseMensagem(JSON.parse(texto));
}

export function fragmentarMensagem(mensagem: Mensagem, tamanhoMaximo = 120): string[] {
  const texto = serializarMensagem(mensagem);

  if (texto.length <= tamanhoMaximo) {
    return [texto];
  }

  const total = Math.ceil(texto.length / tamanhoMaximo);
  const partes: string[] = [];

  for (let indice = 0; indice < total; indice += 1) {
    const inicio = indice * tamanhoMaximo;
    const parte = texto.slice(inicio, inicio + tamanhoMaximo);
    partes.push(`f:${indice + 1}/${total}:${parte}`);
  }

  return partes;
}
