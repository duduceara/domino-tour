# DOMINÓ TOUR | EDVÓRIA — constituição técnica permanente

Estas instruções aplicam-se a todo o repositório. Antes de editar qualquer arquivo, leia este documento, [o contrato adaptativo](docs/architecture/ADAPTIVE_RESPONSIVE_GAME_UI.md), o registro de aprovação pertinente e instruções locais mais específicas. As instruções expressas do proprietário prevalecem; autorização não se presume.

## Leis permanentes
1. **ZERO REGRESSÃO:** preservar funcionalidades, regras, interfaces, dados e artes aprovadas. Mudança localizada não autoriza efeitos colaterais em outras telas.
2. **ADAPTIVE RESPONSIVE GAME UI:** adaptar composição e fundo à área útil, safe areas e proporção do dispositivo; preservar escala dos elementos essenciais, legibilidade e alvos de toque. Não esticar a imagem inteira nem cortar conteúdo para esconder faixas.
3. **ISOLAMENTO:** estilos e comportamentos pertencem à sua interface. Uma alteração na Mesa 06 não pode modificar as Telas 01–05. Evitar seletores globais e mudanças em coordenadas compartilhadas; alterações transversais exigem escopo expresso e verificação das telas afetadas.
4. **HOMOLOGAÇÃO:** só o proprietário aprova visualmente. Testes não substituem aprovação física. Não promover capturas candidatas a referências nem atualizar baselines para fazer testes passarem.
5. **PRESERVAÇÃO:** não regenerar, sobrescrever, recortar fisicamente ou substituir PNGs homologados sem autorização expressa. Verificar hashes e dimensões antes/depois. Ajustes de composição devem preservar elementos essenciais e sua geometria.
6. **QUALIDADE:** aplicar boas práticas de jogos, lógica, matemática, UI/UX, gráficos e testes proporcionais ao risco, com orçamento de CPU/memória adequado ao celular. Conferir desenho renderizado, não apenas arquivos-fonte.
7. **RASTREABILIDADE:** registrar causa, escopo, implementação, testes realmente executados, limitações e SHA remoto. Não declarar 100% ou zero regressão visual universal sem prova.
8. **EXECUÇÃO SEGURA:** usar exclusivamente `feature/mobile-touch-v1` nesta linha de trabalho. Não alterar main, hospedagem oficial, motor ÁPICE ou regras fora de autorização expressa. Nunca usar force push. Preservar trabalho de outras sessões.

## Procedimento obrigatório
- Consultar o HEAD remoto antes de modificar; conferir status e preservar um ponto recuperável. Se houver avanço concorrente, reconciliar sem sobrescrever.
- Identificar a interface por nome, arquivo e posição no fluxo: a numeração editorial histórica difere da numeração funcional.
- Definir os arquivos necessários e os arquivos que devem permanecer idênticos. Trabalhar em blocos pequenos e testáveis.
- Telas 01 e 02 estão expressamente aprovadas nas versões registradas em `docs/architecture/VISUAL_APPROVALS.json`. Preservar ambas; a aprovação da Tela 02 não inicia a Tela 03.
- Executar `node scripts/check-architecture.mjs` e `node --test tests/architecture-constitution.test.mjs tests/r01-full-viewport.test.mjs tests/r02-presentation-layout.test.mjs`, além dos testes funcionais pertinentes à alteração.
- Para mudanças visuais: conferir diferentes proporções no navegador, safe areas, redimensionamento, cortes, sobreposições, alvos, carregamento e retorno. Priorizar Samsung Galaxy S23+. Não alegar teste físico se só houve emulação.
- Testes existentes não podem ser enfraquecidos, apagados, ignorados ou ter suas referências alteradas para esconder diferenças. Investigar falhas e distinguir preexistentes, ambientais e introduzidas; registrar as não resolvidas.
- Alterar qualquer trava de aprovação exige autorização expressa para a interface e nova evidência. Não regenerar automaticamente manifestos/baselines. Um novo registro deve manter o histórico anterior e explicar a autorização.
- Antes de commit: revisar diff, repetir somente verificações afetadas, confirmar arquivos preservados e persistir na branch autorizada. Confirmar SHA remoto. Prévia apenas separada e privada/temporária, conforme autorização.
- Apresentar resultado concreto e aguardar aprovação expressa da tela em revisão. Não iniciar novas interfaces por conta própria.

## Limites reais das proteções
CI detecta violações dos contratos codificados, não demonstra ausência de todo defeito. CODEOWNERS não bloqueia sozinho pushes diretos. Checks obrigatórios e revisão exigida dependem da configuração de proteção da branch. Não alterar permissões ou proteções do GitHub sem escopo específico. As limitações e o protocolo de referências visuais estão no contrato adaptativo.
