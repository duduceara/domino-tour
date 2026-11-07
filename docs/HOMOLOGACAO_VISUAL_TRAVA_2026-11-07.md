# DOMINÓ TOUR — trava de homologação visual (07/11/2026)

## Decisão expressa do proprietário
- **Tela 01: APROVADA.** Seu enquadramento real no dispositivo é a referência; preservar imagem, geometria, apresentação e transição.
- **Telas 02–05:** já foram aprovadas anteriormente, mas a apresentação atual sofreu regressões durante o trabalho na Tela 06. Não confundir aprovação histórica com homologação da renderização atual.
- **Tela 06:** preservar trabalho funcional existente; não permitir que seus ajustes alterem as telas anteriores.
- Proibido reconstruir ou regenerar artes aprovadas para resolver problemas de layout.
- Cada tela deve ser conferida individualmente no aparelho e só recebe nova homologação com aprovação explícita do proprietário.

## Limitações técnicas verificadas no repositório
- O manifesto `docs/m13-r/approved-art-reference.json` protege bytes de PNGs históricos, não a aparência renderizada.
- `tests/premium-recovery.test.mjs` valida hashes e propriedades estruturais, mas não possui capturas de navegador homologadas por viewport.
- O relatório `docs/m13-r/RELATORIO.md` registra que o enquadramento de imagens 1024×1536 em áreas de outras proporções ainda pode produzir margens externas; não foi comprovada homologação visual física das Telas 02–05.
- `web/presentation-fit.js` altera a largura da apresentação dinamicamente. Alterações nesse módulo e em CSS compartilhado exigem comparação visual da Tela 01 e da Tela 02.

## Protocolo obrigatório antes de novas mudanças
1. Confirmar HEAD remoto e preservar ponto de recuperação.
2. Identificar o commit aprovado e o PNG correspondente por tela, sem trocar nomes editoriais por números de fluxo.
3. Capturar o navegador em dimensões reais, comparar com a captura explicitamente homologada e verificar áreas clicáveis.
4. Corrigir somente o seletor/componente responsável pela diferença; nunca modificar uma tela aprovada como efeito colateral.
5. Executar suíte funcional e visual, registrar resultados e solicitar homologação no aparelho.
6. Sem captura de referência homologada, **não afirmar zero regressão visual nem 100% de conclusão**.

**Estado deste registro:** proteção documental e auditoria de código; não constitui prova de correção ou homologação visual das Telas 02–06.
