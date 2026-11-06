# M07 — Tela 02 oficial

Base remota preservada: `0268a3d4836a81638c803b5c5141dafd5a7572d8`.

A versão aprovada `screen-02-apresentacao-rumo-a-lenda-super-definitiva.png` foi copiada byte a byte para `web/assets/approved/screen-02-oficial.png`. Nenhuma outra arte foi substituída. Dimensões reais: 1024 × 1536 (2:3). A proporção real é preservada; não se converte artificialmente para 9:16.

Um único PNG substitui a composição anterior de recortes e botão redesenhado. Os alvos transparentes usam percentuais relativos ao mesmo contêiner da imagem. ResizeObserver mede a área útil após safe areas; escala uniforme = mínimo entre largura disponível e altura disponível × 2/3. Fundo azul preenche excedentes. Abaixo de 308px de largura calculada, prioriza-se alvo mínimo de 24 CSS px; em alturas muito pequenas ocorre rolagem vertical. Não há promessa universal de 44px: configurações e saldo são menores que isso em celulares compactos, devido à arte aprovada. Não há recorte ou deformação.

Tela 01 e motor preservados. Mantido mínimo de 3 segundos e load real antes de Tela 02. Apresentação sem login. Jogar Rápido mantém painel existente, offline sem cadastro e online bloqueado até autenticação segura. Fechar painéis retorna à apresentação e o diálogo restaura foco.

## Dados e moedas

Avatar, DuduCE, nível 12, saldo 3.850, botão RESGATAR e progresso 38% estão incorporados ao PNG. Não representam dados persistidos. Saldo e recompensa abrem explicações; não concedem créditos. Não existe serviço de autenticação/resgate validado nesta base. Regra aprovada: 1.000 moedas por hora para usuário autenticado, não acumulativas. O relógio, concessão e elegibilidade precisam de validação em servidor, identificador idempotente e transação atômica, nunca do texto no PNG.

Proposta para futura autorização: fornecer arte aprovada com campos variáveis limpos e sobrepor avatar/textos/barras proporcionais no mesmo sistema de coordenadas. Não mascarar nem pintar esses campos nesta missão. Texto rasterizado não acompanha ampliação de fonte; nomes acessíveis e painéis HTML continuam disponíveis. Isso limita a acessibilidade visual da arte estática.

## Homologação

Não foi publicado site público. Homologação física no Chrome do Galaxy S23+ permanece obrigatória; emulação não substitui barras reais, escala Android ou toque físico. 384×854 é apenas cenário adicional aproximado, não medição do aparelho do proprietário. Os cenários de altura reduzida representam a área útil com barras presentes.

Executar a matriz: iniciar `python -m http.server 8765` na raiz; com Playwright e Chromium instalados, executar `node tests/m07-presentation-browser.cjs`. Executar regressão: `node --test tests/*.test.mjs`.

Aprovação visual e funcional definitiva pendente do proprietário. Nenhum trabalho na Tela 03.

## Resultados executados

- Antes: 149/149 testes Node aprovados.
- Depois: 150/150 aprovados, incluindo novo teste de identidade byte a byte.
- Chromium 153 headless: nove viewports (320×568, 360×640, 375×667, 390×844, 412×915, 430×932, 384×854, 412×760, 320×400). Geometria medida, proporção, 11 alvos, 99 acionamentos, retorno de painéis, teclado, altura variável e fonte HTML em 200%; nenhum erro JavaScript. Capturas e medidas em `docs/m07-evidence/`.
- 320×400 usa rolagem para não reduzir alvos abaixo de 24px. Demais tamanhos da matriz sem rolagem. Campos rasterizados continuam ilustrativos e não ampliam com a fonte HTML.
- Sem homologação física, sem evidência de barras Android reais, sem link HTTPS restrito disponível nesta execução. Nenhuma alegação de compatibilidade universal.
- SHA-256 do PNG: `1c764246cf92895329280bc9d50d1efe6eb3e2d628498948795118a519b73e7b`.

Execução estimada: 85% — implementação e validação automatizada concluídas; homologação física e aprovação pendentes.
