// Public views from full baseline matches, deterministic reservoir per match.
import {chooseBotMove} from '../fixtures/bots-before-speed.mjs';
import {newGame,viewFor,play,pass,continueRound,assertStateIntegrity} from '../../dist/src/engine.js';
export const seededRandom=seed=>n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
export function samplingCorpus(seeds=4,perMatch=32){
 const views=[],outcomes=[];
 for(const size of [6,7])for(let seed=1;seed<=seeds;seed++){
  const random=seededRandom(seed+size*1000),reservoirRandom=seededRandom(seed+size*10000),state=newGame(100,size,random),reservoir=[];
  state.players.forEach(p=>p.kind='bot');let seen=0,actions=0;
  while(state.phase!=='finished'&&actions++<10000){
   if(state.phase==='round-complete'){continueRound(state,random);continue}
   const view=viewFor(state,state.turn);seen++;
   if(reservoir.length<perMatch)reservoir.push(view);else{const index=reservoirRandom(seen);if(index<perMatch)reservoir[index]=view;}
   const move=chooseBotMove(view,'hard');if(move.type==='pass')pass(state,state.turn,random);else play(state,state.turn,move.tileId,move.side);assertStateIntegrity(state);
  }
  if(state.phase!=='finished')throw Error('Baseline match did not finish');
  views.push(...reservoir);outcomes.push({size,seed,winner:state.winner,scores:state.players.map(p=>p.score),actions:seen});
 }
 return {views,outcomes};
}
