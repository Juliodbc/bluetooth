# Burro Bluetooth
 
Jogo de cartas multiplayer local para dispositivos Android. A aplicação permite criar uma mesa, encontrar jogadores próximos e conduzir uma partida sem internet, usando Bluetooth Low Energy (BLE) para a comunicação entre os aparelhos.
 
> Projeto acadêmico desenvolvido por [Vinicius Cavilha](https://github.com/ViniciusCavilha) e [Julio Correa](https://github.com/Juliodbc) [Lucas da Cunha] (https://github.com/ceciquinho).
 
## Informações acadêmicas
 
| Campo | Informação |
| --- | --- |
| Curso | **A preencher** |
| Unidade(s) Curricular(es) | **A preencher** |
| Indicador(es) | **A preencher** |
 
> Os nomes do curso, das UCs e dos indicadores não estavam registrados no repositório. Substitua os campos acima pelas informações oficiais da atividade.
 
## Integrantes
 
| Integrante | GitHub |
| --- | --- |
| Vinicius Cavilha | [@ViniciusCavilha](https://github.com/ViniciusCavilha) |
| Julio Correa | [@Juliodbc](https://github.com/Juliodbc) |
| Lucas da Cunha | [@ceciquinho](https://github.com/ceciquinho) |
 
## Sobre o projeto
 
O Burro Bluetooth foi construído com Vue 3, Ionic e Capacitor. Um aparelho atua como anfitrião e anuncia uma partida; os demais encontram a sala e entram como convidados. O anfitrião mantém o estado oficial do jogo e sincroniza as informações necessárias com cada participante.
 
A comunicação usa mensagens JSON validadas com Zod. Como mensagens BLE possuem limite de tamanho, o protocolo divide conteúdos maiores em fragmentos e os remonta no aparelho de destino. Cada convidado recebe somente a própria mão, preservando as cartas dos demais jogadores.
 
No navegador, o projeto usa um transporte simulado. A conexão BLE real é ativada somente em uma plataforma nativa compatível.
 
## Como o jogo funciona
 
O objetivo é formar um grupo de quatro cartas do mesmo valor e evitar completar a palavra **B-U-R-R-O**.
 
1. Um jogador cria a partida e se torna o anfitrião.
2. Os demais jogadores ativam o Bluetooth, procuram a mesa e entram na sala.
3. Quando houver pelo menos dois participantes, o anfitrião inicia a partida.
4. Cada jogador recebe quatro cartas; o primeiro recebe uma carta extra.
5. Na sua vez, o jogador escolhe uma carta e a passa para o próximo participante.
6. Os turnos seguem em sequência enquanto os jogadores tentam formar quatro cartas do mesmo valor.
7. Ao completar o grupo, o jogador toca em **Bati!**.
8. A rodada é encerrada, um participante recebe uma letra e o resultado é sincronizado entre os aparelhos.
9. A partida termina quando a condição de derrota da palavra **BURRO** é atingida.
 
### Como jogar no aplicativo
 
#### Criar uma partida
 
1. Na tela inicial, toque em **Criar uma partida**.
2. Digite seu nome e toque em **Continuar**.
3. Mantenha a sala aberta enquanto os convidados entram.
4. Com dois ou mais jogadores conectados, toque em **Começar partida**.
 
#### Entrar em uma partida
 
1. Na tela inicial, toque em **Encontrar uma mesa**.
2. Digite seu nome e toque em **Continuar**.
3. Selecione uma das mesas encontradas por Bluetooth.
4. Aguarde o anfitrião iniciar a partida.
 
#### Durante a partida
 
- Observe o aviso de turno no topo da mesa.
- Quando for sua vez, toque em uma carta para selecioná-la.
- Toque em **Passar carta** para enviá-la ao próximo jogador.
- Use **Bati!** apenas quando tiver quatro cartas do mesmo valor.
- Acompanhe as letras e o resultado de cada rodada na interface.
 
## Telas do jogo
 
<p align="center">
  <img src="docs/screenshots/home.png" alt="Tela inicial do Burro Bluetooth" width="300">
  &nbsp;&nbsp;
  <img src="docs/screenshots/identificacao.png" alt="Tela de identificação do jogador" width="300">
</p>
 
## Tecnologias utilizadas
 
- [Vue 3](https://vuejs.org/) com TypeScript
- [Ionic Vue](https://ionicframework.com/docs/vue/overview)
- [Capacitor](Capacitor by Ionic - Cross-platform apps with web technology) para integração com Android
- [Pinia](https://pinia.vuejs.org/) para gerenciamento de estado
- `@capgo/capacitor-bluetooth-low-energy` para comunicação BLE
- SQLite para o histórico local
- Zod para validação das mensagens do protocolo
- Vite para desenvolvimento e build
- Vitest e Vue Test Utils para testes unitários
- Cypress para testes de ponta a ponta
 
## Arquitetura
 
```text
src/
├── db/          # Persistência do histórico
├── domain/      # Regras, cartas, turnos e penalidades
├── services/    # Permissões e serviços da aplicação
├── stores/      # Estado global da partida
├── transport/   # BLE real, transporte mock e protocolo
├── types/       # Contratos TypeScript
└── views/       # Telas Ionic/Vue
```
 
Mais detalhes estão disponíveis em:
 
- [Protocolo de comunicação](docs/PROTOCOLO.md)
- [Decisões técnicas](docs/DECISOES_TECNICAS.md)
 
## Como executar
 
### Pré-requisitos
 
- Node.js compatível com as dependências do projeto
- npm
- Android Studio e Android SDK para a versão nativa
- Dois ou mais aparelhos Android com BLE para testar a comunicação real
 
### Desenvolvimento no navegador
 
```bash
npm install
npm run dev
```
 
A aplicação ficará disponível em `http://localhost:5173`. Nesse ambiente, a camada `TransporteMock` simula a descoberta e a conexão com uma mesa.
 
### Build de produção
 
```bash
npm run build
```
 
### Android
 
```bash
npm run build
npx cap sync android
```
 
Depois, abra a pasta `android` no Android Studio, conecte um dispositivo físico e execute o aplicativo.
 
## Como testar
 
### Testes unitários
 
```bash
npm run test:unit -- --run
```
 
Os testes cobrem regras do jogo, protocolo, histórico e estado da partida.
 
### Qualidade do código
 
```bash
npm run lint
```
 
### Testes de ponta a ponta
 
Com o servidor de desenvolvimento em execução:
 
```bash
npm run dev
```
 
Em outro terminal:
 
```bash
npm run test:e2e
```
 
### Teste manual em aparelhos
 
1. Instale o APK em pelo menos dois dispositivos Android compatíveis com BLE.
2. Conceda as permissões solicitadas pelo sistema.
3. Crie uma sala em um aparelho.
4. Procure e entre na sala usando o segundo aparelho.
5. Inicie a partida e valide turnos, passagem de cartas e desconexão.
 
## Como contribuir
 
1. Faça um fork do repositório.
2. Crie uma branch para sua alteração:
 
   ```bash
   git checkout -b feature/minha-melhoria
   ```
 
3. Instale as dependências e implemente a mudança.
4. Antes de enviar, execute:
 
   ```bash
   npm run lint
   npm run test:unit -- --run
   npm run build
   ```
 
5. Faça um commit objetivo e envie a branch:
 
   ```bash
   git commit -m "feat: descreve a melhoria"
   git push origin feature/minha-melhoria
   ```
 
6. Abra um Pull Request explicando o problema, a solução e como a mudança foi testada.
 
Ao alterar mensagens ou regras de sincronização, atualize também `docs/PROTOCOLO.md` e inclua testes automatizados.
 
## Checklist de funcionalidades
 
Legenda: ✅ concluído · 🟡 parcial/em validação · ⬜ não desenvolvido
 
| Funcionalidade | Estado | Observação |
| --- | :---: | --- |
| Identificação do jogador | ✅ | Nome salvo localmente |
| Criação de sala | ✅ | Anfitrião anuncia uma partida |
| Busca de salas próximas | ✅ | Varredura BLE e mock para navegador |
| Entrada de convidados | ✅ | Solicitação e sincronização implementadas |
| Sala para 2 a 6 jogadores | ✅ | Limite validado no domínio |
| Distribuição e embaralhamento de cartas | ✅ | Executados pelo anfitrião |
| Controle de turnos | ✅ | Jogadas fora do turno são rejeitadas |
| Passagem de carta | ✅ | Carta enviada ao próximo jogador |
| Detecção de quatro cartas iguais | ✅ | Validação no domínio |
| Penalidades com letras de BURRO | ✅ | Estado das letras mantido por jogador |
| Tela de resultado da rodada | ✅ | Exibe vencedor, penalizado e motivo |
| Histórico local | ✅ | SQLite no dispositivo e fallback em memória |
| Modo escuro e layout responsivo | ✅ | Interface adaptada para celular e desktop |
| Privacidade das mãos | ✅ | Snapshot inclui apenas a mão do destinatário |
| Fragmentação de mensagens BLE | ✅ | Fragmentos numerados e remontados por origem |
| Validação de mensagens | ✅ | Schemas e versão do protocolo validados |
| Tratamento de desconexão | 🟡 | Detecta a perda; reconexão automática ainda é limitada |
| Testes unitários | ✅ | Regras, protocolo, histórico e store |
| Testes E2E | 🟡 | Fluxos escritos; execução depende do Cypress compatível com o ambiente |
| Validação com vários aparelhos físicos | 🟡 | Necessita bateria de testes em modelos Android diferentes |
| Suporte a iOS | ⬜ | Projeto nativo disponível somente para Android |
| Partida pela internet | ⬜ | Fora do escopo; o jogo é local por BLE |
 
## Limitações conhecidas
 
- A comunicação real depende de dispositivos com Bluetooth Low Energy.
- O comportamento de advertising, permissões e conexões simultâneas pode variar conforme fabricante e versão do Android.
- O modo navegador usa um transporte simulado e não comprova o funcionamento do BLE físico.
- A arquitetura usa o anfitrião como autoridade da partida; se ele encerrar o aplicativo, a sala não possui migração automática para outro jogador.
- A perda de conexão é detectada, mas a retomada completa e automática da sessão ainda precisa de evolução.
- O histórico no navegador usa fallback em memória e pode ser perdido ao recarregar a página; a persistência SQLite é destinada ao aplicativo nativo.
- A quantidade de conexões simultâneas e o tamanho efetivo das mensagens dependem do hardware e do MTU negociado.
- A implementação nativa ainda precisa ser validada em uma matriz maior de aparelhos físicos.
- O projeto não possui versão iOS nem modo multiplayer pela internet.
- As regras de penalização e encerramento devem ser conferidas com a variação do jogo adotada pela turma antes da entrega final.
 
## Licença
 
Projeto acadêmico. Consulte os integrantes antes de reutilizar ou distribuir o código.