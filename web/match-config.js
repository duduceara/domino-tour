export const DIFFICULTIES=Object.freeze(['easy','medium','hard']);
export const SUPPORTED_TARGETS=Object.freeze([100,200]); // 300 is drawn in the art, but rejected by the current engine.
export const TABLE_STYLES=Object.freeze(['green','red','blue','wood','purple']);
export const TABLE_LABELS=Object.freeze({green:'Verde clássico',red:'Vermelho real',blue:'Azul safira',wood:'Madeira',purple:'Roxo imperial'});
export function createMatchConfig(){return Object.freeze({mode:'offline',difficulty:'medium',target:200,tableStyle:'green'})}
export function updateMatchConfig(state,field,value){
 const valid=field==='mode'?['offline','online'].includes(value):field==='difficulty'?DIFFICULTIES.includes(value):field==='target'?SUPPORTED_TARGETS.includes(value):field==='tableStyle'?TABLE_STYLES.includes(value):false;
 if(!valid)throw new RangeError('Opção não suportada: '+field);
 return Object.freeze({...state,[field]:value});
}
export function stepTableStyle(state,direction){if(direction!==1&&direction!==-1)throw new RangeError('Direção inválida');return updateMatchConfig(state,'tableStyle',TABLE_STYLES[(TABLE_STYLES.indexOf(state.tableStyle)+direction+TABLE_STYLES.length)%TABLE_STYLES.length])}
export function prepareIdentification(state){
 for(const field of ['mode','difficulty','target','tableStyle'])updateMatchConfig(state,field,state[field]);
 if(state.mode!=='offline')return Object.freeze({status:'online-unavailable',message:'Modo online em desenvolvimento. Em breve!'});
 return Object.freeze({status:'identification-pending',config:Object.freeze({...state})});
}
