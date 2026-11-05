import {test} from 'node:test';
import assert from 'node:assert/strict';
import {samplePublicHands,inferPublicConstraints} from '../dist/src/bot-sampling.js';
import {newGame,viewFor,runBotTurn,continueRound,allTiles} from '../dist/src/engine.js';
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
function verify(view,samples){
 const {constraints}=inferPublicConstraints(view);
 for(const hands of samples){const seen=new Set([...view.ownHand,...view.chain].map(t=>t.id));
  for(const p of view.players){if(p.seat===view.turn)continue;const hand=hands.get(p.seat),c=constraints.get(p.seat);assert.equal(hand.length,p.handCount);
   for(const tile of hand){assert.ok(!seen.has(tile.id));seen.add(tile.id);assert.ok(!c.absent.has(tile.a)&&!c.absent.has(tile.b));}
  }
  assert.equal(28-seen.size,view.sleepingCount);
 }
}
test('no-draw pass inferences hold in actual hands, across plays, until next deal; 6 and 7 tiles',()=>{
 let checked=0,passes=0;
 for(const size of [6,7])for(let seed=1;seed<=8;seed++){
  const random=rng(seed),state=newGame(100,size,random);state.players.forEach(p=>p.kind='bot');
  for(let action=0;action<70&&state.phase!=='finished';action++){
   if(state.phase==='round-complete'){continueRound(state,random);assert.equal(viewFor(state,state.turn).history.length,0);continue;}
   const view=viewFor(state,state.turn),{constraints,inconsistent}=inferPublicConstraints(view);assert.equal(inconsistent,false);
   for(const p of state.players)for(const tile of p.hand)assert.ok(!constraints.get(p.seat).absent.has(tile.a)&&!constraints.get(p.seat).absent.has(tile.b));
   if(view.history.some(e=>e.type==='pass'))passes++;
   if(action%5===0){const before=structuredClone(view),result=samplePublicHands(view);assert.deepEqual(view,before);assert.equal(result.metrics.exhausted,false);assert.equal(result.samples.length,48);verify(view,result.samples);checked++;}
   runBotTurn(state,random,'medium');
  }
 }
 assert.ok(checked>100&&passes>100);
});
function smallView(){
 const pool=allTiles().filter(t=>[[0,0],[0,1],[1,1],[2,2]].some(([a,b])=>t.a===a&&t.b===b));
 const rest=allTiles().filter(t=>!pool.some(p=>p.id===t.id));
 return {turn:0,ownHand:rest.slice(0,3),chain:rest.slice(3),sleepingCount:0,players:[3,2,1,1].map((handCount,seat)=>({seat,handCount})),history:[{type:'pass',seat:2,left:0,right:0}]};
}
test('conditional counting matches exhaustive enumeration and samples only complete valid allocations',()=>{
 const view=smallView(),result=samplePublicHands(view);
 // Six possibilities: seat 2 gets 1-1 or 2-2, seat 3 gets one of the other three.
 let enumerated=0;const unseen=allTiles().filter(t=>![...view.ownHand,...view.chain].some(p=>p.id===t.id));
 for(const second of unseen)for(const third of unseen){if(second.id!==third.id&&second.a!==0&&second.b!==0)enumerated++;}
 assert.equal(enumerated,6);assert.equal(result.metrics.validAssignments,enumerated);assert.equal(result.samples.length,48);verify(view,result.samples);
 assert.equal(new Set(result.samples.map(h=>JSON.stringify([...h].map(([seat,hand])=>[seat,hand.map(t=>t.id).sort((a,b)=>a-b)])))).size,6);
 assert.deepEqual(samplePublicHands(view),result);
 const impossible=smallView();impossible.history.push({type:'pass',seat:2,left:1,right:2});
 assert.equal(samplePublicHands(impossible).samples.length,0);assert.equal(samplePublicHands(impossible).metrics.inconsistent,true);
});
test('legacy four-double events have no effect on inferred absences, samples or decisions',async()=>{
 const {chooseBotMove}=await import('../dist/src/bots.js');
 const state=newGame(100,6,rng(9)),view=viewFor(state,state.turn),before=samplePublicHands(view),inferred=inferPublicConstraints(view);
 const move=chooseBotMove(view,'hard');view.history.push({type:'declare-four',seat:(view.turn+1)%4});
 assert.deepEqual(inferPublicConstraints(view),inferred);assert.deepEqual(samplePublicHands(view),before);assert.deepEqual(chooseBotMove(view,'hard'),move);
 assert.ok([...inferred.constraints.values()].every(c=>!('doubles' in c)));
});
test('contradictory public play after a pass never produces fabricated samples',()=>{
 const view=smallView();view.history.push({type:'play',seat:2,tileId:allTiles().find(t=>t.a===0&&t.b===3).id});
 assert.equal(inferPublicConstraints(view).inconsistent,true);assert.equal(samplePublicHands(view).samples.length,0);
 assert.throws(()=>samplePublicHands(view,49));
});
test('sampling has no access to hidden hands, sleep contents or engine state; manual order does not alter samples',()=>{
 const s=newGame(100,6,rng(6)),view=viewFor(s,s.turn),before=samplePublicHands(view);
 for(const p of view.players)Object.defineProperty(p,'hand',{get(){throw Error('hidden hand access')}});
 for(const key of ['sleeping','state'])Object.defineProperty(view,key,{get(){throw Error('hidden state access')}});
 assert.deepEqual(samplePublicHands(view),before);view.ownHand.reverse();assert.deepEqual(samplePublicHands(view),before);
});
