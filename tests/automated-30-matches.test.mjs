import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,play,pass,legalTiles,continueRound,runBotTurn,assertStateIntegrity} from '../dist/src/engine.js';

// Thirty complete offline matches, not just thirty rounds.
// The human seat follows a deterministic, legal policy; the other seats use
// the actual bot decision engine. This does not simulate touchscreen gestures.
test('30 complete matches: human versus three bots, 6/7 tiles and three difficulties',()=>{
 const outcomes={human:0,robots:[0,0,0],rounds:0,turns:0};
 for(let i=0;i<30;i++){
  const dealSize=i%2?7:6;
  const difficulty=['easy','medium','hard'][Math.floor(i/2)%3];
  const target=[100,150,200][Math.floor(i/6)%3];
  const s=newGame(target,dealSize);
  let actions=0;
  while(s.phase!=='finished'){
   assert.ok(++actions<12000,`Match ${i+1} exceeded action limit`);
   assertStateIntegrity(s);
   if(s.phase==='round-complete'){
    outcomes.rounds++;
    continueRound(s);
    continue;
   }
   assert.equal(s.phase,'playing');
   if(s.turn===0){
    const moves=legalTiles(s,0);
    if(!moves.length)pass(s,0);
    else{
     // Human uses only the human hand and visible endpoints.
     const tile=moves[(i+actions)%moves.length];
     const side=s.left===null||tile.a===s.left||tile.b===s.left?'left':'right';
     play(s,0,tile.id,side);
    }
   }else{
    runBotTurn(s,undefined,difficulty);
   }
   outcomes.turns++;
  }
  assertStateIntegrity(s);
  assert.ok(Number.isInteger(s.winner)&&s.winner>=0&&s.winner<4);
  assert.ok(s.players[s.winner].score>=target*2);
  if(s.winner===0)outcomes.human++;else outcomes.robots[s.winner-1]++;
  console.log(JSON.stringify({match:i+1,dealSize,difficulty,target,winner:s.winner,rounds:s.roundsCompleted,actions}));
 }
 assert.equal(outcomes.human+outcomes.robots.reduce((a,b)=>a+b,0),30);
 console.log('SUMMARY_30_MATCHES',JSON.stringify(outcomes));
});
