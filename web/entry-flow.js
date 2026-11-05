// DOMINÓ TOUR: staged offline entry. No engine mutations until the player enters the table.
const flow=document.getElementById('entry-flow');
const cards=[...document.querySelectorAll('[data-entry-step]')];
let step=0;
let splashReady=false;
const show=()=>{cards.forEach((c,i)=>c.hidden=i!==step);flow.dataset.step=String(step+1)};
function enterGame(){
 if(flow.hidden||step!==cards.length-1||document.body.dataset.avatarReady!=='true')return;
 flow.hidden=true;document.body.dataset.entry='playing';
 window.dispatchEvent(new Event('domino-tour:enter-game'));
}
document.querySelectorAll('[data-entry-next]').forEach(b=>b.addEventListener('click',()=>{if(step===0&&!splashReady)return;if(cards[step].hasAttribute?.('data-entry-require-avatar')&&document.body.dataset.avatarReady!=='true')return;step=Math.min(cards.length-1,step+1);show()}));
document.querySelectorAll('[data-entry-back]').forEach(b=>b.addEventListener('click',()=>{step=Math.max(1,step-1);show()}));
document.getElementById('entry-play').addEventListener('click',enterGame);
show();

// Both the two-second minimum and real page loading must finish before leaving.
let minimumElapsed=false;
let pageLoaded=document.readyState==='complete';
function finishSplash(){if(!minimumElapsed||!pageLoaded)return;splashReady=true;if(step===0){step=1;show()}}
window.addEventListener('load',()=>{pageLoaded=true;finishSplash()},{once:true});
setTimeout(()=>{minimumElapsed=true;finishSplash()},2000);
