// DOMINÓ TOUR: staged offline entry. No engine mutations until the player enters the table.
const flow=document.getElementById('entry-flow');
const cards=[...document.querySelectorAll('[data-entry-step]')];
let step=0;
let splashReady=false;
const show=()=>{cards.forEach((c,i)=>c.hidden=i!==step);flow.dataset.step=String(step+1)};
function enterGame(requireIdentity=true){
 if(flow.hidden||step!==cards.length-1||(requireIdentity&&document.body.dataset.avatarReady!=='true'))return;
 flow.hidden=true;document.body.dataset.entry='playing';
 window.dispatchEvent(new Event('domino-tour:enter-game'));
}
document.querySelectorAll('[data-entry-next]').forEach(b=>b.addEventListener('click',()=>{if(step===0&&!splashReady)return;if(cards[step].hasAttribute?.('data-entry-require-avatar')&&document.body.dataset.avatarReady!=='true')return;step=Math.min(cards.length-1,step+1);show()}));
document.querySelectorAll('[data-entry-back]').forEach(b=>b.addEventListener('click',()=>{step=Math.max(1,step-1);show()}));
document.getElementById('entry-play').addEventListener('click',()=>enterGame());
window.addEventListener('domino-tour:quick-play',()=>{if(flow.hidden||step!==1)return;step=cards.length-1;enterGame(false)});
show();

// Both the three-second minimum and real page loading must finish before leaving.
let minimumElapsed=false;
let pageLoaded=document.readyState==='complete';
function finishSplash(){if(!minimumElapsed||!pageLoaded)return;splashReady=true;if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('homologacao')==='tela01'){const status=document.getElementById('splash-status');if(status)status.textContent='Carregamento concluído. Tela 01 em avaliação.';return}if(step===0){step=1;show()}}
window.addEventListener('load',()=>{pageLoaded=true;finishSplash()},{once:true});
setTimeout(()=>{minimumElapsed=true;finishSplash()},3000);

// Return to the approved central menu without replaying the splash.
window.addEventListener('domino-tour:return-menu',()=>{
 step=1;flow.hidden=false;flow.inert=false;flow.removeAttribute?.('aria-hidden');
 document.body.dataset.entry='menu';show();
 document.querySelector('[data-official-action="quick"]')?.focus({preventScroll:true});
});
