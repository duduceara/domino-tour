import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitTableViewport,portraitPoint} from '../web/table-viewport.js';
import {fitTableCamera} from '../web/table-camera.js';
import {allTiles} from '../dist/src/engine.js';
import {buildTableModel,validatePhysicalChain,verifyPhysicalContacts} from '../dist/src/table.js';
import {orientPrintedPorts} from '../dist/src/port-values.js';
import {tablePoint} from '../dist/src/viewport.js';
function euler(seed){
 const tiles=allTiles(),left=new Set(tiles.map(t=>t.id)),out=[];
 function visit(v){for(;;){const choices=tiles.filter(t=>left.has(t.id)&&(t.a===v||t.b===v));if(!choices.length)return;const t=choices[(seed=(Math.imul(seed,1664525)+1013904223)>>>0)%choices.length];left.delete(t.id);const next=t.a===v?t.b:t.a;visit(next);out.push({tileId:t.id,from:v,to:next})}}
 visit(0);return out.reverse();
}

test('portrait viewport: native phone size, safe areas, browser offsets and short-window fallback',()=>{
 for(const [w,h] of [[412,915],[412,760],[360,800],[393,873],[360,640],[915,412],[1363,936]]){
  const insets={top:12,right:8,bottom:18,left:6},offset={left:3,top:5};
  const f=portraitTableViewport(w,h,insets,offset);
  assert.equal(f.rotated,false);assert.ok(f.width<f.height);
  assert.ok(f.left>=insets.left+offset.left&&f.top>=insets.top+offset.top);
  assert.ok(f.left+f.width*f.scale<=w-insets.right+offset.left+1e-8);
  assert.ok(f.top+f.height*f.scale<=h-insets.bottom+offset.top+1e-8);
  if(h>=600)assert.equal(f.scale,1,'native scale on portrait phones');
  for(const p of [{x:0,y:0},{x:f.width/2,y:f.height/2},{x:f.width,y:f.height}]){
   const q=portraitPoint({x:f.left+p.x*f.scale,y:f.top+p.y*f.scale},f,f.scale);
   assert.ok(Math.hypot(q.x-p.x,q.y-p.y)<1e-9);
  }
 }
});
test('portrait camera and touch use the same inverse transform with zoom and pan',()=>{
 for(const scale of [.65,1,1.5,2])for(const zoom of [1,2,4]){
  const camera={x:170,y:240,scale},space={width:340,height:480,scale:1,camera},physical={width:240,height:430},pan={x:13,y:-8};
  for(const p of [{x:0,y:0},{x:170,y:240},{x:300,y:400}]){
   const screen={x:(p.x-camera.x)*scale*zoom+physical.width/2+pan.x,y:(p.y-camera.y)*scale*zoom+physical.height/2+pan.y};
   const result=tablePoint(screen,physical,space,zoom,pan);
   assert.ok(Math.hypot(result.x-p.x,result.y-p.y)<1e-9);
  }
 }
});
test('vertical solver: 360 cases retain every contact, printed value, tile and visible endpoint',()=>{
 const by=new Map(allTiles().map(t=>[t.id,t]));let count=0;
 for(let seed=1;seed<=18;seed++){
  const seq=euler(seed),pivot=seed%28,ps=[{tileId:seq[pivot].tileId,side:'right',joined:seq[pivot].from,exposed:seq[pivot].to}];let l=pivot-1,r=pivot+1;
  while(l>=0||r<28){if(l>=0&&(r>=28||((l+r+seed)%2))){const t=seq[l--];ps.push({tileId:t.tileId,side:'left',joined:t.to,exposed:t.from})}else{const t=seq[r++];ps.push({tileId:t.tileId,side:'right',joined:t.from,exposed:t.to})}}
  for(const [width,height]of [[252,410],[252,255],[200,280],[308,182]])for(const n of [1,7,14,21,28]){
   const bounds={x:0,y:0,width,height},placements=ps.slice(0,n),m=buildTableModel(placements,bounds,'vertical','classic',by,{fixedScale:true});
   assert.equal(m.status,'verified',JSON.stringify({seed,width,height,n,failure:m.failure}));
   assert.equal(m.nodes.length,n);assert.equal(new Set(m.nodes.map(t=>t.tileId)).size,n);
   assert.ok(validatePhysicalChain(m.geometry.tiles,bounds));assert.ok(verifyPhysicalContacts(placements,m.geometry.tiles));assert.ok(orientPrintedPorts(placements,m.geometry.tiles,by));
   const c=fitTableCamera(m,{width,height,scale:1},width,height);
   for(const node of m.nodes){const p=node.shape,a=p.angle*Math.PI/180,hw=(Math.abs(Math.cos(a))*p.width+Math.abs(Math.sin(a))*p.height)/2,hh=(Math.abs(Math.sin(a))*p.width+Math.abs(Math.cos(a))*p.height)/2,x=(p.center.x-c.x)*c.scale+width/2,y=(p.center.y-c.y)*c.scale+height/2;
    assert.ok(x-hw*c.scale>=-1e-7&&x+hw*c.scale<=width+1e-7);assert.ok(y-hh*c.scale>=-1e-7&&y+hh*c.scale<=height+1e-7);
   }
   for(const p of Object.values(m.geometry.endpoints)){const x=(p.x-c.x)*c.scale+width/2,y=(p.y-c.y)*c.scale+height/2;assert.ok(x>=22&&x<=width-22&&y>=22&&y<=height-22);}
   count++;
  }
 }
 assert.equal(count,360);
});
