import {landscapeViewport,framePoint,fittedTableSpace,tablePoint} from '../dist/src/viewport.js';
import {LocalSession} from '../dist/src/session.js';
import {validSides,chooseRoute} from '../dist/src/table.js';
import {legalTiles,secureIndex} from '../dist/src/engine.js';
const $=id=>document.getElementById(id);
let game=new LocalSession();let routeStyle=chooseRoute(secureIndex);
let dragId=null,origin=null,dragMoved=false,ghost=null,floatingTile=null;const activePointers=new Set();let gestureBlocked=false;
let rotated=false,zoom=1,pan={x:0,y:0},panStart=null;
let tableSpace={width:800,height:430,scale:1},viewportSignature='',orientationPending=false;
let botTimer=null,botEpoch=0,passNoticeTimer=null,passNoticeEpoch=0;
function clearPassNotice(){passNoticeEpoch++;if(passNoticeTimer!==null){clearTimeout(passNoticeTimer);passNoticeTimer=null}$('pass-notice').hidden=true}
function stopBotSequence(){botEpoch++;if(botTimer!==null){clearTimeout(botTimer);botTimer=null}clearPassNotice()}
function showPassNotice(seat){
 clearPassNotice();const notice=$('pass-notice');notice.textContent=seat===0?'VOCÊ PASSOU! −5 pontos':`ROBÔ ${seat} PASSOU! −5 pontos`;notice.hidden=false;
 const epoch=passNoticeEpoch;passNoticeTimer=setTimeout(()=>{if(epoch!==passNoticeEpoch)return;passNoticeTimer=null;notice.hidden=true;scheduleBots()},2000);
}
function scheduleBots(){
 if(botTimer!==null){clearTimeout(botTimer);botTimer=null}botEpoch++;
 if(document.hidden||$('entry-flow')?.hidden===false||game.state.phase!=='playing'||passNoticeTimer!==null)return;
 const epoch=botEpoch,seat=game.state.turn;
 if(seat===0){
  if(game.state.lastPlayed!==null&&legalTiles(game.state,0).length===0){
   botTimer=setTimeout(()=>{if(epoch!==botEpoch||document.hidden||game.state.phase!=='playing'||game.state.turn!==0)return;botTimer=null;const before=game.state.events.length;if(game.humanPass()){sync();const ev=game.state.events.slice(before).find(e=>e.type==='pass'&&e.seat===0);if(ev)showPassNotice(0);else scheduleBots()}},0);
  }
  return;
 }
 botTimer=setTimeout(()=>{
  if(epoch!==botEpoch||document.hidden||game.state.phase!=='playing'||game.state.turn!==seat)return;
  botTimer=null;const before=game.state.events.length;game.advanceBots(1);sync();
  const ev=game.state.events.slice(before).find(e=>e.type==='pass');
  if(ev)showPassNotice(ev.seat);else scheduleBots();
 },3000);
}
function coords(e){const r=$('app').getBoundingClientRect(),p=framePoint({x:e.clientX,y:e.clientY},r,rotated);const x=p.x-$('table').offsetLeft-$('table').parentElement.offsetLeft-$('table').clientLeft,y=p.y-$('table').offsetTop-$('table').parentElement.offsetTop-$('table').clientTop;return tablePoint({x,y},{width:$('table').clientWidth,height:$('table').clientHeight},tableSpace,zoom,pan)}
function fitViewport(){
 const probe=getComputedStyle($('safe-probe')),insets={top:parseFloat(probe.paddingTop),right:parseFloat(probe.paddingRight),bottom:parseFloat(probe.paddingBottom),left:parseFloat(probe.paddingLeft)};
 const visible=window.visualViewport;const v=landscapeViewport(visible?.width??document.documentElement.clientWidth,visible?.height??window.innerHeight,insets);const signature=JSON.stringify([v,visible?.offsetLeft??0,visible?.offsetTop??0]);if(signature===viewportSignature)return false;viewportSignature=signature;cancelGesture();zoom=1;pan={x:0,y:0};rotated=v.rotated;
 const app=$('app');app.style.width=v.width+'px';app.style.height=v.height+'px';app.style.left=(v.left+(visible?.offsetLeft??0))+'px';app.style.top=(v.top+(visible?.offsetTop??0))+'px';app.style.transform=rotated?'translateX('+v.height+'px) rotate(90deg)':'none';app.dataset.rotated=String(rotated);app.dataset.compact=String(v.height<500);app.dataset.dense=String(v.height<500);$('fullscreen').textContent=v.height<500?'⛶':'Tela cheia';app.style.setProperty('--gutter',Math.max(6,(v.width-1440)/2)+'px');return true;
}
// Entry attempts orientation immediately; fullscreen is requested only with user activation.
async function lockLandscape(gesture=false){
 if(orientationPending)return;orientationPending=true;
 try{
  if(gesture&&!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
  if(!screen.orientation?.lock)throw new Error('Orientation lock unavailable');
  await screen.orientation.lock('landscape');$('app').dataset.orientationLock='native';
 }catch{$('app').dataset.orientationLock='visual-fallback'}
 finally{orientationPending=false;queueViewport()}
}
function rect(){const physical={width:$('table').clientWidth,height:$('table').clientHeight};const fitted=fittedTableSpace(physical.width,physical.height);if(!fitted)return null;tableSpace=fitted;return {x:0,y:0,width:fitted.width,height:fitted.height}}
function clearDragVisual(){floatingTile?.remove?.();floatingTile=null}
function followPointer(e,tile,source){if(!floatingTile){floatingTile=tileEl(tile,'drag-floating');floatingTile.setAttribute('aria-hidden','true');floatingTile.style.width=(source.offsetWidth||88)+'px';floatingTile.style.height=(source.offsetHeight||44)+'px';$('app').append(floatingTile)}const p=framePoint({x:e.clientX,y:e.clientY},$('app').getBoundingClientRect(),rotated);floatingTile.style.left=p.x+'px';floatingTile.style.top=p.y+'px'}
function cancelGesture(){clearDragVisual();game.interaction.cancel();dragId=null;origin=null;dragMoved=false;ghost=null;panStart=null}
function tileEl(tile,css=''){const b=document.createElement('button');b.className='piece '+css;b.dataset.tileId=tile.id;b.innerHTML=`<span>${tile.a}</span><span class="divider"></span><span>${tile.b}</span>`;b.setAttribute('aria-label',`Pedra ${tile.a} e ${tile.b}`);return b}
function drawBoard(model,previewId=null){
 const surface=$('table');surface.replaceChildren();const table=document.createElement('div');table.className='board-layer';const scale=zoom*tableSpace.scale;table.style.width=tableSpace.width+'px';table.style.height=tableSpace.height+'px';table.style.transformOrigin='0 0';table.style.transform=`translate(${$('table').clientWidth/2+pan.x-tableSpace.width*scale/2}px,${$('table').clientHeight/2+pan.y-tableSpace.height*scale/2}px) scale(${scale})`;surface.append(table);
 surface.dataset.geometry=model.status;surface.dataset.nodes=String(model.nodes.length);
 if(!model.geometry){const warning=document.createElement('p');warning.className='geometry-warning';warning.textContent='Geometria indisponível ('+model.failure+'). Tente outro percurso ou orientação. Nenhum encaixe artificial foi desenhado.';table.append(warning);return}
 for(const node of model.nodes){const el=tileEl({...node.official,a:node.printed[0],b:node.printed[1]},node.tileId===previewId?'ghost':'');el.disabled=true;const p=node.shape;el.style.left=p.center.x+'px';el.style.top=p.center.y+'px';el.style.width=p.width+'px';el.style.height=p.height+'px';el.style.transform=`translate(-50%,-50%) rotate(${p.angle}deg)`;el.style.fontSize=Math.min(22,p.height*.72)+'px';el.dataset.order=String(node.order);table.append(el)}
 for(const side of ['left','right']){
  const point=model.geometry.endpoints[side],b=document.createElement('button');b.className='endpoint';b.dataset.side=side;b.textContent=side==='left'?'←':'→';b.setAttribute('aria-label','Jogar na ponta '+(side==='left'?'esquerda':'direita'));b.style.left=point.x+'px';b.style.top=point.y+'px';b.disabled=previewId!==null||game.state.turn!==0||game.interaction.selectedTile===null||!validSides(game.state,0,game.interaction.selectedTile).includes(side);
  b.onclick=()=>{if(game.interaction.tapEndpoint(side))afterAction();else $('message').textContent='Essa pedra não tem encaixe físico validado nessa ponta.'};table.append(b);
 }
}
function sync(){
 const prior=rect();if(!prior){$('table').dataset.layout='waiting';return} $('table').dataset.layout='ready';game.setRouteStyle(routeStyle);game.resize(prior,'horizontal');
 const s=game.state,human=s.players[0];
 $('scores').replaceChildren(...s.players.map(p=>{const e=document.createElement('span');e.className='seat'+(s.turn===p.seat?' active':'');e.textContent=`${p.seat===0?'Você':`Robô ${p.seat}`} · ${p.score} pts · ${p.hand.length} pedras`;return e}));
 drawBoard(game.model);
 const hand=$('hand');hand.replaceChildren();
 for(const tile of human.hand){
  const b=tileEl(tile,'inhand'+(game.interaction.selectedTile===tile.id?' selected':'')+(validSides(s,0,tile.id).length?' playable':' unavailable'));b.setAttribute('aria-pressed',String(game.interaction.selectedTile===tile.id));b.disabled=s.turn!==0||s.phase!=='playing'||game.model.status==='unavailable'||validSides(s,0,tile.id).length===0;
  let secondTapCandidate=false;
  b.addEventListener('pointerdown',e=>{
   secondTapCandidate=false;
   if(gestureBlocked)return;
   if(dragId!==null){cancelGesture();drawBoard(game.model);return}
   if(e.button!==0||!e.isPrimary)return;
   secondTapCandidate=game.interaction.selectedTile===tile.id;
   if(!game.interaction.begin(e.pointerId,tile.id,coords(e)))return;
   dragId=e.pointerId;origin=coords(e);dragMoved=false;b.setPointerCapture(e.pointerId);
  });
  b.addEventListener('pointermove',e=>{
   if(dragId!==e.pointerId)return;
   const pos=coords(e);if(origin&&Math.hypot(pos.x-origin.x,pos.y-origin.y)>=8)dragMoved=true;
   if(!dragMoved)return;
   followPointer(e,tile,b);
   // Movement previews only. Release is the sole pointer commit boundary.
   const preview=game.interaction.preview(tile.id,pos);
   if(preview?.model){ghost=preview.tileId;drawBoard(preview.model,ghost)}else if(ghost!==null){ghost=null;drawBoard(game.model)}
  });
  b.addEventListener('pointerup',e=>{if(dragId!==e.pointerId)return;clearDragVisual();const wasDragging=dragMoved;const result=wasDragging?game.interaction.move(e.pointerId,coords(e)):null;if(result?.committed){dragId=null;origin=null;ghost=null;afterAction();return}game.interaction.end(e.pointerId);if(!wasDragging&&!gestureBlocked&&secondTapCandidate){const sides=validSides(game.state,0,tile.id);if(sides.length===1&&game.interaction.tapEndpoint(sides[0])){dragId=null;origin=null;ghost=null;secondTapCandidate=false;afterAction();return}}if(wasDragging&&!gestureBlocked){game.interaction.select(tile.id)}secondTapCandidate=false;dragId=null;origin=null;dragMoved=false;ghost=null;sync();if(wasDragging&&game.interaction.selectedTile===tile.id)$('message').textContent='Pedra selecionada. Toque em uma das pontas destacadas para encaixar.'});
  b.addEventListener('pointercancel',e=>{if(dragId!==e.pointerId)return;cancelGesture();sync()});
  b.addEventListener('lostpointercapture',e=>{if(dragId===e.pointerId){cancelGesture();sync()}});
  b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const wasSelected=game.interaction.selectedTile===tile.id;const sides=validSides(game.state,0,tile.id);if(wasSelected&&sides.length===1&&game.interaction.tapEndpoint(sides[0])){afterAction();return}game.interaction.select(tile.id);sync()}});
  hand.append(b);
 }
 $('next-round').hidden=s.phase!=='round-complete';
 $('play-again').hidden=s.phase!=='finished';
 $('message').textContent=game.model.status==='unavailable'?'Mesa não desenhada: '+game.model.failure:s.phase==='round-complete'?'Rodada encerrada! Vencedor: '+(s.nextOpeningSeat===0?'Você':`Robô ${s.nextOpeningSeat}`)+'. Pontuação atualizada. Toque em Próxima rodada para continuar.':s.phase==='finished'?'Partida encerrada. Vencedor: '+(s.winner===0?'Você':`Robô ${s.winner}`):s.phase==='blocked-awaiting-rule'?'Rodada bloqueada: regra da V0.21 preservada.':s.turn===0?(game.interaction.selectedTile!==null?(validSides(s,0,game.interaction.selectedTile).length===1?'Uma ponta disponível: toque novamente na pedra para jogar.':'Duas pontas disponíveis: escolha uma ponta iluminada.'):'Sua vez! Selecione uma pedra e uma ponta.'):`Robô ${s.turn} pensando... (3 segundos por jogada)`;
}
// Capture phase sees a second pointer even outside the rack/first captured element.
document.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1){gestureBlocked=true;cancelGesture();drawBoard(game.model)}},true);
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{activePointers.delete(e.pointerId);if(!activePointers.size)gestureBlocked=false});
window.addEventListener('blur',()=>{cancelGesture();activePointers.clear();gestureBlocked=false;drawBoard(game.model)});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBotSequence();cancelGesture();activePointers.clear();gestureBlocked=false;drawBoard(game.model)}else{sync();scheduleBots()}});
function afterAction(){clearDragVisual();dragId=null;origin=null;ghost=null;sync();scheduleBots()}
$('next-round').onclick=()=>{if(game.state.phase!=='round-complete')return;stopBotSequence();cancelGesture();if(game.nextRound()){sync();scheduleBots()}};
$('play-again').onclick=()=>{if(game.state.phase!=='finished')return;stopBotSequence();cancelGesture();game.newMatch();sync();scheduleBots()};
$('restart').onclick=()=>{stopBotSequence();cancelGesture();game=new LocalSession(Number($('target').value),Number($('deal').value));routeStyle=$('route').value==='random'?chooseRoute(secureIndex):$('route').value;sync();scheduleBots()};
$('route').onchange=()=>{cancelGesture();routeStyle=$('route').value==='random'?chooseRoute(secureIndex):$('route').value;sync()};
$('zoom').onclick=()=>{cancelGesture();zoom=zoom>=8?1:Math.min(8,zoom*2);pan={x:0,y:0};drawBoard(game.model)};
$('fit').onclick=()=>{cancelGesture();zoom=1;pan={x:0,y:0};drawBoard(game.model)};
$('table').addEventListener('pointerdown',e=>{if(zoom===1||e.target.closest('button')||!e.isPrimary||gestureBlocked)return;const r=$('app').getBoundingClientRect();panStart={id:e.pointerId,point:framePoint({x:e.clientX,y:e.clientY},r,rotated),pan:{...pan}};$('table').setPointerCapture(e.pointerId)});
$('table').addEventListener('pointermove',e=>{if(!panStart||panStart.id!==e.pointerId)return;if(gestureBlocked){panStart=null;return}const p=framePoint({x:e.clientX,y:e.clientY},$('app').getBoundingClientRect(),rotated);pan={x:panStart.pan.x+p.x-panStart.point.x,y:panStart.pan.y+p.y-panStart.point.y};drawBoard(game.model)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('table').addEventListener(type,()=>{panStart=null});
$('fullscreen').onclick=()=>lockLandscape(true);
// Touch transient activation is granted on pointerup, unlike mouse pointerdown.
document.addEventListener('pointerup',e=>{if(e.isTrusted&&$('app').dataset.orientationLock!=='native')void lockLandscape(true)},{capture:true,once:true});
$('settings').onclick=()=>{const panel=$('settings-panel');panel.hidden=!panel.hidden;$('settings').setAttribute('aria-expanded',String(!panel.hidden))};
// All resize sources share one RAF queue; frame, geometry and controls commit before paint.
let viewportFrame=null,viewportDirty=true,measuredSize='';
function queueViewport(){viewportDirty=true;if(viewportFrame===null)viewportFrame=requestAnimationFrame(flushViewport)}
function flushViewport(){
 viewportFrame=null;
 if(document.hidden)return;
 if(viewportDirty){viewportDirty=false;if(fitViewport())measuredSize=''}
 const size=$('table').clientWidth+':'+$('table').clientHeight;
 if(size!==measuredSize){measuredSize=size;cancelGesture();sync()}
}
window.addEventListener('resize',queueViewport);
window.visualViewport?.addEventListener('resize',queueViewport);
window.visualViewport?.addEventListener('scroll',queueViewport);
document.addEventListener('fullscreenchange',queueViewport);
const layoutObserver=new ResizeObserver(queueViewport);
layoutObserver.observe(document.documentElement);layoutObserver.observe($('table'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueViewport()});
window.addEventListener('domino-tour:enter-game',()=>{sync();scheduleBots();queueViewport()});
fitViewport();sync();scheduleBots();void lockLandscape(Boolean(navigator.userActivation?.isActive));queueViewport();
