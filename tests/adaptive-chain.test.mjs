import test from 'node:test';
import assert from 'node:assert/strict';
import {allTiles} from '../dist/src/engine.js';
import {LocalSession} from '../dist/src/session.js';
import {buildTableModel,validatePhysicalChain,verifyPhysicalContacts} from '../dist/src/table.js';
import {auditPrintedPorts} from '../dist/src/port-values.js';
import {chainSpace,fitTableCamera,cameraPoint} from '../web/table-camera.js';
import {reflowChain} from '../web/chain-reflow.js';
function euler(seed){
 const tiles=allTiles(),left=new Set(tiles.map(t=>t.id)),out=[];
 function visit(v){for(;;){const choices=tiles.filter(t=>left.has(t.id)&&(t.a===v||t.b===v));if(!choices.length)return;const t=choices[(seed=(Math.imul(seed,1664525)+1013904223)>>>0)%choices.length];left.delete(t.id);const next=t.a===v?t.b:t.a;visit(next);out.push({tileId:t.id,from:v,to:next})}}
 visit(0);return out.reverse();
}


function chain(seed){const seq=euler(seed),pivot=seed%28,ps=[{tileId:seq[pivot].tileId,side:'right',joined:seq[pivot].from,exposed:seq[pivot].to}];let l=pivot-1,r=pivot+1;while(l>=0||r<28){if(l>=0&&(r>=28||((l+r+seed)%2))){const t=seq[l--];ps.push({tileId:t.tileId,side:'left',joined:t.to,exposed:t.from})}else{const t=seq[r++];ps.push({tileId:t.tileId,side:'right',joined:t.from,exposed:t.to})}}return ps}
const by=new Map(allTiles().map(t=>[t.id,t]));
function visible(p,c,w,h,zoom=1,pan={x:0,y:0}){const x=p.x-c.x,y=p.y-c.y,s=c.scale*zoom;return {x:w/2+pan.x+(c.quarterTurn?-y:x)*s,y:h/2+pan.y+(c.quarterTurn?x:y)*s}}

test('chain-only quarter turn: exact inverse at zoom/pan, including physical endpoint targets',()=>{
 for(const [w,h] of [[258,413],[258,258],[206,298],[308,182]]){
  const space=chainSpace(w,h);assert.equal(space.quarterTurn,h>w);
  const m=buildTableModel(chain(1).slice(0,14),{x:0,y:0,width:space.width,height:space.height},'horizontal','classic',by,{fixedScale:true});
  const v=reflowChain(m,space,w,h),c=fitTableCamera(v,space,w,h);space.camera=c;
  for(const zoom of [1,2,4])for(const pan of [{x:0,y:0},{x:13,y:-19}])for(const p of [...v.nodes.map(n=>n.shape.center),...Object.values(v.geometry.endpoints)]){
   const q=cameraPoint(visible(p,c,w,h,zoom,pan),{width:w,height:h},space,zoom,pan);
   assert.ok(Math.hypot(q.x-p.x,q.y-p.y)<1e-8);
  }
 }
});
test('240 growing-chain cases: reflow never changes values, contacts, 2:1 ratio, input or fit safety',()=>{
 let cases=0;let s23min=Infinity;
 for(let seed=1;seed<=12;seed++)for(const [w,h]of [[258,413],[258,258],[206,298],[308,182]])for(const n of [1,7,14,21,28]){
  const ps=chain(seed).slice(0,n),space=chainSpace(w,h),bounds={x:0,y:0,width:space.width,height:space.height};
  const m=buildTableModel(ps,bounds,'horizontal','classic',by,{fixedScale:true}),before=JSON.stringify(m);assert.equal(m.status,'verified');
  const v=reflowChain(m,space,w,h),c=fitTableCamera(v,space,w,h),base=fitTableCamera(m,space,w,h);
  assert.equal(JSON.stringify(m),before);assert.equal(v.nodes.length,n);assert.equal(new Set(v.nodes.map(n=>n.tileId)).size,n);
  assert.ok(validatePhysicalChain(v.geometry.tiles,v.geometry.bounds));assert.ok(verifyPhysicalContacts(ps,v.geometry.tiles));
  const reversed=new Map(v.nodes.map(n=>[n.tileId,n.printed[0]!==n.official.a]));assert.ok(auditPrintedPorts(ps,v.geometry.tiles,by,reversed));
  assert.ok(v.nodes[0].shape.height*c.scale+1e-7>=m.nodes[0].shape.height*base.scale,'no worse than validated fallback');
  for(const node of v.nodes){const p=node.shape,q=visible(p.center,c,w,h),a=(p.angle+(c.quarterTurn?90:0))*Math.PI/180,hw=(Math.abs(Math.cos(a))*p.width+Math.abs(Math.sin(a))*p.height)*c.scale/2,hh=(Math.abs(Math.sin(a))*p.width+Math.abs(Math.cos(a))*p.height)*c.scale/2;
   assert.equal(p.width,p.height*2);assert.ok(q.x-hw>=-1e-6&&q.x+hw<=w+1e-6&&q.y-hh>=-1e-6&&q.y+hh<=h+1e-6,'no clipping');
  }
  for(const p of Object.values(v.geometry.endpoints)){const q=visible(p,c,w,h);assert.ok(q.x>=22&&q.x<=w-22&&q.y>=22&&q.y<=h-22,'44px target visible');}
  assert.equal(reflowChain(m,space,w,h),v,'rerenders reuse the cached view');
  if(w===258&&h===413)s23min=Math.min(s23min,v.nodes[0].shape.height*c.scale);
  cases++;
 }
 assert.equal(cases,240);assert.ok(s23min>=17,'dense S23+ tall felt remains legible without an oversized first tile');
});
test('session, hands, score, difficulty and rule events survive presentation reflow in both deal variants',()=>{
 for(const deal of [6,7]){
  const game=new LocalSession(100,deal,'medium'),before=JSON.stringify(game.state);
  for(const [w,h] of [[258,413],[206,298],[258,258]]){const s=chainSpace(w,h);game.resize({x:0,y:0,width:s.width,height:s.height},'horizontal');reflowChain(game.model,s,w,h);assert.equal(JSON.stringify(game.state),before)}
  assert.equal(game.difficulty,'medium');assert.equal(game.state.players[0].hand.length,deal);
 }
});
