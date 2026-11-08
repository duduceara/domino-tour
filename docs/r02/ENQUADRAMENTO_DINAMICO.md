# R02 — enquadramento dinâmico da apresentação

Base remota consultada: `9c1535b1724aacb65851629852baa6b53f409323`, branch `feature/mobile-touch-v1`. Ponto recuperável local: `recovery/r02-start`; o commit inicial continua ancestral da correção. Preservado o registro de homologação adicionado por outra sessão.

## Diagnóstico e solução
A arte original 1024×1536 era limitada pela largura e centralizada em uma área mais alta. Isso produzia faixas externas. A solução histórica do M07 usa esse enquadramento proporcional e não contém uma implementação comprovada de preenchimento integral que possa simplesmente ser restaurada.

A correção fica em `web/presentation-fit.js` e `web/presentation-layout.js`. A imagem original não é regravada ou substituída. A apresentação usa três regiões contíguas do mesmo PNG, renderizadas em canvas com escala adequada ao DPR. Conteúdo superior e inferior conservam escala uniforme. Apenas a faixa decorativa de feltro sem pedras, textos ou controles, entre as linhas 724 e 760 da arte, absorve a altura adicional. Isso alonga o fundo da mesa decorativa; não se aplica cover/fill à imagem inteira. A passagem entre regiões usa as coordenadas contíguas da própria arte, sem espaços vazios ou repetição de objetos.

Os 11 controles mantêm largura/altura proporcionais e recebem a mesma transformação de posição que sua arte. A área útil é medida no contêiner existente, que já respeita os safe-area-insets. Telas curtas conservam a rolagem anterior para não esmagar conteúdo.

CSS corretivo injetado pelo módulo é exclusivamente limitado a `#entry-flow[data-step="2"]`. Não foram modificados `layout.css`, `premium-polish.css`, HTML, navegação, PNGs ou arquivos das Telas 03–06. A Tela 01 recém-aprovada permanece byte-idêntica no PNG, estilos, HTML e navegação.

## Verificação
- 20 testes direcionados aprovados: novo layout R02, enquadramento R01, carregamento/transição, preservação da arte M07, guards de recuperação e contrato de Jogar Rápido.
- Novos testes verificam 11 hitboxes, limites e proporções em 320×568, 360×640, 360×800, 412×744, 412×760, 412×915 e 430×932; fallback de rolagem em 320×400; integridade exata dos arquivos da Tela 01 e PNG original.
- Navegador: composição com altura integral e top=0 em 412×744, 360×800 e 412×915. Os centros dos 11 controles foram verificados via hit-testing; todos desobstruídos.
- Jornada, Torneios, Perfil, Ranking, Conquistas e Regras foram acionados no navegador e retornaram à Tela 02. Jogar Rápido manteve seu contrato funcional nos testes existentes; não foi aberta a Tela 03 na conferência visual.
- Nenhuma referência visual ou teste existente foi alterado para aprovar diferenças. A antiga matriz browser M07 contém pressupostos de imagem única 2:3 e navegação de uma versão anterior; não foi executada nesta missão nem regravada.
- As primeiras tentativas locais de repetir textura apresentaram emendas e foram descartadas antes do commit/publicação.

## Homologação
A apresentação adaptativa é candidata à aprovação, não uma referência automaticamente homologada. A altura do feltro varia com a proporção do aparelho. A conferência física no Galaxy S23+ pertence ao proprietário; testes no navegador não substituem essa aprovação.

Prévia privada existente, sem alterar hospedagem oficial: abrir a raiz e aguardar os 3 segundos da Tela 01 aprovada para chegar à Tela 02. Não clicar em Jogar Rápido para esta homologação. Nenhuma nova funcionalidade foi iniciada.
