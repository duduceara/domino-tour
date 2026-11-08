// Source coordinates from the owner's exact 708×1536 official JPEG.
export const OFFICIAL_MENU=Object.freeze({src:'./assets/approved/screen-02-menu-oficial-r02.jpg',width:708,height:1536,sha256:'1a04ec265596f7cde5d7afff5d4df4215dcca2cd3f48f805b09ea9813ca5f3da'});
// Empty/decorative gaps only; no label, domino, logo or interactive card crosses these.
export const DECORATIVE_BANDS=Object.freeze([[0,24],[916,931],[1118,1139],[1264,1319],[1432,1536]].map(([start,end])=>Object.freeze({start,end,min:1})));
export const MENU_TARGETS=Object.freeze({
 settings:[623,44,65,64],coins:[501,137,188,55],rewards:[498,201,192,78],
 quick:[153,817,399,94],journey:[13,935,337,182],tournaments:[357,935,339,182],
 goals:[12,1142,685,121],profile:[13,1321,169,106],ranking:[182,1321,173,106],
 achievements:[355,1321,174,106],rules:[529,1321,168,106]
});
export function officialMenuLayout(width,height){
 const {width:sw,height:sh}=OFFICIAL_MENU;
 const capacity=DECORATIVE_BANDS.reduce((n,b)=>n+b.end-b.start-b.min,0);
 const scale=Math.min(width/sw,height/(sh-capacity));
 const sourceHeight=height/scale,compression=Math.max(0,sh-sourceHeight),extra=Math.max(0,sourceHeight-sh);
 const segments=[];let sourceY=0,destY=0;
 for(const [i,b]of DECORATIVE_BANDS.entries()){
  if(b.start>sourceY){const length=b.start-sourceY;segments.push({sourceY,length,top:destY*scale,height:length*scale,decorative:false});destY+=length}
  const length=b.end-b.start,allocated=length-compression*(length-b.min)/capacity+(i===DECORATIVE_BANDS.length-1?extra:0);
  segments.push({sourceY:b.start,length,top:destY*scale,height:allocated*scale,decorative:true});destY+=allocated;sourceY=b.end;
 }
 if(sourceY<sh)segments.push({sourceY,length:sh-sourceY,top:destY*scale,height:(sh-sourceY)*scale,decorative:false});
 const mapY=y=>{const s=segments.find(s=>y<s.sourceY+s.length)||segments.at(-1);return s.top+(y-s.sourceY)/s.length*s.height};
 return {width:sw*scale,height,scale,segments,mapY,fallback:sw*scale<width-.1};
}
