import {prepareIdentification} from './match-config.js';
export function guestOptions(config){
 const result=prepareIdentification(config);
 if(result.status!=='identification-pending')throw new RangeError('Online indisponível');
 return {mode:'offline',guest:true,resume:false,name:'Visitante',difficulty:result.config.difficulty,target:result.config.target,tableStyle:result.config.tableStyle,deal:result.config.deal,accepted:false};
}
export function localGuest(storage,id,name='Visitante'){
 const guest=Object.freeze({kind:'guest',id,name:String(name).trim().slice(0,24)||'Visitante',authenticated:false});
 try{storage?.setItem('domino-tour:guest:v1',JSON.stringify(guest))}catch{}
 return guest;
}
