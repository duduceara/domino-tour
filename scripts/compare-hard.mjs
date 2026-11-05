// node scripts/compare-hard.mjs [seedCount=24] [firstSeed=1001]
// Frozen baseline has no dependency on current strategy or Git availability.
import {chooseBotMove as before,baselineSamples} from '../tests/fixtures/bots-apice01.mjs';
import {chooseBotMove as after} from '../dist/src/bots.js';
import {samplePublicHands,inferPublicConstraints} from '../dist/src/bot-sampling.js';
import {newGame,viewFor,play,pass,continueRound,assertStateIntegrity} from '../dist/src/engine.js';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
const seedCount=Number(process.argv[2]??24),firstSeed=Number(process.argv[3]??1001);
if(!Number.isInteger(seedCount)||seedCount<1||!Number.isInteger(firstSeed))throw Error('Invalid seed range');
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
const stats={before:{wins:0,times:[],samples:0,zeroSamples:0,invalidSamples:0},after:{wins:0,times:[],samples:0,zeroSamples:0,invalidSamples:0,budgetExhaustions:0}},quality={positions:0,withPasses:0};
const outcomes=[],decisions=[],byDealSize={6:{before:0,after:0},7:{before:0,after:0}};
function valid(view,sample){
 const {constraints}=inferPublicConstraints(view),seen=new Set([...view.ownHand,...view.chain].map(t=>t.id));
 for(const p of view.players){if(p.seat===view.turn)continue;const hand=sample.get(p.seat),c=constraints.get(p.seat);if(!hand||hand.length!==p.handCount)return false;
  for(const tile of hand){if(seen.has(tile.id)||c.absent.has(tile.a)||c.absent.has(tile.b))return false;seen.add(tile.id)}
 }
 return 28-seen.size===view.sleepingCount;
}
for(const size of [6,7])for(let seed=firstSeed;seed<firstSeed+seedCount;seed++)for(let mask=0;mask<16;mask++){
 if(mask.toString(2).replaceAll('0','').length!==2)continue;
 const random=rng(seed+size*100000),state=newGame(100,size,random),levels=[0,1,2,3].map(seat=>mask&1<<seat?'after':'before');state.players.forEach(p=>p.kind='bot');let actions=0;
 while(state.phase!=='finished'&&actions++<10000){
  if(state.phase==='round-complete'){continueRound(state,random);continue}
  const view=viewFor(state,state.turn),version=levels[state.turn],start=performance.now(),move=(version==='after'?after:before)(view,'hard');stats[version].times.push(performance.now()-start);
  decisions.push([version,move]);
  // Compare sample quality on identical public positions, independently of who acts.
  if(actions%7===0){quality.positions++;if(view.history.some(e=>e.type==='pass'))quality.withPasses++;
   const improved=samplePublicHands(view);stats.after.budgetExhaustions+=Number(improved.metrics.exhausted);
   for(const [name,samples] of [['before',baselineSamples(view)],['after',improved.samples]]){stats[name].samples+=samples.length;stats[name].zeroSamples+=Number(!samples.length);stats[name].invalidSamples+=samples.filter(s=>!valid(view,s)).length;}
  }
  if(move.type==='pass')pass(state,state.turn,random);else play(state,state.turn,move.tileId,move.side);
  assertStateIntegrity(state);
 }
 if(state.phase!=='finished')throw Error('Unfinished match');stats[levels[state.winner]].wins++;byDealSize[size][levels[state.winner]]++;outcomes.push([size,seed,mask,state.winner]);
}
const results={seedCount,firstSeed,matches:outcomes.length,seatExposuresPerVersion:outcomes.length*2,quality,byDealSize,results:{},outcomeHash:createHash('sha256').update(JSON.stringify(outcomes)).digest('hex'),decisionHash:createHash('sha256').update(JSON.stringify(decisions)).digest('hex')};
for(const [name,s] of Object.entries(stats)){const times=s.times.sort((a,b)=>a-b);results.results[name]={...s,times:undefined,decisions:times.length,p50ms:times[Math.floor(times.length*.5)],p95ms:times[Math.floor(times.length*.95)],maxMs:times.at(-1)};}
console.log(JSON.stringify(results,null,2));
