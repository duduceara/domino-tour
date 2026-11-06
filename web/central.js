import {readOffline} from './offline-save.js';
const $=id=>document.getElementById(id);let storage=null;try{storage=window.localStorage}catch{}
const dialog=$('official02-dialog');let saved;
const info={
 profile:['Perfil local','O apelido e a partida offline são salvos neste navegador quando o armazenamento está disponível. O avatar existente é preservado. Dados locais não são sincronizados com outro aparelho e podem ser perdidos ao limpar os dados ou desinstalar. O nome e nível desenhados na arte são ilustrativos.'],
 coins:['Moedas','O saldo de 3.850 moedas faz parte da arte aprovada. Não representa saldo real nem permite compras nesta prévia.'],
 rewards:['Recompensa por hora','Recompensa de 1.000 moedas para usuários autenticados, sem acúmulo. O serviço de autenticação e a validação de resgate ainda não estão integrados nesta prévia. Nenhuma moeda foi concedida.'],
 gems:['Gemas','As 120 gemas são ilustrativas. Não há compra nem cobrança nesta prévia.'],
 notifications:['Notificações','Não há notificações integradas nesta prévia.'],
 settings:['Configurações','Escolha dificuldade e distribuição em Jogar Rápido. A mesa mantém suas configurações atuais. Sem música de fundo.'],
 journey:['Jornada Mundial','A progressão começa no Brasil, pelo Ceará, e segue por estados, regiões, países e continentes até Lenda. Este percurso ainda não está implementado. O progresso de 38% da arte é ilustrativo.'],
 goals:['Metas','O nível 12, os 38% e a meta de nível 13 fazem parte da arte. Não representam evolução real. A partida offline pode ser retomada; a progressão da Jornada ainda não foi integrada.'],
 tournaments:['Torneios Especiais','Competições ainda não estão disponíveis. O online permanecerá bloqueado até existir autenticação segura e servidor de partidas.'],
 challenge:['Próximo Desafio','O desafio e os 320 pontos desenhados são ilustrativos. A Jornada será integrada e homologada em outro ciclo.'],
 ranking:['Ranking','O ranking oficial será online, com autenticação obrigatória. Ainda não está disponível.'],
 achievements:['Conquistas','Medalhas e conquistas da Jornada ainda não estão integradas. A pontuação e o estado da partida offline são preservados localmente.'],
 shop:['Loja','A loja ainda não está disponível. Não há pagamentos nesta prévia.'],
 rules:['Regras','Quatro participantes individuais. Distribuição de seis pedras com quatro reservadas, ou sete sem reservadas. Toque numa pedra e depois numa ponta válida ou arraste até a ponta. Passagens sem jogada legal são automáticas. Sem duplas.']
};
function show(title,message,quick=false){$('official02-title').textContent=title;$('official02-message').textContent=message;$('official02-options').hidden=!quick;dialog.showModal()}
for(const b of document.querySelectorAll('[data-official-action]'))b.addEventListener('click',()=>{
 if(b.dataset.officialAction!=='quick'){show(...info[b.dataset.officialAction]);return}
 window.dispatchEvent(new Event('domino-tour:configure-match'));
});
$('official02-mode').addEventListener('change',()=>{const online=$('official02-mode').value==='online';$('official02-start').disabled=online;$('official02-save-status').textContent=online?'Online indisponível: exige autenticação segura e servidor, ainda não configurados. Nenhuma partida online será iniciada.':'Salvamento somente neste dispositivo, sem sincronização automática.'});
$('official02-start').addEventListener('click',()=>{
 if($('official02-mode').value!=='offline')return;
 const detail={resume:saved.kind==='saved',name:$('official02-name').value.trim()||'Visitante',difficulty:$('official02-difficulty').value,deal:Number($('official02-deal').value),accepted:false};
 window.dispatchEvent(new CustomEvent('domino-tour:offline-options',{detail}));if(!detail.accepted)return;
 dialog.close();window.dispatchEvent(new Event('domino-tour:quick-play'));
});
