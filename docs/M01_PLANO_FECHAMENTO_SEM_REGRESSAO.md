# DOMINÓ TOUR — M01: implementação segura de fechamento e partida completa

Status: plano de execução, sem alterar regras ainda não aprovadas. Referência: commit `06957d6` na branch `feature/mobile-touch-v1`.

## 1. Máquina de estados existente

| Situação | Estado | Ação permitida |
| --- | --- | --- |
| Rodada ativa | `playing` | `play` ou `pass` válidos |
| Mão zerada | `playing` ou `finished` | Pontuação de batida, nova distribuição ou vitória |
| Tranca de quatro assentos | `blocked-awaiting-rule` | Nenhuma adjudicação automática |
| Meta atingida | `finished` | Exibir vencedor; impedir jogadas posteriores |

A função `pass` registra `{type:'pass',seat,delta:-5,beneficiary:lastPlayed}`, transfere exatamente cinco pontos do passante ao último que jogou e somente então verifica eventual vitória por meta. Três passes consecutivos não implicam necessariamente tranca: o último que jogou ainda pode ter pedra legal. O motor verifica essa condição antes de bloquear.

## 2. Decisões de produto indispensáveis

**D1. Critério de tranca:** quando ninguém pode jogar, usar menor soma dos pontos nas pedras restantes, outra regra, ou encerrar sem pontuação? Em caso de empate, como desempatar?

**D2. Pagamento na tranca:** quais jogadores pagam, quem recebe, quantos pontos e se o pagamento depende da soma das pedras? A regra aprovada de cinco pontos por *passagem* continua independente.

**D3. Nova rodada:** depois da tranca, quem abre? Depois da batida, manter o vencedor como primeiro jogador ou voltar à maior dupla?

**D4. Meta da partida:** confirmar 100/150/200 (implementado) ou 100/200/300 (proposto na interface). Confirmar também a condição de vitória: saldo inicial igual à meta e vitória em 2× a meta.

Sem D1–D4, não codificar um desempate arbitrário.

## 3. Ordem técnica de implementação após aprovação

1. Registrar as decisões como contrato versionado, com exemplos concretos de quatro jogadores.
2. Criar testes unitários RED para tranca com vencedor único, empate, conservação da soma de saldos, novo abridor e partida completa de 6 e 7 pedras.
3. Implementar uma função explícita `resolveBlockedRound` que só aceite estado `blocked-awaiting-rule`; rejeitar chamadas duplicadas e dados inconsistentes.
4. Reaproveitar `startNextRound` com o assento de abertura aprovado, sem recriar a partida e sem perder pontuação.
5. Manter `pass`, `play`, `auditedBotTurn`, `TableInteraction`, orientação, zoom, arraste e temporizador de 3 segundos sem alterações salvo necessidade demonstrada por teste.
6. Rodar todos os testes existentes e novos, simulações determinísticas e QA visual; somente depois considerar o critério de partida completa homologado.

## 4. Matriz de aceitação

- [ ] 6 pedras: batida, tranca, empate e vitória final.
- [ ] 7 pedras: batida, tranca, empate e vitória final.
- [ ] Passes sucessivos: beneficiário permanece o último jogador válido, +5 por passante.
- [ ] Nenhuma passagem quando há jogada legal.
- [ ] 28 pedras únicas preservadas em todos os estados.
- [ ] Soma dos saldos preservada em operações competitivas, exceto recarga autorizada.
- [ ] Exatamente um evento de encerramento por rodada e por partida.
- [ ] Estado `finished` não aceita novos movimentos.
- [ ] Rotação e arraste aprovados permanecem funcionais.
- [ ] GitHub Actions apresenta conclusão real com zero falhas.
- [ ] Teste no Samsung e prévia de feature branch atualizada, sem mexer na prévia pública.

## 5. Limite da evidência CI

O conector GitHub consultou o commit `06957d67d4b68913b3ab36576a3be5c77b7e3afc`. `fetch_commit_workflow_runs` não lista execuções de `push` de forma abrangente; `get_commit_combined_status` retornou `statuses: []`. Portanto, CI **não confirmado** nesta auditoria, sem inferir sucesso nem falha. O workflow configurado executa os arquivos `tests/board-legibility.test.mjs` e `tests/m01-rules-contract.test.mjs` juntamente com os testes anteriores.

**Progresso homologado:** M01 = 60% (3/5), sem incremento por documentação.
