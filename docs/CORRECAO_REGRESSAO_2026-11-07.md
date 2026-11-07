# Correção de regressão — identidade e preenchimento

Base: f1f5a3a9c9a7e132e69ce6b3ba7181fd33da40b0.

O proprietário reprovou a identidade nativa substituta. Restaurada a implementação anterior com a arte original do passaporte, preservando apelido, retrato, foto local e seleção de avatares. Foco inicial continua no botão JOGAR para não abrir o teclado automaticamente.

Menu, acesso e identidade passam a ancorar a primeira e a última faixa da arte nas bordas da área disponível. Os blocos de conteúdo conservam a proporção original e os controles acompanham suas coordenadas. Em telas mais altas, o espaço adicional fica entre blocos, dentro da composição; em telas curtas, mantém-se rolagem para não cortar controles. Isso não remove barras externas do Android/navegador. Artes PNG não foram editadas.

Pino amarelo restaurado no centro das pedras, com 3px visuais na cadeia. Nenhuma outra mudança na mesa, motor, regras, relógios ou IA. Ambas as distribuições permanecem disponíveis.

34 testes direcionados aprovados: identidade, visitante, distribuições, configuração, touch, próxima rodada e encaixe proporcional das faixas em 412×744, 412×915, 360×800 e 412×600. Fluxo real no navegador em 412×744: menu, configurar, visitante, identidade original e partida com 6 pedras + 4 dormidas. Nova homologação visual no Galaxy S23+ permanece pendente.

A prévia privada será atualizada; hospedagem oficial e main preservadas. O redesenho da mesa não faz parte desta correção inicial.
