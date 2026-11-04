import {landscapeViewport,framePoint} from '../dist/src/viewport.js';
import {LocalSession} from '../dist/src/session.js';
import {validSides,chooseRoute} from '../dist/src/table.js';
import {legalTiles,secureIndex} from '../dist/src/engine.js';
const $=id=>document.getElementById(id);
let game=new LocalSession();let routeStyle=chooseRoute(secureIndex);
let dragId=null,origin=null,dragMoved=false,ghost=null;const activePointers=new Set();let gestureBlocked=false;
let rotated=false,zoom=1,pan={x:0,y:0},panStart=null;
let botTimer=null,botEpoch=0;
function stopBotSequence(){botEpoch++;if(botTimer!==null){clearTimeout(botTimer);botTimer=null}}
function scheduleBots(){stopBotSequence();if(game.state.phase!=='playing'||game.state.turn===0)return;const epoch=botEpoch;const step=()=>{if(epoch!==botEpoch)return;botTimer=null;if(game.state.phase!=='playing'||game.state.turn===0)return;game.advanceBots(1);sync();if(game.state.phase==='playing'&&game.state.turn!==0)botTimer=setTimeout(step,420)};botTimer=setTimeout(step,420)}
function coords(e){const r=$('app').getBoundingClientRect(),p=framePoint({x:e.clientX,y:e.clientY},r,rotated);const x=p.x-$('table').offsetLeft-$('table').parentElement.offsetLeft-$('table').clientLeft,y=p.y-$('table').offsetTop-$('table').parentElement.offsetTop-$('table').clientTop;return {x:(x-$('table').clientWidth/2-pan.x)/zoom+$('table').clientWidth/2,y:(y-$('table').clientHeight/2-pan.y)/zoom+$('table').clientHeight/2}}
function fitViewport(){
 cancelGesture();zoom=1;pan={x:0,y:0};const probe=getComputedStyle($('safe-probe')),insets={top:parseFloat(probe.paddingTop),right:parseFloat(probe.paddingRight),bottom:parseFloat(probe.paddingBottom),left:parseFloat(probe.paddingLeft)};
 const v=landscapeViewport(document.documentElement.clientWidth,window.innerHeight,insets);rotated=v.rotated;
 const app=$('app');app.style.width=v.width+'px';app.style.height=v.height+'px';app.style.left=v.left+'px';app.style.top=v.top+'px';app.style.transform=rotated?'translateX('+v.height+'px) rotate(90deg)':'none';app.dataset.rotated=String(rotated);
}
async function lockLandscape(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();if(!screen.orientation?.lock)throw new Error('Orientation lock unavailable');await screen.orientation.lock('landscape');$('app').dataset.orientationLock='native'}catch{$('app').dataset.orientationLock='visual-fallback'}fitViewport()}
function rect(){return {x:0,y:0,width:$('table').clientWidth,height:$('table').clientHeight}}
function cancelGesture(){game.interaction.cancel();dragId=null;origin=null;dragMoved=false;ghost=null;panStart=null}
function tileEl(tile,css=''){const b=document.createElement('button');b.className='piece '+css;b.dataset.tileId=tile.id;b.innerHTML=`<span>${tile.a}</span><span class="divider"></span><span>${tile.b}</span>`;b.setAttribute('aria-label',`Pedra ${tile.a} e ${tile.b}`);return b}
function drawBoard(model,previewId=null){
 const surface=$('table');surface.replaceChildren();const table=document.createElement('div');table.className='board-layer';table.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;surface.append(table);
 surface.dataset.geometry=model.status;surface.dataset.nodes=String(model.nodes.length);
 if(!model.geometry){const warning=document.createElement('p');warning.className='geometry-warning';warning.textContent='Geometria indisponível ('+model.failure+'). Tente outro percurso ou orientação. Nenhum encaixe artificial foi desenhado.';table.append(warning);return}
 for(const node of model.nodes){const el=tileEl({...node.official,a:node.printed[0],b:node.printed[1]},node.tileId===previewId?'ghost':'');el.disabled=true;const p=node.shape;el.style.left=p.center.x+'px';el.style.top=p.center.y+'px';el.style.width=p.width+'px';el.style.height=p.height+'px';el.style.transform=`translate(-50%,-50%) rotate(${p.angle}deg)`;el.style.fontSize=Math.min(18,p.height*.6)+'px';el.dataset.order=String(node.order);table.append(el)}
 for(const side of ['left','right']){
  const point=model.geometry.endpoints[side],b=document.createElement('button');b.className='endpoint';b.dataset.side=side;b.textContent=side==='left'?'←':'→';b.setAttribute('aria-label','Jogar na ponta '+(side==='left'?'esquerda':'direita'));b.style.left=point.x+'px';b.style.top=point.y+'px';b.disabled=previewId!==null||game.state.turn!==0||game.interaction.selectedTile===null||!validSides(game.state,0,game.interaction.selectedTile).includes(side);
  b.onclick=()=>{if(game.interaction.tapEndpoint(side))afterAction();else $('message').textContent='Essa pedra não tem encaixe físico validado nessa ponta.'};table.append(b);
 }
}
function sync(){
 const prior=rect();game.setRouteStyle(routeStyle);game.resize(prior,'horizontal');
 const s=game.state,human=s.players[0];
 $('scores').replaceChildren(...s.players.map(p=>{const e=document.createElement('span');e.className='seat'+(s.turn===p.seat?' active':'');e.textContent=`${p.seat===0?'Você':`Robô ${p.seat}`} · ${p.score} pts · ${p.hand.length} pedras`;return e}));
 drawBoard(game.model);
 const hand=$('hand');hand.replaceChildren();
 for(const tile of human.hand){
  const b=tileEl(tile,'inhand'+(game.interaction.selectedTile===tile.id?' selected':'')+(validSides(s,0,tile.id).length?' playable':' unavailable'));b.setAttribute('aria-pressed',String(game.interaction.selectedTile===tile.id));b.disabled=s.turn!==0||s.phase!=='playing'||game.model.status==='unavailable';
  b.addEventListener('pointerdown',e=>{
   if(gestureBlocked)return;
   if(dragId!==null){cancelGesture();drawBoard(game.model);return}
   if(e.button!==0||!e.isPrimary)return;
   if(!game.interaction.begin(e.pointerId,tile.id,coords(e)))return;
   dragId=e.pointerId;origin=coords(e);dragMoved=false;b.setPointerCapture(e.pointerId);
  });
  b.addEventListener('pointermove',e=>{
   if(dragId!==e.pointerId)return;
   const pos=coords(e);if(origin&&Math.hypot(pos.x-origin.x,pos.y-origin.y)>=8)dragMoved=true;
   if(!dragMoved)return;
   const result=game.interaction.move(e.pointerId,pos);
   if(result.committed){dragId=null;origin=null;ghost=null;afterAction();return}
   if(result.preview?.model){ghost=result.preview.tileId;drawBoard(result.preview.model,ghost)}
  });
  b.addEventListener('pointerup',e=>{if(dragId!==e.pointerId)return;const wasDragging=dragMoved;const result=wasDragging?game.interaction.move(e.pointerId,coords(e)):null;if(result?.committed){dragId=null;origin=null;ghost=null;afterAction();return}game.interaction.end(e.pointerId);if(wasDragging){game.interaction.select(tile.id)}dragId=null;origin=null;dragMoved=false;ghost=null;sync();if(wasDragging&&game.interaction.selectedTile===tile.id)$('message').textContent='Pedra selecionada. Toque em uma das pontas destacadas para encaixar.'});
  b.addEventListener('pointercancel',()=>{cancelGesture();sync()});
  b.addEventListener('lostpointercapture',()=>{if(dragId!==null){cancelGesture();sync()}});
  b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();game.interaction.select(tile.id);sync()}});
  hand.append(b);
 }
 $('pass').disabled=s.turn!==0||s.phase!=='playing'||legalTiles(s,0).length>0;
 $('message').textContent=game.model.status==='unavailable'?'Mesa não desenhada: '+game.model.failure:s.phase==='finished'?'Partida encerrada. Vencedor: '+(s.winner===0?'Você':`Robô ${s.winner}`):s.phase==='blocked-awaiting-rule'?'Rodada bloqueada: regra da V0.21 preservada.':s.turn===0?'Sua vez! Selecione uma pedra e uma ponta.':'Robôs jogando';
}
// Capture phase sees a second pointer even outside the rack/first captured element.
document.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1){gestureBlocked=true;cancelGesture();drawBoard(game.model)}},true);
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{activePointers.delete(e.pointerId);if(!activePointers.size)gestureBlocked=false});
window.addEventListener('blur',()=>{cancelGesture();activePointers.clear();gestureBlocked=false;drawBoard(game.model)});
function afterAction(){dragId=null;origin=null;ghost=null;sync();scheduleBots()}
$('pass').onclick=()=>{if(game.humanPass())afterAction()};
$('restart').onclick=()=>{stopBotSequence();cancelGesture();game=new LocalSession(Number($('target').value),Number($('deal').value));routeStyle=$('route').value==='random'?chooseRoute(secureIndex):$('route').value;sync();scheduleBots()};
$('route').onchange=()=>{cancelGesture();routeStyle=$('route').value==='random'?chooseRoute(secureIndex):$('route').value;sync()};
$('zoom').onclick=()=>{cancelGesture();zoom=zoom>=8?1:Math.min(8,zoom*2);pan={x:0,y:0};drawBoard(game.model)};
$('fit').onclick=()=>{cancelGesture();zoom=1;pan={x:0,y:0};drawBoard(game.model)};
$('table').addEventListener('pointerdown',e=>{if(zoom===1||e.target.closest('button')||!e.isPrimary||gestureBlocked)return;const r=$('app').getBoundingClientRect();panStart={id:e.pointerId,point:framePoint({x:e.clientX,y:e.clientY},r,rotated),pan:{...pan}};$('table').setPointerCapture(e.pointerId)});
$('table').addEventListener('pointermove',e=>{if(!panStart||panStart.id!==e.pointerId)return;if(gestureBlocked){panStart=null;return}const p=framePoint({x:e.clientX,y:e.clientY},$('app').getBoundingClientRect(),rotated);pan={x:panStart.pan.x+p.x-panStart.point.x,y:panStart.pan.y+p.y-panStart.point.y};drawBoard(game.model)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('table').addEventListener(type,()=>{panStart=null});
$('fullscreen').onclick=lockLandscape;
window.addEventListener('resize',fitViewport);
document.addEventListener('fullscreenchange',fitViewport);
new ResizeObserver(()=>{cancelGesture();sync()}).observe($('table'));
fitViewport();sync();scheduleBots();
