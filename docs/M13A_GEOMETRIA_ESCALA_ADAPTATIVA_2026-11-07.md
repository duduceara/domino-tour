# M13A — Geometria e escala adaptativa

Data: 07/11/2026, America/Fortaleza. Branch exclusiva: `feature/mobile-touch-v1`.
HEAD inicial remoto confirmado: `3ec1078526c1ed73738eb65ce3ff2e58d1f6927e`.

## Diagnóstico e correção

A câmera da M12 ampliava muito as primeiras pedras e depois reduzia uma cadeia espalhada no eixo horizontal. O caminho fixo do solver prioriza faixas horizontais, mesmo no feltro em retrato; havia altura disponível que o enquadramento não aproveitava.

A M13A orienta somente a geometria da cadeia pelo eixo mais longo da superfície, sem girar a interface. O solver existente recebe limites transpostos quando necessário. A câmera inicia com metade curta moderada de 20–26 CSS px, conforme a largura útil, e mantém proporção 2:1.

Uma camada de apresentação tenta reorganizar a cadeia em faixas com curvas, usando exclusivamente a cadeia pública. Reutiliza os verificadores e primitivas do ÁPICE para contatos, ausência de sobreposição e valores impressos. Não aceita encaixe visual falso. Preserva IDs, ordem cronológica dos nós e as conexões da partida; apenas as posições/orientações de apresentação podem mudar.

A busca faz até três tentativas, com orçamento de aproximadamente 12 ms por tentativa e limite de 1.600 nós. O resultado é armazenado em cache por modelo/viewport. Só substitui o fallback quando melhora o tamanho visível em mais de 3%. Na falta de solução no orçamento, conserva a geometria já validada. O tempo de busca não é uma garantia de latência no aparelho físico.

O controle de toque usa a transformação inversa da câmera, inclusive no giro exclusivo da cadeia, zoom e pan. A prévia de arraste conserva a câmera durante o gesto. O resolver de apresentação mantém a validação/jogada final na sessão original. O estado, eventos, mãos, dificuldade e pontuação não são modificados pelo reflow.

## Arquivos

- `web/app.js`: integração da apresentação adaptativa, geometria do gesto e prévias.
- `web/table-camera.js`: enquadramento proporcional, adaptação dos eixos e conversão inversa.
- `web/chain-reflow.js`: reorganização visual limitada e validada, com cache/fallback.
- `tests/adaptive-chain.test.mjs`: regressão de escala, valores, contatos, coordenadas e imutabilidade.
- `tests/m06-table-interaction-guards.test.mjs`: guarda atualizada para os adaptadores efetivamente usados.
- Este relatório.

Comparação por Git blob contra a base: **49 arquivos protegidos idênticos**, incluindo motor, regras, IA, relógio, artes, entrada, save, viewport e apresentação estrutural.

O CSS final e a posição geral da mesa são idênticos à M12. Nenhum redesenho das pedras, alteração de artes ou mudança das Telas 01–05. Motor e regras em `dist/`, IA, relógios, sons e vibração permanecem intactos. M13B não iniciada.

## Validação dirigida

34 testes aprovados, zero falhas. Incluem 240 casos adaptativos, 360 casos verticais anteriores e 900 casos de geometria anteriores: 1.500 casos geométricos. Nenhuma suíte completa foi executada.

```sh
node --test tests/adaptive-chain.test.mjs tests/portrait-table.test.mjs tests/mobile-touch.test.mjs tests/round-transition.test.mjs tests/m06-table-interaction-guards.test.mjs tests/table06.test.mjs tests/hand-arrangement.test.mjs
```

Verificados: contatos físicos, pips realmente desenhados, unicidade de pedras, proporção 2:1, ausência de cortes, pontas de 44 px visíveis, inversão exata com zoom/pan, não mutação do modelo e do estado, cache de rerender, distribuições de 6/7 pedras, cancelamento e transição de rodada. A busca pode retornar fallback sem invalidar o jogo.

Comparação pareada contra a câmera/solver da M12, 12 cadeias legais completas de 28 pedras por superfície, mesma área útil antes/depois. Valores abaixo são a média da metade curta visível, em CSS px; não são taxa de vitória ou medição de dispositivo físico.

| Superfície do feltro | M12 | M13A | Ganho médio |
|---|---:|---:|---:|
| 258 × 413 | 10.54 | 18.99 | +80.2% |
| 258 × 258 | 10.54 | 15.77 | +49.7% |
| 206 × 298 | 8.01 | 14.44 | +80.3% |

O orçamento temporal pode afetar qual solução compacta é encontrada; esses números descrevem uma execução controlada, não um mínimo universal.

No navegador remoto: fluxo preservado até a Mesa 06; fixtures de 14/28 pedras; 28 peças completas, sem cortes. Na superfície 258 × 413, foi observada metade curta mínima de 20,27 px. Arraste em partida controlada real: uma pedra da mão foi para a mesa exatamente uma vez, restando seis na mão e seguindo o turno do robô. Fixtures temporárias são isoladas e removidas da publicação.

## Limites e entrega

Em feltros curtos ou posições densas ainda pode haver redução proporcional e necessidade de Ampliar; não há garantia de empacotamento ótimo para todas as cadeias. Homologação no Galaxy S23+ físico e aprovação visual continuam necessárias. Não se promete tamanho fixo ou ausência total de redução ao crescer.

Prevista atualização somente da prévia privada separada: `https://domino-tour-m10-homologacao.cedufac.chatgpt.site/`, com login do proprietário. A hospedagem oficial e `main` não são alteradas.

Entrega em um único commit na branch autorizada, com proteção pelo HEAD esperado. O SHA final é fornecido após confirmação remota, evitando autorreferência no documento. Meta acumulada: **35% somente após persistência e validação**; este registro encerra exclusivamente M13A.
