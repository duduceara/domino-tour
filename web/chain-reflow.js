// Presentation-only packing. The authoritative session, placements and solver stay intact.
import {attachAtFace,faceContact,facePorts,validatePhysicalChain} from '../dist/src/table.js';
import {touchingPorts} from '../dist/src/semantic.js';
import {orientPrintedPorts,portValue} from '../dist/src/port-values.js';
import {fitTableCamera} from './table-camera.js';
const cache=new WeakMap(),dirs=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function pack(model,space,width,height,target){
 const nodes=model.nodes,by=new Map(nodes.map(n=>[n.tileId,n.official]));
 const order=[0];for(let i=1;i<nodes.length;i++)nodes[i].side==='left'?order.unshift(i):order.push(i);
 const edge=(a,b)=>model.connections.find(c=>c.fromId===a&&c.toId===b||c.fromId===b&&c.toId===a);
 const bounds={x:0,y:0,width:(space.quarterTurn?height-48:width-48)/target,height:(space.quarterTurn?width-48:height-48)/target};
 if(bounds.width<4||bounds.height<4)return null;
 const first=nodes[order[0]].official;
 const placed=[{tileId:first.id,center:{x:1.5,y:1.5},width:2,height:1,angle:first.a===first.b?90:0}];
 const domains=new Map([[first.id,first.a===first.b?[false]:[false,true]]]);let visited=0;const deadline=performance.now()+12;
 function visit(i,heading,lastAcross){
  if(i===order.length)return true;
  if(++visited>1600||performance.now()>deadline)return false;
  const tile=nodes[order[i]].official,prev=placed.at(-1),prior=by.get(prev.tileId),joined=edge(prev.tileId,tile.id)?.value;
  if(joined===undefined)return false;
  const candidates=heading%2===0?[heading,1,(heading+2)%4,3]:[(lastAcross+2)%4,1,lastAcross,3];
  for(const d of [...new Set(candidates)]){
   const next=attachAtFace(prev,{tileId:tile.id,width:2,height:1,angle:(d%2?90:0)+(tile.a===tile.b?90:0)},dirs[d]);
   const pa=facePorts(prev).findIndex(p=>Math.abs(p.normal.x-dirs[d].x)<1e-6&&Math.abs(p.normal.y-dirs[d].y)<1e-6);
   const pb=facePorts(next).findIndex(p=>Math.abs(p.normal.x+dirs[d].x)<1e-6&&Math.abs(p.normal.y+dirs[d].y)<1e-6);
   const offsets=(shape,port)=>port<2?[0]:[0,-shape.width/4,shape.width/4];
   for(const a of offsets(prev,pa))for(const b of offsets(next,pb)){
    if(performance.now()>deadline)return false;
    const shift=a-b,q={...next,center:{x:next.center.x-dirs[d].y*shift,y:next.center.y+dirs[d].x*shift}};
    if(!validatePhysicalChain([...placed,q],bounds)||placed.slice(0,-1).some(t=>faceContact(t,q)))continue;
    const ports=touchingPorts(prev,q);if(!ports||prior.a===prior.b&&ports.a<2||tile.a===tile.b&&ports.b<2)continue;
    const before=domains.get(prev.tileId),narrowed=before.filter(r=>portValue(prior,prev,ports.a,r,ports)?.value===joined);
    const choices=(tile.a===tile.b?[false]:[false,true]).filter(r=>portValue(tile,q,ports.b,r,ports)?.value===joined);
    if(!narrowed.length||!choices.length)continue;
    domains.set(prev.tileId,narrowed);domains.set(tile.id,choices);placed.push(q);
    if(visit(i+1,d,d%2===0?d:lastAcross))return true;
    placed.pop();domains.set(prev.tileId,before);domains.delete(tile.id);
   }
  }
  return false;
 }
 if(!validatePhysicalChain(placed,bounds)||!visit(1,0,0))return null;
 const shapes=nodes.map(n=>placed.find(p=>p.tileId===n.tileId));
 const placements=nodes.map(n=>({tileId:n.tileId,side:n.side,joined:model.connections.find(c=>c.toId===n.tileId)?.value??n.official.a}));
 const reversed=orientPrintedPorts(placements,shapes,by);if(!reversed)return null;
 const used=new Map(nodes.map(n=>[n.tileId,new Set()]));
 const connections=model.connections.map(c=>{const a=shapes.find(s=>s.tileId===c.fromId),b=shapes.find(s=>s.tileId===c.toId),p=touchingPorts(a,b);if(!p)return null;used.get(c.fromId).add(p.a);used.get(c.toId).add(p.b);return {...c,fromPort:p.a,toPort:p.b,start:p.start,end:p.end}});
 if(connections.some(c=>!c))return null;
 const endpoints={},openPorts=new Map();
 for(const side of ['left','right']){
  const index=side==='left'?order[0]:order.at(-1),node=nodes[index],shape=shapes[index];
  const originalPorts=facePorts(node.shape).filter((p,i)=>portValue(node.official,node.shape,i,node.printed[0]!==node.official.a)!==null);
  originalPorts.sort((a,b)=>distance(a.center,model.geometry.endpoints[side])-distance(b.center,model.geometry.endpoints[side]));
  const portIndex=facePorts(node.shape).findIndex(p=>distance(p.center,originalPorts[0].center)<1e-6);
  const value=portValue(node.official,node.shape,portIndex,node.printed[0]!==node.official.a)?.value;
  const ports=facePorts(shape).map((p,i)=>({p,i})).filter(({i})=>!used.get(node.tileId).has(i)&&portValue(node.official,shape,i,reversed.get(node.tileId))?.value===value&&(node.official.a!==node.official.b||i>=2));
  if(!ports.length)return null;
  const p=ports[0].p;openPorts.set(node.tileId,ports[0].i);used.get(node.tileId).add(ports[0].i);endpoints[side]={x:p.center.x+p.normal.x,y:p.center.y+p.normal.y};
 }
 const unit=nodes[0].shape.height,root=shapes[0].center;
 const point=p=>({x:space.width/2+(p.x-root.x)*unit,y:space.height/2+(p.y-root.y)*unit});
 const resultNodes=nodes.map((n,i)=>({...n,shape:{...shapes[i],center:point(shapes[i].center),width:unit*2,height:unit},printed:reversed.get(n.tileId)?[n.official.b,n.official.a]:[n.official.a,n.official.b]}));
 for(const node of resultNodes){const incoming=connections.find(c=>c.toId===node.tileId),outgoing=connections.find(c=>c.fromId===node.tileId);node.incoming=incoming?facePorts(node.shape)[incoming.toPort]:null;node.outgoing=outgoing?facePorts(node.shape)[outgoing.fromPort]:openPorts.has(node.tileId)?facePorts(node.shape)[openPorts.get(node.tileId)]:null}
 return {...model,nodes:resultNodes,connections:connections.map(c=>({...c,start:point(c.start),end:point(c.end)})),geometry:{...model.geometry,bounds:{x:space.width/2-root.x*unit,y:space.height/2-root.y*unit,width:bounds.width*unit,height:bounds.height*unit},tiles:resultNodes.map(n=>n.shape),tileWidth:unit*2,tileHeight:unit,endpoints:{left:point(endpoints.left),right:point(endpoints.right)}},reflow:true};
}

export function reflowChain(model,space,width,height){
 if(model.status!=='verified'||model.nodes.length<2)return model;
 const key=[width,height,space.quarterTurn].join(':'),saved=cache.get(model);if(saved?.key===key)return saved.value;
 const root=model.nodes[0].shape.center,dx=space.width/2-root.x,dy=space.height/2-root.y;
 const point=p=>({x:p.x+dx,y:p.y+dy});
 // Same root coordinate system for packed and fallback previews; never mutate input.
 const fallback={...model,nodes:model.nodes.map(n=>({...n,shape:{...n.shape,center:point(n.shape.center)}})),geometry:{...model.geometry,bounds:{...model.geometry.bounds,x:model.geometry.bounds.x+dx,y:model.geometry.bounds.y+dy},tiles:model.geometry.tiles.map(s=>({...s,center:point(s.center)})),endpoints:{left:point(model.geometry.endpoints.left),right:point(model.geometry.endpoints.right)}}};
 let best=fallback,score=fitTableCamera(best,space,width,height).scale*best.nodes[0].shape.height;
 for(const target of [14,18,24]){
  const candidate=pack(model,space,width,height,target);if(!candidate)continue;
  const size=fitTableCamera(candidate,space,width,height).scale*candidate.nodes[0].shape.height;
  if(size>score*1.03){best=candidate;score=size}
  if(score>=Math.min(24,width/10)-.1)break;
 }
 cache.set(model,{key,value:best});return best;
}
