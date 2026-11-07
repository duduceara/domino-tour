import {fittedTableSpace} from '../dist/src/viewport.js';
// A presentation camera; solver geometry and engine state are never changed.
export function fitTableCamera(model,space,width,height){
 const camera={x:space.width/2,y:space.height/2,scale:space.scale,quarterTurn:!!space.quarterTurn};
 if(!model.nodes.length||!model.geometry)return camera;
 const boxes=model.nodes.map(({shape:p})=>{const a=p.angle*Math.PI/180,w=Math.abs(Math.cos(a))*p.width+Math.abs(Math.sin(a))*p.height,h=Math.abs(Math.sin(a))*p.width+Math.abs(Math.cos(a))*p.height;return {l:p.center.x-w/2,r:p.center.x+w/2,t:p.center.y-h/2,b:p.center.y+h/2}});
 for(const p of Object.values(model.geometry.endpoints))boxes.push({l:p.x,r:p.x,t:p.y,b:p.y});
 const l=Math.min(...boxes.map(b=>b.l)),r=Math.max(...boxes.map(b=>b.r)),t=Math.min(...boxes.map(b=>b.t)),b=Math.max(...boxes.map(b=>b.b));
 camera.x=(l+r)/2;camera.y=(t+b)/2;
 // Padding is in visible CSS pixels, so the 44px endpoint targets stay on screen
 // at every scale instead of consuming 24 model units on each side of a tiny tile.
 // Start at a readable, moderate size; fit the long runs along the long felt axis.
 const target=Math.min(26,Math.max(20,width/10)),unit=model.nodes[0].shape.height;
 const spanX=camera.quarterTurn?b-t:r-l,spanY=camera.quarterTurn?r-l:b-t;
 camera.scale=Math.min(target/unit,Math.max(1,width-48)/Math.max(1,spanX),Math.max(1,height-48)/Math.max(1,spanY));
 return camera;
}

// Inverse of the renderer transform. Only the chain may turn; the UI never does.
export function cameraPoint(point,physical,space,zoom=1,pan={x:0,y:0}){
 const c=space.camera??{x:space.width/2,y:space.height/2,scale:space.scale,quarterTurn:space.quarterTurn};
 const x=point.x-physical.width/2-pan.x,y=point.y-physical.height/2-pan.y,scale=c.scale*zoom;
 return {x:(c.quarterTurn?y:x)/scale+c.x,y:(c.quarterTurn?-x:y)/scale+c.y};
}

export function chainSpace(width,height){
 const quarterTurn=height>width,fitted=fittedTableSpace(quarterTurn?height:width,quarterTurn?width:height);
 return fitted?{...fitted,quarterTurn}:null;
}
