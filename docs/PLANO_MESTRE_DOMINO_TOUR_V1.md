# DOMINÓ TOUR | Documento Mestre V1.0
Data-base: 2026-11-04 · Organização: EDVÓRIA · Marco: M00
Status: planejamento de engenharia; não confundir implementação, teste automatizado e homologação física.

## 1. Objetivo e princípios
Jogo de dominó mobile premium, com experiência offline inicial (1 humano + 3 robôs) e multiplayer online como eixo estratégico do produto final. Construção incremental, zero regressão, decisões rastreáveis, uma entrega principal por vez, preservação de main e da prévia pública até homologação expressa. Sem declaração de teste aprovado sem evidência.

## 2. Inventário factual conferido no GitHub
Repositório: duduceara/domino-tour.
Branches retornadas na consulta: main, preview/github-pages, feature/mobile-touch-v1. A pesquisa apresentou cursor de paginação; não afirmar exaustividade absoluta.
Branch de trabalho: feature/mobile-touch-v1. Último commit conhecido antes do M00: 3beda033d2550153d515a82ba19b48977391646a.
Arquivos verificados na branch: index.html (redireciona a web/index.html), web/index.html (protótipo de mesa V0.21), web/layout.css, web/app.js (inspecionado na execução anterior), dist/src/session.js, dist/src/table.js (inspecionado anteriormente), dist/src/viewport.js (inspecionado anteriormente), tests/mobile-touch.test.mjs e .github/workflows/mobile-touch-tests.yml.
README.md não encontrado no caminho raiz desta branch (HTTP 404). Não pressupor inexistência de outros documentos em outros caminhos.
A interface web atual é uma mesa técnica com meta, distribuição 6/7 pedras, percurso, passar, zoom, tela cheia, nova mesa, pontuação e mão. NÃO é evidência de que as telas visuais 01–05 estejam implementadas no repositório.
O histórico de decisões do projeto menciona seleção visual até a Tela 05; número, nomes exatos, artes e aprovações finais devem ser recuperados e confirmados antes de desenhar a Tela 06.
A rotina LocalSession encapsula estado, interação, prévia de encaixe, renderização geométrica, turnos dos robôs e jogadas humanas. A interface utiliza temporização de 3000ms por turno de robô e segundo toque apenas quando uma ponta é válida, conforme inspeção anterior.
Os testes mobile-touch.test.mjs cobrem interação de mesa simulada (seleção, pontas, cancelamento, arraste), não eventos reais de navegador nem cronômetro dos robôs. Workflow configurado para node --check web/app.js e node --test tests/mobile-touch.test.mjs.
Consultas anteriores aos checks e runs do commit 3beda033 retornaram listas vazias; a consulta de runs disponível filtra execuções originadas de PR. Não concluir que não houve execução de push. Sem confirmação de CI verde nem teste em Android físico.
PR em rascunho foi tentado anteriormente, mas houve timeout; existência permanece não confirmada.
Prévia pública histórica: https://duduceara.github.io/domino-tour/ (não substituir sem autorização).

## 3. Matriz de estados
- Aprovado conceitualmente: visão premium, prioridade do online futuro, trabalho por telas, zero regressão, robôs com 3 segundos, segundo toque apenas quando há exatamente uma ponta.
- Implementado no código, não homologado no aparelho: interação de toque, arraste, encaixe físico condicionado à geometria, temporização dos robôs, proteção a ponteiros obsoletos, pausa em aba oculta.
- Testes criados, execução não confirmada: cinco cenários do controlador TableInteraction e sintaxe do app.
- Pendente: demonstração real da partida offline no navegador móvel, partida até resultado, validação de timer com relógio, compatibilidade com rotação e touch, testes de regressão afetados.
- Futuro: arquitetura online, autenticação, servidor autoritativo, reconexão, salas, matchmaking, rankings, torneios, monetização e observabilidade.

## 4. Marcos e critérios de saída
M00 Governança: inventário real, decisões, backlog, riscos, critérios, cronograma; pendências de evidência explicitadas.
M01 MVP técnico offline: (1) testes executados com resultado verificável; (2) toque, segundo toque e arraste em navegador móvel; (3) encaixes e regras; (4) robôs com intervalo 3s; (5) partida completa sem falha crítica. Não requer acabamento premium.
M02 Arquitetura online: motor puro determinístico, contrato de comandos/eventos, modelo de identidade e sessão, segurança, estratégia de nuvem e custos; ADRs aprovadas. Não exige infraestrutura implantada.
M03 Mapa de interfaces: recuperar telas 01–05 e suas aprovações; inventariar fluxos e estados de erro; numerar telas definitivas e aprovar mapa.
M04 Design premium: sistema visual e telas aprovadas individualmente, sem divergência de identidade.
M05 Integração offline: navegação, salvamento/retomada, resultado e controles ligados ao motor, testes de fluxo.
M06 Cloud: ambientes separados, autenticação, persistência, monitoramento, backups, proteção de dados, limites de custo.
M07 Multiplayer: servidor valida ações, salas, convites, matchmaking, turnos, reconexão, abandono, idempotência e testes de carga.
M08 Progressão: perfil, estatísticas, ranking, torneios, conquistas e regras antitrapaça.
M09 Comercial: publicidade moderada, produtos/assinaturas opcionais, consentimentos e métricas de receita/custo.
M10 Homologação: segurança, acessibilidade, dispositivos, rede, carga, regressão e beta.
M11 Lançamento: publicação gradual, monitoramento, suporte e roadmap.

## 5. Backlog priorizado por dependência
P0 [M00] Registrar inventário e evidências sem alterar o jogo.
P0 [M01] Obter execução verificável do CI e corrigir falhas reais, sem reexecutar auditorias antigas sem impacto.
P0 [M01] Testar em navegador móvel: uma ponta/duas pontas/nenhuma ponta, arraste válido/inválido, cancelamento, rotação, reinício.
P0 [M01] Confirmar 3s por robô, sem duplicação de timers, e partida completa até o resultado.
P1 [M02] Isolar motor determinístico da UI e definir protocolo de eventos; planejar backend autoritativo.
P1 [M03] Recuperar referências visuais 01–05 e aprovação efetiva; mapear telas restantes antes de retomar Tela 06.
P1 [M04–M05] Aprovar e integrar telas em sequência, com componentes reutilizáveis.
P1 [M06–M07] Implementar fundação cloud e multiplayer resiliente.
P2 [M08–M11] Progressão, monetização, homologação ampliada e lançamento.

## 6. Riscos e controles
R1 alto: testes automatizados não confirmados. Controle: resultado real de CI, logs, não confundir teste escrito com teste executado.
R2 alto: UI móvel não homologada. Controle: prova em dispositivo e casos de ponteiro/rotação.
R3 alto: acoplamento offline-online. Controle: ADR de motor compartilhado, servidor autoritativo e eventos determinísticos no M02.
R4 alto: custo cloud e abuso. Controle: orçamento, limites, observabilidade, segurança e ensaio de carga antes de escalar.
R5 médio-alto: decisões visuais perdidas. Controle: catálogo visual com arte, versão, aprovação e histórico de mudanças.
R6 médio: expansão de escopo. Controle: backlog, dependências, critérios de aceite e autorização para mudar marcos.

## 7. Planejamento relativo, sujeito a reestimativa
M00–M01: semanas 1–2; M02–M03: semanas 3–4; M04: semanas 5–9; M05: semanas 10–13; M06–M07: semanas 14–19; M08–M10: semanas 20–24+; M11 somente após homologação. São hipóteses, não prazos garantidos.
Pesos iniciais para planejamento: M00 3%, M01 12%, M02 8%, M03 5%, M04 15%, M05 10%, M06 12%, M07 15%, M08 7%, M09 4%, M10 7%, M11 2%. Total 100%. Recalcular progresso por critérios aceitos, não por número de commits. Referência histórica anterior: 19% estimados, sem auditoria.

## 8. Política de execução e relatório
Para cada tijolinho: objetivo -> implementação isolada -> teste afetado -> evidência -> aceite -> atualização deste Documento Mestre. Reportar marco, resultado, commit, teste, pendência, risco e próximo passo. Não modificar main, preview/github-pages nem publicar sem autorização. Não prometer trabalho assíncrono.

## 9. M00 — Catálogo de decisões das interfaces 01–05 (consolidado em 2026-11-04)
**Origem da evidência:** decisões expressas do usuário em conversas de 2026-11-03 e referências anteriores do projeto, recuperadas do histórico; Documento Mestre V5 de 2026-11-03 e showcase visual como referências documentais. **Distinção:** aprovação de conceito/arte não comprova implementação no GitHub, aprovação funcional ou que os PNGs originais estejam versionados. Não confundir o showcase promocional com aprovação individual.

### Identidade visual transversal — APROVADA como diretriz
Logo oficial: globo azul-oceano, continentes/rotas dourados, duas pedras marfim, DOMINÓ em dourado e faixa TOUR azul. Não alterar sem autorização.
Linguagem premium: azul-oceano, madeira polida, feltro verde, dourado, marfim, botões arredondados, avatares detalhados, contexto visual consistente. Referência V5: feltro #154C41, profundo #103A32, madeira #38251E, dourado #E2B65B, azul viagem #154B68, marfim #FFF5DF. São diretrizes, não prova de implementação pixel-perfect.
Marca EDVÓRIA discreta. Não copiar interfaces ou personagens de produtos de referência.

### Tela 01 — Carregamento — APROVAÇÃO EXPRESSA de conceito/arte
Fundo azul-oceano; logotipo oficial; EDVÓRIA discreta; barra curta animada sem percentual; exibição por no mínimo 2 segundos. Pendente: implementação e validação de duração/fluxo.

### Tela 02 — Acesso — APROVAÇÃO EXPRESSA de conceito/arte
Opções Entrar, Criar conta e Visitante, com assinatura discreta. Pendente: fluxo de conta, persistência, integração e testes. Não confundir com uma antiga proposta de tela de apresentação de outro aplicativo.

### Tela 03 — Identidade — APROVAÇÃO EXPRESSA de conceito/arte
Foto pessoal opcional, escolha de avatar e apelido editável; identidade azul-oceano/dourado. Pendente: catálogo definitivo, políticas de foto/privacidade, persistência e integração.

### Tela 04 — Menu principal — APROVAÇÃO EXPRESSA de conceito/arte
Identidade premium, destino/progressão, navegação e recursos visuais; painel “Sua Próxima Conquista” e caixinha de bônus aprovados em refinamento posterior. Diretriz V5: marca, avatar, apelido, configurações, card de próxima etapa, ação principal JOGAR, navegação Início/Jornada/Torneios/Ranking/Perfil; destino Ceará como referência do menu. Pendente: especificação de cada componente, artes versionadas, navegação e integração.

### Tela 05 — Preparar partida — APROVAÇÃO EXPRESSA de conceito/arte
Seleção dinâmica Offline/Online. Offline: jogador humano com três robôs, dificuldade ajustável. Online: partida rápida, criar sala e entrar em sala. Metas de pontuação 100/200/300; mesas gratuitas e premium apenas cosméticas; ação “Iniciar Partida”. Pendente: consistência entre protótipo técnico (que hoje exibe 100/150/200 e 6/7 pedras) e especificação visual aprovada, além da implementação online. A diferença 100/150/200 versus 100/200/300 é uma divergência **a resolver na integração**, não autorização para alterar código no M00.

### Telas 06–16 — PROPOSTA DE INVENTÁRIO, NÃO APROVAÇÃO INDIVIDUAL
06 Jornada; 07 Destino/desafio; 08 Mesa; 09 Resultado; 10 Torneios; 11 Detalhes; 12 Ranking; 13 Perfil; 14 Conquistas/passaporte; 15 Configurações; 16 Como jogar/Sobre. Número e divisão podem crescer após mapa de navegação. Nenhuma dessas telas deve ser considerada aprovada apenas por estar listada.

### Referências e rastreabilidade visual
Documento Mestre V5 de 2026-11-03: diretrizes aprovadas para turismo sequencial, Brasil como partida, ranking, ligas semanais, avatares/foto opcional, interface e paleta. Showcase Premium: ilustra conceitos de Tela 03 e Tela 05, mas não substitui as artes individualmente aprovadas. As imagens finais de 01–05 e seus identificadores/arquivos originais **não foram verificados no repositório nesta auditoria**; portanto a rastreabilidade binária da arte permanece pendente. Proibir redesenho automático ou substituição das referências sem conferência.

## 10. Fechamento controlado do M00 e transferência para M01
Entregues e verificados: Documento Mestre versionado, inventário de três branches encontradas, arquivos centrais da mesa técnica, teste focal e workflow, catálogo de decisões visuais com aprovação/proposta distinguida, backlog, riscos, critérios e sequência de marcos.
Limitações documentadas: inventário de diretórios não é exaustivo; não foram localizados/versionados os arquivos finais de arte aprovados; CI real e teste físico continuam sem evidência. Esses pontos **não são aprovações**. A falta das artes originais vira pendência de rastreabilidade para M03, sem bloquear o fechamento documental do M00; a falta de CI e teste físico pertence ao critério de saída do M01.
**M00: concluído no escopo documental com ressalvas de rastreabilidade.** Próxima entrega principal: M01, obter resultado verificável dos testes e prova de partida offline no navegador móvel. Não iniciar Tela 06 antes dos critérios de saída do M01 e do mapa de telas M03. Sem alteração do motor, main ou prévia pública nesta consolidação.


## 11. M01 — execução real em 2026-11-04
Base verificada: 3973bb3eada0a1d65541ee061b42e58f718b0906, branch feature/mobile-touch-v1. main e preview/github-pages não foram alteradas nesta missão. Nenhuma publicação ou merge.

### CI confirmado
Execução de push existente: https://github.com/duduceara/domino-tour/actions/runs/41818115619 — success, job 126534022823. Logs completos recuperados pela integração: checkout da base 3973bb3e, Node 22.23.4, node --check web/app.js aprovado, 5 testes focalizados aprovados e zero falhas. Não foi necessário workflow_dispatch; o workflow da branch já recebe push. O aviso de depreciação das actions Node20 não falhou o job e não foi motivo para atualização fora do escopo.

### Cobertura adicional proporcional
Adicionado tests/m01-runtime.test.mjs: executa os handlers reais de web/app.js em node:vm com adaptador DOM e relógio controlado, usando TableInteraction real. Não é navegador, PointerEvent nativo, Android físico nem homologação de toque no aparelho. Confirma segundo toque com uma ponta, duas pontas sem jogada automática, arraste válido/inválido, cancelamento, ponteiro obsoleto, submissão única e timers de 3000ms sequenciais, cancelados ao ocultar e substituídos no reinício. O teste antigo de segundo toque chama tapEndpoint explicitamente; foi preservado e complementado pela verificação do handler da interface.
Execução local: sintaxe aprovada; 12 testes executados, 12 aprovados, 0 falhas. Evidência: docs/evidencias/M01-testes.txt. Workflow ampliado para executar também a nova cobertura.
Simulações: 60 mesas legais, 30 distribuições de seis e 30 de sete, quatro agentes com política de bot em todos os lugares para exercitar o motor. RNG controlado apenas nos testes, inclusive redistribuições. Integridade das 28 pedras e conservação do saldo atual verificadas após cada ação. Resultado: 1 mesa concluída com vencedor e 59 suspensas em jogo fechado. Resultado detalhado em docs/evidencias/M01-simulacoes.json. A asserção dessas simulações valida integridade e término do laço de diagnóstico; NÃO comprova conclusão bem-sucedida da mesa: consultar finished/blocked na evidência.

### Bloqueios reais e decisão de preservação
- dist/src/engine.js, pass(): jogo fechado muda phase para blocked-awaiting-rule, sem adjudicação, vencedor nem nova distribuição. Isso impede conclusão geral de partidas. Não confundir a suspensão controlada com resultado homologado.
- highestHeldDouble()/play(): abertura exige jogar a própria maior carroça; diverge da diretriz histórica de escolha livre pelo jogador que abre. Em 6+6+6+6+4 sempre há ao menos três das sete carroças distribuídas, logo ausência de carroças não ocorre nesta configuração.
- play()/finishIfWon(): a batida atual transfere 5 de cada adversário (+15 ao vencedor), e a mesa termina ao atingir 2*target; não existe condição mínima de quatro rodadas. Não corresponde à tabela histórica fixa 10/20/30/40. As transferências de passe atuais foram preservadas. Estas divergências são bloqueios de conformidade, não novas regras propostas.
- O usuário exige preservar regras homologadas e não alterar regras nesta missão; a base/documentação de M00 registra explicitamente a preservação do comportamento V0.21. Não foi aplicada silenciosamente uma revisão de economia/abertura/encerramento para fazer testes passarem. Próxima correção requer consolidar qual contrato de regras rege esta branch, confrontando essas divergências com as aprovações.
- Sem dispositivo físico conectado. A automação de handlers Node não cobre layout, hit-testing nativo, captura real de ponteiro nem rotação em navegador móvel; critério 2 permanece pendente.

### Estado de aceite do M01
1. Automatizados: TESTADO, CI original confirmado e nova suíte local aprovada; CI ampliado confirmado: https://github.com/duduceara/domino-tour/actions/runs/41823270175, job 126551480334, commit dd9c423587e1c8b02e068a004822731d1f6f2349; sintaxe válida, 12/12 testes, 0 falhas. Logs em docs/evidencias/M01-ci.log.
2. Interação mobile: PARCIAL, handlers testados; navegador móvel/Android físico pendentes.
3. Motor/regras: BLOQUEADO por divergências descritas; distribuição e integridade testadas.
4. Robôs 3s: TESTADO por relógio controlado executando código real do app; aceite automatizado, sem homologação física.
5. Partida completa: BLOQUEADO por jogo fechado sem resolução; não homologado.
Progresso: 2 de 5 critérios com aceite automatizado (40%); não significa 40% do produto nem homologação física. M01 NÃO homologado integralmente.
Commit da cobertura: dd9c423587e1c8b02e068a004822731d1f6f2349. Este fechamento documental não altera código executável e dispensa nova execução de testes.\nPróxima entrega objetiva: resolver contrato de fechamento/abertura/pontuação da base e implementar a resolução de jogo fechado em alteração isolada, com testes de desempate e partida completa, antes de avançar para M02 ou interfaces.


## 12. Adendo M01 — responsividade premium (2026-11-04)
REQUISITO APROVADO: partida horizontal em celulares pequenos/grandes, tablets, dobráveis e computadores, com mesa e conteúdo proporcionais, limites de dimensão, centralização e margens laterais em telas excedentes. Pedras e avatares sem deformação, mão/placares/controles essenciais sempre visíveis, leitura confortável, alvos de toque acessíveis e ausência de sobreposições/cortes/rolagem. Redimensionamento, rotação e mudança do espaço disponível em dobráveis devem preservar o estado completo da partida. A adaptação não autoriza redesenho premium, mudança de regras, publicação, merge ou alterações de main/preview.

TESTADO automaticamente em Node: tests/responsive-viewport.test.mjs, 13 testes executados, 13 aprovados, 0 falhas. Grade CSS lógica (não dispositivos reais): 568×320, 640×360, 740×360, 844×390, 915×412, 1024×768, 1280×800, 1366×1024, 720×540, 1440×900, 1920×1080, 2560×1440. Todas com orientação invertida: 24 configurações. Testes verificam landscapeViewport, área útil com insets assimétricos, inversão matemática do ponto de toque e preservação byte a byte do estado ao redimensionar LocalSession após uma pedra jogada. Não exercitam painéis/sensores/dobras físicas, densidade de pixels, CSS computado ou PointerEvent nativo. Evidência: docs/evidencias/M01-responsividade.txt. Nenhuma alteração executável de produção; testes anteriores não foram repetidos por não sofrerem impacto.

INSPECIONADO, não homologado visualmente: web/layout.css já limita arena a 1360px e conteúdo a 1440px e usa dimensões específicas para mão/controles. flex-shrink:1 na mão pode reduzir largura mantendo altura; portanto a proporção 2:1 não está comprovada em todos os limites. Não afirmar ausência de deformação, sobreposições nem legibilidade com base apenas em matemática de viewport. O fallback visual gira o quadro em navegador sem bloqueio nativo; o cálculo inverso foi testado, mas estabilidade da rotação e safe areas no dispositivo continuam pendentes. Próximo teste visual precisa medir retângulos reais, razão das pedras, alvos de pelo menos 44px e oclusões, com seis/sete pedras e cadeias curtas/longas, nos três percursos.

PRÉVIA EXISTENTE VERIFICADA: https://duduceara.github.io/domino-tour/web/index.html — aberta em navegador Work; carregou quatro lugares, saldo, cadeia e mão. É a versão pública anterior na branch preview/github-pages, não contém este adendo ou as alterações mobile da branch de desenvolvimento. Não houve implantação nesta etapa. Não usar essa URL como prova visual da feature/mobile-touch-v1.

ACEITE: requisitos registrados; cálculos responsivos e estado TESTADOS. Responsividade premium visual PENDENTE, sem Android físico ou navegador móvel redimensionado nesta etapa. M01 permanece em 2/5 critérios com aceite automatizado (40%); zero critérios adicionais homologados pelo adendo. Não declarar homologação visual/física. Bloqueios de fechamento e regras da seção 11 permanecem.


## 13. M01 — correção INVALID_BOUNDS e orientação (2026-11-04)
Base c45867e1eecb32ffa69451a9646b4a02a055cb35. Reprodução em Chromium real via iframe com dimensões CSS móveis: 568×320 produzia mesa 396×90, e 740×309 mesa 568×79. O solucionador exige no mínimo 120×120 (dist/src/table.js, buildTableModel). As linhas fixas de cabeçalho/configurações/mão/status e insets consumiam a altura útil. Não era um erro de distribuição ou pontuação.
Correção: configurações recolhíveis com botão acessível; passar/zoom/integral permanecem na barra inferior; grid dimensionado pela altura lógica horizontal. Medição por visualViewport com fallback, observação do contêiner raiz e atualização agrupada por microtask; ResizeObserver da mesa ignora tamanho repetido. Sem redefinir LocalSession ao girar. Gutter calculado da largura lógica evita percentuais baseados no contêiner retrato. Mesa limitada em telas grandes; mão conserva aspect-ratio 2:1 e área de toque ampliada por pseudo-elemento. Núcleo de regras, pontuação e solucionador sem alterações.
Resultado depois: mesas 396×134 em 568×320; 568×123 em 740×309; 743×226 em 915×412; 816×554 em 1024×768; 1164×596 em 1920×1080. Frames retrato 309×740, 320×568, 412×915 mantiveram apresentação horizontal. Área útil mínima coberta por esta evidência: 568×320 e 740×309; não declarar suporte irrestrito a janelas com altura menor que 306 CSS px ou insets que reduzam a área abaixo dos cenários cobertos.
QA de navegador: tests/browser-responsive.html executado em Chromium pelo preview interno. Oito dimensões; zero recortes dos controles essenciais/assentos/mão, estado visual de mãos/placares preservado durante redimensionamento; seleção, jogada e arraste após rotação aprovados por PointerEvents sintéticos e clique DOM. A sincronização da QA espera dimensões E flag rotated, pois trocar retrato/paisagem mantém o mesmo par lógico width/height e medições prematuras davam falsos recortes. Essa automação não equivale a captura de ponteiro física, Android real, nem prova da orientação nativa. O bloqueio nativo permanece condicionado ao suporte e gesto de tela cheia; o fallback visual abre automaticamente horizontal.
Testes locais: 25/25 aprovados, 0 falhas, node --check web/app.js aprovado. O adaptador DOM foi atualizado para CSSStyleDeclaration.setProperty; os cenários anteriores foram preservados. Workflow ampliado para incluir os 13 casos responsivos. CI confirmado: https://github.com/duduceara/domino-tour/actions/runs/41828215299, job 126568328761, commit 774450879eb6f29d43a9a6c7cf2a46b09dbfff32. 25 testes, 25 aprovados, zero falhas; logs em docs/evidencias/M01-bounds-ci.log. Prévia privada isolada: https://domino-tour-m01-bounds-samsung.cedufac.chatgpt.site/ — implantação succeeded. A URL foi aberta no Work e exibiu a barreira de autenticação ChatGPT, conforme privacidade exigida; jogabilidade validada no preview interno de mesmos arquivos, não além da barreira HTTPS. O titular deve entrar com sua conta ChatGPT no Samsung. Não foi tornada pública. Source commit do ambiente privado: 263427e0c47b6dfc88cf446541fe72281e0188f1; runtime copiado dos arquivos da correção. Sem alteração posterior de produção no fechamento documental.
M01: 3/5 critérios com validação automatizada (60%); interação agora exercitada também em navegador real com eventos sintéticos, sem homologação física. Regras/fechamento e partida completa continuam bloqueios da seção 11. Não declarar homologação Samsung até confirmação do usuário. main/preview/github-pages preservadas; sem merge ou publicação pública.


## 14. Retorno físico Samsung — altura útil reduzida (2026-11-04)
Usuário apresentou print da prévia privada, telefone horizontal, ainda com INVALID_BOUNDS. A faixa mínima anteriormente validada (309px) não cobria a altura útil menor com barras do navegador. O print não informa dimensões CSS exatas; não atribuir 292px como medição do aparelho. Reprodução adicional feita a 740×280 e 740×292, além dos respectivos retratos.
Correção em web/app.js e web/layout.css: modo denso pela altura lógica <340px, margens/borda menores e placares norte/sul movidos para áreas livres das barras existentes. Não reduz a exigência mínima do solucionador e não altera regras. Botão de tela cheia compacto mantém nome acessível; mensagem de turno continua acessível ao leitor de tela. Sem recriar a sessão.
Chromium real, tests/browser-responsive.html ampliado: 12 dimensões, incluindo 280/292/309px de altura útil; geometrias verified, nenhum controle/assento/pedra cortado, estado preservado. Mesa interna em 740×280 = 572×122; em 740×292 = 572×134. Seleção, segundo toque com uma ponta e arraste após rotação aprovados com eventos sintéticos. A faixa abaixo de 280px de altura útil ainda não está validada. 25 testes Node aprovados, zero falhas; CI aprovado: https://github.com/duduceara/domino-tour/actions/runs/41829693959, job 126573374660, commit 1a4432d7d61020048caef530c2e9a1798da6e96e; logs recuperados: 25 testes, 25 aprovados, zero falhas. Prévia privada no mesmo endereço atualizada com implantação succeeded, source 804b170ca3ed1619f4a2c81d1645ebbbdae78e7b; versão pública preservada. M01 permanece 60% automatizado; teste Samsung continua NÃO HOMOLOGADO até nova confirmação. A falha física anterior invalida qualquer interpretação de homologação integral da etapa 13.


## 15. M01 — orientação de entrada, clamping coerente e RAF (2026-11-04)
Base real a2b5dba247fef378f8793bb1f3d3cad6e75bdeb1. web/app.js tenta screen.orientation.lock('landscape') automaticamente na inicialização. Fullscreen é solicitado na entrada se userActivation permitir, ou no primeiro pointerdown confiável/botão de tela cheia. Recusa não interrompe a sessão; dataset.orientationLock registra native ou visual-fallback. Não prometer desbloqueio de políticas de navegador.
Todos os sinais de resize/scroll visual/fullscreen e um único ResizeObserver (raiz e mesa) entram numa fila requestAnimationFrame. Alterações do quadro são aplicadas primeiro; leitura da mesa fica para o próximo frame. Assinatura de viewport e tamanho físico evitam resolução repetida/loops; retorno de aba oculta agenda nova medição. Não usa microtask para layout.
Proteção em dist/src/viewport.js: fittedTableSpace(w,h) retorna null para superfície zerada/não finita e adia sync, sem fornecer dimensões inválidas ao motor. Para superfície positiva, k=min(1,w/120,h/120); dimensões lógicas=max(120,w/k),max(120,h/k). Mesma escala uniforme k no desenho, na prévia, nas pontas e inversão de toque (tablePoint), juntamente com zoom/pan. Assim, clamping não cria área desenhada fora do espaço real nem deforma pedras. Em área extremamente pequena a leitura pode ficar insuficiente; a proteção de geometria não equivale a homologação visual de toda dimensão arbitrária.
Motor de regras, IA, pontuação e dist/src/table.js intactos. Testes existentes preservados, apenas mock de viewport ajustado com navigator e requestAnimationFrame. Novos testes em tests/viewport-geometry.test.mjs validam limites físicos de 79/90/102px, regiões ocultas e transformação inversa com zoom/pan, nos três percursos.
Resultado local: sintaxe válida; 28/28 testes aprovados, 0 falhas. CI aprovado: https://github.com/duduceara/domino-tour/actions/runs/41831152114, commit 060eae8ee10f5257d03cd9b75d1dda90d99ef293; 28/28 testes, zero falhas, logs em docs/evidencias/M01-raf-ci.log. QA Chromium: 14 configurações (incluindo 740×260 e 260×740 com mesa física de 572×102), todas com geometria verified, nenhum controle essencial cortado e estado preservado. Seleção, jogada e arraste após rotação aprovados com eventos sintéticos. orientationLock=visual-fallback: bloqueio nativo recusado no iframe, sem travar o jogo. Prévia privada atualizada no mesmo endereço, source 8edaab0e131815c6d93f31525b701df864e47260, sem alteração da versão pública. M01 não recebe homologação física nesta etapa; mantém 60% de validação automatizada e pendências de regras/partida completa.


## 16. M01 — percepção de rotação e repaint (2026-11-04)
Usuário relata piscada ao alternar Samsung entre retrato/paisagem; prints confirmam disposição diferente de placares entre alturas lógicas. Isso não comprova bloqueio nativo. Fontes primárias consultadas: MDN ScreenOrientation.lock, Fullscreen API e User activation: fullscreen requer ativação transitória, e bloqueio de orientação pode depender de fullscreen. CSS transform apenas adapta o conteúdo; não controla rotação da interface do navegador/sistema.
Correção restrita a web/app.js: mesma disposição densa para a faixa móvel inteira abaixo de 500px lógicos (antes alternava em 340px); quadro/medições/geometria/controles atualizados no mesmo RAF antes do paint, sem frame intermediário; tentativa de fullscreen no primeiro pointerup confiável em vez de pointerdown, respeitando a ativação de toque móvel. Fallback e estado preservados. Não prometer eliminação de animação do sistema quando o navegador recusa lock.
Testes locais 28/28 aprovados, sem alterações nos testes ou regras. CI aprovado: https://github.com/duduceara/domino-tour/actions/runs/41833906325, commit 7b47e5f2e854bbec7d2fc5a8b7b7dd2bda0f9951, 28/28 testes e zero falhas. Chromium: 14 configurações sem recortes/INVALID_BOUNDS, estado preservado, seleção/jogada/arraste aprovados. Isso não mede a animação de rotação do navegador Samsung nem confirma lock nativo. M01 permanece 60% automatizado, sem homologação física. Prévia privada atualizada com implantação succeeded, source 457e2dab95a65f83066cd7d3ce7ba01cfacdb657, mantendo audiência e versão pública intactas.


## 17. Aceite físico de rotação e próximo tijolinho (2026-11-04)
O usuário confirmou expressamente: “resolveu sim” e “essa parte de girar a tela tá resolvido”, após testar Samsung e apresentar prints. Registrar ACEITE FÍSICO LIMITADO À ORIENTAÇÃO da prévia testada; encerrar essa frente sem novos ciclos. Não estender o aceite a arraste, escala das pedras, avatares, botões, regras ou partida completa. O usuário apontou esses itens como ainda insatisfatórios.
Próximo trabalho isolado: arraste. Correção em web/app.js: pointermove só exibe peça seguindo o dedo e preview do encaixe; confirmação única ocorre em pointerup usando a validação existente de intenção/projeção, lado e geometria. Cancela visual flutuante em pointercancel, perda de captura, blur, rotação ou conclusão. Arraste inválido preserva seleção para escolha explícita de ponta. Motor, TableInteraction, pontuação, IA e orientação não alterados.
web/layout.css acrescenta somente o estilo da peça flutuante. Teste de arraste do app ajustado para exigir zero commits antes da soltura; testes do controlador original preservados. Novo teste cobre preview sem commit, cancelamento e pointerup duplicado. Local: 29/29 aprovados, zero falhas; sintaxe válida. CI aprovado: https://github.com/duduceara/domino-tour/actions/runs/41835200500, commit cd6bc59b06428a42b90992d2422e802635349e3b; 29/29 testes, zero falhas. Logs em docs/evidencias/M01-drag-ci.log. Chromium com eventos sintéticos confirmou selectionAfterRotation=true, humanPlayCommitted=true, dragPreviewOnly=true, floatingVisible=true e dragAfterRotation=true. Prévia privada atualizada no mesmo endereço (source 54ea37142bcbee76884622af1bdf4e7c13ed32f5), sem publicar a versão pública. Touch físico continua pendente de avaliação do usuário.
Fila preservada: concluir controle de arraste -> legibilidade/escala das pedras -> consolidar regras e fechamento do M01 -> avatares e limpeza de controles na integração visual, sem remover controles por suposição. M01 permanece 60% automatizado; aceite de rotação não equivale à conclusão integral de um critério composto.


## 18. Aceite do arraste — 2026-11-04
Após receber a prévia privada da correção cd6bc59, com pedra acompanhando o dedo, prévia e confirmação na soltura, o usuário respondeu expressamente “Aprovado.” Aceite limitado ao arraste apresentado para avaliação no Samsung; rotação já aceita na seção 17. Encerrar essas duas frentes, preservando o comportamento aprovado. Não estender aprovação a regras/fechamento, partida completa, escala/legibilidade, avatares ou limpeza de botões.
Próxima entrega isolada: legibilidade e escala das pedras na mesa, mantendo contato físico, extremos, três percursos, estado, orientação e arraste. M01 permanece em 3/5 critérios (60%) de validação automatizada; critérios compostos de regras e partida completa continuam pendentes. Alteração somente documental, sem necessidade de repetir testes ou atualizar a implantação.

## Prévia premium isolada — 2026-11-04

Base inspecionada: `95982c102256bbcf60192e569998ac259db77993`, exclusivamente `feature/mobile-touch-v1`.

- Fluxo corrigido: identidade/carregamento (2s ou pular), apresentação/Começar, modalidade offline, jogadores/preparação, confirmação, mesa.
- Avatares SVG originais locais, madeira/feltro/dourado, pontos nas pedras existentes preservados. Robô 3 à esquerda e Robô 1 à direita, sem mudar a ordem lógica dos turnos.
- Câmera baseada na caixa da cadeia ocupada. Desenho, prévia e conversão inversa de toque compartilham a mesma câmera. Alvos de ponta conservam 44px físicos no zoom.
- Corrigido corte dos botões do cabeçalho em alturas compactas. Proporção 2:1 das pedras da mão preservada.
- Não modificados: engine.js, session.js, table.js, IA, pontuação, passagem automática/aviso de 2 segundos, transferência de cinco pontos, Próxima rodada e comportamento de rodada bloqueada.
- Baseline real disponível: 48/48; após alteração: 49/49, zero falhas. `node --check web/app.js` e `web/entry-flow.js` aprovados. Sem bundler: publicação dos módulos estáticos completos.
- Navegador Chrome real, viewport móvel por iframe: navegação das seis telas; seleção, segundo toque/escolha de ponta, arraste com prévia sem commit antecipado, commit ao soltar e conservação de estado ao redimensionar. Harness reproduzível: `tests/browser-premium.html`. PointerEvents sintéticos; não equivale a Samsung físico.
- Ajuste INVALID_BOUNDS da base preservado: espaços físicos positivos são normalizados uniformemente para o mínimo lógico de 120px; dimensão zero aguarda medição, sem inventar área física.
- M01 permanece **60%**. Aparência premium e touch desta revisão aguardam confirmação física do proprietário. Arte é evolução vetorial inicial, não equivalência final à imagem de referência.
- Hospedagem: somente prévia privada isolada existente, mantendo o público GitHub Pages e branches protegidas intactos.
