import {fitTableCamera} from '../web/table-camera.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {TurnClock} from '../web/turn-clock.js';
import {allTiles} from '../dist/src/engine.js';
import {buildTableModel,validatePhysicalChain,verifyPhysicalContacts} from '../dist/src/table.js';
import {orientPrintedPorts} from '../dist/src/port-values.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('human deadline survives rerenders, warns at ten, expires once and cancels on leaving',()=>{
 let now=0;const clock=new TurnClock(()=>now);clock.start('turn-1');
 now=49000;assert.equal(clock.start('turn-1'),11);
 now=50000;assert.equal(clock.remaining(),10);assert.equal(clock.claimExpiry(),false);
 now=60000;assert.equal(clock.claimExpiry(),true);assert.equal(clock.claimExpiry(),false);
 clock.start('turn-2');assert.equal(clock.remaining(),60);clock.stop();now+=60000;assert.equal(clock.claimExpiry(),false);
});
test('hidden page and exit confirmation pause remaining time without granting another minute',()=>{
 let now=0;const c=new TurnClock(()=>now);c.start('1');now=12000;c.pause();now=90000;assert.equal(c.remaining(),48);c.resume();now+=47000;assert.equal(c.remaining(),1);now+=1000;assert.equal(c.claimExpiry(),true);
});
function euler(seed){
 const tiles=allTiles(),left=new Set(tiles.map(t=>t.id)),out=[];
 function visit(v){for(;;){const choices=tiles.filter(t=>left.has(t.id)&&(t.a===v||t.b===v));if(!choices.length)return;const t=choices[(seed=(Math.imul(seed,1664525)+1013904223)>>>0)%choices.length];left.delete(t.id);const next=t.a===v?t.b:t.a;visit(next);out.push({tileId:t.id,from:v,to:next})}}
 visit(0);return out.reverse();
}
test('900 geometry cases: 28 unique pieces, all doubles, both growing ends, exact contacts and fixed scale',()=>{
 const by=new Map(allTiles().map(t=>[t.id,t]));
 for(let seed=1;seed<=60;seed++){
  const seq=euler(seed),pivot=seed%28,ps=[{tileId:seq[pivot].tileId,side:'right',joined:seq[pivot].from,exposed:seq[pivot].to}];
  let l=pivot-1,r=pivot+1;
  while(l>=0||r<28){if(l>=0&&(r>=28||((l+r+seed)%2))){const t=seq[l--];ps.push({tileId:t.tileId,side:'left',joined:t.to,exposed:t.from})}else{const t=seq[r++];ps.push({tileId:t.tileId,side:'right',joined:t.from,exposed:t.to})}}
  for(const [width,height]of [[600,180],[800,260],[1000,350]])for(const n of [1,7,14,21,28]){
   const bounds={x:0,y:0,width,height},placements=ps.slice(0,n),m=buildTableModel(placements,bounds,'horizontal','classic',by,{fixedScale:true});
   assert.equal(m.status,'verified',JSON.stringify({seed,width,height,n,failure:m.failure}));
   const camera=fitTableCamera(m,{width,height,scale:1},width,height);
   for(const node of m.nodes){const p=node.shape,a=p.angle*Math.PI/180,hw=(Math.abs(Math.cos(a))*p.width+Math.abs(Math.sin(a))*p.height)/2,hh=(Math.abs(Math.sin(a))*p.width+Math.abs(Math.cos(a))*p.height)/2;
    const x=(p.center.x-camera.x)*camera.scale+width/2,y=(p.center.y-camera.y)*camera.scale+height/2;
    assert.ok(x-hw*camera.scale>=-1e-7&&x+hw*camera.scale<=width+1e-7,'visible tile width');
    assert.ok(y-hh*camera.scale>=-1e-7&&y+hh*camera.scale<=height+1e-7,'visible tile height');
   }
   for(const p of Object.values(m.geometry.endpoints)){const x=(p.x-camera.x)*camera.scale+width/2,y=(p.y-camera.y)*camera.scale+height/2;assert.ok(x>=22&&x<=width-22&&y>=22&&y<=height-22,'44px endpoint stays visible');}
   assert.equal(m.nodes.length,n);assert.equal(new Set(m.nodes.map(n=>n.tileId)).size,n);
   assert.ok(validatePhysicalChain(m.geometry.tiles,bounds));assert.ok(verifyPhysicalContacts(placements,m.geometry.tiles));assert.ok(orientPrintedPorts(placements,m.geometry.tiles,by));
   for(const node of m.nodes){assert.ok(Math.abs(node.shape.height-Math.min(width/24,height/12))<1e-8);assert.equal(node.shape.width,node.shape.height*2)}
  }
 }
});
test('approved PNG remains byte-identical; fullscreen requires explicit button and never a global touch',()=>{
 const bytes=readFileSync(new URL('../web/assets/approved/screen-06-mesa-oficial.png',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'d86e7473f7bee937bd0ebf45616f13a7aeba5d5bb2e746e42b1e09ee4da4766c');
 const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
 assert.equal((source.match(/await lockLandscape\(true\)/g)||[]).length,1);
 assert.doesNotMatch(source,/void lockLandscape\(true\)/);
 assert.doesNotMatch(source,/Camera fits the occupied chain/);
});
