# M12 — Mesa vertical premium

Data: 07/11/2026, America/Fortaleza. Repositório: `duduceara/domino-tour`.
Branch exclusiva: `feature/mobile-touch-v1`.
HEAD remoto inicial: `8774c96cc1318dc7d7936339f50f384b63a6a95c`.
Árvore inicial: `269ef6bb99a4bedbe91c930d195988958b15822b`.
Auditoria lida: `docs/M11_AUDITORIA_MESA_CAMPEA_2026-11-07.md`.

## Verificação de duplicação e entrega

M12 não estava implementada: o HEAD inicial ainda usava `landscapeViewport`, rotação de 90°, bloqueio landscape opcional e `game.resize(...,'horizontal')`. O trabalho posterior à referência histórica `955e09d` foi preservado.

A Tela 06 agora usa um adaptador de retrato exclusivo. Em telefones com altura útil de pelo menos 600 CSS px, o frame mantém escala nativa, safe areas e offsets do `visualViewport`. Em telas largas, a coluna de até 480 px é centralizada. Não há rotação de 90° ou chamada de bloqueio de orientação. Fullscreen é uma opção explícita dentro do menu, dispensável para iniciar e jogar.

Janelas com menos de 600 CSS px de altura exibem a mesma composição lógica 360 × 640 uniformemente reduzida e centralizada, com transformação inversa do ponteiro. Isso mantém o retrato ao girar o dispositivo, mas reduz a leitura. A homologação prioritária é com o celular em pé.

O layout reserva áreas para marca/menu/saída, informações, mesa central, humano inferior, estado do turno, mão e controles. RobiX fica à esquerda, AndroX em cima e DomiX à direita. O perfil humano usa dados reais. Versos e contagens públicas permanecem; em alturas compactas, contagens numéricas substituem os versos. A mão de seis/sete pedras não exige rolagem horizontal. Organizar, chat, Ampliar e Integral ficam no rodapé. Saída continua com confirmação de abandono.

O solver existente é chamado em orientação `vertical`, sem edição do ÁPICE. A câmera de apresentação amplia até 3× quando cabe, mantendo peças/pontas na visão integral com margens medidas em pixels visíveis. A prévia conserva a câmera durante o arraste. As coordenadas usam o retângulo real da mesa e a inversão da escala. Os identificadores internos das pontas e suas regras não mudam; os controles visuais passam a A/B.

Todos os novos estilos estão sob `.premium06`. Nenhum PNG aprovado foi regenerado ou alterado. A apresentação em código reaproveita azul/dourado/marfim e retratos existentes; a composição vertical ainda depende da homologação visual do proprietário.

## Arquivos alterados

| Arquivo | Papel |
|---|---|
| `web/app.js` | Frame, coordenadas, orientação do solver, perfil inferior e fullscreen opcional |
| `web/table-viewport.js` | Novo adaptador isolado de retrato e ponteiro |
| `web/table-screen.js` | Áreas de perfil/controles, menu e contagens existentes |
| `web/table-screen.css` | Composição vertical e responsividade |
| `web/table-camera.js` | Enquadramento e margens físicas das pontas |
| `tests/portrait-table.test.mjs` | Viewport, coordenadas e geometria vertical |
| `tests/table06.test.mjs` | Contrato atualizado de fullscreen sem bloqueio de orientação; demais invariantes mantidas |
| `tests/m06-table-interaction-guards.test.mjs` | Guarda verifica o adaptador de retrato efetivamente usado |
| Este relatório | Evidências e limites da M12 |

## Proteção contra regressão e escopo

Comparação por Git blob contra o HEAD inicial: **46 arquivos protegidos conferidos, zero diferenças**. Inclui `dist/` (motor, solver, sessão, IA e utilitários), artes em `web/assets/approved/`, HTML/CSS compartilhados, entrada, configuração, visitante, identidade, avatar, save e relógio. O diff completo foi limitado aos arquivos listados. Nenhum arquivo das Telas 01–05 foi alterado.

Preservadas as distribuições existentes para quatro jogadores: 6 por pessoa + 4 dormidas; ou 7 por pessoa, sem dormidas. A variante de sete foi exercitada por fixture local, sem modificar seleção nas Telas 01–05.

Regras de produto registradas: Mano a Mano futuro é exclusivamente online, dois humanos, 7 pedras por pessoa e 14 no cemitério. Metas estatísticas dos robôs: Fácil 15%, Médio 40%, Difícil 65%, sem vantagens artificiais. Nenhuma nova modalidade ou calibração da IA foi implementada.

Os tempos permanecem **60 s para humano, alerta em 10 s, robôs em 3 s**. Os requisitos futuros 75/15/5, áudio/vibração e calibração estatística não são apresentados como entregues. M13 não foi iniciada.

## Testes direcionados

**42 testes distintos aprovados, zero falhas**, em dois grupos dirigidos, sem execução da suíte completa.

Grupo A: 25 testes.

```sh
node --test tests/portrait-table.test.mjs tests/mobile-touch.test.mjs tests/round-transition.test.mjs tests/table06.test.mjs tests/m06-table-interaction-guards.test.mjs
```

Abrange safe areas e offsets, inversão de coordenadas com zoom/pan, seleção, cancelamento, transição de rodada, relógio existente, integridade da arte e **360 casos verticais + 900 horizontais de geometria**. Os casos validam unicidade, contatos, valores impressos e enquadramento das peças/pontas. Após a última revisão da câmera, os sete testes de `portrait-table` e `table06` foram repetidos e aprovados.

Grupo B: 17 testes.

```sh
node --test tests/entry-flow.test.mjs tests/hand-arrangement.test.mjs tests/offline-save.test.mjs
```

Abrange entrada/carregamento, organização/orientação da mão sem mutar regras, save/restauração e falhas de armazenamento. `node --check` nos quatro módulos JS envolvidos e `git diff --check` também passaram.

## Conferência no navegador

- Navegação pelas Telas 01–05 até a mesa sem fullscreen ou rotação; retorno à apresentação após confirmar saída.
- Viewports 412 × 760, 412 × 915 e 360 × 800; também 915 × 412 para conferir preservação da composição de retrato e da partida ao girar.
- Em 412 × 760, a fixture de sete pedras mostrou **sete peças de 40 × 80 CSS px**, dormidas ocultas e os quatro jogadores.
- Em 412 × 915: frame 412 × 915 com `transform: none`; mesa útil **258 × 413 CSS px**; seis controles principais visíveis com pelo menos 44 px de altura/largura, sem interseção entre seus retângulos.
- Em 360 × 800: mesa útil **206 × 298 CSS px**, peças da mão de 40 × 80 e controles principais de pelo menos 44 px.
- Em 915 × 412: composição lógica 360 × 640 reduzida por escala 0,64375; área física 231,75 × 412 centralizada, sem giro. O mesmo tabuleiro permaneceu com uma peça e seis pedras na mão após o redimensionamento.
- Arraste real: mover a primeira pedra para o fim da mão manteve sete pedras e tabuleiro vazio. Arrastar essa pedra para a mesa resultou em uma peça no tabuleiro e seis na mão, seguido do turno do robô.
- Fixtures de fim de rodada/partida validaram diálogos, Próxima rodada, Nova partida e retorno ao menu. Menu e botão opcional de fullscreen foram conferidos.

As fixtures são locais e isoladas do runtime entregue; não são modalidades de produto e foram removidas do pacote de prévia. As medições usam navegador remoto e viewports CSS; não equivalem a homologação física no Samsung Galaxy S23+. Hashes idênticos também não substituem comparação visual no aparelho.

## Prévia, pendências e encerramento

Prévia privada separada: `https://domino-tour-m10-homologacao.cedufac.chatgpt.site/`.
Exige login do proprietário no ChatGPT. A atualização não altera a hospedagem oficial; seu sucesso será confirmado na entrega, sem presumir publicação somente por existir a URL.

HEAD final e SHA integral serão o commit desta M12, filho do HEAD inicial, confirmados após persistência. A etapa só será registrada como **30%** após confirmação remota. Esse percentual encerra a implementação/verificação técnica da M12; não representa aprovação visual final nem conclusão de todo o aplicativo.

Pendências: homologação no S23+ físico, leitura de posições densas com eventual ampliação e aprovação visual da composição. Tempos 75/15/5, áudio/vibração, calibração estatística e futuras modalidades seguem fora do escopo. Nenhuma alteração de `main`, hospedagem oficial, motor, regras ou artes nesta M12.
