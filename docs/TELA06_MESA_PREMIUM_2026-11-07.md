# Tela 06 — Mesa funcional e saída explícita

Base: 1ab97b66e205ad76d41fffc1cdd586f45390be4b, branch feature/mobile-touch-v1.

## Resultado

Mesa horizontal com controles reais, perfil recebido da Tela 05, mãos ocultas
contáveis, dormidas, contador, peças verticais na mão com pino dourado,
organização manual e ordenação pelo botão Organizar. A superfície respeita
a preferência visual escolhida. O PNG aprovado fica intacto como referência;
a interface funcional é montada por HTML/CSS, não por uma imagem de partida
sobreposta a outra. Moedas e gemas ilustrativas não viram saldos inventados.

Não há solicitação automática de fullscreen na entrada ou no toque.
Tela cheia é uma opção explícita e reversível. O aviso de sistema pode ser
mostrado pelo navegador ao usar essa opção; a página não pode suprimi-lo.
O fallback horizontal existente funciona sem fullscreen.

Sair da mesa abre confirmação de abandono. Confirmar cancela bots,
arraste, cronômetro e mensagens, remove somente o salvamento da partida,
sai do fullscreen se necessário e retorna ao menu aprovado (Tela 02).
Perfil e retrato permanecem. Não atribui vitória nem pontos ao abandono.
A rodada encerrada oferece Próxima rodada (preservando placar), Nova partida
(com confirmação para abandonar a partida por pontos) e Voltar ao menu.
No fim da partida, oferece Nova partida e Voltar ao menu.

## Relógio

Turno humano de 60 segundos com prazo por turno, sem reiniciar em rerender.
Alerta visual nos últimos dez segundos. Ao vencer, uma única jogada legal
é executada. Se não houver jogada, usa a passagem automática existente,
sem penalidade adicional de tempo. Bots continuam com três segundos.
Página oculta e confirmação de saída pausam a contagem local. Frases e
figurinhas são exibidas localmente; não há chat online simulado.

## Geometria

O modo fixedScale mantém largura/altura invariantes para um mesmo viewport:
altura lógica = min(largura da superfície / 24, altura da superfície / 12).
A câmera não amplia a cadeia curta nem a reduz quando cresce. O solver
busca linhas horizontais e retornos, limita os limites ocupados e translada
a cadeia sem escala adicional. Valida colisões, contato e valores nas portas.
O solver legado continua disponível para os consumidores que não optam
pelo modo novo. Os arquivos JS em dist/src são os fontes de runtime
versionados neste checkout; não há árvore TypeScript ou build de geração.

O teste percorre 900 combinações: 60 circuitos do conjunto duplo-seis,
abertura em posições diferentes, expansão nas duas pontas, três superfícies,
prefixos de 1, 7, 14, 21 e 28 pedras. Verifica tamanho fixo, 28 identidades,
todas as carroças, limites, ausência de colisões e semântica dos contatos.
Isso é evidência das amostras, não prova matemática de todas as sequências.
A capacidade de 28 é teste geométrico; quatro dormidas continuam fora da
partida no modo de seis.

## Validação

- 35 testes direcionados aprovados (incluindo 900 casos de geometria).
- Suíte completa: 178/179; mesma falha histórica do hash da Tela 02
  reproduzida antes das alterações, sem atualizar a expectativa para escondê-la.
- Sintaxe de app, entrada, interfaces, apresentação e relógio aprovada.
- Navegador Chromium: 915×412, 844×390, 800×360 e 412×915.
  Entrada pela configuração/visitante/identidade, apelido Carlos, mãos 6/7,
  dormidas, ordenação, mensagem, cancelamento do abandono, alerta, timeout
  com uma jogada, próxima rodada, fim da partida, nova partida, abandono,
  limpeza do save, preservação do perfil e reentrada. Sem erros de página.
- Teste de navegador reproduzível em tests/table06-browser.cjs.
  QA_URL aponta para servidor local do checkout, CHROMIUM_PATH é opcional,
  QA_OUTPUT_DIR define a pasta de evidências fora do código.
  A instrumentação fica apenas na resposta interceptada pelo teste, nunca no app.
- Telas 01–05 e assets anteriores preservados. Motor de regras inalterado.

## Limites

Homologação física no S23+ (leitura das pedras no tamanho fixo, seletor de
foto e comportamento do fullscreen/orientação Android) continua pendente.
O acabamento funcional HTML/CSS precisa da avaliação visual do proprietário.
Não houve atualização de hospedagem, main ou implementação online.
