# DOMINÓ TOUR — atualização oficial das carroças

## Regra vigente por decisão expressa do proprietário

- **Quatro carroças:** mão comum. Não há declaração, botão, confirmação, evento, bônus ou perda especial de turno. Se não houver encaixe, aplica-se o passe automático normal, com a transferência de pontos já aprovada.
- **Cinco carroças:** vitória automática obrigatória da rodada, com **10 pontos**, registrada antes de qualquer jogada após a distribuição. Não depende de botão ou escolha; pagamento ocorre uma única vez. Vencedor abre a próxima rodada e permanece a condição final de vitória existente. O comportamento anterior para mãos com mais de cinco carroças também foi preservado.
- Todas as demais regras, pontuações, variantes, metas, sentido de turnos, três dificuldades, avatares e organização manual permanecem iguais. Batida de carroça continua valendo 30 pontos: essa categoria não foi removida.

Esta decisão substitui exclusivamente as instruções antigas sobre quatro carroças nos relatórios 02A/02B/02C e ÁPICE 02. Esses documentos receberam um aviso de atualização; suas evidências e métricas históricas não foram reescritas.

## Implementação e commits

- Branch exclusiva: `feature/mobile-touch-v1`.
- HEAD inicial local e remoto confirmado: `329f0c4203d40fa8f08ef259ded3c7f0b00236ac`.
- Commit funcional: `6f45b6186e98bef5ea5e6f173f24b4a9fd17674f`.
- O commit seguinte contém esta documentação. O HEAD final é o SHA desse commit no histórico, evitando uma referência circular no próprio arquivo.
- Nenhuma mudança local concorrente ou commit do Work 03 foi encontrado na branch ao iniciar; o HEAD foi conferido novamente antes de criar os commits. A atualização da referência usa o HEAD esperado e não força sobrescrita de trabalho concorrente.
- Nenhuma alteração em main, merge, publicação de Pages, atualização da prévia ou substituição de imagem.

Motor: removidas `canDeclareFour`, `declareFour`, a emissão do evento e os campos `declaredFour`/`playedSeats`, usados somente pela regra retirada. `viewFor` só entrega eventos de jogada e passe para a IA. `declareFiveAtDeal` e seus 10 pontos ficaram intactos.

IA: removidas a restrição de quatro carroças e a contagem adicional de carroças hipotéticas. Eventos legados não influenciam inferências, amostras ou a semente pseudorrandômica. Inferências de passes sem compra e amostragem por contagem de conclusões válidas permanecem.

Interface: removidos exclusivamente o botão, o diálogo, seus estilos/handlers e a espera especial de declaração antes de passar. Passe sem encaixe continua automático e o aviso permanece por dois segundos; robôs preservam a espera de três segundos. Organização da mão, rotação e gestos não foram redesenhados.

## Dados e migração segura

A aplicação atual não tem salvamento automático de partidas nem carregamento persistente de snapshots integrado. Perfil, avatar e favoritos locais não foram tocados. Nenhuma chave de armazenamento foi apagada ou renomeada e não foi criado um novo mecanismo de salvamento.

Para consumidores que já armazenem snapshots JSON, o motor exporta `migrateGameState(snapshot)`. Na restauração, pode-se usar:

```js
const restored = migrateGameState(JSON.parse(savedJson));
```

A função valida a integridade, trabalha em uma cópia e retira somente campos/eventos obsoletos. Recalcula `roundHistoryStart` conforme os eventos retirados antes desse limite, evitando misturar passes de rodadas anteriores nas inferências atuais. É idempotente, preserva pedras e ordem da mão, pontuação, turno atual, fase, prêmios, próximo abridor, dados adicionais e o snapshot original. Não desfaz turnos já concluídos, não compensa pontos, não redistribui pedras e não repete pagamentos. Dados inválidos são rejeitados sem sobrescrever o original.

Snapshots antigos também continuam utilizáveis pelo motor: os campos extras são ignorados e os eventos de declaração não são expostos à IA. A migração explícita produz o formato limpo, sem esse material obsoleto. Não se afirma que exista retomada automática de partida na interface.

## Regressão e evidências

Base: `node --test tests/*.test.mjs`: **106 testes, 105 aprovados, uma falha preexistente** da integridade da galeria.

Após a alteração: mesmo comando, **110 testes, 109 aprovados, a mesma falha**. Não foram alterados hashes, artes ou o teste da galeria para mascará-la. Cobertura:

- Mãos com quatro e cinco carroças em todos os quatro assentos, nas distribuições de 6 e 7 pedras: quatro mantêm a abertura normal; cinco encerram automaticamente e pagam exatamente 10 uma única vez.
- Ausência do controle/diálogo e das APIs de declaração; mão de quatro carroças pode jogar normalmente ou passar automaticamente quando obrigatório, com −5/+5 e aviso de dois segundos.
- Migração não destrutiva e idempotente, preservação de dados extras e da ordem da mão, limite do histórico da rodada, continuidade legal de snapshots antigos e preservação dos prêmios de cinco carroças/abridor seguinte.
- Partidas completas existentes exercitam a migração durante os ciclos de serialização JSON, sem alterar o estado restaurado.
- Histórico legado de declaração não altera inferências, amostras ou decisões do Difícil.
- As **2.326 decisões** do Difícil em posições ordinárias permanecem idênticas ao HEAD inicial: digest `8cf0f8ad9baff28887229692ee02b7d6e56b84eb1b80c638ae1f547a5516b6c1`.
- Testes existentes preservam decisões Fácil/Médio em 2.326 posições, gestos, mão manual, temporizadores, turnos, pontuação e avatares.

Comparativo existente de 288 partidas: **Fácil 27 / Médio 98 / Difícil 163**, igual ao estado anterior a esta atualização. Nenhuma recalibração de estratégia fora da regra revogada.

Verificação adicional: `node scripts/compare-hard.mjs 8 1`: **96 partidas**, 52 vitórias da estratégia atual contra 44 da baseline ÁPICE 01, mesmos resultados de antes desta atualização; 3.129 posições comparadas, zero casos sem amostras para a estratégia atual e zero amostras incompatíveis. Hash dos resultados `6f5a1458afdf2f0e14bd18972420ea20f50599e15161a0ddbf6b5bc1e5941f72`; hash das decisões `f932d13d4c5d3531404553903770d0644e3421f385197ec12aff975d268aa214`.

Testes Python do pacote: **4/4 aprovados**. Sintaxe dos módulos modificados e `git diff --check`: aprovados. Os testes de handlers usam adaptador DOM, não constituem teste visual em navegador real ou homologação Samsung.

## Limites e conclusão

Atualização editorial implementada e testada. Permanecem a falha conhecida da galeria e a homologação física no Samsung. Nenhuma nova publicação ou nova etapa do ÁPICE MOTOR foi iniciada; o progresso ponderado informado anteriormente permanece em 60%.
