import {assertStateIntegrity} from '../dist/src/engine.js';
import {LocalSession} from '../dist/src/session.js';
export const SAVE_KEY='domino-tour:offline-match:v1';
export function readOffline(storage){
 try{const raw=storage?.getItem(SAVE_KEY);if(!raw)return {kind:'empty'};
 const value=JSON.parse(raw);if(value.version!==1||!['easy','medium','hard'].includes(value.difficulty)||!['classic','loop','spiral'].includes(value.routeStyle)||typeof value.name!=='string')throw Error('format');
 assertStateIntegrity(value.state);const session=new LocalSession(value.state.target,value.state.dealSize,value.difficulty);session.state=structuredClone(value.state);session.routeStyle=value.routeStyle;session.handLayout=null;session.refresh();if(value.handLayout)session.restoreHandLayout(value.handLayout);
 return {kind:'saved',session,routeStyle:value.routeStyle,name:value.name.slice(0,24)};
 }catch{return {kind:'unavailable'}}
}
export function writeOffline(storage,session,routeStyle,name='Visitante'){
 try{assertStateIntegrity(session.state);storage.setItem(SAVE_KEY,JSON.stringify({version:1,state:session.state,difficulty:session.difficulty,routeStyle,handLayout:session.snapshotHandLayout(),name:String(name).slice(0,24),savedAt:new Date().toISOString()}));return true}catch{return false}
}
