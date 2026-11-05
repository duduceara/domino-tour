# DOMINÓ TOUR | M05 — Execução de integridade e bloqueio de restauração
Data: 2026-11-05
Branch exclusiva: feature/mobile-touch-v1
HEAD de partida: 8f1040b158a114136ff7e1b6962f245cd830e87f

## Testes efetivamente executados
- Ambiente local isolado: Node.js 22.16.0.
- O teste tests/m05-approved-art-integrity.test.mjs foi executado em árvore local reconstruída com as 10 artes originais do ZIP e 4 imagens fornecidas pelo proprietário para telas 02, 03, 05 e 06, com catálogo equivalente ao catálogo GitHub.
- Resultado local: 17 testes aprovados, 0 falhas, 0 ignorados.
- ZIP DOMINO_TOUR_M05_ARTES_ORIGINAIS_RECUPERADAS.zip: CRC completo válido, dez arquivos presentes; SHA-256 comparado com manifesto.
- Limitação: NÃO é execução do teste sobre checkout remoto GitHub nem prova de galeria remota íntegra.

## Inspeção remota
Consulta autenticada a web/assets/approved/screen-01.png, screen-07.png, screen-09.png, screen-10.png, screen-11.png, screen-12.png, screen-13.png, screen-14.png, screen-15.png, screen-16.png na branch autorizada.
Todos os dez retornaram conteúdos codificados de aproximadamente 1.066.069 a 1.066.073 caracteres, diferindo dos originais de 1.952.619 a 2.294.834 bytes. A integridade remota não foi homologada.
A versão remota atual do teste e o documento de auditoria foram conferidos.

## Bloqueio de restauração
As ferramentas autenticadas GitHub aceitam texto/base64 como argumento, mas o ambiente de execução de ferramentas GitHub não compartilha acesso binário direto aos arquivos locais. O ambiente container não dispõe de acesso de rede GitHub por DNS. Não foi possível transmitir os PNGs originais para o GitHub sem copiar manualmente payloads de múltiplos megabytes. Nenhuma restauração foi reivindicada ou realizada.

## Estado e próxima etapa
- Motor ÁPICE: 100% homologação técnica anterior; não alterado nesta execução.
- 17 imagens do chat: 100% recebidas/catalogadas.
- Validação local das 15 referências com arquivo (14 únicos): 17/17 testes OK.
- Restauração remota das dez artes: 0/10 (0%).
- Prévia HTTPS jogável: 0%, nenhuma URL homologada.
- Próximo passo: disponibilizar os dez binários originais ao processo autenticado de upload GitHub, preferencialmente uma arte por commit com SHA-256 verificado, sem modificar main; depois executar o teste no GitHub Actions e somente então integrar prévia mobile.
- Proibido modificar main, motor, regras e implantar produção sem autorização.
