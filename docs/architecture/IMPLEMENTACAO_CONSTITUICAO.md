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
78 testes Node aprovados, sem falhas, cancelamentos ou skips. Quatro testes Python aprovados. Guard executado com sucesso: 21 imagens históricas, dez arquivos aprovados e quatro escopos CSS; cinco divergências históricas de extensão/formato reportadas sem modificar arquivos ou manifesto antigo. YAML validado, triggers restritos à branch de desenvolvimento e permissões de leitura. Testes e workflows existentes permanecem byte-idênticos; nenhum código de web/dist foi alterado.

Esta missão não exigiu navegador, mudança visual, build ou nova publicação de prévia. Não se declara nova certificação visual. A execução do workflow no GitHub precisa ser conferida após o commit; resultados locais não são apresentados como execução remota.

## Pendências e limites
- Não há coleção versionada de screenshots explicitamente homologados por viewport/browser; comparação integral por pixels permanece pendente. Não houve promoção automática de capturas.
- As proteções não substituem aprovação do proprietário nem provam zero regressão universal. Travas de código detectam alterações no estado aprovado, mas não diferenças causadas por navegador/OS.
- Require status checks, review de CODEOWNERS e bloqueio de push direto dependem do ruleset/branch protection remoto. Nenhuma configuração/permissão remota foi alterada nesta missão.
- AGENTS.md deve ser lido por próximas sessões; sua leitura por todo agente externo não pode ser tecnicamente garantida só com um arquivo.
- Mudanças futuras autorizadas nas telas aprovadas exigem revisão explícita das travas e histórico de aprovação; não há rotina automática que regrave baselines.
