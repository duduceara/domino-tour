# Contrato técnico — Adaptive Responsive Game UI

## Estado e fontes de verdade
As oito leis em [AGENTS.md](../../AGENTS.md) são permanentes. Os registros antigos permanecem válidos no que forem compatíveis. O registro de trava de 07/11 tinha a Tela 02 pendente; sua aprovação expressa posterior está em [VISUAL_APPROVALS.json](VISUAL_APPROVALS.json). PNG aprovado, aprovação da implementação e aprovação de screenshot por viewport são evidências distintas.

Tela 01: versão 78dd8eb, imagem proporcional preenchendo o viewport, enquadramento expressamente aprovado no S23+. Não aplicar seu cover automaticamente a telas com controles nas bordas. Tela 02: versão 2ee84db, composição adaptativa; apenas o feltro decorativo absorve altura extra. Essa decisão específica não autoriza deformar elementos de outras telas.

## Contrato de renderização
- Medir o contêiner útil após safe-area-insets, considerando barras do navegador, visualViewport, orientação e teclado. Responder a resize sem resetar sessão, avatar, seleção ou partida.
- Separar fundo/material adaptável, conteúdo essencial, HUD e alvos de entrada. Globo, marca, peças, textos e botões mantêm proporções e hierarquia. Não distorcer PNG inteiro com fill; cover só quando demonstrado que nenhum elemento essencial é perdido e o enquadramento for homologado.
- Ajustar layout, espaços decorativos e limites internos. Não pintar faixas de outra cor como correção; não inserir emendas, objetos duplicados ou vazios artificiais.
- Aplicar a mesma transformação/inversa à arte, hitboxes, arraste e encaixe. DPR melhora resolução, não altera coordenadas CSS. Cancelamento de toque e gesto devem preservar estado.
- Manter alvos confortáveis (44 CSS px quando o layout permitir), contraste, foco de teclado e redução de movimento. Registrar limitações reais de controles rasterizados menores; não alegar conformidade universal.
- Mesa vertical, quatro jogadores e humano inferior permanecem no contrato atual. Regras, IA e relógios são responsabilidades separadas do layout.
- Escopar CSS por interface; não usar regras globais para corrigir uma tela. Módulos de apresentação não podem mutar motor, storage ou estilos de outra interface. Recursos compartilhados exigem análise explícita de impacto.

## Matriz mínima e evidências
Conferir 360×640, 360×800, 412×744, 412×760 e 412×915 CSS px, mais altura reduzida para barras/teclado. Ampliar matriz quando houver risco novo. Confirmar integridade da arte, bounds, ausência de cortes/sobreposição, centralização pertinente, todos os alvos desobstruídos e fluxo de abrir/voltar. Preservar o enquadramento já homologado da Tela 01.

Capturas precisam registrar commit, viewport, DPR, navegador/versão, estado e fonte de aprovação. Comparar em condições equivalentes. Não gerar/update snapshots automaticamente e chamá-los aprovados. `scripts/compare-premium-screenshots.py` rejeita referência ausente ou tamanho divergente e produz diff; seu autoteste sintético testa o comparador, não homologa uma interface.

## Proteções executáveis
`node scripts/check-architecture.mjs` verifica PNGs contra a referência histórica, impede troca simultânea de arte e manifesto, protege código das Telas 01/02 aprovadas e escopo do CSS da mesa/identidade/configuração/acesso. As travas usam commits históricos explícitos; autorização de uma revisão futura deve ser registrada e revisada, nunca deduzida de um teste verde.

`tests/architecture-constitution.test.mjs` exercita casos negativos (arte/manifesto adulterados, modificação na tela aprovada e vazamento de CSS), além da integração real. Os testes anteriores permanecem intactos. O workflow `Architecture constitution` executa guards e testes funcionais/geométricos focados em PRs e pushes da branch. Os demais workflows permanecem ativos.

O detector de escopo é conservador e limitado ao CSS atual, sem suporte a nesting/preprocessadores. Se introduzidos, substituí-lo por parser apropriado com os mesmos testes negativos. A integridade do código aprovado detecta mudanças que podem alterar renderização, mas não substitui comparação por pixels entre browsers ou execução de gestos.

## Limitações que não podem ser omitidas
- Ainda não há conjunto versionado de screenshots homologados por viewport/browser. Comparação automática de pixels das telas completas permanece pendente; os testes não criam referências de aprovação.
- Automação não autentica sozinha uma autorização conversacional. Registros e baselines são revisáveis pelo proprietário. Um autor capaz de alterar simultaneamente código, teste e workflow pode contornar proteções sem revisão externa.
- Para bloqueio efetivo no GitHub, configurar branch protection/ruleset com o check Architecture constitution e aprovação do CODEOWNER. Esta missão adiciona CODEOWNERS, mas não altera configurações/permissões remotas nem impede por si só pushes diretos.
- AGENTS.md orienta próximas sessões compatíveis; não garante que qualquer ferramenta/autor o obedecerá. CI e revisão são camadas complementares.
- Nenhuma dessas proteções autoriza novas telas, regras ou alterações visuais nesta missão.

## Divergência histórica de formato
A inspeção encontrou cinco arquivos com extensão `.png` que contêm JPEG: `screen-02-apresentacao-rumo-a-lenda.png`, `screen-02.png`, `screen-03.png`, `screen-05.png` e `screen-06.png`. O manifesto antigo interpretou bytes JPEG como dimensões PNG, produzindo metadados incorretos. Ele foi preservado, assim como as artes e seus testes. O novo guard lê PNG/JPEG pelo formato real, compara JPEGs ao conteúdo do commit homologado e informa a divergência no relatório. Isso não autoriza converter ou renomear as artes.

## Substituição expressamente autorizada da Tela 02
Uma solicitação posterior autorizou a nova arte anexada `1000453798.jpg`. A aprovação histórica em 2ee84db permanece recuperável; a autorização e o hash do novo JPEG estão em [SCREEN02_REPLACEMENT_AUTHORIZATION.json](SCREEN02_REPLACEMENT_AUTHORIZATION.json). A integração nova permanece pendente de homologação visual e funcional. A exceção do entry point é específica desta substituição e não libera alterações na Tela 01 ou em estilos compartilhados.
