// Scale the original PNG and its hit regions together, never crop or distort.
const viewport=document.querySelector('.official-presentation');
const stage=viewport.querySelector('.official02-stage');
function fit(){
 const width=viewport.clientWidth, height=viewport.clientHeight;
 if(!width||!height)return;
 // Below this scale the smallest region would drop below 24 CSS px.
 // Short/wide viewports scroll vertically instead of shrinking controls further.
 const minimum=Math.min(width,308);
 const fitted=Math.max(minimum,Math.min(width,height*2/3));
 stage.style.setProperty('--presentation-width',`${fitted}px`);
}
new ResizeObserver(fit).observe(viewport);
window.visualViewport?.addEventListener('resize',fit);
window.addEventListener('resize',fit);
fit();
