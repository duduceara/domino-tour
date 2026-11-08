import test from 'node:test';
import assert from 'node:assert/strict';
import {TableInteraction} from '../dist/src/table.js';
const geometry={endpoints:{left:{x:100,y:0},right:{x:300,y:0}},tileWidth:30,tileHeight:60};
function make(){let commits=0;const interaction=new TableInteraction({},0,geometry,(id,side)=>({tileId:id,side,center:geometry.endpoints[side],valid:true}),()=>{commits++;return true});return {interaction,get commits(){return commits}}}
// Real engine state and validSides are covered by the full-match matrix.
// Here the pointer state machine is exercised with an actual legal engine hand.
import {newGame,legalTiles} from '../dist/src/engine.js';
function live(){for(let seed=0;seed<100;seed++){let n=seed;const state=newGame(100,6,max=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%max});if(state.turn!==0)continue;const tile=legalTiles(state,0)[0];if(!tile)continue;const interaction=new TableInteraction(state,0,geometry,(id,side)=>({tileId:id,side,center:geometry.endpoints[side],valid:true}),()=>true);return {interaction,tile}}throw new Error('No playable opening hand found')}
test('pointer ownership, cancellation and multitouch blocking',()=>{
 const setup=live();
 const {interaction:t,tile}=setup;
 assert.equal(t.begin(1,tile.id,{x:0,y:0}),true);
 assert.equal(t.begin(2,tile.id,{x:0,y:0}),false);
 assert.equal(t.move(2,{x:90,y:0}).committed,false);
 t.otherPointer(2);
 assert.equal(t.move(1,{x:90,y:0}).committed,false);
 t.end(1);assert.equal(t.drag,null);assert.equal(t.selectedTile,null);
 assert.equal(t.begin(3,tile.id,{x:0,y:0}),true);
 t.cancel();assert.equal(t.drag,null);assert.equal(t.selectedTile,null);
});
test('sideways drag does not commit a tile',()=>{
 const setup=live();
 const {interaction:t,tile}=setup;
 assert.equal(t.begin(1,tile.id,{x:0,y:0}),true);
 assert.equal(t.move(1,{x:50,y:90}).committed,false);
});
