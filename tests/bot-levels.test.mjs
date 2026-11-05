import {test} from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {BOT_LEVELS,chooseBotMove} from '../dist/src/bots.js';
import {newGame,viewFor,decideBot,runBotTurn,play,pass,continueRound,assertStateIntegrity,allTiles} from '../dist/src/engine.js';
import {chooseBotMove as baselineMove} from './fixtures/bots-apice01.mjs';
import {LocalSession} from '../dist/src/session.js';
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
function humanTurn(s,random){const tile=s.players[0].hand.find(t=>s.left===null||[t.a,t.b].includes(s.left)||[t.a,t.b].includes(s.right));if(!tile)return pass(s,0,random);play(s,0,tile.id,s.left===null||[tile.a,tile.b].includes(s.left)?'left':'right')}
for(const level of BOT_LEVELS)for(const size of [6,7])test(`${level}: complete matches with three bots, ${size} tiles; legal, bounded, unique actions`,()=>{
 for(let seed=1;seed<=8;seed++){
  const random=rng(seed),s=newGame(100,size,random);let actions=0;
  while(s.phase!=='finished'&&actions++<10000){
   if(s.phase==='round-complete'){continueRound(s,random);continue}
   if(s.turn===0)humanTurn(s,random);
   else{const before=s.events.length;runBotTurn(s,random,level);assert.equal(s.events.slice(before).filter(e=>e.type==='play'||e.type==='pass').length,1)}
   assertStateIntegrity(s);
  }
  assert.equal(s.phase,'finished');assert.equal(s.events.filter(e=>e.type==='finish').length,1);assert.equal(s.players[0].kind,'human');assert.ok(s.players.slice(1).every(p=>p.kind==='bot'));
 }
});
test('public bot view never exposes other hands or sleeping tiles; hidden swaps cannot affect decisions',()=>{
 const s=newGame(100,6,rng(7));s.players.forEach(p=>p.kind='bot');const seat=s.turn;
 const view=viewFor(s,seat);assert.equal(view.sleeping,undefined);assert.ok(view.players.every(p=>p.hand===undefined));assert.ok(!('state' in view));
 const before=BOT_LEVELS.map(level=>decideBot(view,level));const opponents=s.players.filter(p=>p.seat!==seat);
 [opponents[0].hand[0],opponents[1].hand[0]]=[opponents[1].hand[0],opponents[0].hand[0]];
 assert.deepEqual(viewFor(s,seat),view);assert.deepEqual(BOT_LEVELS.map(level=>decideBot(viewFor(s,seat),level)),before);
 for(const p of view.players)Object.defineProperty(p,'hand',{get(){throw Error('hidden-hand read')}});
 for(const level of BOT_LEVELS)assert.doesNotThrow(()=>decideBot(view,level));
});
test('levels make distinct choices, difficult uses public pass history; public history resets each round',()=>{
 const tile=(a,b)=>allTiles().find(t=>t.a===a&&t.b===b);
 const base={phase:'playing',turn:0,left:1,right:2,ownHand:[tile(1,6),tile(2,4),tile(2,3)],chain:[],players:[0,1,2,3].map(seat=>({seat,kind:'bot',handCount:3})),history:[]};
 let mediumDifferences=0;
 let differences=0;
 for(let seed=1;seed<=40;seed++){
  const s=newGame(100,6,rng(seed));s.players.forEach(p=>p.kind='bot');runBotTurn(s,rng(seed),'easy');
  const v=viewFor(s,s.turn),without=decideBot(v,'hard');
  if(JSON.stringify(decideBot(v,'easy'))!==JSON.stringify(decideBot(v,'medium')))mediumDifferences++;
  for(let n=0;n<=6;n++)for(let m=n;m<=6;m++){v.history=[{type:'pass',seat:(v.turn+1)%4,left:n,right:m}];if(JSON.stringify(decideBot(v,'hard'))!==JSON.stringify(without))differences++}
 }
 assert.ok(mediumDifferences>0,'connections must change some medium decisions');
 assert.ok(differences>0,'history must change some decisions');
 const s=newGame(100,6,rng(1));s.phase='round-complete';s.nextOpeningSeat=0;s.events.push({type:'pass',seat:2,left:1,right:2});continueRound(s,rng(3));assert.equal(viewFor(s,0).history.length,0);
 assert.throws(()=>chooseBotMove(base,'unknown'));
});
test('manual arrangement never sorts engine hand; difficulty survives rounds and new matches',()=>{
 const session=new LocalSession(100,6,'expert');const before=structuredClone(session.state),order=session.orderedHand().map(t=>t.id);
 session.moveHandTile(order.at(-1),order[0],order[0]);assert.deepEqual(session.state,before);assert.equal(session.orderedHand()[0].id,order.at(-1));assert.equal(session.difficulty,'hard');
 session.newMatch();assert.equal(session.difficulty,'hard');session.setDifficulty('hard');assert.equal(session.difficulty,'hard');assert.throws(()=>session.setDifficulty('invalid'));assert.equal(session.difficulty,'hard');
});
test('exactly three levels; legacy expert migrates to hard and UI exposes only these levels',async()=>{
 assert.deepEqual(BOT_LEVELS,['easy','medium','hard']);
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 for(const id of ['difficulty','entry-difficulty']){
  const select=html.match(new RegExp('<select[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</select>'));
  assert.ok(select,id);assert.deepEqual([...select[1].matchAll(/value="([^"]+)"/g)].map(m=>m[1]),BOT_LEVELS);
 }
 const s=newGame(100,6,rng(17));s.players.forEach(p=>p.kind='bot');const view=viewFor(s,s.turn);
 assert.deepEqual(chooseBotMove(view,'expert'),chooseBotMove(view,'hard'));
});
test('comparison: paired seeded deals, all seat rotations, balanced duplicate levels',()=>{
 const wins=Object.fromEntries(BOT_LEVELS.map(l=>[l,0])),exposures={...wins},times=Object.fromEntries(BOT_LEVELS.map(l=>[l,[]]));let matches=0;
 // Each deal is replayed for every duplicate strategy and all four seat rotations.
 for(const size of [6,7])for(let seed=1;seed<=12;seed++)for(const duplicate of BOT_LEVELS)for(let rotation=0;rotation<4;rotation++){
  const random=rng(seed+size*1000),s=newGame(100,size,random),lineup=[...BOT_LEVELS,duplicate],levels=Array.from({length:4},(_,seat)=>lineup[(seat+rotation)%4]);s.players.forEach(p=>p.kind='bot');let n=0;
  for(const level of levels)exposures[level]++;
  while(s.phase!=='finished'&&n++<10000){if(s.phase==='round-complete'){continueRound(s,random);continue}const level=levels[s.turn],start=performance.now();runBotTurn(s,random,level);times[level].push(performance.now()-start);assertStateIntegrity(s)}
  assert.equal(s.phase,'finished');wins[levels[s.winner]]++;matches++;
 }
 const results=BOT_LEVELS.map(level=>{const values=times[level].sort((a,b)=>a-b);return {level,wins:wins[level],seatExposures:exposures[level],winRatePct:+(100*wins[level]/exposures[level]).toFixed(2),decisions:values.length,p95ms:+values[Math.floor(values.length*.95)].toFixed(3),maxMs:+values.at(-1).toFixed(3)}});
 console.log('BOT_COMPARISON',JSON.stringify({matches,results}));assert.equal(matches,288);assert.ok(wins.hard>wins.medium&&wins.medium>wins.easy,'strength separation in this fixed benchmark');assert.deepEqual(Object.values(exposures),[384,384,384]);assert.ok(results.every(r=>r.p95ms<50),'host p95 guard; not a physical Android benchmark');
});

// Golden digest captured from the previous HEAD's expert, before migration.
test('frozen expert baseline is intact; easy and medium preserve decisions across 2326 public positions',async()=>{
 const {createHash}=await import('node:crypto');const decisions=[];
 for(const size of [6,7])for(let seed=1;seed<=40;seed++){
  const random=rng(seed),s=newGame(100,size,random);s.players.forEach(p=>p.kind='bot');
  for(let turn=0;turn<30&&s.phase!=='finished';turn++){
   if(s.phase==='round-complete'){continueRound(s,random);continue}
   const view=viewFor(s,s.turn);
   for(const level of ['easy','medium'])assert.deepEqual(chooseBotMove(view,level),baselineMove(view,level));
   decisions.push(baselineMove(view,'hard'));runBotTurn(s,random,'easy');
  }
 }
 assert.equal(decisions.length,2326);
 assert.equal(createHash('sha256').update(JSON.stringify(decisions)).digest('hex'),'6464ac53e474a48f883197757be26db197e5c5bf6b7a6690d30dd2cdf1fac934');
});

test('removing four-double inference preserves hard decisions in 2326 ordinary public positions',async()=>{
 const {createHash}=await import('node:crypto');const decisions=[];
 for(const size of [6,7])for(let seed=1;seed<=40;seed++){
  const random=rng(seed),state=newGame(100,size,random);state.players.forEach(p=>p.kind='bot');
  for(let turn=0;turn<30&&state.phase!=='finished';turn++){
   if(state.phase==='round-complete'){continueRound(state,random);continue}
   decisions.push(chooseBotMove(viewFor(state,state.turn),'hard'));runBotTurn(state,random,'easy');
  }
 }
 assert.equal(decisions.length,2326);assert.equal(createHash('sha256').update(JSON.stringify(decisions)).digest('hex'),'8cf0f8ad9baff28887229692ee02b7d6e56b84eb1b80c638ae1f547a5516b6c1');
});
