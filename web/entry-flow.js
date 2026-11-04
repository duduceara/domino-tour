// DOMINÓ TOUR: staged offline entry. No engine mutations until the player enters the table.
const flow=document.getElementById('entry-flow');
const cards=[...document.querySelectorAll('[data-entry-step]')];
let step=0;
const show=()=>{cards.forEach((c,i)=>c.hidden=i!==step);flow.dataset.step=String(step+1)};
function enterGame(){
 flow.hidden=true;document.body.dataset.entry='playing';
 window.dispatchEvent(new Event('domino-tour:enter-game'));
}
document.querySelectorAll('[data-entry-next]').forEach(b=>b.addEventListener('click',()=>{step=Math.min(4,step+1);show()}));
document.querySelectorAll('[data-entry-back]').forEach(b=>b.addEventListener('click',()=>{step=Math.max(0,step-1);show()}));
document.getElementById('entry-play').addEventListener('click',enterGame);
show();
