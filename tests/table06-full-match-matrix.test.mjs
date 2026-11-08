import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,allTiles,legalTiles,play,pass,continueRound,runBotTurn,assertStateIntegrity} from '../dist/src/engine.js';
const seeded=(seed)=>{let n=seed>>>0;return max=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%max}};
for(const deal of [6,7])for(const difficulty of ['easy','medium','hard']){
 test(`table06 full games: ${deal} tiles, ${difficulty}, 10 seeded matches`,()=>{
  for(let k=0;k<10;k++){
   const random=seeded(20261107+deal*100+k),state=newGame(100,deal,random);
   assert.equal(allTiles().length,28);
   assert.ok(state.players.every(p=>p.hand.length===deal));
   assert.equal(state.sleeping.length,28-4*deal);
   assertStateIntegrity(state);
   let turns=0;
   while(state.phase!=='finished'&&turns<2500){
    if(state.phase==='round-complete')continueRound(state,random);
    else if(state.phase==='playing'){
     if(state.turn===0){
      const tiles=legalTiles(state,0);
      if(!tiles.length)pass(state,0,random);
      else {const tile=tiles[0],side=state.left===null||tile.a===state.left||tile.b===state.left?'left':'right';play(state,0,tile.id,side)}
     }else runBotTurn(state,random,difficulty);
    }else assert.fail('Unexpected game phase: '+state.phase);
    assertStateIntegrity(state);turns++;
   }
   assert.equal(state.phase,'finished',`match ${k} exceeded turn limit`);
  }
 });
}
