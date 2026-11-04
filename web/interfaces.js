const $=id=>document.getElementById(id);
let screens=[],current=0;
function show(index){
 current=Math.max(0,Math.min(screens.length-1,index));const screen=screens[current];
 $('screen-title').textContent=`Tela ${String(screen.number).padStart(2,'0')} · ${screen.title}`;
 $('screen-status').textContent=screen.src?(screen.number===8?'Mesma referência da Tela 06.':'Arte original recuperada · navegação demonstrativa'):'Pendente: correspondência da arte original';
 const img=$('original-art');img.hidden=!screen.src;$('missing-art').hidden=!!screen.src;
 if(screen.src){img.src=screen.src;img.alt=`Referência original: ${screen.title}`}else{img.removeAttribute('src');img.alt=''}
 $('previous').disabled=current===0;$('next').disabled=current===screens.length-1;
 [...$('catalog').children].forEach((button,i)=>button.setAttribute('aria-current',String(i===current)));
 history.replaceState(null,'',`#tela-${String(screen.number).padStart(2,'0')}`);
}
try{
 const response=await fetch('./approved-interfaces.json');if(!response.ok)throw new Error('manifest');screens=await response.json();
 for(const [index,screen] of screens.entries()){const button=document.createElement('button');button.type='button';button.textContent=`${String(screen.number).padStart(2,'0')} · ${screen.title}`;button.onclick=()=>show(index);$('catalog').append(button)}
 $('previous').onclick=()=>show(current-1);$('next').onclick=()=>show(current+1);
 const requested=Number(location.hash.match(/^#tela-(\d+)$/)?.[1]??1);show(screens.findIndex(s=>s.number===requested));
}catch{$('screen-status').textContent='Não foi possível carregar o catálogo. Recarregue a página.'}
