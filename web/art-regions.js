// Same source-window/percentage coordinate architecture as approved screen 02.
export function sourceRegion(rect,window){return {left:(rect.x-window.x)/window.width*100,top:(rect.y-window.y)/window.height*100,width:rect.width/window.width*100,height:rect.height/window.height*100}}
export function setArtRegion(element,rect,window){const region=sourceRegion(rect,window);for(const [key,value]of Object.entries(region))element.style[key]=`${value}%`;return element}
