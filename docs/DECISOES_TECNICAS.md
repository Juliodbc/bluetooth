# Decisões técnicas

## Escolha do transporte Bluetooth

A validação foi feita com documentação e metadados oficiais do npm e do repositório do plugin.

- `@e-is/capacitor-bluetooth-serial` foi inicialmente escolhido para Bluetooth Clássico, mas a validação do código instalado revelou que é cliente-only e sua versão 6 declara suporte a Capacitor 6, não a Capacitor 8. Não atende ao papel de anfitrião deste jogo.
- A escolha foi revisada para `@capgo/capacitor-bluetooth-low-energy` 8.x, compatível com Capacitor 8. A versão 8.2.1 documenta modo peripheral/GATT server, advertising e eventos de conexão/escrita no servidor, além do modo central para convidados.

### Prós
- Permite que o anfitrião anuncie um serviço GATT e receba conexões/escritas de convidados em uma arquitetura em estrela.
- É uma solução publicada, sem código nativo customizado.
- Compatível com Capacitor 8 e oferece APIs para escanear, conectar, escrever e notificar.
- Adequado para mensagens pequenas e controle da sala sem internet; mensagens são fragmentadas para o limite de payload BLE.

### Contras
- A implementação usa BLE, não Bluetooth Clássico; dispositivos precisam oferecer Bluetooth LE.
- O comportamento real varia por versão de Android/iOS e fabricante e precisa ser validado em aparelhos físicos, inclusive conexões simultâneas e limites de payload.
- Permissões e estado do rádio são tratados pelo plugin, mas desligamento e perda de conexão ainda precisam ser tratados pelo app.

### Configuração nativa

A implementação usa `@capgo/capacitor-bluetooth-low-energy` atrás da interface TypeScript `TransporteBluetooth`. Nenhuma lógica de jogo é escrita em código nativo.

### Decisão final

Usaremos BLE para o fluxo de anfitrião + convidados, com `TransporteBluetooth` como abstração e `TransporteMock` para desenvolvimento e testes fora do dispositivo. A camada GATT já está implementada; a validação de conexão entre aparelhos físicos continua pendente.

---

## Estrutura do projeto

A arquitetura foi organizada em camadas para manter a lógica de jogo separada da UI e do transporte:

- `src/domain/`: regras do jogo, distribuição, validação e estados.
- `src/transport/`: abstração do transporte Bluetooth e mock em memória.
- `src/services/`: orquestração da partida, permissões e contexto do app.
- `src/db/`: histórico e persistência local via SQLite.
- `src/stores/`: estado reativo da aplicação.
- `src/views/` e `src/components/`: telas e componentes Ionic.
- `src/types/`: contratos TypeScript para carta, jogador, partida e mensagens.

A regra de privacidade das mãos é aplicada nos snapshots enviados pelo anfitrião: cada convidado recebe apenas a própria mão, e a mão dos demais jogadores é removida do estado sincronizado.
