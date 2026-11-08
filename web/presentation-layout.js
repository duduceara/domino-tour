// R02: only the unoccupied decorative felt band may absorb extra height.
export const FELT_ROWS=Object.freeze([724,760]);
export function presentationLayout(width,height){
 const scale=Math.max(Math.min(width,308),Math.min(width,height*2/3))/1024;
 const naturalHeight=1536*scale,extra=Math.max(0,height-naturalHeight);
 return {width:1024*scale,height:naturalHeight+extra,scale,extra,mapY(y){return y*scale+Math.max(0,Math.min(1,(y-FELT_ROWS[0])/(FELT_ROWS[1]-FELT_ROWS[0])))*extra}};
}
