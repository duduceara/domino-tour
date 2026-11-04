import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import * as engine from '../dist/src/engine.js';
import * as table from '../dist/src/table.js';
import * as viewport from '../dist/src/viewport.js';
import {LocalSession} from '../dist/src/session.js';
// DOM adapter, not a real browser/device. Executes the unchanged app handlers and timers.
function app(){
 class Element{
  constructor(){this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.listeners={};this.className='';this.value='100';this.clientWidth=800;this.clientHeight=430;this.offsetLeft=this.offsetTop=this.clientLeft=this.clientTop=0;this.parentElement={offsetLeft:0,offsetTop:0};}
  replaceChildren(...v){this.children=v} append(v){this.children.push(v)} setAttribute(k,v){this[k]=v} addEventListener(k,v){(this.listeners[k]??=[]).push(v)} setPointerCapture(){} getBoundingClientRect(){return this.rect??{x:0,y:0,left:0,top:0,width:800,height:430}} closest(){return this}
 }
 const els=new Map();const get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id)};
 get('deal').value='6';get('route').value='classic';get('hand').rect={left:0,top:500,width:800,height:72};const events={};let now=0,id=0;const timers=new Map();
 const document={hidden:false,documentElement:{clientWidth:800},getElementById:get,createElement:()=>new Element(),addEventListener:(k,v)=>(events[k]??=[]).push(v)};
 const ctx=vm.createContext({...engine,...table,...viewport,LocalSession,document,window:{innerHeight:600,addEventListener:()=>{}},screen:{},navigator:{},requestAnimationFrame:()=>1,getComputedStyle:()=>({paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'}),ResizeObserver:class{observe(){}},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i)});
 const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,ctx);
 const run=s=>vm.runInContext(s,ctx);
 const emit=(el,type,extra={})=>{const e={pointerId:1,button:0,isPrimary:true,clientX:150,clientY:150,preventDefault(){},...extra};if(type==='pointerdown')for(const f of events[type]??[])f(e);for(const f of el.listeners[type]??[])f(e);if(type!=='pointerdown')for(const f of events[type]??[])f(e)};
 const tick=ms=>{const end=now+ms;while(true){const entry=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>end)break;now=entry[1].at;timers.delete(entry[0]);entry[1].f()}now=end};
 function fixture(left=2,right=6){run(`stopBotSequence();game.state.phase='playing';game.state.turn=0;game.state.openingRequiredTileId=null;game.state.left=${left};game.state.right=${right};game.state.players[0].hand=[{id:7,a:2,b:5}];game.model={status:'verified',nodes:[],geometry:{endpoints:{left:{x:50,y:50},right:{x:350,y:50}},tileWidth:40,tileHeight:20}};game.setRouteStyle=()=>{};game.resize=()=>{};game.preview=(id,side)=>validSides(game.state,0,id).includes(side)?{tileId:id,side,center:game.model.geometry.endpoints[side],valid:true}:null;globalThis.plays=[];game.humanPlay=(id,side)=>{plays.push(side);game.state.turn=1;return true};game.interaction=game.makeInteraction();sync();`)}
 return {run,get,emit,tick,timers,fixture,hide(v){document.hidden=v;for(const f of events.visibilitychange)f()}};
}
test('app handlers: second tap with one endpoint commits once',()=>{const h=app();h.fixture();let tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointerup');assert.equal(h.run('plays.length'),0);tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointerup');h.emit(tile,'pointerup');assert.equal(h.run('plays.length'),1)});
test('app handlers: two endpoints require explicit choice',()=>{const h=app();h.fixture(2,5);for(let i=0;i<2;i++){const tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointerup')}assert.equal(h.run('plays.length'),0);const end=h.get('table').children[0].children.find(x=>x.dataset.side==='right');end.onclick();assert.equal(h.run('plays.length'),1)});
test('app handlers: cancel, foreign pointer, invalid drag and duplicate protection',()=>{const h=app();h.fixture();let tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointercancel',{pointerId:9});assert.equal(h.run('dragId'),1);h.emit(tile,'pointercancel');assert.equal(h.run('game.interaction.selectedTile'),null);tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointermove',{clientX:150,clientY:250});h.emit(tile,'pointerup',{clientX:150,clientY:250});assert.equal(h.run('plays.length'),0);tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointermove',{clientX:80,clientY:80});h.emit(tile,'pointermove',{clientX:50,clientY:50});assert.equal(h.run('plays.length'),0);h.emit(tile,'pointerup',{clientX:50,clientY:50});assert.equal(h.run('plays.length'),1)});
test('app clock: 3000ms, one action, no duplicated timers; hide/resume/restart',()=>{const h=app();h.run("stopBotSequence();game.state.phase='playing';game.state.turn=1;globalThis.count=0;sync=()=>{};game.advanceBots=()=>{count++;game.state.turn=game.state.turn===3?0:game.state.turn+1};scheduleBots();scheduleBots()");assert.equal(h.timers.size,1);h.tick(2999);assert.equal(h.run('count'),0);h.tick(1);assert.equal(h.run('count'),1);h.tick(3000);assert.equal(h.run('count'),2);h.hide(true);assert.equal(h.timers.size,0);h.tick(10000);assert.equal(h.run('count'),2);h.hide(false);h.tick(2999);assert.equal(h.run('count'),2);h.tick(1);assert.equal(h.run('count'),3);assert.equal(h.timers.size,0);h.run('game.state.turn=1;scheduleBots()');h.get('restart').onclick();assert.ok(h.timers.size<=1);h.run('stopBotSequence()');assert.equal(h.timers.size,0)});
for(const size of [6,7])test(`engine: ${size} tiles, four seats, integrity and rejected pass`,()=>{const s=engine.newGame(100,size,n=>n-1);engine.assertStateIntegrity(s);assert.equal(s.sleeping.length,28-4*size);assert.ok(s.players.every(p=>p.hand.length===size));assert.throws(()=>engine.pass(s,s.turn));const seat=s.turn;engine.play(s,seat,s.players[seat].hand[0].id,'right');assert.equal(s.turn,(seat+1)%4);engine.assertStateIntegrity(s)});
test('engine: seeded four-seat simulations through terminal result or blocked state',t=>{let rng=1;t.mock.method(webcrypto,'getRandomValues',buffer=>{for(let i=0;i<buffer.length;i++)buffer[i]=(rng=(Math.imul(rng,1664525)+1013904223)>>>0);return buffer});let finished=0,blocked=0;const samples=[];for(const size of [6,7])for(let seed=1;seed<=30;seed++){rng=seed;let n=seed;const s=engine.newGame(100,size,k=>((n=(Math.imul(n,1664525)+1013904223)>>>0)%k));s.players.forEach(p=>p.kind='bot');let turns=0;while(s.phase==='playing'&&turns<5000){engine.auditedBotTurn(s);turns++}assert.notEqual(s.phase,'playing');assert.equal(engine.totalScore(s),400+s.roundAwards.reduce((sum,a)=>sum+a.points,0));if(s.phase==='finished')finished++;else blocked++;samples.push({size,seed,phase:s.phase,turns,rounds:s.roundsCompleted,winner:s.winner})}console.log('SIMULATION_RESULTS',JSON.stringify({finished,blocked,samples}));assert.equal(finished+blocked,60)});

test('app drag: preview never commits; cancellation and repeated release are safe',()=>{const h=app();h.fixture();let tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointermove',{clientX:60,clientY:60});assert.equal(h.run('plays.length'),0);assert.notEqual(h.run('floatingTile'),null);h.emit(tile,'pointercancel');assert.equal(h.run('floatingTile'),null);assert.equal(h.run('plays.length'),0);tile=h.get('hand').children[0];h.emit(tile,'pointerdown');h.emit(tile,'pointermove',{clientX:50,clientY:50});assert.equal(h.run('plays.length'),0);h.emit(tile,'pointerup',{clientX:50,clientY:50});h.emit(tile,'pointerup',{clientX:50,clientY:50});assert.equal(h.run('plays.length'),1);assert.equal(h.run('floatingTile'),null)});

test('automatic human pass: one debit, beneficiary +5, notice for two seconds',()=>{
 const h=app();h.fixture(6,6);
 h.run('game.state.lastPlayed=3;game.state.players[3].score=100;game.state.players[0].score=100;scheduleBots()');
 h.tick(0);
 assert.equal(h.run("game.state.events.filter(e=>e.type==='pass'&&e.seat===0).length"),1);
 assert.equal(h.run('game.state.players[0].score'),95);
 assert.equal(h.run('game.state.players[3].score'),105);
 assert.equal(h.get('pass-notice').hidden,false);
 assert.match(h.get('pass-notice').textContent,/VOCÊ PASSOU/);
 h.tick(1999);assert.equal(h.get('pass-notice').hidden,false);
 h.tick(1);assert.equal(h.get('pass-notice').hidden,true);
 h.run('scheduleBots();scheduleBots()');
 assert.equal(h.run("game.state.events.filter(e=>e.type==='pass'&&e.seat===0).length"),1);
});
test('bot pass notice identifies seat and pauses subsequent bot action',()=>{
 const h=app();h.run("stopBotSequence();game.state.phase='playing';game.state.turn=1;game.state.lastPlayed=0;globalThis.calls=0;game.advanceBots=()=>{calls++;game.state.events.push({type:'pass',seat:1,delta:-5,beneficiary:0});game.state.turn=2};sync=()=>{};scheduleBots()");
 h.tick(3000);assert.equal(h.run('calls'),1);
 assert.match(h.get('pass-notice').textContent,/RobiX PASSOU/);
 h.tick(1999);assert.equal(h.run('calls'),1);
 h.tick(1);assert.equal(h.get('pass-notice').hidden,true);
 h.tick(2999);assert.equal(h.run('calls'),1);
 h.tick(1);assert.equal(h.run('calls'),2);
});

test('new match never performs a robot move before the 3-second scheduler',()=>{
 const h=app();h.run('stopBotSequence();game.state.turn=1;game.newMatch();game.state.turn=1;globalThis.botCalls=0;game.advanceBots=()=>{botCalls++;game.state.turn=2};scheduleBots()');
 assert.equal(h.run('botCalls'),0);
 h.tick(2999);assert.equal(h.run('botCalls'),0);
 h.tick(1);assert.equal(h.run('botCalls'),1);
});
test('entry overlay defers robot scheduler until the player enters the table',()=>{
 const h=app();h.get('entry-flow').hidden=false;
 h.run('stopBotSequence();game.state.phase="playing";game.state.turn=1;globalThis.botCalls=0;game.advanceBots=()=>{botCalls++};scheduleBots()');
 h.tick(5000);assert.equal(h.run('botCalls'),0);
 h.get('entry-flow').hidden=true;
 h.run('scheduleBots()');h.tick(2999);assert.equal(h.run('botCalls'),0);
 h.tick(1);assert.equal(h.run('botCalls'),1);
});

test('domino pip faces display exact 0-6 values without changing tile identity',()=>{
 const h=app();
 for(let value=0;value<=6;value++){
  const html=h.run(`tileEl({id:19,a:${value},b:0}).innerHTML`);
  const halves=html.match(/class="pip-face"/g)||[];
  assert.equal(halves.length,2);
  assert.equal((html.match(/class="pip on"/g)||[]).length,value);
  assert.equal(h.run(`tileEl({id:19,a:${value},b:0}).dataset.tileId`),19);
 }
});
function fourFixture(h){h.run(`stopBotSequence();game=new LocalSession(100,6);const all=allTiles();const hand=[...all.filter(t=>t.a===t.b).slice(0,4),...all.filter(t=>t.a!==t.b).slice(0,2)];const rest=all.filter(t=>!hand.some(h=>h.id===t.id));game.state.players[0].hand=hand;for(let i=1;i<4;i++)game.state.players[i].hand=rest.slice((i-1)*6,i*6);game.state.sleeping=rest.slice(18);game.state.turn=0;game.refresh();sync();`)}
test('four-double control: visible only when legal, cancel preserves state and confirm acts once',()=>{
 const h=app();fourFixture(h);assert.equal(h.get('declare-four').hidden,false);const before=h.run('JSON.stringify(game.state)');h.get('declare-four').onclick();assert.equal(h.get('declare-dialog').hidden,false);h.get('declare-cancel').onclick();assert.equal(h.run('JSON.stringify(game.state)'),before);
 h.get('declare-four').onclick();h.get('declare-confirm').onclick();h.get('declare-confirm').onclick();assert.equal(h.run("game.state.events.filter(e=>e.type==='declare-four').length"),1);assert.equal(h.run('game.state.turn'),1);assert.equal(h.run('totalScore(game.state)'),400);assert.equal(h.get('declare-four').hidden,true);assert.equal(h.get('declare-dialog').hidden,true);assert.equal(h.timers.size,1);h.tick(2999);assert.equal(h.run('game.state.chain.length'),0);h.tick(1);assert.equal(h.run('game.state.chain.length'),1);
});
test('five doubles never exposes four-double control; stale confirmation cannot affect a restarted match',()=>{
 const h=app();fourFixture(h);h.get('declare-four').onclick();h.get('restart').onclick();const before=h.run('JSON.stringify(game.state)');h.get('declare-confirm').onclick();assert.equal(h.run('JSON.stringify(game.state)'),before);
 h.run(`stopBotSequence();game.state.players[0].hand=allTiles().filter(t=>t.a===t.b).slice(0,5);declareFiveAtDeal(game.state);sync()`);assert.equal(h.get('declare-four').hidden,true);assert.equal(h.run('game.state.phase'),'round-complete');assert.equal(h.get('next-round').hidden,false);
});
test('difficulty control and organize preserve pending bot timer and do not perform an extra action',()=>{
 const h=app();h.run(`stopBotSequence();game.state.turn=1;scheduleBots()`);const before=h.run('game.state.events.length');h.get('difficulty').value='expert';h.get('difficulty').onchange();h.get('organize').onclick();assert.equal(h.run('game.difficulty'),'expert');assert.equal(h.get('entry-difficulty').value,'expert');assert.equal(h.run('game.state.events.length'),before);assert.equal(h.timers.size,1);h.tick(2999);assert.equal(h.run('game.state.events.length'),before);
});
test('four-double decision pauses a pending automatic pass; Escape cancels without declaring',()=>{
 const h=app();fourFixture(h);h.run(`const last=allTiles().find(t=>t.a===6&&t.b===6);for(const p of game.state.players)p.hand=p.hand.filter(t=>t.id!==last.id);game.state.sleeping=game.state.sleeping.filter(t=>t.id!==last.id);game.state.chain=[last];game.state.placements=[{tileId:last.id,side:'right',joined:6,exposed:6}];game.state.left=6;game.state.right=6;game.state.lastPlayed=3;game.refresh();sync();scheduleBots()`);
 h.tick(2999);assert.equal(h.run('game.state.events.length'),0);h.get('declare-four').onclick();h.tick(10000);assert.equal(h.run('game.state.events.length'),0);h.emit(h.get('declare-dialog'),'keydown',{key:'Escape'});assert.equal(h.get('declare-dialog').hidden,true);assert.equal(h.run('game.state.events.length'),0);h.get('declare-four').onclick();h.get('declare-confirm').onclick();assert.equal(h.run('game.state.events[0].type'),'declare-four');assert.equal(h.run('totalScore(game.state)'),400);
});
function rackFixture(h){fourFixture(h);h.get('hand').children.forEach((el,i)=>el.rect={left:50+i*44,top:500,width:34,height:68});}
test('manual rack drag shows insertion preview, commits once and never plays',()=>{
 const h=app();rackFixture(h);const before=h.run('JSON.stringify(game.state)'),order=JSON.parse(h.run('JSON.stringify(game.orderedHand().map(t=>t.id))')),first=h.get('hand').children[0];
 h.emit(first,'pointerdown',{clientX:67,clientY:534});h.emit(first,'pointermove',{clientX:320,clientY:534});assert.notEqual(h.run('insertionMarker'),null);assert.equal(h.run('JSON.stringify(game.state)'),before);
 h.emit(first,'pointerup',{clientX:320,clientY:534});h.emit(first,'pointerup',{clientX:320,clientY:534});assert.equal(h.run('JSON.stringify(game.state)'),before);assert.equal(h.run('game.orderedHand().at(-1).id'),order[0]);assert.equal(h.run('insertionMarker'),null);assert.equal(h.run('game.state.events.length'),0);
});
test('rack cancel, lost capture and second pointer preserve the previous arrangement',()=>{
 for(const cancel of ['pointercancel','lostpointercapture','multitouch']){
  const h=app();rackFixture(h);const before=h.run('JSON.stringify(game.snapshotHandLayout())'),el=h.get('hand').children[0];h.emit(el,'pointerdown',{clientX:67,clientY:534});h.emit(el,'pointermove',{clientX:320,clientY:534});
  if(cancel==='multitouch')h.emit(el,'pointerdown',{pointerId:2,isPrimary:false,clientX:300,clientY:534});else h.emit(el,cancel);
  h.emit(el,'pointerup',{clientX:320,clientY:534});assert.equal(h.run('JSON.stringify(game.snapshotHandLayout())'),before);assert.equal(h.run('game.state.events.length'),0);
 }
});
test('rack remains draggable on bot turns and organizing never resets the bot timer',()=>{
 const h=app();rackFixture(h);h.run('game.state.turn=1;scheduleBots();sync()');h.get('hand').children.forEach((el,i)=>el.rect={left:50+i*44,top:500,width:34,height:68});
 const el=h.get('hand').children[0],before=h.run('game.state.events.length');assert.equal(el.disabled,false);h.emit(el,'pointerdown',{clientX:67,clientY:534});h.emit(el,'pointermove',{clientX:320,clientY:534});h.emit(el,'pointerup',{clientX:320,clientY:534});assert.equal(h.timers.size,1);h.tick(2999);assert.equal(h.run('game.state.events.length'),before);h.tick(1);assert.ok(h.run('game.state.events.length')>before);
});
test('rack to board and back to rack never commits a play; drop outside both zones cancels',()=>{
 const h=app();h.fixture();const el=h.get('hand').children[0];el.rect={left:50,top:500,width:34,height:68};const before=h.run('JSON.stringify(game.snapshotHandLayout())');
 h.emit(el,'pointerdown',{clientX:67,clientY:534});h.emit(el,'pointermove',{clientX:50,clientY:50});assert.equal(h.run('plays.length'),0);h.emit(el,'pointermove',{clientX:67,clientY:534});h.emit(el,'pointerup',{clientX:67,clientY:534});assert.equal(h.run('plays.length'),0);
 const another=h.get('hand').children[0];h.emit(another,'pointerdown',{clientX:67,clientY:534});h.emit(another,'pointermove',{clientX:900,clientY:450});h.emit(another,'pointerup',{clientX:900,clientY:450});assert.equal(h.run('plays.length'),0);assert.equal(h.run('JSON.stringify(game.snapshotHandLayout())'),before);
});
test('manual rotation and keyboard reorder are visual only; organize button never sorts',()=>{
 const h=app();rackFixture(h);const before=h.run('JSON.stringify(game.state)'),layout=h.run('JSON.stringify(game.snapshotHandLayout())'),el=h.get('hand').children[0];h.get('organize').onclick();assert.equal(h.run('JSON.stringify(game.snapshotHandLayout())'),layout);
 h.emit(el,'keydown',{key:'r'});assert.equal(h.run('JSON.stringify(game.state)'),before);assert.notEqual(h.run('JSON.stringify(game.snapshotHandLayout())'),layout);const current=h.get('hand').children[0];h.emit(current,'keydown',{key:'ArrowRight',altKey:true});assert.equal(h.run('JSON.stringify(game.state)'),before);assert.equal(h.run('game.state.events.length'),0);
});
test('logical rack hit test remains correct under the portrait visual rotation',()=>{
 const h=app();h.get('hand').rect={left:10,top:50,width:72,height:300};h.run('rotated=true');assert.equal(h.run("within(pointerFrame({clientX:50,clientY:100}),frameRect($('hand')))"),true);assert.equal(h.run("within(pointerFrame({clientX:200,clientY:100}),frameRect($('hand')))"),false);
});
test('a bot action during a rack preview cancels that preview and preserves the committed layout',()=>{
 const h=app();rackFixture(h);h.run('game.state.turn=1;scheduleBots()');const before=h.run('JSON.stringify(game.snapshotHandLayout())'),el=h.get('hand').children[0];h.emit(el,'pointerdown',{clientX:67,clientY:534});h.emit(el,'pointermove',{clientX:320,clientY:534});h.tick(3000);assert.equal(h.run('dragId'),null);h.emit(el,'pointerup',{clientX:320,clientY:534});assert.equal(h.run('JSON.stringify(game.snapshotHandLayout())'),before);assert.equal(h.run("game.state.events.filter(e=>e.seat===0).length"),0);
});
