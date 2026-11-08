# R02 — integração da nova arte oficial do menu

HEAD remoto inicial: `64b3761e4a114413b3c714a2ec86f569f8c3c061`. Branch exclusiva: feature/mobile-touch-v1. Ponto recuperável local: recovery/r02-art-replacement-start. Lidos AGENTS.md, contrato adaptativo e travas existentes antes da edição.

## Autorização e integridade
O proprietário autorizou expressamente substituir o menu principal pela imagem anexada `1000453798.jpg`, independentemente da numeração editorial antiga. O arquivo real é JPEG, 708×1536, 340913 bytes; não foi convertido, recomprimido, redesenhado nem renomeado para PNG.

Destino: `web/assets/approved/screen-02-menu-oficial-r02.jpg`.
SHA-256: `1a04ec265596f7cde5d7afff5d4df4215dcca2cd3f48f805b09ea9813ca5f3da`.

A arte anterior `screen-02-oficial.png` continua no repositório, byte-idêntica, e sua implementação aprovada permanece recuperável no commit 2ee84db. A autorização nova foi registrada separadamente de homologação da implementação; nenhuma captura candidata foi promovida automaticamente a baseline.

## Implementação localizada
- `presentation-fit.js` delega somente a apresentação da Tela 02 ao novo módulo.
- `presentation-official.js` usa o mesmo elemento de imagem, botões e listeners do fluxo atual; troca a fonte visual e alinha as 11 áreas de toque às coordenadas da nova arte.
- `presentation-official-layout.js` descreve o JPEG e a geometria. Globo, logotipo, paisagem central, mesa inteira, pedras, textos e controles usam escala uniforme. Somente intervalos decorativos fora desses elementos absorvem variação de altura. Todas as regiões são contíguas, sem recorte ou duplicação de objetos.
- Em proporções incompatíveis, limita a escala e mantém a composição inteira com margem lateral natural; não força distorção nem esconde elementos. O contêiner existente fornece as áreas seguras do Android.
- CSS novo é restrito a `#entry-flow[data-step="2"]`. HTML, layout.css, premium-polish.css, navegação e fontes das Telas 03–06 permanecem idênticos.
- A trava arquitetural mantém todos os hashes históricos e inclui uma exceção estreita e documentada para o entry point expressamente autorizado, mais hash e dimensões da nova arte. Testes antigos e referências existentes não foram alterados. A nova suite foi adicionada à CI de arquitetura.

## Verificação efetiva
85 testes Node direcionados aprovados, zero falhas/skips/cancelamentos nessa seleção. Incluem: nova arte, geometria, hitboxes, leitura da autorização, proteção arquitetural, integridade histórica, R01, layout legado R02, fluxo, identidade, visitante, touch e próxima rodada. Nenhuma suíte existente foi reduzida. A suíte geral histórica tem falhas já documentadas e não foi reexecutada localmente nesta missão.

Navegador com o aplicativo real:
- 412×744: composição 398,44×744, margem de 6,78 CSS px por lado, sem overflow; 11 alvos dentro da composição e desobstruídos.
- 412×915: composição 412×915, sem overflow; 11 alvos desobstruídos.
- 360×800: composição 360×800, sem overflow; 11 alvos desobstruídos.
- 768×1024: preservação proporcional com composição 548,39×1024 e margens laterais de 109,8 px; sem overflow. Limitação geométrica declarada, sem preencher a tela às custas de corte ou deformação.
- Jornada Mundial e Regras abriram seus painéis reais e retornaram à Tela 02. O contrato existente de Jogar Rápido → configuração foi verificado pelos testes funcionais; não se iniciou desenvolvimento da Tela 03.

Arquivos da Tela 01 (PNG, HTML, estilos e transição), artes anteriores, demais telas e engine foram comparados por bytes à base. Nenhuma alteração em regras, robôs, pontuação, relógios, dados, main, hospedagem oficial ou Google Play.

## Homologação pendente
Prévia privada existente será atualizada. Abrir a raiz, aguardar a Tela 01 aprovada e conferir a Tela 02. Aprovação estética do anexo não equivale à homologação desta renderização/interação. A conferência física no Samsung Galaxy S23+ pertence ao proprietário; não foi alegado acesso a esse hardware.
