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
