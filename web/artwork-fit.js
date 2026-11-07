// Fill the available viewport while preserving the proportions of approved content.
// Additional height is distributed between intact foreground bands.
export function bandLayout(width,height,sourceWidth,sourceHeight,cuts){
 const natural=width*sourceHeight/sourceWidth,total=Math.max(height,natural),extra=total-natural;
 return {height:total,natural,bands:cuts.slice(0,-1).map((start,i)=>({start,end:cuts[i+1],top:start*natural+extra*i/(cuts.length-2),height:(cuts[i+1]-start)*natural}))};
}
export function fitApprovedArtwork(stage,host,cuts,sourceWidth,sourceHeight){
 const image=stage.querySelector('img');if(!image)return;
 const original=[...stage.children].filter(e=>e!==image).map(e=>({e,top:parseFloat(e.style.top),height:parseFloat(e.style.height)}));
 const bands=cuts.slice(0,-1).map(()=>{const e=document.createElement('div');e.className='art-fit-band';e.setAttribute('aria-hidden','true');stage.append(e);return e});
 stage.classList.add('art-fit-stage');
 let last='';
 function fit(){const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;const key=width+':'+height;if(key===last)return;last=key;
  const layout=bandLayout(width,height,sourceWidth,sourceHeight,cuts);stage.style.height=layout.height+'px';
  layout.bands.forEach((b,i)=>{Object.assign(bands[i].style,{top:b.top+'px',height:b.height+'px',backgroundImage:`url("${image.src}")`,backgroundSize:width+'px '+layout.natural+'px',backgroundPosition:'0 '+(-b.start*layout.natural)+'px'})});
  for(const {e,top,height:h}of original){if(!Number.isFinite(top))continue;const center=(top+(Number.isFinite(h)?h/2:0))/100;const index=Math.min(layout.bands.length-1,layout.bands.findIndex(b=>center<b.end));const b=layout.bands[Math.max(0,index)];e.style.top=(b.top+(top/100-b.start)*layout.natural)+'px';if(Number.isFinite(h))e.style.height=h/100*layout.natural+'px'}
 }
 new ResizeObserver(fit).observe(host);fit();
}
