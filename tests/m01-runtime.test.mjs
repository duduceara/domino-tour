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
  replaceChildren(...v){this.children=v} append(v){this.children.push(v)} setAttribute(k,v){this[k]=v} addEventListener(k,v){(this.listeners[k]??=[]).push(v)} setPointerCapture(){} getBoundingClientRect(){return {x:0,y:0,left:0,top:0,width:800,height:430}} closest(){return this}
 }
 const els=new Map();const get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id)};
 get('deal').value='6';get('route').value='classic';const events={};let now=0,id=0;const timers=new Map();
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
for(const size of [6,7])test(`engine: ${size} tiles, four seats, integrity and rejected pass`,()=>{const s=engine.newGame(100,size,n=>n-1);engine.assertStateIntegrity(s);assert.equal(s.sleeping.length,28-4*size);assert.ok(s.players.every(p=>p.hand.length===size));assert.throws(()=>engine.pass(s,s.turn));const seat=s.turn;engine.play(s,seat,s.openingRequiredTileId,'right');assert.equal(s.turn,(seat+1)%4);engine.assertStateIntegrity(s)});
test('engine: seeded four-seat simulations through terminal result or blocked state',t=>{let rng=1;t.mock.method(webcrypto,'getRandomValues',buffer=>{for(let i=0;i<buffer.length;i++)buffer[i]=(rng=(Math.imul(rng,1664525)+1013904223)>>>0);return buffer});let finished=0,blocked=0;const samples=[];for(const size of [6,7])for(let seed=1;seed<=30;seed++){rng=seed;let n=seed;const s=engine.newGame(100,size,k=>((n=(Math.imul(n,1664525)+1013904223)>>>0)%k));s.players.forEach(p=>p.kind='bot');let turns=0;while(s.phase==='playing'&&turns<5000){engine.auditedBotTurn(s);turns++}assert.notEqual(s.phase,'playing');assert.equal(engine.totalScore(s),400);if(s.phase==='finished')finished++;else blocked++;samples.push({size,seed,phase:s.phase,turns,rounds:s.roundsCompleted,winner:s.winner})}console.log('SIMULATION_RESULTS',JSON.stringify({finished,blocked,samples}));assert.equal(finished+blocked,60)});

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
 assert.match(h.get('pass-notice').textContent,/ROBÔ 1 PASSOU/);
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
