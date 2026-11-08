# Implementação da constituição técnica

HEAD remoto inicial consultado: `2ee84db2a3e044c2373af4e07eaf5220eb6de597`.

Não existia AGENTS.md na raiz nem instrução local equivalente no checkout. Foram lidos os workflows de integridade, touch, interação de mesa e recuperação premium, os testes de artes e layout e o registro histórico de trava visual. Todas as instruções compatíveis e os arquivos existentes foram preservados.

## Entrega
- AGENTS.md: oito leis, leitura inicial, fluxo seguro e homologação individual.
- ADAPTIVE_RESPONSIVE_GAME_UI.md: contrato de viewport, escala, material adaptável, HUD, hitboxes, safe areas, testes e limites.
- VISUAL_APPROVALS.json: aprovações expressas 01/02 vinculadas aos commits, sem inventar screenshots homologados.
- CODEOWNERS: proprietário como revisor de governança, testes, workflows, artes e código de apresentação/motor. Não é uma regra de bloqueio remoto por si só.
- check-architecture.mjs: hashes, dimensões PNG/JPEG, referência histórica imutável, dez arquivos de apresentação aprovados e quatro escopos de CSS.
- architecture-constitution.test.mjs: integração e casos negativos de adulteração, vazamento e mudança não revisada.
- test_visual_comparator.py: fixtures sintéticas comprovam aceitação de igualdade, rejeição de diferenças, referência ausente e viewport divergente. Fixtures não são baselines do jogo.
- architecture-constitution.yml: guard, testes focados, comparador, relatório como artifact e aviso explícito do gate visual pendente.

## Resultados efetivamente verificados
78 testes Node aprovados, sem falhas, cancelamentos ou skips. Quatro testes Python aprovados. Guard executado com sucesso: 21 imagens históricas, dez arquivos aprovados e quatro escopos CSS; cinco divergências históricas de extensão/formato reportadas sem modificar arquivos ou manifesto antigo. YAML validado, triggers restritos à branch de desenvolvimento e permissões de leitura. Testes existentes permanecem byte-idênticos; nenhum código de web/dist foi alterado. O checkout do workflow mobile-touch-tests recebeu apenas fetch-depth: 0 para disponibilizar referências históricas, sem remover ou reduzir testes.

Esta missão não exigiu navegador, mudança visual, build ou nova publicação de prévia. Não se declara nova certificação visual. A execução do workflow no GitHub precisa ser conferida após o commit; resultados locais não são apresentados como execução remota.

## Pendências e limites
- Não há coleção versionada de screenshots explicitamente homologados por viewport/browser; comparação integral por pixels permanece pendente. Não houve promoção automática de capturas.
- As proteções não substituem aprovação do proprietário nem provam zero regressão universal. Travas de código detectam alterações no estado aprovado, mas não diferenças causadas por navegador/OS.
- Require status checks, review de CODEOWNERS e bloqueio de push direto dependem do ruleset/branch protection remoto. Nenhuma configuração/permissão remota foi alterada nesta missão.
- AGENTS.md deve ser lido por próximas sessões; sua leitura por todo agente externo não pode ser tecnicamente garantida só com um arquivo.
- Mudanças futuras autorizadas nas telas aprovadas exigem revisão explícita das travas e histórico de aprovação; não há rotina automática que regrave baselines.

## Verificação da CI e correção de infraestrutura
O workflow Architecture constitution passou remotamente no commit 02bc0bf5ad443e8fad1dd00d97bf237d7e67443e (run 42431576079); Premium fidelity guard também passou. O workflow antigo Mobile touch focused tests falhou: checkout raso impedia leitura dos commits homologados e havia falhas de harness antigas. Foi adicionado fetch-depth: 0 ao checkout desse workflow, fortalecendo a execução sem enfraquecer testes.

As suítes board-legibility, bot-levels e m01-runtime foram executadas em worktree isolada do commit BASE 2ee84db, anterior à constituição, para confirmar as falhas antigas. Nessa base, 43 testes foram executados: 16 passaram e 27 falharam, incluindo fitTableCamera/portraitTableViewport não definidos no harness. A CI apresentou também uma asserção antiga de distribuição que não se repetiu nessa execução local; sua causa não foi corrigida nem ocultada. Os testes foram mantidos sem alteração; sua reparação não deve mudar regras ou interfaces e permanece pendente, fora desta missão de governança. O sucesso do novo guard não é apresentado como sucesso da suíte inteira.
