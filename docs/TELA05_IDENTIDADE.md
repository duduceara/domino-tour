# Tela 05 — Crie sua Identidade

Base remota: `1c5b072d263ddd716c7c61ca8eaa269583becb6c`, branch `feature/mobile-touch-v1`.

## Arte preservada

`web/assets/approved/screen-05-identidade-oficial.png`, 941 × 1672.
SHA-256: `c7f38447eaa0ebe5e62b843297cf296e0f4e23a946640e4a22ee2620b5594867`.
O PNG permanece intacto. Retrato, apelido e seis opções são controles sobrepostos que cobrem o conteúdo ilustrativo correspondente, sem substituir o arquivo.

## Fluxo

Configuração → acesso visitante → identidade → mesa existente.
Entrar como visitante apenas abre a identidade. JOGAR valida e salva o perfil, aplica apelido/foto/avatar e dispara uma única preparação/inicialização da sessão existente. Voltar preserva o rascunho e a configuração pendente. Não há autenticação simulada ou partida Online.

O perfil usa `domino-tour:profile:v1`, preservando seleção, favoritos e desbloqueios explícitos. A seleção antiga também permanece disponível após trocar de retrato. Novos campos opcionais: `nickname`, `photo`, `unlockedIds`. O limite do apelido é 24 caracteres, como o adaptador existente. Quando não há armazenamento disponível, a identidade continua válida em memória e o aviso informa a limitação.

Catálogo existente: 50 assets verificados, dez iniciais (cinco humanos e cinco animais); primeira página com três de cada. Os demais têm cadeado, salvo seleção/desbloqueio prévio. Imagens que falham ao carregar não viram opções selecionáveis. Não há compras ou regras inventadas de desbloqueio.

A foto é lida e reduzida localmente a no máximo 512 pixels no maior lado. Aceita JPG, PNG e WebP até 8 MB; não aceita SVG ou URLs remotas. Cancelar não altera a escolha anterior. O arquivo original não é enviado a serviços externos.

## Validação

- Testes Node de perfil, bloqueios, migração, foto local, validação, visitante e início único.
- Sintaxe dos scripts exigidos pelo workflow e dos módulos alterados.
- Navegador de testes com viewports 360 × 800, 390 × 844 e 412 × 915: edição, validação de vazio, setas, coleção, cadeados, foto válida/arquivo inválido, voltar/retornar e aplicação da foto/apelido na mesa.
- Imutabilidade das seções HTML anteriores, assets, motor e regras conferida contra a base.

Pendência anterior à implementação: `tests/m07-match-config.test.mjs` compara a Tela 02 com um hash histórico de outra prévia (`fe7dff…`), diferente do HTML já presente na base (`a94e07…`). A falha foi reproduzida antes da alteração e não foi mascarada ou atualizada nesta missão. O novo teste de preservação fixa a seção efetivamente recebida na base.

Não foi aplicada arte nova de mesa nem feita publicação em hospedagem. Teclado virtual, escolha de foto e orientação nativa no Samsung físico dependem de teste no aparelho; o navegador em iframe valida o fluxo e o fallback visual, sem emular essas integrações do Android.
