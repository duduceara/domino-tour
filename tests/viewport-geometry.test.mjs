import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fittedTableSpace,tablePoint} from '../dist/src/viewport.js';
import {buildTableModel} from '../dist/src/table.js';
test('physical small bounds become uniform solver space >=120 without stretching',()=>{
 for(const [w,h] of [[568,79],[396,90],[572,102],[572,122],[20,10],[120,120],[1000,600]]){
 const v=fittedTableSpace(w,h);assert.ok(v.width>=120&&v.height>=120);assert.ok(Math.abs(v.width*v.scale-w)<1e-8);assert.ok(Math.abs(v.height*v.scale-h)<1e-8);
 for(const style of ['classic','loop','spiral']){const m=buildTableModel([{tileId:27,side:'right',joined:6,exposed:6}],{x:0,y:0,width:v.width,height:v.height},'horizontal',style,new Map([[27,{id:27,a:6,b:6}]]));assert.equal(m.status,'verified')}
 }
});
test('zero, hidden and non-finite surfaces defer instead of supplying fake bounds',()=>{for(const [w,h] of [[0,300],[300,0],[-1,300],[NaN,300],[300,Infinity]])assert.equal(fittedTableSpace(w,h),null)});
test('touch is inverse of fit + zoom + pan on actual small surfaces',()=>{
 for(const [w,h] of [[568,79],[396,90],[572,122],[800,430]]){const v=fittedTableSpace(w,h);for(const zoom of [1,2,8])for(const p of [{x:0,y:0},{x:v.width/2,y:v.height/2},{x:v.width,y:v.height}]){const pan={x:23,y:-17},k=v.scale*zoom;const screen={x:w/2+pan.x+(p.x-v.width/2)*k,y:h/2+pan.y+(p.y-v.height/2)*k};const actual=tablePoint(screen,{width:w,height:h},v,zoom,pan);assert.ok(Math.abs(actual.x-p.x)<1e-8);assert.ok(Math.abs(actual.y-p.y)<1e-8)}}
});

test('Samsung landscape and portrait table bounds never report INVALID_BOUNDS after fit',()=>{
 const samsungSurfaces=[[568,79],[568,96],[572,102],[740,104],[820,115],[320,78],[79,568],[390,120],[844,190]];
 for(const [w,h] of samsungSurfaces){
  const fit=fittedTableSpace(w,h);
  assert.ok(fit.width>=120&&fit.height>=120,`invalid fitted solver bounds for ${w}x${h}`);
  for(const style of ['classic','loop','spiral']){
   const model=buildTableModel([{tileId:27,side:'right',joined:6,exposed:6}],{x:0,y:0,width:fit.width,height:fit.height},'horizontal',style,new Map([[27,{id:27,a:6,b:6}]]));
   assert.notEqual(model.failure,'INVALID_BOUNDS',`Samsung ${w}x${h} ${style}`);
  }
 }
});

test('Samsung bounds remain valid with an actual progressing four-seat engine chain',async()=>{
 const {newGame,auditedBotTurn}=await import('../dist/src/engine.js');
 const s=newGame(100,6,n=>n-1);
 s.players.forEach(p=>p.kind='bot');
 for(let turn=0;turn<24&&s.phase==='playing';turn++){
  auditedBotTurn(s);
  const byId=new Map(s.chain.map(t=>[t.id,t]));
  for(const [w,h] of [[568,79],[572,102],[740,104]]){
   const fitted=fittedTableSpace(w,h);
   const m=buildTableModel(s.placements,{x:0,y:0,width:fitted.width,height:fitted.height},'horizontal','classic',byId);
   assert.notEqual(m.failure,'INVALID_BOUNDS',`turn ${turn}, ${w}x${h}`);
  }
 }
});

test('occupied-chain camera has an exact inverse for mobile touch',()=>{
 const logical={width:800,height:430,scale:1,camera:{x:270,y:170,scale:3.2}},physical={width:640,height:180},pan={x:9,y:-4};
 for(const zoom of [1,2,4])for(const [x,y] of [[270,170],[220,140],[300,180]]){
  const scale=logical.camera.scale*zoom;
  const result=tablePoint({x:physical.width/2+pan.x+(x-270)*scale,y:physical.height/2+pan.y+(y-170)*scale},physical,logical,zoom,pan);
  assert.ok(Math.abs(result.x-x)<1e-9&&Math.abs(result.y-y)<1e-9);
 }
});
