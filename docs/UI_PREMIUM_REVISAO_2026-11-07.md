# Revisão funcional e visual — 7 novembro 2026

Base remota: ef7919ce79294f27107fc58715bdacda6a38d4f2, feature/mobile-touch-v1.

## Entrega
- Distribuição real selecionável: 6 pedras por participante + 4 dormidas, ou 7 por participante sem dormidas. Escolha preservada até a sessão existente; sem novas regras ou modalidades.
- Entrada direta na raiz, sem página branca com link intermediário. Fundo azul crítico antes dos módulos.
- Configuração nativa com opções legíveis. Identidade com retrato, apelido e seleção reais, sem abrir teclado automaticamente.
- Altura visual da navegação acompanha visualViewport; margens recebem atmosfera das próprias artes. Arquivos de arte não alterados.
- Peças marfim, pontos escuros e pino central neutro de 1,5px visuais na cadeia. Brilho âmbar suave no participante ativo, sem ponto amarelo; respeita redução de movimento.
- Organizar ocupa o rodapé; zoom, enquadramento e tela cheia opcional ficam no menu. Cronômetros, IA, motor, geometria M13A e regras preservados.

## Validação
42 testes direcionados aprovados: configuração, visitante, identidade, fluxo inicial, touch, transição de rodada e cadeia adaptativa (incluindo 240 casos de crescimento). Não foi rodada a suíte completa.

Teste em navegador: fluxo raiz → menu → configuração 7 → visitante → identidade → mesa; sete pedras humanas e sete por robô, sem dormidas; toque e encaixe em ponta; resposta dos robôs; menu e cancelamento de saída. Mesa medida em 360×800: área 360×800, sem overflow. Inspeção visual em 412×760 e 360×800. Validação física no Galaxy S23+ ainda depende do proprietário.

O teste histórico M07 estava referenciando layout e assets de uma versão substituída antes desta revisão. Foi atualizado para o markup e hashes efetivamente existentes na base; os testes de hashes das artes atuais continuam ativos.

## Limitações reais
A camada desfocada de carregamento, botão “Editar site” e barras externas pertencem à hospedagem/navegador. A aplicação elimina seu próprio redirecionamento branco, mas não controla essa camada externa. A prévia permanece privada e exige a conta proprietária. Login social e modo online continuam indisponíveis; meta 300 segue desabilitada por contrato atual do motor. Não houve alteração na hospedagem oficial.

A aprovação visual desta revisão permanece pendente. Cinco conceitos e prompts estão no documento UI_PREMIUM_CONCEITOS_E_PROMPTS_2026-11-07.md.
