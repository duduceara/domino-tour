> Atualização WORK 02C: as posições laterais históricas abaixo foram substituídas pelo sentido horário aprovado: Você embaixo, RobiX à esquerda, AndroX acima, DomiX à direita. Ver [contrato atual](OFFLINE_02C_2026-11-04.md). Artes preservadas.

# DOMINÓ TOUR — Referência visual obrigatória da mesa premium (M01)

Aprovada pelo proprietário em 04/11/2026, com base na imagem enviada na conversa: mesa oval de madeira polida e feltro verde, cenário de pôr do sol tropical, quatro jogadores com avatares e placas de pontos, pedras grandes e legíveis, mão humana na base, logotipo DOMINÓ TOUR / EDVÓRIA, barra superior com modalidade e meta, moedas/diamantes e controles discretos.

## Diretrizes visuais

1. **Prioridade absoluta**: a primeira imagem enviada é a direção artística da interface de jogo. A tela técnica verde com textos e controles soltos não é aceitável como produto final.
2. **Mesa**: superfície oval horizontal centralizada, aro de madeira volumétrico e acabamento dourado; área jogável deve ter limites físicos válidos e nunca sobrepor mãos/placares.
3. **Quatro posições**: humano na base, robô 2 no topo, robô 3 à esquerda e robô 1 à direita; avatares e pontuação legíveis e estáveis em rotação.
4. **Pedras**: mão humana grande e centralizada na borda inferior; adversários com verso azul, sem revelar valores; pedras da mesa com pontos visuais, nunca só numerais pequenos.
5. **Barra superior**: identidade EDVÓRIA, modalidade e meta, indicadores de moedas/diamantes apenas quando houver economia real integrada. Não inventar saldos nem adicionar compra fictícia.
6. **Rodadas**: ao bater, manter a última disposição visível, mostrar resultado e botão Próxima rodada. Partida terminada: Jogar novamente.
7. **Passagens**: sem botão Passar. Cada passagem obrigatória gera aviso de 2 segundos; para o próprio jogador, VOCÊ PASSOU; para os demais, identificação de quem passou. A regra dos 5 pontos permanece intocada.
8. **Geometria**: corrigir INVALID_BOUNDS antes de declarar tela jogável. Testar dimensões físicas Samsung em paisagem e retrato com fallback visual; não fabricar encaixes nem reduzir pedras a pontos ilegíveis.
9. **Responsividade**: cabeçalho, mesa, placares, mão e controles visíveis na paisagem sem rolagem vertical; preservar touch, arraste, segundo toque e zoom.
10. **Zero regressão**: modificar apenas feature/mobile-touch-v1, sem main, publicação ou alteração de regras ainda não aprovadas.

## Etapas de implementação

- V1: tokens visuais de madeira/feltro/ouro, hierarquia de mesa e placares, layout paisagem sem regressão.
- V2: artes reais (cenário, logotipo, avatares, versos e faces das pedras), com assets otimizados e licenciamento confirmado; não substituir por emojis como versão final.
- V3: integração visual com estados reais, resultados, passagem, economia futura e testes de toque/rotação.
- V4: homologação visual lado a lado com a referência no Samsung e teste completo de partida.

## Critério de aceite

A imagem de referência define a meta estética, não um resultado já alcançado. A tela somente será declarada premium homologada após comparação visual física e correção de INVALID_BOUNDS. M01 permanece em 60% até validações adicionais.
