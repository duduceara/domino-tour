// A presentation camera; solver geometry and engine state are never changed.
export function fitTableCamera(model,space,width,height){
 const camera={x:space.width/2,y:space.height/2,scale:space.scale};
 if(!model.nodes.length||!model.geometry)return camera;
 const boxes=model.nodes.map(({shape:p})=>{const a=p.angle*Math.PI/180,w=Math.abs(Math.cos(a))*p.width+Math.abs(Math.sin(a))*p.height,h=Math.abs(Math.sin(a))*p.width+Math.abs(Math.cos(a))*p.height;return {l:p.center.x-w/2,r:p.center.x+w/2,t:p.center.y-h/2,b:p.center.y+h/2}});
 for(const p of Object.values(model.geometry.endpoints))boxes.push({l:p.x,r:p.x,t:p.y,b:p.y});
 const l=Math.min(...boxes.map(b=>b.l)),r=Math.max(...boxes.map(b=>b.r)),t=Math.min(...boxes.map(b=>b.t)),b=Math.max(...boxes.map(b=>b.b));
 camera.x=(l+r)/2;camera.y=(t+b)/2;
 // Padding is in visible CSS pixels, so the 44px endpoint targets stay on screen
 // at every scale instead of consuming 24 model units on each side of a tiny tile.
 camera.scale=Math.min(space.scale*3,Math.max(1,width-48)/Math.max(1,r-l),Math.max(1,height-48)/Math.max(1,b-t));
 return camera;
}
