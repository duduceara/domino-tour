import {presentationLayout,FELT_ROWS} from './presentation-layout.js';
const viewport=document.querySelector('.official-presentation'),stage=viewport.querySelector('.official02-stage'),image=stage.querySelector('img');
const targets=[...stage.querySelectorAll('.official02-hit')].map(e=>({e,top:parseFloat(e.style.top)*1536/100,height:parseFloat(e.style.height)*1536/100}));
const canvas=document.createElement('canvas');canvas.className='official02-responsive-art';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
const style=document.createElement('style');style.textContent=`
#entry-flow[data-step="2"] .official02-stage.official02-adaptive{aspect-ratio:auto}
#entry-flow[data-step="2"] .official02-stage.official02-adaptive>#official02-image{position:absolute;inset:0;opacity:0;pointer-events:none}
#entry-flow[data-step="2"] .official02-responsive-art{display:block;pointer-events:none}
`;document.head.append(style);
let previous='';
function fit(){
 const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height||!image.complete||!image.naturalWidth)return;
 const l=presentationLayout(width,height),dpr=Math.min(window.devicePixelRatio||1,3),key=[width,height,dpr].join(':');if(key===previous)return;previous=key;
 canvas.width=Math.round(l.width*dpr);canvas.height=Math.round(l.height*dpr);canvas.style.width=l.width+'px';canvas.style.height=l.height+'px';
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingQuality='high';
 // Three connected source windows, with no cuts or duplication of essential content.
 const [start,end]=FELT_ROWS;
 ctx.drawImage(image,0,0,1024,start,0,0,l.width,start*l.scale);
 ctx.drawImage(image,0,start,1024,end-start,0,start*l.scale,l.width,(end-start)*l.scale+l.extra);
 ctx.drawImage(image,0,end,1024,1536-end,0,end*l.scale+l.extra,l.width,(1536-end)*l.scale);
 stage.classList.add('official02-adaptive');stage.style.setProperty('--presentation-width',l.width+'px');stage.style.height=l.height+'px';
 for(const {e,top,height:h}of targets){e.style.top=l.mapY(top)+'px';e.style.height=h*l.scale+'px'}
}
new ResizeObserver(fit).observe(viewport);image.addEventListener('load',fit);window.visualViewport?.addEventListener('resize',fit);window.addEventListener('resize',fit);fit();
