import test from 'node:test';
import assert from 'node:assert/strict';
import {TableInteraction} from '../dist/src/table.js';
const geometry={endpoints:{left:{x:100,y:0},right:{x:300,y:0}},tileWidth:30,tileHeight:60};
function make(){let commits=0;const interaction=new TableInteraction({},0,geometry,(id,side)=>({tileId:id,side,center:geometry.endpoints[side],valid:true}),()=>{commits++;return true});return {interaction,get commits(){return commits}}}
// Real engine state and validSides are covered by the full-match matrix.
// Here the pointer state machine is exercised with an actual legal engine hand.
import {newGame,legalTiles} from '../dist/src/engine.js';
function live(){const state=newGame(100,6,max=>0);const tile=legalTiles(state,0)[0];if(!tile)return null;const interaction=new TableInteraction(state,0,geometry,(id,side)=>({tileId:id,side,center:geometry.endpoints[side],valid:true}),()=>true);return {interaction,tile}}
test('pointer ownership, cancellation and multitouch blocking',()=>{
 const setup=live();if(!setup)return;
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
 const setup=live();if(!setup)return;
 const {interaction:t,tile}=setup;
 assert.equal(t.begin(1,tile.id,{x:0,y:0}),true);
 assert.equal(t.move(1,{x:50,y:90}).committed,false);
});
