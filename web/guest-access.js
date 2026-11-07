import {openIdentity} from './identity-screen.js';
import {readPendingIdentification} from './match-setup.js';
import {guestOptions,localGuest} from './guest-session.js';
const flow=document.querySelector('#entry-flow'),setup=document.querySelector('#match-setup'),app=document.querySelector('#app');
const root=document.createElement('section');root.id='guest-access';root.className='guest04';root.hidden=true;root.setAttribute('aria-label','Tela 04 — Acesse sua conta');
root.innerHTML='<div class="guest04-art"><img src="./assets/approved/screen-02.png" width="1024" height="1536" alt="DOMINÓ TOUR — Acesse sua conta — EDVÓRIA"><button type="button" class="guest04-hit" disabled aria-label="Entrar com e-mail — indisponível durante os testes" style="left:17%;top:43.4%;width:66%;height:6.2%"></button><button type="button" class="guest04-hit" disabled aria-label="Continuar com Google — indisponível durante os testes" style="left:17%;top:50.7%;width:66%;height:6.2%"></button><button type="button" class="guest04-hit" disabled aria-label="Continuar com Facebook — indisponível durante os testes" style="left:17%;top:58%;width:66%;height:6.2%"></button><button type="button" id="guest04-play" class="guest04-hit" aria-label="Jogar como Visitante" style="left:17%;top:69%;width:66%;height:6.2%"></button><p class="guest04-status" role="status" hidden></p></div>';
document.body.append(root);
const play=root.querySelector('#guest04-play'),status=root.querySelector('[role="status"]');let pending=null,entering=false;
window.addEventListener('domino-tour:identify-guest',()=>{
 if(flow.hidden||setup.hidden)return;
 try{pending=guestOptions(readPendingIdentification())}catch{return}
 entering=false;status.hidden=true;setup.hidden=true;root.hidden=false;play.focus({preventScroll:true});root.scrollTop=0;
});
play.addEventListener('click',()=>{
 if(root.hidden||entering||!pending)return;
 root.hidden=true;
 void openIdentity({onBack:()=>{root.hidden=false;play.focus({preventScroll:true})},onPlay:identity=>{
  if(entering||!pending)return false;
  entering=true;const detail={...pending,name:identity.nickname,accepted:false};
  window.dispatchEvent(new CustomEvent('domino-tour:offline-options',{detail}));
  if(!detail.accepted){entering=false;return false}
  let storage=null;try{storage=window.localStorage}catch{}
  const id=crypto.randomUUID?.()??[...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
  localGuest(storage,id,identity.nickname);document.body.dataset.session='guest';
  app.dataset.guestTheme=detail.tableStyle;app.inert=false;
  window.dispatchEvent(new Event('domino-tour:quick-play'));return true;
 }});
});
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!entering){root.hidden=true;setup.hidden=false;setup.querySelector('[data-config-action="start"]').focus({preventScroll:true})}});
