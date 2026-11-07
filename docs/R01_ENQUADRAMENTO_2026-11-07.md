# R01 — correção das faixas externas da Tela 01

Base remota: 409a845488416b8a83328eff83bf8a36b09c7522.

O proprietário reprovou explicitamente as margens superiores e inferiores mostradas no celular. Causa: override `object-fit:contain` introduzido em M13-R, que mantinha a imagem 2:3 inteira dentro de uma área mais alta.

Correção exclusivamente visual da Tela 01: override limitado a `#entry-flow[data-step="1"] .splash-fullscreen`, usando `cover` centralizado. Escala uniforme, sem deformação; a região decorativa lateral sofre recorte para preencher o viewport. O PNG original permanece byte-idêntico. Nenhuma mudança nas Telas 02–06, navegação, cronômetros, motor ou hospedagem oficial.

Conferência real no navegador em 412×744: área preenchida até as quatro bordas; logotipo, globo central, carregamento e EDVÓRIA visíveis. Testes matemáticos adicionais em 412×760 e 360×640 verificam cobertura e bounds dos elementos principais. Em proporções extremas, o recorte lateral pode alcançar detalhes decorativos; não se declara validação universal.

14 testes direcionados aprovados: integridade, enquadramento R01, carregamento/transição, permanência na Tela 01 em homologação e guards M13-R. O teste verifica ausência de faixas apenas nas proporções declaradas; homologação física no S23+ permanece do proprietário.

Prévia de revisão existente: `/?homologacao=tela01`, que permanece na Tela 01. Não iniciar Tela 02 até aprovação expressa.
