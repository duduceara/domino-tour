import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reconcileHandLayout,previewHandMove,handFaces} from '../dist/src/hand.js';
import {allTiles,newGame,play,pass} from '../dist/src/engine.js';
import {LocalSession} from '../dist/src/session.js';
const tile=(a,b)=>allTiles().find(t=>t.a===a&&t.b===b);
function session(){const s=new LocalSession();s.state=newGame(100,6,n=>n-1);s.handLayout=null;s.interaction=s.makeInteraction();return s}
test('manual reorder changes only visual order, allows blocked tiles during other turns, never sorts',()=>{
 const s=session();s.state.turn=1;const before=JSON.stringify(s.state),order=s.orderedHand().map(t=>t.id);
 assert.ok(s.moveHandTile(order.at(-1),order[0],order[0]));assert.deepEqual(s.orderedHand().map(t=>t.id),[order.at(-1),...order.slice(0,-1)]);assert.equal(JSON.stringify(s.state),before);
 const snapshot=s.snapshotHandLayout();s.refresh();s.resize({x:0,y:0,width:120,height:120},'horizontal');assert.deepEqual(s.snapshotHandLayout(),snapshot);assert.equal(JSON.stringify(s.state),before);
 assert.equal(s.moveHandTile(999,order[0]),false);assert.equal(s.moveHandTile(order[0],999),false);assert.equal(JSON.stringify(s.state),before);
});
test('moving stone turns 180 degrees to align equal top/bottom; stationary stones never turn',()=>{
 const hand=[tile(3,5),tile(5,6),tile(0,2)],layout=reconcileHandLayout(null,hand),before=structuredClone(layout);
 const preview=previewHandMove(layout,hand,hand[0].id,null,hand[1].id);
 assert.deepEqual(layout,before,'preview never commits');assert.deepEqual(handFaces(hand[0],preview.flipped[hand[0].id]),[5,3]);assert.deepEqual(handFaces(hand[1],preview.flipped[hand[1].id]),[5,6]);assert.equal(preview.flipped[hand[2].id],false);
 assert.deepEqual(hand[0],tile(3,5),'official values unchanged');
});
test('existing orientation wins ties, no shared value does not force a flip, neighbor flip is respected',()=>{
 const hand=[tile(3,5),tile(2,5),tile(5,5),tile(0,1)],layout=reconcileHandLayout(null,hand);
 let p=previewHandMove(layout,hand,hand[0].id,null,hand[1].id);assert.equal(p.flipped[hand[0].id],false,'shared bottom stays at bottom');
 p=previewHandMove(layout,hand,hand[0].id,null,hand[2].id);assert.equal(p.flipped[hand[0].id],false,'double neighbor admits either orientation');
 layout.flipped[hand[0].id]=true;p=previewHandMove(layout,hand,hand[0].id,null,hand[3].id);assert.equal(p.flipped[hand[0].id],true,'no match preserves chosen orientation');
 layout.flipped[hand[0].id]=false;layout.flipped[hand[1].id]=true;p=previewHandMove(layout,hand,hand[0].id,null,hand[1].id);assert.equal(p.flipped[hand[0].id],true);assert.equal(p.flipped[hand[1].id],true,'neighbor was not changed');
});
test('remaining order and orientation survive official plays, passes and bot turns',()=>{
 const s=session();s.state.turn=0;const hand=s.orderedHand(),ids=hand.map(t=>t.id);s.moveHandTile(ids.at(-1),ids[0]);s.flipHandTile(ids[1]);const layout=s.snapshotHandLayout();
 play(s.state,0,ids[0],'right');assert.deepEqual(s.orderedHand().map(t=>t.id),layout.order.filter(id=>id!==ids[0]));assert.equal(s.handLayout.flipped[ids[1]],true);
 for(let i=0;i<3&&s.state.phase==='playing'&&s.state.turn!==0;i++)s.advanceBots(1);
 assert.deepEqual(s.orderedHand().map(t=>t.id),layout.order.filter(id=>id!==ids[0]));assert.equal(s.handLayout.flipped[ids[1]],true);
 const before=s.snapshotHandLayout();s.state.turn=0;s.state.left=6;s.state.right=6;s.state.lastPlayed=3;
 // Identity deal gives human only 0-x pieces; 0-6 was just played, so pass is legal.
 if(s.state.players[0].hand.every(t=>t.a!==6&&t.b!==6)){pass(s.state,0);assert.deepEqual(s.snapshotHandLayout(),before)}
});
test('layout roundtrip prepares future resume, copies input and rejects a different round/hand',()=>{
 const s=session(),ids=s.orderedHand().map(t=>t.id);s.moveHandTile(ids.at(-1),ids[0]);s.flipHandTile(ids[2]);const snapshot=JSON.parse(JSON.stringify(s.snapshotHandLayout()));
 const resumed=session();resumed.state=structuredClone(s.state);resumed.interaction=resumed.makeInteraction();resumed.restoreHandLayout(snapshot);assert.deepEqual(resumed.snapshotHandLayout(),snapshot);
 snapshot.order.reverse();assert.notDeepEqual(resumed.snapshotHandLayout().order,snapshot.order,'no alias');
 const before=resumed.snapshotHandLayout();assert.throws(()=>resumed.restoreHandLayout({...before,round:999}));assert.throws(()=>resumed.restoreHandLayout({...before,order:[999]}));assert.deepEqual(resumed.snapshotHandLayout(),before);
 resumed.newMatch();assert.equal(resumed.handLayout,null,'new distribution starts in deal order');
});
test('preview cancellation and explicit 180 flip do not change the rules state',()=>{
 const s=session(),id=s.orderedHand()[0].id,before=JSON.stringify(s.state),layout=s.snapshotHandLayout();s.previewHandMove(id,null,s.orderedHand()[1].id);s.interaction.cancel();assert.deepEqual(s.snapshotHandLayout(),layout);assert.ok(s.flipHandTile(id));assert.ok(s.flipHandTile(id));assert.deepEqual(s.snapshotHandLayout(),layout);assert.equal(JSON.stringify(s.state),before);
});
