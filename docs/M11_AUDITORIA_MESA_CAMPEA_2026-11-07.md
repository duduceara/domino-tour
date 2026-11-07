# M11 — Auditoria técnica da Mesa Campeã vertical

Data: 07/11/2026 (America/Fortaleza). Projeto: DOMINÓ TOUR / EDVÓRIA.
Repositório: `duduceara/domino-tour`. Branch exclusiva: `feature/mobile-touch-v1`.

## Base e escopo

HEAD remoto inicial confirmado: `a96a084d6f84bae658e78e16ceabca1d481253ec`.
Árvore da base: `fbbed4a09db86cf78ba651fc3bfedaf788111287`.
Commit histórico solicitado: `955e09d42d08b779bb8329670e783ac3d69447ca`.
A auditoria considera o HEAD real, que já contém a revisão posterior da apresentação da mesa; não propõe retornar automaticamente ao commit histórico.

Entrega exclusivamente documental. Nenhuma implementação, arte, teste, regra, arquivo de runtime ou configuração de hospedagem foi alterado nesta missão. Nenhuma suíte foi executada e nenhuma publicação foi realizada. M12 não foi iniciada.

O HEAD final será o commit que contém este relatório, filho direto do HEAD inicial. O SHA integral é fornecido na entrega após a criação e a confirmação remota; não se insere um SHA autorreferente no próprio arquivo. A conclusão de 10% refere-se à etapa de auditoria e preparação do plano, não à implementação vertical, nem à homologação do aplicativo.

## Diagnóstico verificável

| Requisito | Situação encontrada no HEAD auditado | Lacuna / encaminhamento futuro |
|---|---|---|
| Mesa exclusivamente vertical | `web/app.js`, `fitViewport()`, usa `landscapeViewport`, proporção 1672/941 e rotação visual de 90° em retrato. `lockLandscape()` solicita fullscreen e bloqueio em landscape. | Separar apresentação vertical da navegação, remover a dependência de rotação e de fullscreen para jogar. |
| Quatro jogadores individuais | `dist/src/engine.js` e `session.js` mantêm quatro assentos; humano é assento 0; `sync()` desenha humano inferior e bots nos outros três lados. | Preservar assentos, ordem dos turnos, distribuição e dados reais. Reposicionar somente a apresentação. |
| Layout premium | `web/table-screen.css` usa áreas absolutas, percentuais horizontais, `cqh`, sobreposições e várias regras finais de sobrescrita. `web/layout.css` ainda contém estilos globais e modos compactos de fases anteriores. | Criar um contrato único para a Tela 06 em retrato; evitar reduzir o desenho horizontal para caber em uma coluna. |
| Arte | `screen-06-mesa-oficial.png` é paisagem. O fundo, logo e elementos desenhados estão juntos; a implementação já cobre parte desses dados com componentes dinâmicos. | Preservar o PNG byte a byte como referência. Não esticar, recortar automaticamente ou apresentar uma adaptação como nova arte aprovada. Compor a tela vertical com identidade existente e dados reais, sujeita a homologação visual. |
| Geometria | `sync()` chama `game.resize(prior,'horizontal')`. `LocalSession.resize()` já aceita orientação. `physicalLayout()` em `dist/src/table.js` contém caminho para `vertical`; a escala fixa é `min(width/24,height/12)`. | Ensaiar o caminho vertical existente sem editar o motor. Em retrato estreito, a divisão por 24 pode produzir pedras pequenas; capacidade matemática não prova legibilidade. |
| Câmera | `web/table-camera.js` amplia até 2× e ajusta a visão às peças e pontas. `drawBoard()` reutiliza a câmera durante prévia de arraste. Zoom manual e visão integral estão ligados. | Rever limites em retrato, manter a transformação inversa do toque e evitar saltos durante o gesto. Não mascarar falhas físicas com encaixes apenas visuais. |
| Touch | `web/app.js` usa Pointer Events, captura do ponteiro, limiar de 8 px, cancelamento por ponteiro adicional e conversão tela → frame → mesa. Há organização da mão, seleção e pontas. O controlador efetivamente usado é `TableInteraction`, de `dist/src/table.js`; `dist/src/touch.js` é outro controlador, não o ponto de integração direto da mesa atual. | Adaptar coordenadas ao frame sem rotação, preservar captura/cancelamentos e medir o desvio real de arraste. Não fazer correção parcial apenas no CSS. |
| Humano: 75 s | `TurnClock.start()` soma 60000 ms; `remaining()` retorna 60 sem turno ativo. Atualização por intervalo de 200 ms em `web/app.js`. | Planejar duração única de 75000 ms, inicialização 01:15, meter máximo 75 e expiração exatamente uma vez. |
| Alerta nos 15 s finais | `updateClock()` compara `seconds<=10`; CSS do warning usa fundo escuro e borda alaranjada. | Unificar limiar em 15 s, vermelho inequívoco com texto/ícone; não depender apenas de cor. |
| Robôs: 5 s | `scheduleBots()` espera 3000 ms e chama `game.advanceBots(1)`. A mensagem informa qual bot pensa e há assento ativo; não há contagem visual própria de 5 s. | Agendador de 5000 ms por turno, indicação no assento e proteção por chave/epoch, evitando ação após saída, pausa ou mudança de rodada. |
| IA justa | `bots.js`: Fácil prioriza descarte de pontos; Médio usa mobilidade e conexões; Difícil acrescenta histórico público e amostragem de mãos possíveis. `viewFor()` limita dados à própria mão e informação pública. | Preservar esse limite; as taxas 15/40/65 não estão implementadas nem comprovadas pelo código lido. |
| Música, efeitos, vibração | Não foram encontradas chamadas de áudio ou vibração no runtime examinado. O chat atual é local/offline. | Módulos independentes de preferências e feedback, música desligada por padrão, efeitos e vibração configuráveis e fallback silencioso. |
| Menu compacto | Configurações abrem toolbar com dificuldade e percurso; meta e distribuição aparecem desabilitadas porque são definidas antes da partida. Saída tem confirmação; resultado oferece próximos passos. | Consolidar menu compacto acessível, mantendo confirmação de abandono, próxima rodada, nova partida e retorno ao menu. Não religar seletores sem contrato funcional. |

## Dependências e limites de alteração futura

Fluxo atual: entrada → configuração → visitante → identidade → evento `domino-tour:enter-game` → `web/app.js` → `LocalSession` → motor/solver. `table-screen.js` monta a apresentação e `paintTableScreen()` recebe contagens públicas. Avatar e perfil são atualizados por eventos. `offline-save.js` persiste estado, dificuldade, rota e organização da mão; o relógio não faz parte desse snapshot.

| Arquivos | Papel e evolução prevista |
|---|---|
| `web/app.js` | Integração de frame vertical, coordenadas, temporização humana e dos bots, câmera, menu e ciclo de vida. Concentrar a mudança na Tela 06. |
| `web/table-screen.css` | Layout em retrato, zonas reservadas, alvos de toque, tamanho de pedras e indicadores, sem seletores que vazem para as Telas 01–05. |
| `web/table-screen.js` | Estrutura dos indicadores, relógio, menu compacto e preferências; dados dinâmicos em vez de valores ilustrativos da arte. |
| `web/table-camera.js` | Ajuste de enquadramento em superfície alta/estreita e estabilidade durante o gesto. |
| `web/turn-clock.js` | Duração de 75 s e contrato de pausa/retomada/expiração única; configuração central, sem constantes divergentes. |
| Novos módulos locais de viewport e feedback da Tela 06 | Preferir adaptador de retrato e módulos de áudio/haptics específicos, evitando alterar utilitários compartilhados sem necessidade. Nomes finais a definir na implementação. |
| `web/offline-save.js` | Dependência a preservar. Só precisará mudar se a política futura exigir persistir tempo restante; não misturar preferências de áudio com migração do estado da partida. |
| `tests/table06.test.mjs`, `tests/mobile-touch.test.mjs`, `tests/viewport-geometry.test.mjs`, `tests/responsive-viewport.test.mjs`, `tests/round-transition.test.mjs`, `tests/m06-table-interaction-guards.test.mjs` | Adaptar/adicionar cenários específicos de retrato, mantendo os contratos anteriores úteis. Não apagar testes apenas porque ficam vermelhos. |
| `tests/table06-browser.cjs` | Roteiro existente voltado principalmente a paisagem; adaptar futuro roteiro à proporção vertical e aos novos tempos. Sua presença não comprova aprovação nesta missão. |
| `tests/bot-levels.test.mjs`, `tests/bot-sampling.test.mjs` e scripts de benchmark | Referência para justiça e força relativa; não são comprovação de taxa de vitória humana. Planejar benchmark separado, sem executá-lo em M11. |

Arquivos protegidos: Telas 01–05 e seus CSS/JS, `web/assets/approved/*`, `dist/src/engine.js`, `dist/src/table.js`, `dist/src/session.js`, `dist/src/bots.js`, `dist/src/bot-sampling.js`, regras e fontes históricas do ÁPICE. São dependências examinadas, não uma lista de autorização de edição. `web/layout.css`, `web/index.html` e `dist/src/viewport.js` também devem permanecer intactos por padrão; eventual necessidade compartilhada exige revisão explícita de impacto antes da implementação. A mudança de orientação passada ao solver existente deve ser avaliada no adaptador, não por reescrita do solver.

## Proposta de composição vertical — ainda não implementada

Usar o viewport útil real, safe areas e altura dinâmica do navegador. Retrato deve ser utilizável sem fullscreen ou pedido de rotação. Ao girar fisicamente o aparelho, apresentar a mesma composição de retrato centralizada, sem recriar partida nem voltar ao menu.

| Zona, de cima para baixo | Conteúdo | Reserva inicial para protótipo |
|---|---|---|
| Cabeçalho | Marca discreta, modo/meta e botão de menu de 44 × 44 CSS px | 7% |
| Adversário superior | AndroX, pontos, contagem de pedras e indicador de turno | 10% |
| Mesa central | RobiX na margem esquerda e DomiX na direita; caminho das pedras na região central; contagens compactas | 50% |
| Estado do turno | Mensagem curta, relógio 01:15 e acesso a Integral/Ampliar | 8% |
| Humano inferior | Avatar/apelido/pontos e mão com seis ou sete pedras; Organizar acessível | 21% |
| Faixa auxiliar | Dormidas e feedback/mensagens, sem sobrepor a mão | 4% |

Percentuais são um ponto de partida, não especificação rígida. Para alturas reduzidas, priorizar mínimos físicos de interação e reduzir decoração. Texto não deve ficar ilegível para cumprir percentuais. A mão de sete pedras deve caber sem rolagem horizontal e sem encobrir pontas. Separar o alvo de toque da dimensão visual quando necessário; alvos não podem se sobrepor.

Identidade: azul, dourado, marfim, feltro e retratos existentes. As boas práticas propostas são gerais: foco na mesa, feedback claro de seleção, indicação de jogada legal, gestos canceláveis e menu discreto. Nenhum jogo de referência foi identificado ou inspecionado nesta auditoria; não há alegação de análise comparativa de concorrentes. Não reutilizar marcas, artes, sons ou layouts proprietários de terceiros.

## Cronometragem e ciclo de vida propostos

- Humano: deadline de 75 s por chave de turno, independente de rerender. Vermelho de 15 até 0 s. Expiração inicia uma única ação legal, ou passagem automática já prevista, sem penalidade adicional inventada.
- Robô: uma ação por turno, após 5 s de tempo ativo. O custo de cálculo pode acrescentar atraso e precisa ser medido; não prometer precisão absoluta de JavaScript sob suspensão do navegador.
- Pausa: proposta é congelar ambos os relógios em aba oculta e diálogos modais da mesa; retorno conserva o saldo. Hoje o timer humano já pausa em aba oculta/diálogos de decisão, mas o agendamento dos bots é cancelado e recomeça. Chat e toolbar não têm a mesma política explícita de pausa. Essa inconsistência deve ser resolvida antes de codificar os novos tempos.
- Saída, nova partida e próxima rodada invalidam callbacks antigos. Evitar resetar 75 s ao organizar, selecionar peça, ampliar ou abrir/fechar menu.
- Restauração de partida: hoje não persiste deadline. Decidir e documentar política de reinício do turno ou saldo persistido antes de mudar o formato do save; não alterar snapshots silenciosamente.
- Música só após gesto do usuário; preferências persistentes, pausa ao ocultar a página. Falha de áudio, falta de suporte de vibração ou armazenamento indisponível nunca bloqueiam uma jogada. Usar material original ou licenciado, sem copiar sons de referências.

## Metas estatísticas de dificuldade: condição de interpretação

Registrar as metas fornecidas sem convertê-las em manipulação de resultado: Fácil 15%, Médio 40%, Difícil 65%.

O sujeito dessas taxas precisa ser definido antes de calibrar. Se forem vitórias do humano contra bots progressivamente mais fortes, a ordem é inversa ao significado habitual de dificuldade. Se forem taxa de um bot específico, ou vitória agregada dos três bots, denominador e interpretação mudam. Não assumir uma dessas alternativas silenciosamente, nem renomear as metas. Esta é uma pendência de especificação para a evolução, não um impedimento à conclusão documental de M11.

Protocolo proposto: definir vencedor da partida completa, agente/política de referência no assento humano, meta de pontos, variante 6/7 e conjunto de seeds congelados; executar as mesmas distribuições e controlar posições de abertura. Separar calibração e validação. Reportar vitórias/N, taxa observada e intervalo de Wilson de 95%. Proposta de tolerância inicial: ±3 pontos percentuais, a validar; cerca de 1.100 partidas por configuração dá margem aproximada de 3 p.p. no pior caso binomial, sem garantir generalização para humanos reais. Não misturar rodada com partida, bot individual com conjunto de bots, ou dificuldade com probabilidade forçada.

O benchmark existente de força relativa distribui níveis entre quatro bots e roda 288 partidas; não mede essas metas contra jogadores humanos. Ajuste futuro da IA, se necessário, constitui escopo próprio: nenhum acesso a mãos ocultas, troca de pedras, sorteio condicionado ao nível ou derrota/vitória forçada. Não é autorizado nesta missão e não deve ser embutido na migração visual.

## Sequência segura proposta para evolução posterior

1. Congelar baseline: hashes das artes, arquivos das Telas 01–05 e motor; evidências visuais nas dimensões prioritárias; preservar o commit histórico e o HEAD auditado.
2. Formalizar contrato de retrato, política de pausa/restauração, interpretação estatística e critérios de legibilidade. Não gerar novas artes como se estivessem aprovadas.
3. Ensaiar geometria vertical existente com 1–28 pedras e todas as carroças; medir superfície e câmera. Se exigir alteração do motor, registrar bloqueio separado, sem contornar com sobreposição ou desenho fictício.
4. Montar apresentação vertical isolada, mantendo dados e assentos existentes. Validar mão, pontas e menu antes de conectar mais feedback.
5. Ajustar transformações de ponteiro e garantir câmera estável no arraste. Só depois alterar os tempos para 75/15/5 com proteção de ciclo de vida.
6. Adicionar preferências opcionais de áudio/vibração sem mudanças em regras ou vantagem competitiva.
7. Rodar apenas verificações afetadas, comparar Telas 01–05 e publicar prévia privada para homologação no aparelho físico. Não usar este relatório como autorização para iniciar essas etapas agora.

## Aceitação objetiva proposta — Samsung Galaxy S23+

Dimensões são viewports CSS de teste, não alegação sobre a resolução física do aparelho. Priorizar 412 × 915, 412 × 760 com barras abertas, 360 × 800 e 393 × 873; incluir 915 × 412 para garantir composição de retrato centralizada ao girar. Medir também `visualViewport` real no S23+ em Chrome e Samsung Internet.

| Área | Critério de aceite futuro |
|---|---|
| Retrato | Nenhuma transformação de 90°, bloqueio landscape ou solicitação automática de fullscreen; humano sempre inferior; nenhuma rolagem da página durante partida. |
| Navegação | Telas 01–05 iguais à baseline nos mesmos estados/dados; nenhuma mesa interativa por baixo; saída volta ao menu sem apagar perfil. Comparação visual e hashes complementam um ao outro. |
| Legibilidade | Alvos de controles e pontas de pelo menos 44 × 44 CSS px, sem interseções; texto funcional inicialmente ≥14 px; mão com pedras inicialmente ≥32 × 64 px. No tabuleiro, proporção 2:1 e pips distinguíveis; se a visão integral não sustentar metade curta de 18 px, disponibilizar ampliação sem ocultar o acesso a Integral e submeter a leitura ao aparelho físico. São critérios propostos, não resultados medidos. |
| Geometria | 1, 7, 14, 21 e 28 peças; seis/sete pedras distribuídas; todas as carroças e ambas as pontas; sem sobreposição, valores errados ou contatos falsos. Integral mantém todas as peças e pontas acessíveis. |
| Touch | Reordenar sem jogar; toque seleciona; duas pontas exigem escolha; uma ponta aceita confirmação prevista; jogada ilegal não altera estado. Arraste até cada ponta com zoom/pan e safe areas: erro de conversão ≤2 CSS px em testes e aceitação no dedo real. |
| Cancelamento | Segundo dedo, `pointercancel`, perda de captura, mudança de viewport, aba oculta e saída não duplicam ações, não deixam pedra fantasma nem executam jogada tardia. |
| Humano | Relógio injetável: 75 no início, estado normal em 16, vermelho em 15, expiração em 0 exatamente uma vez. Rerender não reinicia. Em primeiro plano no aparelho, atualização/ação em até 500 ms do deadline como alvo de medição. |
| Robôs | Com relógio falso, nenhuma ação em 4.999 ms e uma em 5.000 ms; em dispositivo ativo, atraso adicional de cálculo registrado separadamente. Indicador permanece no jogador correto. Nenhum callback após abandono. |
| Continuidade | Próxima rodada, nova partida, cancelar saída e voltar ao menu funcionam; reentrada preserva identidade; refresh/restauração segue política documentada; 28 pedras únicas e regras intactas. |
| Feedback | Música inicia somente por escolha explícita; efeitos e vibração podem ser desligados; preferências sobrevivem à recarga; sem suporte/permissão não gera exceções nem bloqueia controles. |
| Desempenho | Medir no aparelho: alvo inicial p95 de resposta visual ao toque ≤100 ms e nenhuma tarefa principal >50 ms durante arraste sem investigação. Tempos do host não substituem medição Android. |
| Justiça | Testar permutações de mãos ocultas com mesma visão pública, ações legais e seeds independentes; taxas somente após especificação e amostragem, nunca por resultado individual garantido. |

## Riscos e proteções

1. **Regressão por CSS global:** manter regras da evolução sob raiz específica da Mesa 06; comparar também navegação em retrato com barras e teclado. Não editar arquivos anteriores para ajustar a mesa.
2. **Escala versus espaço:** o solver vertical existe, mas a fórmula de escala fixa pode resultar em peças pequenas. Validar câmera, capacidade e limites de toque antes de homologar.
3. **Desvio de arraste:** retirar rotação exige revisar transformações e offsets em conjunto. Testar ida/volta de coordenadas e estabilidade da prévia; não mudar o referencial durante gesto.
4. **Callbacks de turno:** timers humanos/bots, diálogo, aba oculta e reentrada podem concorrer. Usar deadline/chave/epoch e commits de ação únicos.
5. **Arte de paisagem:** mantê-la intacta não prova fidelidade da composição de retrato. Homologar apresentação nova explicitamente, sem prometer igualdade visual a um formato incompatível.
6. **IA e metas:** separar medição de calibração e proteger a informação oculta. A ambiguidade das taxas não deve virar código de vitória forçada.
7. **Save e configurações:** preservar identidade, dificuldade, distribuição, estado e organização; qualquer novo dado precisa de defaults compatíveis e tratamento de falhas.
8. **Dependências compartilhadas:** preferir adaptadores em `web/`; nenhuma alteração no ÁPICE para resolver layout sem autorização específica.

## Evidência e encerramento da M11

Procedimento realizado: consulta remota de HEAD, comparação com checkout limpo e leitura estática do layout, integração, controlador de interação, solver, relógio, estratégias, amostragem, save e testes relevantes. Não foram instaladas dependências, executados benchmarks/suítes, abertas novas prévias ou modificada a hospedagem. Evidências históricas em `docs/TELA06_BROWSER_EVIDENCIAS.json` e testes existentes não foram reexecutadas e não certificam os novos requisitos.

Persistência prevista: um único arquivo Markdown adicionado sobre a árvore inicial; atualização da branch com proteção pelo SHA esperado. O diff remoto deve conter somente este relatório. Após confirmar commit e HEAD remoto, etapa M11 concluída: **10%**. A implementação vertical permanece **não iniciada**.
