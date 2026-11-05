# DOMINÓ TOUR | M05 — Auditoria visual das 17 artes recebidas
Data: 2026-11-05. Escopo: análise documental e planejamento; não é homologação funcional nem visual no Android.

## Base
- 17 imagens enviadas no chat: 10 no primeiro lote, 7 no segundo.
- 16 posições de tela na prancha de referência, além de artes complementares de robôs e biblioteca de avatares.
- O ZIP externo de recuperação contém dez PNGs originais, com hashes verificados localmente. A presença no ZIP não prova que estejam restaurados no GitHub.
- Motor ÁPICE tecnicamente homologado segundo os relatórios existentes; homologação física ainda pendente.
- A arte independente do menu «Rumo à Lenda!» foi recebida e é candidata à Tela 04. Não substituir a arte atual sem validar dimensões e autorização.

## Inventário visual dos envios
Primeiro lote:
1. Resultado da Partida (referência Tela 09).
2. Destino e Desafio (Tela 07).
3. Torneios e Ligas (Tela 10).
4. Torneio Estadual Ceará (Tela 11).
5. Meu Perfil (Tela 13).
6. Como Jogar (Tela 16).
7. Configurações (Tela 15).
8. Conquistas (Tela 14).
9. Robôs RobiX, AndroX, DomiX (arte complementar).
10. Biblioteca de Avatares (arte complementar).

Segundo lote:
11. Carregamento (Tela 01).
12. Acesso à Conta (Tela 02).
13. Crie sua Identidade (Tela 03).
14. Configurar Partida offline/online (referência Tela 05; duas variantes na mesma prancha).
15. Menu Principal «Rumo à Lenda!» (candidata Tela 04).
16. Mesa horizontal de dominó (referência Tela 06 e reutilização na Tela 08).
17. Prancha de referência das 16 posições (não substitui arquivos individuais).

## Cobertura por tela
01 carregamento: arte enviada; 02 acesso: enviada; 03 identidade: enviada; 04 menu: enviada, candidata a validar; 05 configuração: enviada, duas variantes; 06 mesa: enviada; 07 destino: enviada; 08 mesa: reutilizar 06; 09 resultado: enviada; 10 torneios: enviada; 11 torneio estadual: enviada; 12 ranking: somente na prancha compacta, sem arte detalhada independente identificada; 13 perfil: enviada; 14 conquistas: enviada; 15 configurações: enviada; 16 regras: enviada.

## Divergências e riscos identificados
1. Telas detalhadas majoritariamente verticais versus requisito de partida horizontal fixa: não esticar nem deformar imagens; reconstruir composição em componentes responsivos.
2. A arte de regras apresenta «2 a 4 jogadores (individual ou em duplas)»; produto aprovado utiliza quatro jogadores individuais. Também há referência genérica a sete peças por pessoa: o motor admite seis peças + quatro dormidas como padrão e sete peças sem dormidas como alternativa.
3. Arte da mesa mostra botão «Passar» permanentemente visível: na implementação, disponibilizar somente quando não existir jogada legal; preservar passe -5 ao passante e +5 ao último jogador que fez jogada válida.
4. Textos de pontuação e recompensas de artes são exemplos visuais. Não alterar regras de pontuação aprovadas nem criar economia de moedas/gemas/XP com base em números ilustrativos.
5. Torneios, status «inscrições abertas», quantidade de participantes, ranking e resultados são dados de demonstração, não evidência de serviço online.
6. Autenticação Google/Facebook, loja, notificações, suporte, busca de avatares e contas dependem de integrações reais. Não anunciar como prontas.
7. As artes detalhadas e a prancha compacta têm composições diferentes: manter identidade comum, usar artes detalhadas como referência de alta fidelidade e a prancha como mapa de navegação, sujeito à aprovação.
8. Conteúdo fixo embutido nas imagens não deve ser usado como botão ou indicador funcional; separar fundo decorativo de componentes interativos acessíveis.
9. A arte de configuração oferece escolha de pontuação 100/200/300: confirmar a compatibilidade com a implementação antes de ativar.
10. Validar integridade dos dez arquivos remotos e correspondência com manifesto antes de substituir qualquer ativo.

## Plano incremental sem regressão
M05-A: preservar os 17 envios e o ZIP; conferir manifestos e mapear 16 telas.
M05-B: restaurar os dez PNGs no GitHub em lotes pequenos, comparar SHA-256 e auditar galeria.
M05-C: integrar carregamento, acesso, identidade, menu e configuração com componentes reais; manter motor intacto.
M05-D: integrar mesa horizontal responsiva, interação touch e estados de passe/jogada; testes focados.
M05-E: integrar resultado, destino, torneios, perfil, conquistas, regras, configurações e avatares com dados reais ou rótulo de demonstração.
M05-F: validar em Samsung Galaxy S23+ Android Chrome e disponibilizar prévia HTTPS de testes após confirmação explícita da visibilidade do endereço; não alterar main nem fazer lançamento oficial.

## Métricas de acompanhamento
- Motor ÁPICE: 100% técnico (não significa aplicativo completo).
- Recebimento do lote atual: 17/17 imagens, 100% dos arquivos efetivamente enviados neste ciclo.
- Mapeamento visual: 16/16 posições identificadas na prancha, com ranking independente ainda faltante.
- Restauração remota das dez artes: 0/10 confirmadas neste registro.
- Integração visual funcional: não homologada; não atribuir percentual fictício.
- Prévia HTTPS jogável: pendente.

## Restrições
ZERO REGRESSÃO; não alterar main, não fazer merge, não modificar regras homologadas, não redesenhar arte aprovada sem consentimento. Nenhuma imagem, código ou implantação é alterada por este relatório.
