# M13-R — incremento estável de recuperação

## Estado e preservação
HEAD remoto inicial confirmado: `4e18a1e35c99346fca8729df9b671ce07d0c3229`.
Branch exclusiva: `feature/mobile-touch-v1`; main e hospedagem oficial não alteradas.
Ponto recuperável: o próprio commit inicial, ancestral do novo commit; branch local `recovery/m13-r-4e18a1e` criada antes das mudanças. Sem force push.

Lidos o registro mestre `docs/INTERFACES_APROVADAS_2026-11-04.md`, baseline M07 e as implementações históricas dos commits ef7919c, f1f5a3a e 4e18a1e. A numeração funcional do fluxo difere da numeração editorial do registro; as referências abaixo usam nomes de arquivo para evitar substituições equivocadas.

## Causas e diferenças
| Área | Regressão comprovada | Correção mínima |
|---|---|---|
| Carregamento | `object-fit:cover` podia cortar arte em celular alto | `contain` localizado; imagem inteira, proporcional |
| Menu | Adaptador separava PNG em faixas, reduzindo continuidade e criando espaços internos | Recuperado enquadramento proporcional e PNG único do menu aprovado |
| Acesso | Faixas inseriam vazio entre título e botões | Removido uso do adaptador; PNG único e hitboxes originais |
| Identidade | Faixas podiam deslocar/recortar elementos do passaporte | Arte contínua, retrato, apelido e botões nas coordenadas originais; sem teclado automático |
| Configuração | Header/footer premium trocados por UI genérica | Restaurados sprites originais, ajuda e controles; acréscimo localizado do seletor 6/7 |
| Mesa | Nenhuma nova regressão comprovada que exigisse alteração de lógica | App, composição, IA, cronômetros e regras idênticos ao HEAD inicial; pino amarelo e Organizar mantidos |

Arquivos de aplicação alterados: `web/guest-access.js`, `web/identity-screen.js`, `web/match-setup.js`, `web/premium-polish.css`, `web/presentation-fit.js`. O módulo antigo artwork-fit permanece no histórico/árvore para não apagar seus testes; nenhuma tela recuperada o importa.

## Referências e proteções
- `approved-art-reference.json`: 21 PNGs históricos, SHA-256 e dimensões obtidos diretamente do commit ef7919ce79294f27107fc58715bdacda6a38d4f2, sem substituição de bytes ou regravação de imagens.
- Manifesto inclui hashes dos arquivos de motor, mesa, app e CSS não relacionados a esta correção, a partir do HEAD inicial.
- `tests/premium-recovery.test.mjs`: integridade de imagens, preservação de código, ausência de faixas no fluxo, escopo do CSS corretivo, controles premium e proporções de enquadramento em quatro tamanhos.
- `.github/workflows/premium-recovery-guard.yml`: execução automática na branch autorizada. Testes existentes não foram modificados, apagados ou desativados nesta missão. A execução remota do workflow não foi confirmada; execução local do comando foi aprovada.
- `scripts/compare-premium-screenshots.py`: comparação de pixels, relatório JSON e imagem de diferenças. Rejeita referência ausente; não cria nem atualiza referências. Autoteste: aceita imagem idêntica, rejeita diferença e referência ausente.

## Validação realizada
41 testes direcionados aprovados, zero falhas nessa seleção. Incluem identidade, visitante, configurações, ambos os contratos de distribuição, touch, transição de rodada, adaptador histórico e novos guards. Não executada a suíte completa.

Navegador real: configuração em 412×744 (scrollWidth=412, altura útil 744) e 360×800 (scrollWidth=360, altura útil 800), sem overflow horizontal; fluxo menu → configurar → selecionar 7 → visitante → identidade → partida; mesa confirmou sete pedras por participante e ausência de dormidas. Identidade em 412×915 manteve proporção 941:1672 e zero faixas inseridas. Artes do menu e perfil inspecionadas visualmente.

## Pendências — missão ainda não integralmente homologada
1. Os PNGs de menu/acesso são 1024×1536. A área 412×744 tem outra proporção. Preservar a imagem inteira, sem esticar ou cortar, deixa margens externas naturais de enquadramento. Foram eliminados os vazios artificiais DENTRO da composição; preenchimento integral da área útil permanece pendente. Não foi introduzida nova recomposição para esconder essa limitação.
2. Não foi recuperado um conjunto confiável de capturas de navegador já aprovado por viewport. Os PNGs aprovados estão preservados como referência de arte, mas não equivalem a screenshots aprovados da implementação. Portanto a comparação automática por pixels das telas completas ainda depende dessas referências explícitas. Nenhuma captura candidata foi promovida a referência.
3. Os testes de geometria calculada não substituem validação de sobreposição e diferenças por pixels no navegador. O comparador está implementado e testado com fixtures, mas não certifica sozinho todas as telas.
4. Homologação física no Samsung Galaxy S23+ e aprovação visual pertencem ao proprietário. Login social e online seguem indisponíveis como antes; meta 300 continua desabilitada.

Este é um incremento recuperável, não declaração de 100% ou conclusão de todos os critérios M13-R. A prévia privada recebe o incremento; main e publicação oficial permanecem intactas.
