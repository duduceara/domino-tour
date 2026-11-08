import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,play,pass,legalTiles,continueRound,runBotTurn,assertStateIntegrity} from '../dist/src/engine.js';

// Sixty complete offline matches, 10 per difficulty and deal size.
// The human seat follows a deterministic, legal policy; the other seats use
// the actual bot decision engine. This does not simulate touchscreen gestures.
test('60 complete matches: 10 for each difficulty and deal size',()=>{
 const outcomes={human:0,robots:[0,0,0],rounds:0,turns:0,groups:{}};
 for(let i=0;i<60;i++){
  const dealSize=Math.floor(i/30)===0?6:7;
  const difficulty=['easy','medium','hard'][Math.floor((i%30)/10)];
  const target=[100,150,200][i%3];
  const groupKey=dealSize+'-'+difficulty;
  const group=outcomes.groups[groupKey]??={matches:0,humanWins:0,botWins:[0,0,0],rounds:0,turns:0};
  group.matches++;
  const roundsBefore=outcomes.rounds,turnsBefore=outcomes.turns;
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
  if(s.winner===0){outcomes.human++;group.humanWins++}else{outcomes.robots[s.winner-1]++;group.botWins[s.winner-1]++}
  group.rounds+=outcomes.rounds-roundsBefore+1;
  group.turns+=outcomes.turns-turnsBefore;
  console.log(JSON.stringify({match:i+1,dealSize,difficulty,target,winner:s.winner,rounds:s.roundsCompleted,actions}));
 }
 assert.equal(outcomes.human+outcomes.robots.reduce((a,b)=>a+b,0),60);
 for(const [key,g] of Object.entries(outcomes.groups)){
  assert.equal(g.matches,10,`Expected ten matches for ${key}`);
  assert.equal(g.humanWins+g.botWins.reduce((a,b)=>a+b,0),10);
  console.log('GROUP_STATS',JSON.stringify({group:key,...g,humanWinRatePercent:100*g.humanWins/g.matches,averageRounds:g.rounds/g.matches,averageTurns:g.turns/g.matches}));
 }
 console.log('SUMMARY_60_MATCHES',JSON.stringify(outcomes));
});
