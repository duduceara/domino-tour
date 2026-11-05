import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BOT_LEVELS,chooseBotMove} from '../../dist/src/bots.js';
import {newGame,viewFor,play,pass,legalTiles,continueRound,assertStateIntegrity,totalScore} from '../../dist/src/engine.js';
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
export const OPPONENT_PROFILES={easy:['easy','easy','easy'],medium:['medium','medium','medium'],hard:['hard','hard','hard'],mixed:['easy','medium','hard'],random:['random','random','random']};
const AWARDS={'simple':10,'blocked':10,'five-doubles':10,'without-pass':20,'double':30,'la-e-lo':40};
function randomLegal(view,random){
 const options=[];
 for(const t of view.ownHand){if(view.left===null)options.push({type:'play',tileId:t.id,side:'right'});else for(const side of ['left','right'])if(t.a===view[side]||t.b===view[side])options.push({type:'play',tileId:t.id,side});}
 return options.length?options[random(options.length)]:{type:'pass'};
}
export function homologationMatrix(seedCount=4){
 assert.ok(Number.isInteger(seedCount)&&seedCount>0&&seedCount<=100);
 const digest=createHash('sha256'),results={seedCount,matches:0,actions:0,passes:0,rounds:0,fiveDoubleWins:0,duplicateRejections:0,awards:Object.fromEntries(Object.keys(AWARDS).map(k=>[k,0])),focal:Object.fromEntries(BOT_LEVELS.map(level=>[level,{matches:0,wins:0,seats:[0,0,0,0]}])),profiles:{}};
 for(const size of [6,7])for(let seed=1;seed<=seedCount;seed++)for(const level of BOT_LEVELS)for(const [profile,opponents] of Object.entries(OPPONENT_PROFILES))for(let seat=0;seat<4;seat++){
  const random=rng(seed+size*10000),moveRandom=rng(seed+size*100000+seat),s=newGame(100,size,random);s.players.forEach(p=>p.kind='bot');let turns=0,duplicatePlay=false,duplicatePass=false;
  while(s.phase!=='finished'&&turns++<10000){
   if(s.phase==='round-complete'){const opener=s.nextOpeningSeat;continueRound(s,random);assert.equal(s.turn,opener);continue;}
   const actor=s.turn,last=s.lastPlayed,scores=s.players.map(p=>p.score),start=s.events.length,view=viewFor(s,actor),strategy=actor===seat?level:opponents[(actor-seat+3)%4];
   const move=strategy==='random'?randomLegal(view,moveRandom):chooseBotMove(view,strategy);
   if(move.type==='pass'){assert.equal(legalTiles(s,actor).length,0);pass(s,actor,random);}else{assert.ok(legalTiles(s,actor).some(t=>t.id===move.tileId));play(s,actor,move.tileId,move.side);}
   const events=s.events.slice(start),action=events.filter(e=>e.type==='play'||e.type==='pass');assert.equal(action.length,1);
   const award=events.find(e=>e.type==='round-finished');
   for(let p=0;p<4;p++)assert.equal(s.players[p].score-scores[p],(move.type==='pass'?(p===actor?-5:p===last?5:0):0)+(award?.seat===p?award.points:0));
   if(move.type==='pass')assert.equal(action[0].beneficiary,last);
   if(s.phase==='playing')assert.equal(s.turn,(actor+1)%4);
   assertStateIntegrity(s);assert.equal(totalScore(s),400+s.roundAwards.reduce((n,a)=>n+a.points,0));
   if((move.type==='play'&&!duplicatePlay)||(move.type==='pass'&&!duplicatePass)){
    const before=JSON.stringify(s);assert.throws(()=>move.type==='pass'?pass(s,actor,random):play(s,actor,move.tileId,move.side));assert.equal(JSON.stringify(s),before);results.duplicateRejections++;
    if(move.type==='play')duplicatePlay=true;else duplicatePass=true;
   }
  }
  assert.equal(s.phase,'finished');assert.equal(s.events.filter(e=>e.type==='finish').length,1);assert.ok(s.players[s.winner].score>=s.target*2);
  assert.ok(!s.events.some(e=>e.type==='declare-four'));assert.equal(s.declaredFour,undefined);
  for(const a of s.roundAwards){assert.equal(a.points,AWARDS[a.category]);results.awards[a.category]++;}
  results.matches++;results.actions+=s.events.filter(e=>e.type==='play'||e.type==='pass').length;results.passes+=s.events.filter(e=>e.type==='pass').length;results.rounds+=s.roundsCompleted;results.fiveDoubleWins+=s.events.filter(e=>e.type==='declare-five').length;
  results.focal[level].matches++;results.focal[level].wins+=Number(s.winner===seat);results.focal[level].seats[seat]++;
  const key=size+':'+profile;const group=results.profiles[key]??={matches:0,focalWins:0};group.matches++;group.focalWins+=Number(s.winner===seat);
  digest.update(JSON.stringify([size,seed,level,profile,seat,s.winner,s.players.map(p=>p.score),s.events]));
 }
 assert.equal(results.matches,2*seedCount*BOT_LEVELS.length*Object.keys(OPPONENT_PROFILES).length*4);
 results.traceHash=digest.digest('hex');return results;
}
