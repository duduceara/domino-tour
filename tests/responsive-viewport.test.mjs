import {test} from 'node:test';
import assert from 'node:assert/strict';
import {landscapeViewport,framePoint} from '../dist/src/viewport.js';
import {LocalSession} from '../dist/src/session.js';
import {play,assertStateIntegrity} from '../dist/src/engine.js';
const cases=[[568,320],[640,360],[740,360],[844,390],[915,412],[1024,768],[1280,800],[1366,1024],[720,540],[1440,900],[1920,1080],[2560,1440]];
for(const [w,h] of cases)test(`viewport ${w}x${h}: landscape and safe-area coordinate roundtrip`,()=>{
 for(const [width,height] of [[w,h],[h,w]]){
 const inset={left:12,right:16,top:8,bottom:10};const v=landscapeViewport(width,height,inset);
 assert.ok(v.width>=v.height);assert.equal(v.width*v.height,(width-28)*(height-18));
 const frame={left:v.left,top:v.top,width:v.rotated?v.height:v.width};
 for(const p of [{x:0,y:0},{x:v.width/2,y:v.height/2},{x:v.width,y:v.height}]){
 const client=v.rotated?{x:frame.left+v.height-p.y,y:frame.top+p.x}:{x:frame.left+p.x,y:frame.top+p.y};
 assert.deepEqual(framePoint(client,frame,v.rotated),p);
 }
 }
});
test('resize and orientation preserve match state',()=>{
 const s=new LocalSession(100,6);play(s.state,s.state.turn,s.state.players[s.state.turn].hand[0].id,'right');s.refresh();const before=JSON.stringify(s.state);
 for(const [width,height] of cases){for(const [w,h] of [[width,height],[height,width]]){const v=landscapeViewport(w,h);s.resize({x:0,y:0,width:Math.min(1160,v.width-180),height:Math.max(120,v.height-180)},'horizontal');assert.equal(JSON.stringify(s.state),before);assert.equal(s.interaction.drag,null);assertStateIntegrity(s.state)}}
});
