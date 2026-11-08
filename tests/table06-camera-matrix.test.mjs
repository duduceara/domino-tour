import test from 'node:test';
import assert from 'node:assert/strict';
import {fitTableCamera,cameraPoint} from '../web/table-camera.js';
for(const count of [1,5,10,20,28])for(const portrait of [true,false]){
 test(`table06 camera round-trip: ${count} tiles, ${portrait?'portrait':'landscape'}`,()=>{
  const model={nodes:Array.from({length:count},(_,i)=>({shape:{angle:i%4*90,width:22,height:44,center:{x:i*26,y:90}}})),geometry:{endpoints:{left:{x:0,y:90},right:{x:count*26,y:90}}}};
  const before=JSON.stringify(model),space={width:800,height:430,scale:1,quarterTurn:portrait};
  const width=portrait?360:640,height=portrait?640:360;
  const camera=fitTableCamera(model,space,width,height);
  assert.ok(Number.isFinite(camera.scale)&&camera.scale>0);
  assert.equal(JSON.stringify(model),before);
  const p={x:120,y:65},zoom=1.5,pan={x:13,y:-7},factor=camera.scale*zoom;
  const screen=portrait?{x:width/2+pan.x-(p.y-camera.y)*factor,y:height/2+pan.y+(p.x-camera.x)*factor}:{x:width/2+pan.x+(p.x-camera.x)*factor,y:height/2+pan.y+(p.y-camera.y)*factor};
  const mapped=cameraPoint(screen,{width,height},{...space,camera},zoom,pan);
  assert.ok(Math.abs(mapped.x-p.x)<1e-7);
  assert.ok(Math.abs(mapped.y-p.y)<1e-7);
 });
}
