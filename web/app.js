import {reflowChain} from './chain-reflow.js';
import {portraitTableViewport,portraitPoint} from './table-viewport.js';
import {fitTableCamera,cameraPoint,chainSpace} from './table-camera.js';
import {mountTableScreen,paintTableScreen} from './table-screen.js';
import {TurnClock} from './turn-clock.js';
import {SAVE_KEY} from './offline-save.js';
import {readOffline,writeOffline} from './offline-save.js';
import {LocalSession} from '../dist/src/session.js';
import {validSides,chooseRoute} from '../dist/src/table.js';
import {legalTiles,secureIndex} from '../dist/src/engine.js';
const $=id=>document.getElementById(id);
const PLAYER_NAMES=['Você','RobiX','AndroX','DomiX'];
let offlineStorage=null;try{offlineStorage=window.localStorage}catch{}
const restoredOffline=readOffline(offlineStorage);let offlineName=restoredOffline.name||'Visitante';let offlineStarted=false;let offlineSaveBlocked=restoredOffline.kind==='unavailable';
let game=restoredOffline.session||new LocalSession();let routeStyle=restoredOffline.routeStyle||chooseRoute(secureIndex);
const tableUI=mountTableScreen($('app')),turnClock=new TurnClock();
let tableActive=false,decisionKind=null,completedKey=null;
let handDrag=null,insertionMarker=null;
let dragId=null,origin=null,dragMoved=false,ghost=null,floatingTile=null;const activePointers=new Set();let gestureBlocked=false;
let viewportScale=1,zoom=1,pan={x:0,y:0},panStart=null;
let tableSpace={width:800,height:430,scale:1},viewportSignature='';
let botTimer=null,botEpoch=0,passNoticeTimer=null,passNoticeEpoch=0;
function clearPassNotice(){passNoticeEpoch++;if(passNoticeTimer!==null){clearTimeout(passNoticeTimer);passNoticeTimer=null}$('pass-notice').hidden=true}
function stopBotSequence(){botEpoch++;if(botTimer!==null){clearTimeout(botTimer);botTimer=null}clearPassNotice()}
function showPassNotice(seat){
 clearPassNotice();const notice=$('pass-notice');notice.textContent=seat===0?'VOCÊ PASSOU! −5 pontos':`${PLAYER_NAMES[seat]} PASSOU! −5 pontos`;notice.hidden=false;
 const epoch=passNoticeEpoch;passNoticeTimer=setTimeout(()=>{if(epoch!==passNoticeEpoch)return;passNoticeTimer=null;notice.hidden=true;scheduleBots()},2000);
}
function scheduleBots(){
 if(botTimer!==null){clearTimeout(botTimer);botTimer=null}botEpoch++;
 if(!tableActive||rotationSuspended||document.hidden||decisionKind||$('entry-flow')?.hidden===false||game.state.phase!=='playing'||passNoticeTimer!==null)return;
 const epoch=botEpoch,seat=game.state.turn;
 if(seat===0){
  if(game.state.lastPlayed!==null&&legalTiles(game.state,0).length===0){
   botTimer=setTimeout(()=>{if(epoch!==botEpoch||!tableActive||decisionKind||document.hidden||game.state.phase!=='playing'||game.state.turn!==0)return;botTimer=null;const before=game.state.events.length;if(game.humanPass()){sync();const ev=game.state.events.slice(before).find(e=>e.type==='pass'&&e.seat===0);if(ev)showPassNotice(0);else scheduleBots()}},0);
  }
  return;
 }
 botTimer=setTimeout(()=>{
  if(epoch!==botEpoch||!tableActive||decisionKind||document.hidden||game.state.phase!=='playing'||game.state.turn!==seat)return;
  botTimer=null;const before=game.state.events.length;game.advanceBots(1);sync();
  const ev=game.state.events.slice(before).find(e=>e.type==='pass');
  if(ev)showPassNotice(ev.seat);else scheduleBots();
 },3000);
}
function coords(e){const r=$('table').getBoundingClientRect();return cameraPoint({x:(e.clientX-r.left)/viewportScale-$('table').clientLeft,y:(e.clientY-r.top)/viewportScale-$('table').clientTop},{width:$('table').clientWidth,height:$('table').clientHeight},tableSpace,zoom,pan)}
// Portrait-only play: rotation is a temporary suspension, never a new layout.
const rotationNotice=document.createElement('div');
rotationNotice.id='mesa-portrait-notice';
rotationNotice.setAttribute('role','status');
rotationNotice.setAttribute('aria-live','polite');
rotationNotice.textContent='Gire o celular para a vertical para continuar a partida.';
rotationNotice.hidden=true;
document.body.append(rotationNotice);
let rotationSuspended=false;
function syncPortraitOrientation(){
 const viewport=window.visualViewport;
 const width=viewport?.width??window.innerWidth;
 const height=viewport?.height??window.innerHeight;
 const sideways=tableActive&&width>height;
 if(sideways===rotationSuspended)return;
 rotationSuspended=sideways;
 rotationNotice.hidden=!sideways;
 if(sideways){
  turnClock.pause();stopBotSequence();cancelGesture();
 }else{
  // Returning to portrait must not restart a clock while the page is hidden or a decision is open.
  if(!document.hidden&&!decisionKind)turnClock.resume();
  sync();scheduleBots();
 }
}
function fitViewport(){
 // Keep the last playable portrait frame while the rotation notice is visible.
 if(rotationSuspended)return false;
 const probe=getComputedStyle($('safe-probe')),insets={top:parseFloat(probe.paddingTop),right:parseFloat(probe.paddingRight),bottom:parseFloat(probe.paddingBottom),left:parseFloat(probe.paddingLeft)};
 const visible=window.visualViewport;
 const v=portraitTableViewport(visible?.width??document.documentElement.clientWidth,visible?.height??window.innerHeight,insets,{left:visible?.offsetLeft??0,top:visible?.offsetTop??0});
 const signature=JSON.stringify(v);if(signature===viewportSignature)return false;
 const app=$('app');
 const geometryChanged=app.style.width!==v.width+'px'||app.style.height!==v.height+'px';
 viewportSignature=signature;
 // A viewport offset alone must not cancel a live finger drag.
 if(geometryChanged)cancelGesture();
 viewportScale=v.scale;
 // Viewport offsets and browser chrome must not discard the player's zoom/pan.
 if(geometryChanged){zoom=1;pan={x:0,y:0}}
 app.style.width=v.width+'px';app.style.height=v.height+'px';app.style.left=v.left+'px';app.style.top=v.top+'px';app.style.transform=v.scale===1?'none':`scale(${v.scale})`;
 app.dataset.rotated='false';app.dataset.compact=String(v.height<700);app.dataset.dense='false';
 $('fullscreen').textContent=document.fullscreenElement?'Sair da tela cheia':'Tela cheia (opcional)';
 return true;
}
// Optional fullscreen stays in portrait and is requested only by its own button.
async function toggleTableFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{}
 queueViewport();
}
function rect(){const fitted=chainSpace($('table').clientWidth,$('table').clientHeight);if(!fitted)return null;tableSpace=fitted;return {x:0,y:0,width:fitted.width,height:fitted.height}}
function clearDragVisual(){floatingTile?.remove?.();floatingTile=null;insertionMarker?.remove?.();insertionMarker=null;for(const el of $('hand').children)delete el.dataset.dragging}
function followPointer(e,tile,source){if(!floatingTile){floatingTile=tileEl(tile,'drag-floating rack-floating',handDrag?.flipped??false);floatingTile.setAttribute('aria-hidden','true');floatingTile.style.width=(source.offsetWidth||34)+'px';floatingTile.style.height=(source.offsetHeight||68)+'px';$('app').append(floatingTile)}const p=portraitPoint({x:e.clientX,y:e.clientY},$('app').getBoundingClientRect(),viewportScale);floatingTile.style.left=p.x+'px';floatingTile.style.top=p.y+'px'}
function cancelGesture(){handDrag=null;clearDragVisual();game.interaction.cancel();dragId=null;origin=null;dragMoved=false;ghost=null;panStart=null}
const PIP_POSITIONS=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
function pipFace(value){const occupied=new Set(PIP_POSITIONS[value]??[]);return '<span class="pip-face" aria-hidden="true">'+Array.from({length:9},(_,i)=>'<i class="pip'+(occupied.has(i)?' on':'')+'"></i>').join('')+'</span>'}
function tileEl(tile,css='',flipped=false){const b=document.createElement('button');b.className='piece '+css;b.dataset.tileId=tile.id;b.innerHTML=pipFace(flipped?tile.b:tile.a)+'<span class="divider"></span>'+pipFace(flipped?tile.a:tile.b);b.dataset.flipped=String(flipped);b.setAttribute('aria-label',`Pedra ${tile.a} e ${tile.b}`);return b}
// Pointer zones share the same unrotated portrait frame as the visible rack.
function frameRect(element){
 const r=element.getBoundingClientRect(),app=$('app').getBoundingClientRect();
 const a=portraitPoint({x:r.left,y:r.top},app,viewportScale),b=portraitPoint({x:r.left+r.width,y:r.top+r.height},app,viewportScale);
 return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(b.x-a.x),height:Math.abs(b.y-a.y)};
}
function pointerFrame(e){return portraitPoint({x:e.clientX,y:e.clientY},$('app').getBoundingClientRect(),viewportScale)}
function within(p,r,padding=0){return p.x>=r.x-padding&&p.x<=r.x+r.width+padding&&p.y>=r.y-padding&&p.y<=r.y+r.height+padding}
function handDropPlan(e,tileId){
 const point=pointerFrame(e),rack=frameRect($('hand'));
 if(!within(point,rack,6))return null;
 const tiles=[...$('hand').children].filter(el=>Number(el.dataset.tileId)!==tileId).map(el=>({id:Number(el.dataset.tileId),rect:frameRect(el)}));
 const before=tiles.find(t=>point.x<t.rect.x+t.rect.width/2);
 const neighbor=tiles.reduce((best,t)=>!best||Math.abs(point.x-t.rect.x-t.rect.width/2)<Math.abs(point.x-best.rect.x-best.rect.width/2)?t:best,null);
 return {beforeId:before?.id??null,neighborId:neighbor?.id??null,x:before?before.rect.x-3:tiles.length?tiles.at(-1).rect.x+tiles.at(-1).rect.width+3:rack.x+rack.width/2,rack};
}
function previewRackDrop(e,tile,source){
 const plan=handDropPlan(e,tile.id);
 insertionMarker?.remove?.();insertionMarker=null;
 if(!plan)return false;
 const layout=game.previewHandMove(tile.id,plan.beforeId,plan.neighborId);
 handDrag.flipped=layout?.flipped[tile.id]??handDrag.flipped;
 // Only the moving preview turns; stationary neighbors retain their orientation.
 if(floatingTile)floatingTile.innerHTML=pipFace(handDrag.flipped?tile.b:tile.a)+'<span class="divider"></span>'+pipFace(handDrag.flipped?tile.a:tile.b);
 insertionMarker=document.createElement('span');insertionMarker.className='hand-insertion';insertionMarker.setAttribute('aria-hidden','true');
 insertionMarker.style.left=plan.x+'px';insertionMarker.style.top=plan.rack.y+'px';insertionMarker.style.height=plan.rack.height+'px';$('app').append(insertionMarker);
 source.dataset.dragging='true';return true;
}
function drawBoard(model,previewId=null){
 const surface=$('table');surface.replaceChildren();const table=document.createElement('div');table.className='board-layer';
 const camera=previewId!==null&&tableSpace.camera?tableSpace.camera:fitTableCamera(model,tableSpace,$('table').clientWidth,$('table').clientHeight);
 tableSpace.camera=camera;
 const scale=zoom*(camera?.scale??tableSpace.scale);table.style.setProperty('--inverse-board-scale',String(1/scale));table.style.width=tableSpace.width+'px';table.style.height=tableSpace.height+'px';table.style.transformOrigin='0 0';table.style.transform=`translate(${$('table').clientWidth/2+pan.x}px,${$('table').clientHeight/2+pan.y}px) rotate(${camera.quarterTurn?90:0}deg) scale(${scale}) translate(${-camera.x}px,${-camera.y}px)`;surface.append(table);
 surface.dataset.geometry=model.status;surface.dataset.nodes=String(model.nodes.length);
 if(!model.geometry){const warning=document.createElement('p');warning.className='geometry-warning';warning.textContent='Geometria indisponível ('+model.failure+'). Tente outro percurso ou orientação. Nenhum encaixe artificial foi desenhado.';table.append(warning);return}
 for(const node of model.nodes){const el=tileEl({...node.official,a:node.printed[0],b:node.printed[1]},node.tileId===previewId?'ghost':'');el.disabled=true;const p=node.shape;el.style.left=p.center.x+'px';el.style.top=p.center.y+'px';el.style.width=p.width+'px';el.style.height=p.height+'px';el.style.transform=`translate(-50%,-50%) rotate(${p.angle}deg)`;el.style.fontSize=Math.min(22,p.height*.72)+'px';el.dataset.order=String(node.order);table.append(el)}
 for(const side of ['left','right']){
  const point=model.geometry.endpoints[side],b=document.createElement('button');b.className='endpoint';b.dataset.side=side;b.textContent=side==='left'?'A':'B';b.setAttribute('aria-label','Jogar na ponta '+(side==='left'?'A':'B'));b.style.left=point.x+'px';b.style.top=point.y+'px';b.style.width=b.style.height=b.style.minHeight=(44/scale)+'px';b.style.fontSize=(16/scale)+'px';b.disabled=previewId!==null||game.state.turn!==0||game.interaction.selectedTile===null||!validSides(game.state,0,game.interaction.selectedTile).includes(side);
  b.onclick=()=>{if(game.interaction.tapEndpoint(side))afterAction();else $('message').textContent='Essa pedra não tem encaixe físico validado nessa ponta.'};table.append(b);
 }
}
function sync(){
 if(offlineStarted&&!offlineSaveBlocked){const saved=writeOffline(offlineStorage,game,routeStyle,offlineName);document.body.dataset.offlineSave=saved?'saved':'unavailable'}
 if(handDrag)cancelGesture();
 game.layoutOptions={fixedScale:true,maxMillis:200,maxNodes:18000};
 const prior=rect();if(!prior){$('table').dataset.layout='waiting';return} $('table').dataset.layout='ready';game.setRouteStyle(routeStyle);game.resize(prior,'horizontal');
 const s=game.state,human=s.players[0];
 paintTableScreen({difficulty:game.difficulty,target:s.target,deal:s.dealSize,sleeping:s.sleeping.length,remaining:28-s.chain.length,opponents:s.players.slice(1).map(p=>({seat:p.seat,name:PLAYER_NAMES[p.seat],count:p.hand.length}))});
 $('scores').replaceChildren(...s.players.map(p=>{const e=document.createElement('span');e.className='seat'+(s.turn===p.seat?' active':'');e.dataset.seat=String(p.seat);if(s.turn===p.seat)e.setAttribute('aria-current','true');e.setAttribute('aria-label',p.seat===0?'Seu placar':`Placar de ${PLAYER_NAMES[p.seat]}`);const label=document.createElement('span');label.textContent=`${p.seat===0?offlineName:PLAYER_NAMES[p.seat]}\n${p.score-s.target} ${p.seat===0?'pontos':'pts'}`;if(p.seat!==0){const count=document.createElement('small');count.className='seat-hand-count';count.textContent=p.hand.length+' peças';label.append(count)}e.append(label);e.dataset.handCount=String(p.hand.length);const avatar=document.createElement('span');avatar.className='avatar-slot';avatar.dataset.avatarSeat=String(p.seat);avatar.textContent=p.seat===0?offlineName:PLAYER_NAMES[p.seat][0];e.append(avatar);return e}));
 tableUI.placeHuman($('scores').querySelector('[data-seat="0"]'));
 window.dispatchEvent?.(new Event('domino-tour:participants-rendered'));
 const view=reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight);
 game.interaction.updateGeometry(view.geometry??game.geometry());
 game.interaction.resolver=(id,side)=>{
  const preview=game.preview(id,side);if(!preview)return null;
  const model=reflowChain(preview.model,tableSpace,$('table').clientWidth,$('table').clientHeight),node=model.nodes.find(n=>n.tileId===id);
  return {...preview,model,center:node.shape.center,shape:node.shape,printed:node.printed};
 };
 drawBoard(view);
 const hand=$('hand');hand.replaceChildren();
 for(const tile of game.orderedHand()){
  const b=tileEl(tile,'inhand'+(game.interaction.selectedTile===tile.id?' selected':'')+(validSides(s,0,tile.id).length?' playable':' unavailable'),game.handLayout.flipped[tile.id]);b.setAttribute('aria-pressed',String(game.interaction.selectedTile===tile.id));b.disabled=s.phase!=='playing';b.setAttribute('aria-keyshortcuts','Alt+ArrowLeft Alt+ArrowRight R');b.title='Arraste na mão para organizar. R gira; Alt + setas move.';
  let secondTapCandidate=false;
  b.addEventListener('pointerdown',e=>{
   secondTapCandidate=false;
   if(gestureBlocked||s.phase!=='playing')return;
   if(dragId!==null){cancelGesture();drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight));return}
   if(e.button!==0||!e.isPrimary)return;
   secondTapCandidate=game.interaction.selectedTile===tile.id;
   game.interaction.cancel();
   handDrag={state:s,round:s.roundsCompleted,pointerId:e.pointerId,tileId:tile.id,start:pointerFrame(e),tableStart:coords(e),tableStarted:false,flipped:game.handLayout.flipped[tile.id]};
   dragId=e.pointerId;origin=coords(e);dragMoved=false;b.setPointerCapture(e.pointerId);
  });
  b.addEventListener('pointermove',e=>{
   if(dragId!==e.pointerId||!handDrag)return;
   if(handDrag.state!==game.state||handDrag.round!==game.state.roundsCompleted){cancelGesture();return}
   const point=pointerFrame(e);if(Math.hypot(point.x-handDrag.start.x,point.y-handDrag.start.y)>=8)dragMoved=true;
   if(!dragMoved)return;
   followPointer(e,tile,b);
   if(previewRackDrop(e,tile,b)){
    if(handDrag.tableStarted){game.interaction.cancel();handDrag.tableStarted=false}
    if(ghost!==null){ghost=null;drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))}return;
   }
   if(!within(point,frameRect($('table')))){if(ghost!==null){ghost=null;drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))}return}
   if(!handDrag.tableStarted)handDrag.tableStarted=Boolean(game.interaction.begin(e.pointerId,tile.id,handDrag.tableStart));
   if(!handDrag.tableStarted)return;
   const preview=game.interaction.preview(tile.id,coords(e));
   if(preview?.model){ghost=preview.tileId;drawBoard(preview.model,ghost)}else if(ghost!==null){ghost=null;drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))}
  });
  b.addEventListener('pointerup',e=>{
   if(dragId!==e.pointerId||!handDrag)return;
   const active=handDrag,point=pointerFrame(e),wasDragging=dragMoved||Math.hypot(point.x-active.start.x,point.y-active.start.y)>=8;
   if(active.state!==game.state||active.round!==game.state.roundsCompleted||gestureBlocked){cancelGesture();sync();return}
   const plan=wasDragging?handDropPlan(e,tile.id):null;
   if(plan){
    cancelGesture();game.moveHandTile(tile.id,plan.beforeId,plan.neighborId);sync();return;
   }
   let committed=false;
   if(wasDragging&&within(point,frameRect($('table')))){
    if(!active.tableStarted)active.tableStarted=Boolean(game.interaction.begin(e.pointerId,tile.id,active.tableStart));
    committed=active.tableStarted&&game.interaction.move(e.pointerId,coords(e))?.committed===true;
   }
   handDrag=null;clearDragVisual();dragId=null;origin=null;dragMoved=false;ghost=null;
   if(committed){afterAction();return}
   game.interaction.end(e.pointerId);
   if(!wasDragging){
    const sides=validSides(s,0,tile.id);
    if(secondTapCandidate&&sides.length===1){game.interaction.select(tile.id);if(game.interaction.tapEndpoint(sides[0])){secondTapCandidate=false;afterAction();return}}
    game.interaction.select(tile.id);
   }else game.interaction.cancel();
   secondTapCandidate=false;sync();
  });
  b.addEventListener('pointercancel',e=>{if(dragId!==e.pointerId)return;cancelGesture();sync()});
  b.addEventListener('lostpointercapture',e=>{if(dragId===e.pointerId){cancelGesture();sync()}});
  b.addEventListener('keydown',e=>{
   if(e.altKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
    e.preventDefault();cancelGesture();const order=game.orderedHand(),i=order.findIndex(t=>t.id===tile.id),destination=i+(e.key==='ArrowLeft'?-1:1);
    if(destination>=0&&destination<order.length){const before=e.key==='ArrowLeft'?order[destination].id:order[destination+1]?.id??null;game.moveHandTile(tile.id,before,order[destination].id);sync();[...$('hand').children].find(el=>Number(el.dataset.tileId)===tile.id)?.focus?.()}return;
   }
   if(e.key.toLowerCase()==='r'){e.preventDefault();cancelGesture();game.flipHandTile(tile.id);sync();return}
   if(e.key==='Enter'||e.key===' '){e.preventDefault();const wasSelected=game.interaction.selectedTile===tile.id;const sides=validSides(s,0,tile.id);if(wasSelected&&sides.length===1&&game.interaction.tapEndpoint(sides[0])){afterAction();return}game.interaction.select(tile.id);sync()}
  });
  hand.append(b);
 }
 $('next-round').hidden=s.phase!=='round-complete';
 $('play-again').hidden=s.phase!=='finished';
 $('message').textContent=game.model.status==='unavailable'?'Mesa não desenhada: '+game.model.failure:s.phase==='round-complete'?'Rodada encerrada! Vencedor: '+(s.nextOpeningSeat===0?'Você':PLAYER_NAMES[s.nextOpeningSeat])+'. Pontuação atualizada. Toque em Próxima rodada para continuar.':s.phase==='finished'?'Partida encerrada. Vencedor: '+(s.winner===0?'Você':PLAYER_NAMES[s.winner]):s.phase==='blocked-awaiting-rule'?'Rodada bloqueada: regra da V0.21 preservada.':s.turn===0?(game.interaction.selectedTile!==null?(validSides(s,0,game.interaction.selectedTile).length===1?'Toque novamente para jogar.':'Escolha uma ponta iluminada.'):'Sua vez de jogar!'):`${PLAYER_NAMES[s.turn]} pensando…`;
 updateClock();
 queueMicrotask(showCompleted);
 if(offlineStarted&&document.body.dataset.offlineSave==='unavailable')$('message').textContent+=' · Não foi possível salvar neste navegador.';
}
// Capture phase sees a second pointer even outside the rack/first captured element.
document.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1){gestureBlocked=true;cancelGesture();drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))}},true);
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{activePointers.delete(e.pointerId);if(!activePointers.size)gestureBlocked=false});
window.addEventListener('blur',()=>{cancelGesture();activePointers.clear();gestureBlocked=false;drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))});
document.addEventListener('visibilitychange',()=>{if(document.hidden){turnClock.pause();stopBotSequence();cancelGesture();activePointers.clear();gestureBlocked=false;drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))}else{if(!rotationSuspended&&!decisionKind)turnClock.resume();sync();scheduleBots()}});
function afterAction(){clearDragVisual();dragId=null;origin=null;ghost=null;sync();scheduleBots()}
$('organize').onclick=()=>{
 if(!tableActive||decisionKind||game.state.phase!=='playing')return;
 cancelGesture();const ordered=[...game.state.players[0].hand].sort((a,b)=>a.a-b.a||a.b-b.b);
 game.handLayout={version:1,order:ordered.map(t=>t.id),flipped:Object.fromEntries(ordered.map(t=>[t.id,false]))};sync();
};
$('difficulty').onchange=()=>{game.setDifficulty($('difficulty').value);$('entry-difficulty').value=game.difficulty;sync()};
$('entry-difficulty').onchange=()=>{game.setDifficulty($('entry-difficulty').value);$('difficulty').value=game.difficulty};
$('next-round').onclick=()=>{if(game.state.phase!=='round-complete')return;stopBotSequence();cancelGesture();if(game.nextRound()){sync();scheduleBots()}};
$('play-again').onclick=()=>{if(game.state.phase!=='finished')return;stopBotSequence();cancelGesture();game.newMatch();sync();scheduleBots()};
$('restart').onclick=()=>askLeave('new');
$('route').onchange=()=>{cancelGesture();routeStyle=$('route').value==='random'?chooseRoute(secureIndex):$('route').value;sync()};
$('zoom').onclick=()=>{cancelGesture();zoom=zoom>=8?1:Math.min(8,zoom*2);pan={x:0,y:0};drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))};
$('fit').onclick=()=>{cancelGesture();zoom=1;pan={x:0,y:0};drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))};
$('table').addEventListener('pointerdown',e=>{if(zoom===1||e.target.closest('button')||!e.isPrimary||gestureBlocked)return;const r=$('app').getBoundingClientRect();panStart={id:e.pointerId,point:portraitPoint({x:e.clientX,y:e.clientY},r,viewportScale),pan:{...pan}};$('table').setPointerCapture(e.pointerId)});
$('table').addEventListener('pointermove',e=>{if(!panStart||panStart.id!==e.pointerId)return;if(gestureBlocked){panStart=null;return}const p=portraitPoint({x:e.clientX,y:e.clientY},$('app').getBoundingClientRect(),viewportScale);pan={x:panStart.pan.x+p.x-panStart.point.x,y:panStart.pan.y+p.y-panStart.point.y};drawBoard(reflowChain(game.model,tableSpace,$('table').clientWidth,$('table').clientHeight))});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('table').addEventListener(type,()=>{panStart=null});
$('fullscreen').onclick=toggleTableFullscreen;
window.addEventListener('fullscreenchange',queueViewport);
for(const id of ['target','deal']){$(id).disabled=true;$(id).title='Definido antes da partida. Volte ao menu para mudar.'}
$('settings').onclick=()=>{const panel=$('settings-panel');panel.hidden=!panel.hidden;$('settings').setAttribute('aria-expanded',String(!panel.hidden))};
// All resize sources share one RAF queue; frame, geometry and controls commit before paint.
let viewportFrame=null,viewportDirty=true,measuredSize='';
function queueViewport(){viewportDirty=true;if(viewportFrame===null)viewportFrame=requestAnimationFrame(flushViewport)}
function flushViewport(){
 viewportFrame=null;
 syncPortraitOrientation();
 if(document.hidden)return;
 if(viewportDirty){viewportDirty=false;if(fitViewport())measuredSize=''}
 const size=$('table').clientWidth+':'+$('table').clientHeight;
 if(size!==measuredSize){measuredSize=size;cancelGesture();sync()}
}
window.addEventListener('resize',queueViewport);
window.visualViewport?.addEventListener('resize',queueViewport);
window.visualViewport?.addEventListener('scroll',queueViewport);
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Sair da tela cheia':'Tela cheia';queueViewport()});
const layoutObserver=new ResizeObserver(queueViewport);
layoutObserver.observe(document.documentElement);layoutObserver.observe($('table'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueViewport()});
window.addEventListener('domino-tour:offline-options',e=>{
 if($('entry-flow').hidden||$('entry-flow').dataset.step!=='2')return;
 const o=e.detail;if(!o||!['easy','medium','hard'].includes(o.difficulty)||![6,7].includes(o.deal))return;
 const target=o.target??100;if(![100,200].includes(target)||o.mode&&o.mode!=='offline')return;
 if(o.guest&&(!['green','red','blue','wood','purple'].includes(o.tableStyle)||o.resume))return;
 if(!o.resume){stopBotSequence();cancelGesture();game=new LocalSession(target,o.deal,o.difficulty);game.layoutOptions={fixedScale:true};routeStyle='classic';turnClock.stop();completedKey=null}
 offlineName=String(o.name).slice(0,24);$('target').value=String(game.state.target);$('difficulty').value=game.difficulty;$('entry-difficulty').value=game.difficulty;$('deal').value=String(game.state.dealSize);o.accepted=true;
});
window.addEventListener('domino-tour:enter-game',()=>{tableActive=true;offlineStarted=true;completedKey=null;turnClock.stop();syncPortraitOrientation();sync();scheduleBots();queueViewport()});
window.addEventListener('pagehide',()=>{if(offlineStarted&&!offlineSaveBlocked)writeOffline(offlineStorage,game,routeStyle,offlineName)});

function updateClock(){
 const active=tableActive&&game.state.phase==='playing'&&game.state.turn===0;
 if(active){turnClock.start(game.state.roundsCompleted+':'+game.state.events.length);if(rotationSuspended)turnClock.pause()}else turnClock.stop();
 const seconds=turnClock.remaining(),el=$('turn-clock');el.hidden=!active;
 el.querySelector('strong').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 el.querySelector('meter').value=seconds;el.dataset.warning=String(active&&seconds<=10);
 el.querySelector('small').textContent=seconds<=10?'Tempo acabando!':'Jogada automática ao zerar';
}
setInterval(()=>{
 if(!tableActive||rotationSuspended||document.hidden||decisionKind)return;
 updateClock();
 if(!turnClock.claimExpiry())return;
 cancelGesture();
 for(const tile of legalTiles(game.state,0))for(const side of validSides(game.state,0,tile.id)){
  if(game.humanPlay(tile.id,side)){afterAction();return}
 }
 // No legal move is a normal automatic pass; no extra timeout penalty.
 if(!legalTiles(game.state,0).length){scheduleBots();return}
 $('message').textContent='Não foi possível encaixar a jogada automática. Escolha uma ponta válida.';
},200);
function decide(kind,title,message,choices){
 decisionKind=kind;stopBotSequence();cancelGesture();turnClock.pause();
 const d=tableUI.decision;d.querySelector('h2').textContent=title;d.querySelector('p').textContent=message;
 d.querySelector('.decision-actions').replaceChildren(...choices.map(([label,run])=>{
  const b=document.createElement('button');b.textContent=label;b.onclick=()=>{d.close();decisionKind=null;turnClock.resume();run()};return b;
 }));
 if(!d.open)d.showModal();
}
function keepPlaying(){sync();scheduleBots()}
function askLeave(destination='menu'){
 if(!tableActive)return;
 const inProgress=game.state.phase!=='finished';
 decide('leave',inProgress?'Abandonar a partida?':'Sair da mesa?',inProgress?'Ao sair, você perde esta partida. Seu perfil e avatar serão preservados.':'Escolha o próximo passo.',
 [['Continuar na mesa',keepPlaying],[destination==='new'?'Abandonar e iniciar outra':'Sair e voltar ao menu',()=>destination==='new'?newMatch():leaveTable()]]);
}
function newMatch(){
 stopBotSequence();cancelGesture();turnClock.stop();completedKey=null;
 game.newMatch();game.layoutOptions={fixedScale:true};sync();scheduleBots();
}
async function leaveTable(){
 tableUI.decision.classList.remove('premium-result');
 for(const old of tableUI.decision.querySelectorAll('.result-trophy,.result-ranking,.result-rewards-note'))old.remove();
 tableActive=false;rotationSuspended=false;rotationNotice.hidden=true;offlineStarted=false;stopBotSequence();cancelGesture();turnClock.stop();tableUI.clearMessages();completedKey=null;
 try{offlineStorage?.removeItem(SAVE_KEY);document.body.dataset.offlineSave='cleared'}catch{offlineSaveBlocked=true;document.body.dataset.offlineSave='unavailable'}
 // Only this unfinished match is discarded. Profile, avatar and other data remain.
 try{if(document.fullscreenElement)await document.exitFullscreen()}catch{}
 screen.orientation?.unlock?.();
 $('app').inert=true;
 window.dispatchEvent(new Event('domino-tour:return-menu'));
}
function showCompleted(){
 if(!tableActive||decisionKind||!['round-complete','finished'].includes(game.state.phase))return;
 const s=game.state,key=s.phase+':'+s.roundsCompleted;
 if(completedKey===key)return;completedKey=key;
 const finished=s.phase==='finished';
 const winner=finished?s.winner:s.nextOpeningSeat;
 const winnerName=winner===0?offlineName:PLAYER_NAMES[winner];
 const scores=s.players.map(p=>({seat:p.seat,name:p.seat===0?offlineName:PLAYER_NAMES[p.seat],score:p.score-s.target}));
 const ranking=[...scores].sort((a,b)=>b.score-a.score||a.seat-b.seat);
 const choices=[];
 if(!finished)choices.push(['Próxima rodada',()=>{if(game.nextRound()){turnClock.stop();sync();scheduleBots()}}]);
 choices.push(['Jogar novamente',()=>{if(finished)newMatch();else askLeave('new')}],['Voltar ao menu',()=>{if(finished)void leaveTable();else askLeave()}]);
 decide('result',finished?'Resultado da Partida':'Resultado da Rodada',
  (winner===0?(finished?'Vitória! Você venceu a partida!':'Você venceu esta rodada!'):(finished?'Vencedor da partida: ':'Vencedor da rodada: ')+winnerName),choices);
 const d=tableUI.decision;
 // A reused result dialog must contain exactly one trophy, ranking and note.
 for(const old of d.querySelectorAll('.result-trophy,.result-ranking,.result-rewards-note'))old.remove();
 d.classList.add('premium-result');
 const p=d.querySelector('p');
 const trophy=document.createElement('div');trophy.className='result-trophy';trophy.setAttribute('aria-hidden','true');trophy.textContent=finished?'🏆':'🎲';
 const table=document.createElement('table');table.className='result-ranking';
 const caption=document.createElement('caption');caption.textContent=finished?'Classificação final':'Pontuação após a rodada';
 table.append(caption);
 const head=document.createElement('thead'),hr=document.createElement('tr');
 for(const label of ['Posição','Jogador','Pontos']){const th=document.createElement('th');th.textContent=label;hr.append(th)}head.append(hr);table.append(head);
 const body=document.createElement('tbody');
 ranking.forEach((player,index)=>{const row=document.createElement('tr');if(player.seat===winner)row.className='result-winner';
  for(const value of [String(index+1)+'º',player.name,String(player.score)]){const cell=document.createElement('td');if(value===player.name&&cell.cellIndex===-1&&row.children.length===1){const portrait=document.createElement('span');portrait.className='result-avatar';portrait.dataset.avatarSeat=String(player.seat);portrait.setAttribute('aria-hidden','true');cell.append(portrait,document.createTextNode(value))}else cell.textContent=value;row.append(cell)}body.append(row)});
 table.append(body);
 const note=document.createElement('p');note.className='result-rewards-note';note.textContent='Recompensas: serão exibidas quando confirmadas pelo sistema de progressão.';
 p.after(trophy,table,note);
 window.dispatchEvent(new Event('domino-tour:participants-rendered'));
 d.addEventListener('close',()=>{d.classList.remove('premium-result');trophy.remove();table.remove();note.remove()},{once:true});
}
tableUI.decision.addEventListener('cancel',e=>{e.preventDefault();if(decisionKind==='leave'){tableUI.decision.close();decisionKind=null;turnClock.resume();keepPlaying()}});
$('leave-table').onclick=()=>askLeave();
window.addEventListener('domino-tour:return-menu',()=>{queueViewport()});
$('difficulty').value=game.difficulty;$('entry-difficulty').value=game.difficulty;$('target').value=String(game.state.target);$('deal').value=String(game.state.dealSize);
fitViewport();sync();scheduleBots();queueViewport();
