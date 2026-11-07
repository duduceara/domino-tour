import {prepareIdentification} from './match-config.js';
export function guestOptions(config){
 const result=prepareIdentification(config);
 if(result.status!=='identification-pending')throw new RangeError('Online indisponível');
 return {mode:'offline',guest:true,resume:false,name:'Visitante',difficulty:result.config.difficulty,target:result.config.target,tableStyle:result.config.tableStyle,deal:6,accepted:false};
}
export function localGuest(storage,id){
 const guest=Object.freeze({kind:'guest',id,name:'Visitante',authenticated:false});
 try{storage?.setItem('domino-tour:guest:v1',JSON.stringify(guest))}catch{}
 return guest;
}
