import {OFFICIAL_MENU,MENU_TARGETS,officialMenuLayout} from './presentation-official-layout.js';
const viewport=document.querySelector('.official-presentation'),stage=viewport.querySelector('.official02-stage'),image=stage.querySelector('#official02-image');
// Preserve every existing button/listener. Change only its presentation coordinates.
image.width=OFFICIAL_MENU.width;image.height=OFFICIAL_MENU.height;image.src=new URL(OFFICIAL_MENU.src,import.meta.url).href;
const canvas=document.createElement('canvas');canvas.className='official02-official-art';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
const style=document.createElement('style');style.textContent=`
#entry-flow[data-step="2"] .official02-stage.official02-official{aspect-ratio:auto}
#entry-flow[data-step="2"] .official02-official>#official02-image{position:absolute;inset:0;width:0;height:0;opacity:0;pointer-events:none}
#entry-flow[data-step="2"] .official02-official-art{display:block;pointer-events:none}
`;document.head.append(style);
let previous='';
function fit(){
 const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height||!image.complete||image.naturalWidth!==OFFICIAL_MENU.width)return;
 const dpr=Math.min(window.devicePixelRatio||1,3),key=[width,height,dpr].join(':');if(previous===key)return;previous=key;
 const l=officialMenuLayout(width,height);canvas.width=Math.round(l.width*dpr);canvas.height=Math.round(l.height*dpr);canvas.style.width=l.width+'px';canvas.style.height=l.height+'px';
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingQuality='high';
 for(const s of l.segments)ctx.drawImage(image,0,s.sourceY,OFFICIAL_MENU.width,s.length,0,s.top,l.width,s.height);
 stage.classList.add('official02-official');stage.dataset.fitFallback=String(l.fallback);stage.style.setProperty('--presentation-width',l.width+'px');stage.style.height=l.height+'px';
 for(const [action,[x,y,w,h]]of Object.entries(MENU_TARGETS)){
  const button=stage.querySelector(`[data-official-action="${action}"]`);button.style.left=x*l.scale+'px';button.style.top=l.mapY(y)+'px';button.style.width=w*l.scale+'px';button.style.height=h*l.scale+'px';
 }
}
new ResizeObserver(fit).observe(viewport);image.addEventListener('load',fit);window.visualViewport?.addEventListener('resize',fit);window.addEventListener('resize',fit);fit();
