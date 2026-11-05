import {test} from 'node:test';
import assert from 'node:assert/strict';
import {samplingCorpus,seededRandom} from './helpers/sampling-corpus.mjs';
import {samplePublicHands as beforeSample} from './fixtures/bot-sampling-before-speed.mjs';
import {samplePublicHands as afterSample} from '../dist/src/bot-sampling.js';
import {chooseBotMove as beforeMove} from './fixtures/bots-before-speed.mjs';
import {chooseBotMove as afterMove,BOT_LEVELS} from '../dist/src/bots.js';
import {newGame,viewFor,play,pass,continueRound,assertStateIntegrity} from '../dist/src/engine.js';
test('optimized sampler preserves every sampled hand, metric and decision on 256 full-match public views',()=>{
 const {views}=samplingCorpus();assert.equal(views.length,256);
 for(const view of views){
  const original=structuredClone(view);
  assert.deepEqual(afterSample(view),beforeSample(view));
  for(const level of BOT_LEVELS)assert.deepEqual(afterMove(view,level),beforeMove(view,level));
  assert.deepEqual(view,original);
 }
 const invalid=structuredClone(views[0]);invalid.players.find(p=>p.seat!==invalid.turn).handCount=8;
 assert.deepEqual(afterSample(invalid),beforeSample(invalid));
 for(const count of [1,17,48])assert.deepEqual(afterSample(views[0],count),beforeSample(views[0],count));
});
test('32 full matches preserve every hard decision and final state, with unique actions and legal turn order',()=>{
 let decisions=0;
 for(const size of [6,7])for(let seed=101;seed<=116;seed++){
  const aRandom=seededRandom(seed),bRandom=seededRandom(seed),a=newGame(100,size,aRandom),b=newGame(100,size,bRandom);let actions=0;
  a.players.forEach(p=>p.kind='bot');b.players.forEach(p=>p.kind='bot');
  while(a.phase!=='finished'&&actions++<10000){
   assert.equal(b.phase,a.phase);assert.equal(b.turn,a.turn);
   if(a.phase==='round-complete'){continueRound(a,aRandom);continueRound(b,bRandom);continue;}
   const before=beforeMove(viewFor(a,a.turn),'hard'),after=afterMove(viewFor(b,b.turn),'hard');assert.deepEqual(after,before);decisions++;
   const seat=b.turn,eventCount=b.events.length;
   for(const [state,move,random] of [[a,before,aRandom],[b,after,bRandom]]){
    if(move.type==='pass')pass(state,state.turn,random);else play(state,state.turn,move.tileId,move.side);assertStateIntegrity(state);
   }
   assert.equal(b.events.slice(eventCount).filter(e=>e.type==='play'||e.type==='pass').length,1);
   if(b.phase==='playing')assert.equal(b.turn,(seat+1)%4);
   if(after.type==='play')assert.throws(()=>play(b,seat,after.tileId,after.side));else assert.throws(()=>pass(b,seat,bRandom));
  }
  assert.equal(a.phase,'finished');assert.deepEqual(b,a);assert.equal(b.events.filter(e=>e.type==='finish').length,1);
 }
 console.log('SPEED_MATCH_EQUIVALENCE',JSON.stringify({matches:32,decisions}));
});
