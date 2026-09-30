# Protocolo do jogo Burro

## Visão geral

Todas as mensagens entre dispositivos usam JSON com os campos obrigatórios:

- `tipo`
- `partidaId`
- `jogadorId`
- `versao`
- `seq`
- `payload`

Exemplo base:

```json
{
  "tipo": "JOGADA",
  "partidaId": "partida-01",
  "jogadorId": "jogador-01",
  "versao": 1,
  "seq": 7,
  "payload": {
    "carta": { "id": "7-copas", "valor": "7", "naipe": "copas" },
    "paraJogadorId": "jogador-02",
    "confirma": true
  }
}
```

## Tipos suportados

- `SOLICITACAO_ENTRADA`
- `JOGADOR_ENTROU`
- `PARTIDA_INICIADA`
- `JOGADA`
- `TROCA_REALIZADA`
- `JOGADOR_COMPLETOU`
- `PARTIDA_FINALIZADA`
- `JOGADOR_DESCONECTADO`
- `RECONEXAO`
- `ENTRADA_RECUSADA`
- `ESTADO_SINCRONIZADO`
- `ERRO`
- `SAIDA_SALA`

## Regras de validação

Antes de qualquer alteração de estado, a mensagem passa por validação de schema em TypeScript com Zod.

Validações obrigatórias:

- tipo conhecido
- `partidaId` obrigatório
- `jogadorId` obrigatório
- `versao` correta
- `seq` crescente por remetente
- jogador pertence à partida
- mensagem não pode ser repetida/antiga
- carta deve pertencer à mão do emissor
- jogada só é aceita no turno válido

## Fragmentação

Como o payload de uma escrita/notificação BLE é limitado e depende do MTU negociado, mensagens são fragmentadas em pedaços pequenos com cabeçalho de índice e total, por exemplo:

```text
f:1/3:{...payload...}f:2/3:{...payload...}f:3/3:{...payload...}
```

Na camada de transporte, cada fragmento é remontado por origem no lado receptor antes da validação final. O anfitrião mantém o mapeamento entre o ID lógico do jogador e o endereço BLE conectado para enviar notificações direcionadas.

Os snapshots enviados pelo anfitrião incluem a mão somente do destinatário; as mãos dos outros jogadores são removidas antes da serialização.

## Exemplos

### Solicitação de entrada

```json
{
  "tipo": "SOLICITACAO_ENTRADA",
  "partidaId": "partida-01",
  "jogadorId": "jogador-03",
  "versao": 1,
  "seq": 1,
  "payload": {
    "nome": "Maria"
  }
}
```

### Jogador entrou

```json
{
  "tipo": "JOGADOR_ENTROU",
  "partidaId": "partida-01",
  "jogadorId": "anfitriao-01",
  "versao": 1,
  "seq": 12,
  "payload": {
    "jogadorId": "jogador-03",
    "nome": "Maria",
    "ordem": 2,
    "conectado": true
  }
}
```

### Partida finalizada

```json
{
  "tipo": "PARTIDA_FINALIZADA",
  "partidaId": "partida-01",
  "jogadorId": "anfitriao-01",
  "versao": 1,
  "seq": 40,
  "payload": {
    "vencedorId": "jogador-02",
    "penalizadoId": "jogador-01",
    "motivo": "penalidade BURRO",
    "status": "VITORIA"
  }
}
```
