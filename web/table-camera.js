export function fitTableCamera(model,space,width,height){
 // Enlarge the real geometry for legibility, fitting every placed tile and both
 // endpoints inside the surface. The rules and physical layout stay unchanged.
 const camera={x:space.width/2,y:space.height/2,scale:space.scale};
 if(model.nodes.length&&model.geometry){
  const boxes=model.nodes.map(n=>{const p=n.shape,r=p.angle*Math.PI/180,w=Math.abs(Math.cos(r))*p.width+Math.abs(Math.sin(r))*p.height,h=Math.abs(Math.sin(r))*p.width+Math.abs(Math.cos(r))*p.height;return {l:p.center.x-w/2,r:p.center.x+w/2,t:p.center.y-h/2,b:p.center.y+h/2}});
  for(const p of Object.values(model.geometry.endpoints))boxes.push({l:p.x-24,r:p.x+24,t:p.y-24,b:p.y+24});
  const l=Math.min(...boxes.map(b=>b.l)),r=Math.max(...boxes.map(b=>b.r)),t=Math.min(...boxes.map(b=>b.t)),b=Math.max(...boxes.map(b=>b.b));
  camera.x=(l+r)/2;camera.y=(t+b)/2;
  camera.scale=Math.min(space.scale*2,Math.max(1,width-16)/(r-l),Math.max(1,height-16)/(b-t));
 }


 return camera;
}
