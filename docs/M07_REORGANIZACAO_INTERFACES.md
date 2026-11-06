# M07 — Reorganização e homologação individual

Base remota: `8ba052f4fdc45f6ca1244f0c0a7092897066fe2a`. Branch: `feature/mobile-touch-v1`.

## Inventário real
A entrada atual contém seis etapas: carregamento → acesso → avatar → menu Jornada → modo offline → preparação → mesa. Acesso/identidade são obrigatórios no fluxo existente. As artes 01/02/03/05 estavam aplicadas como fundos de cartões com conteúdo duplicado. A mesa, os serviços de conta e a sincronização não estão homologados como produto final.

## Arquitetura prevista (não implementada neste ciclo)
Carregamento → Central do Jogador → Jogar Agora → partida. A Central será criada somente após aprovação expressa da Tela 01. Não há arte 04 original disponível para substituir ou renumerar. A Central precisa de composição própria a ser avaliada.

| Arte original | Função | Nova posição | Condição de acesso | Aprovação | Arquivo em web/assets/approved/ |
|---|---|---|---|---|---|
| 1 | Carregamento | 01 · abertura | Sempre | Em homologação M07 | screen-01.png |
| 2 | Acesso à conta | 03 · acesso contextual | Online ou vínculo voluntário | Arte aprovada; reorganização pendente | screen-02.png |
| 3 | Identidade | 03 · identidade/perfil | Primeiro uso ou edição | Arte aprovada; reorganização pendente | screen-03.png |
| 4 | Sua Jornada | Central 02 → Jornada | Escolha do jogador | Arte original pendente | — |
| 5 | Configurar partida | Central 02 → Jogar Agora | Somente escolhas indispensáveis | Arte aprovada; integração pendente | screen-05.png |
| 6 | Mesa Premium | Partida | Após escolhas indispensáveis | Arte aprovada; mobile não homologado | screen-06.png |
| 7 | Destino e desafio | Jornada → destino | Próximo destino desbloqueado | Arte aprovada; integração pendente | screen-07.png |
| 8 | Referência da mesa | Mesa Premium | Mesma interface 06 | Referência 08 = 06 preservada | screen-06.png |
| 9 | Resultado | Fim da partida | Rodada/partida concluída | Arte aprovada; integração pendente | screen-09.png |
| 10 | Torneios e ligas | Central 02 → Competições | Escolha; online exige conta | Arte aprovada; integração pendente | screen-10.png |
| 11 | Detalhes da competição | Competições → detalhes | Competição selecionada | Arte aprovada; integração pendente | screen-11.png |
| 12 | Ranking | Central 02 → Ranking | Consulta; competição oficial online autenticada | Arte aprovada; integração pendente | screen-12.png |
| 13 | Perfil e estatísticas | Central 02 → Perfil | Local ou autenticado | Arte aprovada; integração pendente | screen-13.png |
| 14 | Conquistas e passaporte | Central 02 → Conquistas/Jornada | Progresso local ou sincronizado | Arte aprovada; integração pendente | screen-14.png |
| 15 | Configurações | Central 02 → Configurações | Sempre | Arte aprovada; integração pendente | screen-15.png |
| 16 | Como jogar | Central 02 → Ajuda | Opcional | Arte aprovada; integração pendente | screen-16.png |

## Dependências e preservação
- Central: definir destino atual, apelido/avatar local, partida retomável e prioridade do próximo desafio. Não exibir progresso ilustrativo como real.
- Offline: auditar persistência de partida/progresso e versionamento; explicar armazenamento no dispositivo, limpeza de dados e ausência de sincronização automática.
- Sincronização opcional: exige backend seguro, autenticação, migração dos dados locais e resolução explícita de conflitos. Não existe promessa de recuperação entre aparelhos neste ciclo.
- Online: infraestrutura de sessão e servidor autoritativo, Google/e-mail conforme viabilidade; sessão válida preservada, competições oficiais exigem conta.
- Jornada: preservar Brasil → estados/destinos → regiões → país → países → continentes → Lenda, medalhas offline/online e desbloqueio linear.
- Acervo: preservar identificadores, imagem 04 pendente e referência 08 = 06. Motor, regras, viewport, avatares e dados existentes intocados.

## Escopo implementado agora
Somente Tela 01: imagem original completa, sem cortes/duplicação, fundo azul, mínimo de 3000 ms e espera pelo load real. Sem botão para pular. O modo `web/index.html?homologacao=tela01` mantém a abertura visível para avaliação após o carregamento, sem reiniciar a animação ou abrir login.

A transição definitiva para a Central é dependência da Tela 02 e permanece pendente. Fora do link isolado de avaliação, a navegação legada continua preservada; ela não representa o fluxo M07 concluído. A imagem contém barra ilustrativa estática, não percentual real de download.

## Protocolo
Entregar captura, link e testes; parar. Só avançar com “TELA 01 APROVADA. PODE AVANÇAR.” Aprovação da arte antiga, testes ou silêncio não aprovam a implementação mobile.

## Ciclo Tela 02 — Central do Jogador
Tela 01 aprovada pelo proprietário. Central implementada com Jogar Agora offline em um toque, sem exigir cadastro ou seleção obrigatória de avatar. Usa avatar local quando disponível; apelido padrão Visitante porque o perfil atual ainda não possui apelido. Brasil/Fortaleza é o início planejado, sem progresso territorial fictício. Jornada, competições, ranking e conquistas têm painéis informativos transparentes até sua implementação. Não há infraestrutura atual de recuperação de partidas nem sincronização: o aviso explicita a ausência de salvamento da partida. Conta, progresso durável e online permanecem dependências da Tela 03 e ciclos posteriores. Os seis containers legados permanecem preservados; a entrada rápida usa o evento existente de início do jogo, sem alterar motor, regras ou viewport. A rota de homologação da Tela 01 permanece intacta.

## Revisão oficial da Tela 02 — Rumo à Lenda!
Base ff51e7caed5135a7d2675a6e11653da5f0c10d86. O PNG original `screen-02-apresentacao-rumo-a-lenda.png` (1404×1536, SHA-256 f668011054b12323ece150bacb6c915fcad84b981f8c66a63c3178c7ac35b83c) substitui a Central anterior como apresentação oficial, sem renumerar as artes anteriores. Todas as regiões de botão têm alvos transparentes proporcionais e nomes acessíveis. Campos desenhados de nível, moedas, gemas e progresso continuam ilustrativos, com explicação nos painéis.
Jogar Rápido abre opções mínimas offline/online, apelido opcional, dificuldade e distribuição. A partida local é salva em chave nova `domino-tour:offline-match:v1`, sem mexer no perfil existente. Inclui estado validado pelo motor, pontuação, dificuldade, disposição da mão e apelido, com retomada por escolha do usuário. Não há sincronização. Salvamento inválido é preservado, sem exclusão ou substituição silenciosa. Integração no adaptador web/app.js necessária para salvar após ações; nenhum arquivo dist/src foi alterado.
Online bloqueado: não existe provedor de autenticação ou servidor de partidas configurado. Não simular login nem permitir partidas online sem esses serviços. Demais botões abrem informações/regras e indicam claramente funcionalidades pendentes; não há pagamentos nem novas telas implementadas.

## Encaixe mobile das Telas 01/02
Altura dinâmica 100dvh. Tela 01 usa escala uniforme para cobrir a área útil, recortando apenas cenário lateral no retrato; logo, carregamento e EDVÓRIA permanecem visíveis. Tela 02 recompõe regiões do PNG original: cabeçalho, Jornada, Jogar Rápido, Torneios, Jornada Mundial, desafio e menu. Painéis empilhados para telas altas, com aspecto nativo de cada região e alvos de toque transformados junto à arte. PNGs inalterados. Conferência visual em área de 393×710; homologação física final pelo proprietário.
