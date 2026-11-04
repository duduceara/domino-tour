import assert from 'node:assert/strict';
import {test} from 'node:test';
import {TableInteraction} from '../dist/src/table.js';

function fixture(sides){
 const state={phase:'playing',turn:0,openingRequiredTileId:null,left:sides.includes('left')?2:6,right:sides.includes('right')?5:6,players:[{hand:[{id:7,a:2,b:5}]}]};
 const geometry={endpoints:{left:{x:50,y:50},right:{x:350,y:50}},tileWidth:40,tileHeight:20};
 let plays=[];
 const interaction=new TableInteraction(state,0,geometry,(id,side)=>sides.includes(side)?{tileId:id,side,center:geometry.endpoints[side],valid:true}:null,(id,side)=>{plays.push(side);return true});
 return {interaction,plays,state};
}
test('one legal endpoint: selected tile commits exactly once on second tap',()=>{
 const {interaction,plays}=fixture(['left']);
 assert.equal(interaction.begin(1,7,{x:150,y:150}),true);
 interaction.end(1);
 assert.equal(interaction.selectedTile,7);
 assert.equal(interaction.begin(2,7,{x:150,y:150}),true);
 interaction.end(2);
 assert.equal(interaction.tapEndpoint('left'),true);
 assert.deepEqual(plays,['left']);
});
test('two legal endpoints: selection alone never commits',()=>{
 const {interaction,plays}=fixture(['left','right']);
 assert.equal(interaction.begin(1,7,{x:150,y:150}),true);
 interaction.end(1);
 assert.equal(interaction.begin(2,7,{x:150,y:150}),true);
 interaction.end(2);
 assert.deepEqual(plays,[]);
 assert.equal(interaction.tapEndpoint('right'),true);
 assert.deepEqual(plays,['right']);
});
test('illegal endpoint is rejected',()=>{
 const {interaction,plays}=fixture(['left']);
 interaction.select(7);
 assert.equal(interaction.tapEndpoint('right'),false);
 assert.deepEqual(plays,[]);
});
test('pointer cancellation clears selection',()=>{
 const {interaction,plays}=fixture(['left']);
 interaction.begin(1,7,{x:150,y:150});
 interaction.cancel();
 assert.equal(interaction.selectedTile,null);
 assert.deepEqual(plays,[]);
});
test('drag toward a legal endpoint can commit; sideways swipe cannot',()=>{
 const {interaction,plays}=fixture(['right']);
 interaction.begin(1,7,{x:100,y:50});
 assert.equal(interaction.move(1,{x:100,y:130}).committed,false);
 assert.deepEqual(plays,[]);
 assert.equal(interaction.move(1,{x:280,y:50}).committed,true);
 assert.deepEqual(plays,['right']);
});
