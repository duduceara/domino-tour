import {createMatchConfig,updateMatchConfig,stepTableStyle,prepareIdentification,TABLE_STYLES,TABLE_LABELS} from './match-config.js';
import {setArtRegion} from './art-regions.js';
const root=document.querySelector('#match-setup'),page=root.querySelector('.config03-page'),flow=document.querySelector('#entry-flow');
const app=document.querySelector('#app');let appWasInert=false;
const dialog=document.querySelector('#config03-dialog'),title=dialog.querySelector('h2'),message=dialog.querySelector('p');
const ART={offline:{src:'./assets/approved/screen-03-offline.png',x:0,width:768},online:{src:'./assets/approved/screen-03-online.png',x:8,width:760}};
let state=createMatchConfig(),pendingIdentification=null,returnFocus=null,renderedMode=null;
const difficultyLabels={easy:'Fácil',medium:'Médio',hard:'Difícil'};
const windows=[];
function showInfo(heading,text){title.textContent=heading;message.textContent=text;if(!dialog.open)dialog.showModal()}
function announceOnline(){showInfo('Jogar Online','Modo online em desenvolvimento. Em breve!')}
function hit(window,action,label,rect,handler){const b=document.createElement('button');b.type='button';b.className='config03-hit';b.dataset.configAction=action;b.setAttribute('aria-label',label);setArtRegion(b,rect,window);b.addEventListener('click',handler);return b}
function artWindow(className,y,height,rects=[],cropped=false){
 const e=document.createElement('div');e.className='official02-slice config03-window '+className;
 const img=new Image();img.alt='';img.setAttribute('aria-hidden','true');img.width=768;img.height=1024;e.append(img);
 windows.push({e,img,y,height,rects,cropped});return e;
}
const header=artWindow('config03-header',0,291,[
 ['back','Voltar',{x:20,y:148,width:135,height:62},close],
 ['help','Ajuda',{x:674,y:145,width:76,height:67},()=>showInfo('Como configurar','Offline: jogue contra três robôs. Escolha uma dificuldade, a meta de 100 ou 200 pontos e sua preferência de mesa. A meta de 300 pontos ainda não é suportada. Os estilos são preferências visuais para a próxima etapa.\n\nOnline: modo em desenvolvimento.\n\nO nome, nível, moedas e gemas desenhados são ilustrativos. A identificação será homologada na Tela 04.')],
 ['coins','Moedas ilustrativas',{x:317,y:0,width:170,height:45},()=>showInfo('Moedas','O saldo desenhado é ilustrativo. Nenhuma moeda é concedida nesta tela.')],
 ['gems','Gemas ilustrativas',{x:500,y:0,width:156,height:45},()=>showInfo('Gemas','O saldo de gemas desenhado é ilustrativo. Não há compras nesta prévia.')],
 ['settings','Configurações',{x:680,y:0,width:68,height:60},()=>showInfo('Configurações','As escolhas desta tela são mantidas durante a navegação. Nenhum dado salvo, avatar ou conquista é alterado. Sem música de fundo.')]
]);
const tabs=artWindow('config03-tabs',291,80,[
 ['offline','Jogar Offline',{x:43,y:292,width:348,height:71},()=>set('mode','offline')],
 ['online','Jogar Online',{x:403,y:292,width:321,height:71},()=>set('mode','online')]
]);
const modeInfo=artWindow('config03-mode-info',371,104);
const banner=document.createElement('p');banner.className='config03-banner';banner.setAttribute('role','status');banner.textContent='Modo online em desenvolvimento. Em breve!';banner.hidden=true;
function group(kind,headingY,headingHeight){const g=document.createElement('div');g.className='config03-options config03-'+kind;g.append(artWindow('config03-heading',headingY,headingHeight,[],true));const row=document.createElement('div');row.className='config03-group';row.setAttribute('role','group');g.append(row);return {g,row}}
const difficulty=group('difficulty',475,39);difficulty.row.setAttribute('aria-label','Dificuldade dos robôs');
const onlineOptions=group('online-options',475,39);onlineOptions.row.setAttribute('aria-label','Opções de jogo online em desenvolvimento');
function choice(row,label,field,value,content){const b=document.createElement('button');b.type='button';b.className='config03-choice';b.dataset.configField=field;b.dataset.configValue=String(value);b.setAttribute('aria-label',label);b.innerHTML=content||label;b.addEventListener('click',()=>field==='onlineAction'?announceOnline():set(field,value));row.append(b);return b}
for(const [i,key]of ['easy','medium','hard'].entries())choice(difficulty.row,difficultyLabels[key],'difficulty',key,`<span class="config03-stars" aria-hidden="true">${'★'.repeat(i+1)}</span><span>${difficultyLabels[key]}</span>`);
onlineOptions.row.remove();
const onlineActions=artWindow('config03-online-actions',511,101,[
 ['online-quick','Partida Rápida online — em desenvolvimento',{x:65,y:511,width:216,height:96},announceOnline],
 ['online-create','Criar Sala — em desenvolvimento',{x:289,y:512,width:211,height:95},announceOnline],
 ['online-join','Entrar em Sala — em desenvolvimento',{x:508,y:512,width:212,height:95},announceOnline]
],true);onlineOptions.g.append(onlineActions);
const points=group('points',600,35);points.row.setAttribute('aria-label','Pontuação da partida');
for(const n of [100,200,300]){const b=choice(points.row,n+' pontos','target',n);if(n===300){b.setAttribute('aria-disabled','true');b.setAttribute('aria-label','300 pontos — ainda não suportado')}}
const themes=group('table-styles',707,39);themes.row.className='config03-themes';themes.row.setAttribute('aria-label','Preferência visual da mesa');
function arrow(direction){const b=document.createElement('button');b.type='button';b.className='config03-arrow';b.dataset.configAction=direction<0?'previous-style':'next-style';b.setAttribute('aria-label',direction<0?'Estilo anterior':'Próximo estilo');b.textContent=direction<0?'‹':'›';b.addEventListener('click',()=>{state=stepTableStyle(state,direction);pendingIdentification=null;renderState()});return b}
themes.row.append(arrow(-1));
for(const style of TABLE_STYLES){const b=choice(themes.row,TABLE_LABELS[style],'tableStyle',style,'');b.classList.add('config03-theme');b.textContent='';const c=document.createElement('canvas');c.width=110;c.height=66;c.setAttribute('aria-hidden','true');b.append(c)}themes.row.append(arrow(1));
const footer=artWindow('config03-footer',849,175,[['start','Iniciar Partida',{x:146,y:858,width:480,height:96},()=>{
 const result=prepareIdentification(state);
 if(result.status==='online-unavailable'){announceOnline();return}
 pendingIdentification=result.config;
 showInfo('Identificação em desenvolvimento',`Suas escolhas foram preservadas:\nOffline · ${difficultyLabels[state.difficulty]} · ${state.target} pontos · ${TABLE_LABELS[state.tableStyle]}.\n\nA Tela 04 ainda será implementada e homologada. Nenhuma partida foi iniciada.`);
}]]);
page.append(header,tabs,modeInfo,banner,difficulty.g,onlineOptions.g,points.g,themes.g,footer);
function set(field,value){
 const focusAction=document.activeElement?.dataset?.configAction;
 try{state=updateMatchConfig(state,field,value);pendingIdentification=null}catch{showInfo('Opção ainda indisponível','A meta de 300 pontos ainda não é suportada pelo motor atual. Escolha 100 ou 200 pontos. Sua seleção anterior foi preservada.');return}
 renderState();
 if(focusAction)root.querySelector(`[data-config-action="${focusAction}"]`)?.focus({preventScroll:true});
}
function renderState(){
 root.dataset.mode=state.mode;banner.hidden=state.mode!=='online';difficulty.g.hidden=state.mode==='online';onlineOptions.g.hidden=state.mode!=='online';
 for(const b of root.querySelectorAll('[data-config-field]')){const f=b.dataset.configField;b.setAttribute('aria-pressed',String(f==='onlineAction'?b.dataset.configValue==='quick':String(state[f])===b.dataset.configValue))}
 if(renderedMode===state.mode)return;renderedMode=state.mode;
 for(const item of windows){
  const art=ART[state.mode];let windowY=item.y;
  if(item.e===points.g.firstElementChild)windowY=state.mode==='online'?613:600;
  const x=item.cropped?40:art.x,width=item.cropped?693:art.width;
  const win={x,y:windowY,width,height:item.height};
  item.e.style.setProperty('--slice-ratio',`${width}/${item.height}`);
  // Both modes share one source coordinate window; no viewport pixel positions.
  item.img.src=art.src;item.img.style.width=`${768/width*100}%`;item.img.style.left=`${-x/width*100}%`;item.img.style.top=`${-windowY/item.height*100}%`;
  for(const old of item.e.querySelectorAll('.config03-hit'))old.remove();
  for(const [action,label,rect,handler]of item.rects){let actual=rect;
   if(item.e===tabs&&state.mode==='online')actual=action==='offline'?{x:50,y:292,width:320,height:70}:{x:384,y:289,width:347,height:76};
   const b=hit(win,action,label,actual,handler);if(action.startsWith('online-')){b.setAttribute('aria-disabled','true');b.setAttribute('aria-pressed',String(action==='online-quick'))}if(action==='offline'||action==='online')b.setAttribute('aria-pressed',String(action===state.mode));item.e.append(b)
  }
 }
}
function open(){if(flow.hidden||flow.dataset.step!=='2')return;appWasInert=app.inert;app.inert=true;pendingIdentification=null;returnFocus=document.querySelector('[data-official-action="quick"]');state=updateMatchConfig(state,'mode','offline');renderState();root.hidden=false;flow.inert=true;flow.setAttribute('aria-hidden','true');root.querySelector('[data-config-action="back"]').focus({preventScroll:true});root.scrollTop=0}
function close(){if(dialog.open)dialog.close();root.hidden=true;app.inert=appWasInert;flow.inert=false;flow.removeAttribute('aria-hidden');returnFocus?.focus({preventScroll:true})}
window.addEventListener('domino-tour:configure-match',open);
root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.open){event.preventDefault();close()}});
const sprites=new Image();sprites.src=ART.offline.src;sprites.addEventListener('load',()=>{
 const crops=[[118,757,103,59],[239,758,94,58],[348,757,95,59],[458,758,95,58],[569,759,94,57]];
 for(const [i,c]of [...root.querySelectorAll('.config03-theme canvas')].entries()){
  const ctx=c.getContext('2d');ctx.drawImage(sprites,...crops[i],0,0,c.width,c.height);
  if(i===0){const copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;copy.getContext('2d').drawImage(c,0,0);ctx.save();ctx.beginPath();ctx.rect(70,31,40,35);ctx.clip();ctx.translate(110,0);ctx.scale(-1,1);ctx.drawImage(copy,0,0);ctx.restore()}
 }
});
renderState();
export function readPendingIdentification(){return pendingIdentification}
