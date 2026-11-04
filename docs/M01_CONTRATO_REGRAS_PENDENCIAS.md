# DOMINÓ TOUR — M01: contrato de regras e pendências de homologação

Status: **inventário técnico, NÃO aprovado para alteração do motor**. Base: branch `feature/mobile-touch-v1`, inspeção de `dist/src/engine.js`. Este arquivo não altera o jogo.

## Comportamentos já codificados e que não devem sofrer regressão

- 28 pedras únicas, quatro assentos; mão de 6 ou 7 pedras; sobra sem compra.
- Abertura inicial pela maior dupla efetivamente distribuída.
- Uma jogada deve corresponder a uma ponta legal; passagem somente sem jogada legal.
- Cada passagem transfere 5 pontos do passante ao **último jogador que colocou pedra válida**. O beneficiário não muda durante passes consecutivos; muda somente após nova pedra válida.
- Robôs agem um turno por vez, com espera de 3 segundos na camada da aplicação.
- Batida por esvaziamento de mão: o código transfere 5 pontos de cada adversário ao jogador que bate e redistribui, salvo fim de partida.
- Pontuação atual: cada participante inicia com saldo igual à meta; vence quem atinge o dobro da meta. Os valores aceitos pelo motor são 100, 150 e 200.
- Um bloqueio real após três passes e ausência de jogada para o último jogador resulta em `blocked-awaiting-rule`, deliberadamente sem vencedor.

## Divergências que exigem decisão antes de modificar o motor

1. **Fechamento/tranca:** qual critério adjudica uma rodada sem jogadas (menor soma das pedras, empate, quem recebe pontos, valor da transferência e assento que inicia a próxima rodada)? Não assumir regra tradicional como se já aprovada.
2. **Metas:** interface premium anteriormente planejada 100/200/300, mas motor aceita 100/150/200. A mudança exige decisão de produto e atualização coordenada de UI, validação e testes.
3. **Abertura de rodadas seguintes:** `startNextRound` força a abertura pelo assento que bateu, sem exigir maior dupla. Confirmar se a regra aprovada é manter esse privilégio ou reaplicar a maior dupla.
4. **Vitória/encerramento:** validar se meta dupla e transferências de 5 pontos são definitivas para o modo offline e se há alguma regra adicional de torneio.
5. **Cenários de esgotamento de saldo:** `recharge` e `botTakeover` existem, mas integração com economia/continuidade online está fora do M01.

## Critérios de teste após aprovação

- Rodada bloqueada resolvida deterministicamente; estado e 28 pedras íntegros.
- Transferências preservam a soma dos saldos, exceto recarga explicitamente autorizada.
- Empates e sequência de abertura testados.
- Simulações de 6 e 7 pedras não param em `blocked-awaiting-rule` sem adjudicação.
- Partida completa atinge fase `finished`, registra vencedor e não duplica pagamentos.
- Nenhuma mudança em rotação, arraste, segundo toque, temporizadores, `main` ou `preview/github-pages`.

## Evolução de legibilidade (M01)

O commit `430a8b4` ampliou apenas o tamanho da fonte das pedras na mesa, de `min(18, height*0.6)` para `min(22, height*0.72)`, sem tocar em hitboxes ou coordenadas. O teste focalizado `tests/board-legibility.test.mjs` executa a função real `drawBoard` com DOM mínimo e verifica cinco alturas, fonte, posicionamento, rotação e estado desabilitado. A aprovação do CI e o aceite visual em Samsung devem ser verificados separadamente. Não confundir testes de DOM simulado com captura física.

**Progresso M01:** manter referência 3/5 (60%) até evidência de homologação adicional. Não aumentar por mera criação de teste ou documentação.
