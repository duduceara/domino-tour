import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allTiles,newGame,highestHeldDouble,play,pass,continueRound,declareFour,canDeclareFour,declareFiveAtDeal,resolveBlockedRound,runBotTurn,assertStateIntegrity,totalScore} from '../dist/src/engine.js';
const rng=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
const tile=(a,b)=>allTiles().find(t=>t.a===a&&t.b===b);
function arranged(hands, chain=[]){
 const s=newGame(100,6,n=>n-1), used=new Set([...hands.flat(),...chain].map(t=>t.id));
 s.players.forEach((p,i)=>p.hand=hands[i]);s.chain=chain;s.placements=chain.map(t=>({tileId:t.id,side:'right',joined:t.a,exposed:t.b}));
 s.sleeping=allTiles().filter(t=>!used.has(t.id));s.turn=0;s.left=chain.length?chain[0].a:null;s.right=chain.length?chain.at(-1).b:null;s.lastPlayed=chain.length?3:null;
 s.openingRequiredTileId=null;return s;
}
test('6+4 and 7+0 deals conserve every tile; targets and final threshold unchanged',()=>{
 for(const size of [6,7])for(const target of [100,150,200]){const s=newGame(target,size,rng(14));assert.equal(s.sleeping.length,28-size*4);assert.ok(s.players.every(p=>p.hand.length===size&&p.score===target));assertStateIntegrity(s)}
 assert.throws(()=>newGame(300,6));
});
test('highest double chooses seat, opening may use a different tile; winner opens next round',()=>{
 const s=newGame(100,6,rng(3));const opening=highestHeldDouble(s.players);assert.equal(s.turn,opening.seat);assert.equal(s.openingRequiredTileId,null);
 const t=s.players[s.turn].hand.find(t=>t.id!==opening.tile.id);play(s,s.turn,t.id,'right');assert.equal(s.chain[0].id,t.id);
 const r=arranged([[tile(0,1)],[tile(2,2)],[tile(3,3)],[tile(4,4)]]);r.passedSeats=[0];play(r,0,tile(0,1).id,'right');continueRound(r,rng(21));assert.equal(r.turn,0);assert.equal(r.openingRequiredTileId,null);
});
test('no doubles: largest sum then largest end then lowest seat',()=>{
 const players=[{seat:0,hand:[tile(3,5)]},{seat:1,hand:[tile(2,6)]},{seat:2,hand:[tile(0,1)]},{seat:3,hand:[tile(0,2)]}];assert.equal(highestHeldDouble(players).seat,1);
 players[0].hand=[tile(2,6)];assert.equal(highestHeldDouble(players).seat,0);
});
for(const [name,last,left,right,passed,points] of [
 ['simple',tile(1,2),null,null,true,10],['without-pass',tile(1,2),null,null,false,20],
 ['double',tile(2,2),2,3,false,30],['la-e-lo',tile(1,2),1,2,false,40]
])test(`exclusive award ${name}: ${points}, no opponent debit or duplicate payment`,()=>{
 const s=arranged([[last],[tile(4,4)],[tile(5,5)],[tile(6,6)]],left===null?[]:[tile(0,3)]);s.left=left;s.right=right;s.passedSeats=passed?[0]:[];
 const before=s.players.map(p=>p.score);play(s,0,last.id,'left');assert.equal(s.players[0].score,before[0]+points);assert.deepEqual(s.players.slice(1).map(p=>p.score),before.slice(1));assert.equal(s.roundAwards.length,1);assert.equal(s.roundAwards[0].category,name);assert.throws(()=>play(s,0,last.id,'left'));assert.equal(s.roundAwards.length,1);assertStateIntegrity(s);
});
test('four doubles optional declaration forfeits turn without pass debit, once only',()=>{
 const hand=[0,1,2,3].map(n=>tile(n,n));const s=arranged([hand,[tile(4,4)],[tile(5,5)],[tile(6,6)]]);
 assert.ok(canDeclareFour(s,0));assert.throws(()=>declareFour(s,1));declareFour(s,0);assert.equal(s.turn,1);assert.equal(totalScore(s),400);s.turn=0;assert.throws(()=>declareFour(s,0));
 const t=arranged([hand,[tile(4,4)],[tile(5,5)],[tile(6,6)]]);play(t,0,hand[0].id,'right');assert.equal(t.chain.length,1);
});
test('five doubles declares automatically on distribution, awards 10, preserves hand and next opener',()=>{
 let found;
 for(let seed=1;seed<=10000;seed++){const s=newGame(100,7,rng(seed));if(s.events.some(e=>e.type==='declare-five')){found=s;break}}
 assert.ok(found);const event=found.events.find(e=>e.type==='declare-five');assert.equal(found.phase,'round-complete');assert.equal(found.players[event.seat].score,110);assert.equal(found.nextOpeningSeat,event.seat);assert.equal(found.roundAwards.length,1);assertStateIntegrity(found);assert.equal(declareFiveAtDeal(found),false);
});
test('blocked round: minimum pip sum, fair injectable tie draw, no double resolution',()=>{
 for(const pick of [0,1]){const s=arranged([[tile(0,2)],[tile(0,1)],[tile(1,1)],[tile(0,0)]],[tile(6,6)]);s.left=6;s.right=6;
 // Unique minimum is seat 3, RNG must not run.
 resolveBlockedRound(s,()=>{throw Error('unexpected draw')});assert.equal(s.nextOpeningSeat,3);assert.equal(s.players[3].score,110);assert.throws(()=>resolveBlockedRound(s));assertStateIntegrity(s);
 const t=arranged([[tile(0,3)],[tile(1,2)],[tile(4,4)],[tile(5,5)]],[tile(6,6)]);let calls=0;resolveBlockedRound(t,n=>{calls++;assert.equal(n,2);return pick});assert.equal(t.nextOpeningSeat,pick);assert.equal(calls,1);assert.equal(t.roundAwards[0].points,10);
 }
});
test('consecutive passes keep beneficiary and transfer only five each before any award',()=>{
 const s=arranged([[tile(2,2)],[tile(3,3)],[tile(4,4)],[tile(1,5)]],[tile(0,1)]);s.left=0;s.right=1;s.lastPlayed=3;
 for(const seat of [0,1,2])pass(s,seat);assert.deepEqual(s.players.map(p=>p.score),[95,95,95,115]);assert.equal(s.turn,3);assert.equal(s.phase,'playing');assert.equal(s.roundAwards.length,0);
});
test('complete matches with human seat and three existing bots, JSON restore and duplicate guards',()=>{
 for(const size of [6,7])for(let seed=1;seed<=20;seed++){
  let s=newGame(100,size,rng(seed)),steps=0;const random=rng(seed+1000);
  while(s.phase!=='finished'&&steps++<10000){
   if(s.phase==='round-complete'){continueRound(s,random);continue}
   assert.equal(s.players[0].kind,'human');assert.ok(s.players.slice(1).every(p=>p.kind==='bot'));
   if(s.turn===0){const t=s.players[0].hand.find(t=>s.left===null||[t.a,t.b].includes(s.left)||[t.a,t.b].includes(s.right));if(t){const side=s.left===null||[t.a,t.b].includes(s.left)?'left':'right';play(s,0,t.id,side);assert.throws(()=>play(s,0,t.id,side))}else pass(s,0,random)}else runBotTurn(s,random);
   assertStateIntegrity(s);
   const copy=JSON.parse(JSON.stringify(s));assert.deepEqual(copy,s);assertStateIntegrity(copy);s=copy;
   assert.equal(totalScore(s),400+s.roundAwards.reduce((sum,a)=>sum+a.points,0));
  }
  assert.equal(s.phase,'finished');assert.ok(s.players[s.winner].score>=200);assert.equal(s.events.filter(e=>e.type==='finish').length,1);assert.throws(()=>continueRound(s));
 }
});
test('third forced pass resolves a real block once and preserves each pass transfer',()=>{
 const s=arranged([[tile(0,1)],[tile(2,2)],[tile(3,3)],[tile(4,4)]],[tile(6,6)]);s.lastPlayed=3;
 pass(s,0);pass(s,1);pass(s,2);
 assert.equal(s.phase,'round-complete');assert.equal(s.nextOpeningSeat,0);
 assert.deepEqual(s.players.map(p=>p.score),[105,95,95,115]);
 assert.equal(s.events.filter(e=>e.type==='pass').length,3);assert.equal(s.events.filter(e=>e.type==='round-finished').length,1);assert.throws(()=>pass(s,2));
});
test('invalid tie RNG rejects without resolving or paying; current player cannot pass a legal tile',()=>{
 const s=arranged([[tile(0,3)],[tile(1,2)],[tile(4,4)],[tile(5,5)]],[tile(6,6)]);const before=JSON.stringify(s);
 assert.throws(()=>resolveBlockedRound(s,()=>2));assert.equal(JSON.stringify(s),before);
 const t=arranged([[tile(0,1)],[tile(2,2)],[tile(3,3)],[tile(4,4)]],[tile(0,0)]);assert.throws(()=>pass(t,0));
});
