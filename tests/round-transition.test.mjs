import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame, play, pass, continueRound, assertStateIntegrity, totalScore} from '../dist/src/engine.js';
import {LocalSession} from '../dist/src/session.js';

function fixture(){
 const s=newGame(100,6,n=>n-1);
 // Preserve the original 28 tiles by redistributing the existing tiles.
 const all=[...s.players.flatMap(p=>p.hand),...s.sleeping];
 const finishing=all.find(t=>t.a===t.b);
 const remaining=all.filter(t=>t.id!==finishing.id);
 s.players[0].hand=[finishing];
 s.players[1].hand=remaining.slice(0,9);
 s.players[2].hand=remaining.slice(9,18);
 s.players[3].hand=remaining.slice(18,27);
 s.sleeping=[];
 s.chain=[];s.placements=[];s.left=null;s.right=null;
 s.turn=0;s.openingRequiredTileId=finishing.id;s.lastPlayed=null;
 assertStateIntegrity(s);
 return {s,tile:finishing};
}
test('batida pauses, preserves final board and score until explicit next-round confirmation',()=>{
 const {s,tile}=fixture(),total=totalScore(s);
 play(s,0,tile.id,'right');
 assert.equal(s.phase,'round-complete');
 assert.equal(s.roundsCompleted,1);
 assert.equal(s.nextOpeningSeat,0);
 assert.equal(s.chain.length,1);
 assert.equal(s.players[0].hand.length,0);
 assert.equal(s.players[0].score,115);
 assert.equal(totalScore(s),total);
 assert.throws(()=>play(s,0,tile.id,'right'));
 assert.throws(()=>continueRound({...s,phase:'blocked-awaiting-rule'}));
 assertStateIntegrity(s);
 continueRound(s,n=>n-1);
 assert.equal(s.phase,'playing');
 assert.equal(s.chain.length,0);
 assert.equal(s.roundsCompleted,1);
 assert.equal(s.nextOpeningSeat,null);
 assert.ok(s.players.every(p=>p.hand.length===6));
 assert.equal(s.turn,0);
 assertStateIntegrity(s);
 assert.throws(()=>continueRound(s));
});
test('final match never offers next round and keeps the winner',()=>{
 const {s,tile}=fixture();
 s.players[0].score=185;
 for(const p of s.players.slice(1))p.score=100;
 play(s,0,tile.id,'right');
 assert.equal(s.phase,'finished');
 assert.equal(s.winner,0);
 assert.equal(s.nextOpeningSeat,undefined);
 assert.throws(()=>continueRound(s));
 assertStateIntegrity(s);
});
test('local session nextRound rejects noncompleted rounds without changing state',()=>{
 const session=new LocalSession(100,6);
 const state=session.state;
 assert.equal(session.nextRound(),false);
 assert.equal(session.state,state);
});
