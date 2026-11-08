import test from 'node:test';
import assert from 'node:assert/strict';
import {TurnClock} from '../web/turn-clock.js';
import {cameraPoint,chainSpace,fitTableCamera} from '../web/table-camera.js';

test('human clock pauses, resumes and expires only once',()=>{
 let now=0;const c=new TurnClock(()=>now);
 assert.equal(c.start('one'),60);now=30000;assert.equal(c.remaining(),30);
 c.pause();now=90000;assert.equal(c.remaining(),30);assert.equal(c.claimExpiry(),false);
 c.resume();assert.equal(c.remaining(),30);now=120000;
 assert.equal(c.claimExpiry(),true);assert.equal(c.claimExpiry(),false);
 assert.equal(c.start('two'),60);now=125000;assert.equal(c.start('two'),55);
 c.stop();assert.equal(c.remaining(),60);
});
test('portrait chain rotation and inverse pointer mapping respect zoom and pan',()=>{
 const space=chainSpace(360,640);assert.equal(space.quarterTurn,true);
 const camera={x:120,y:80,scale:2,quarterTurn:true};
 const world={x:150,y:95},pan={x:23,y:-17},scale=3;
 const screen={x:180+pan.x-(world.y-camera.y)*scale,y:320+pan.y+(world.x-camera.x)*scale};
 const mapped=cameraPoint(screen,{width:360,height:640},{...space,camera},1.5,pan);
 assert.ok(Math.abs(mapped.x-world.x)<1e-8);assert.ok(Math.abs(mapped.y-world.y)<1e-8);
});
test('long-chain fit produces finite positive scale without changing geometry',()=>{
 const nodes=Array.from({length:20},(_,i)=>({shape:{angle:0,width:20,height:40,center:{x:20+i*22,y:100}}}));
 const model={nodes,geometry:{endpoints:{left:{x:0,y:100},right:{x:460,y:100}}}};
 const snapshot=JSON.stringify(model);
 const camera=fitTableCamera(model,{width:640,height:360,scale:1,quarterTurn:true},360,640);
 assert.ok(Number.isFinite(camera.scale)&&camera.scale>0);
 assert.equal(JSON.stringify(model),snapshot);
});
