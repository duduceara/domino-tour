// Tela 06 only: portrait layout, never a quarter-turn or an orientation lock.
export function portraitTableViewport(width,height,insets={top:0,right:0,bottom:0,left:0},offset={left:0,top:0}){
 const usableWidth=Math.max(1,width-insets.left-insets.right),usableHeight=Math.max(1,height-insets.top-insets.bottom);
 // A short/wide window shows the same complete portrait layout, uniformly fitted.
 const short=usableHeight<600;
 const frameWidth=short?360:Math.min(480,usableWidth),frameHeight=short?640:usableHeight;
 const scale=Math.min(1,usableWidth/frameWidth,usableHeight/frameHeight);
 return {width:frameWidth,height:frameHeight,scale,left:insets.left+(usableWidth-frameWidth*scale)/2+(offset.left??0),top:insets.top+(usableHeight-frameHeight*scale)/2+(offset.top??0),rotated:false};
}
export function portraitPoint(client,frame,scale=1){return {x:(client.x-frame.left)/scale,y:(client.y-frame.top)/scale}}
