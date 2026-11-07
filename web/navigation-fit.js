// Shared visual viewport sizing; no game state or orientation changes.
let queued=false,last='';
function fit(){queued=false;const v=window.visualViewport,h=Math.round(v?.height??window.innerHeight),top=Math.round(v?.offsetTop??0),key=h+':'+top;if(key===last)return;last=key;document.documentElement.style.setProperty('--navigation-height',h+'px');document.documentElement.style.setProperty('--navigation-top',top+'px')}
function schedule(){if(!queued){queued=true;requestAnimationFrame(fit)}}
window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);fit();
