// Player cosmetics only. No imports from the engine/session and no match storage access.
export const PROFILE_KEY = 'domino-tour:profile:v1';
export const plainSearch = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function validateCatalog(raw) {
 if(raw?.version!==1 || !Array.isArray(raw.items) || !Array.isArray(raw.opponents))throw new Error('Catálogo indisponível');
 const ids=new Set();
 const validEntry=(entry,name)=>{
  if(!entry || typeof entry.id!=='string' || !/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id) || typeof entry[name]!=='string' || !entry[name].trim() || !/^assets\/avatars\/[a-z0-9-]+\.webp$/.test(entry.src))throw new Error('Entrada de avatar inválida');
  ids.add(entry.id);
 };
 for(const item of raw.items){validEntry(item,'label');if(!Array.isArray(item.regions)||item.regions.some(r=>typeof r!=='string')||typeof item.country!=='string')throw new Error('Metadados de avatar inválidos')}
 const expected=['RobiX','AndroX','DomiX'];
 for(const [i,item]of raw.opponents.entries()){validEntry(item,'name');if(item.name!==expected[i]||item.seat!==i+1)throw new Error('Assento de androide inválido')}
 if(raw.opponents.length!==3)throw new Error('Três androides obrigatórios');
 return raw;
}
export function normalizeProfile(raw,catalog) {
 const valid=new Set(catalog.items.map(a=>a.id));
 return {version:1,selectedId:raw?.version===1&&valid.has(raw.selectedId)?raw.selectedId:null,favoriteIds:raw?.version===1&&Array.isArray(raw.favoriteIds)?[...new Set(raw.favoriteIds.filter(id=>valid.has(id)))]:[]};
}
export function loadProfile(storage,catalog){try{return normalizeProfile(JSON.parse(storage?.getItem(PROFILE_KEY)??'null'),catalog)}catch{return normalizeProfile(null,catalog)}}
export function saveProfile(storage,profile){try{if(!storage)return false;storage.setItem(PROFILE_KEY,JSON.stringify(profile));return true}catch{return false}}
export function selectProfileAvatar(profile,id,catalog){if(!catalog.items.some(a=>a.id===id))throw new Error('Avatar não disponível');return {...profile,selectedId:id,favoriteIds:[...profile.favoriteIds]}}
export function toggleFavorite(profile,id,catalog){if(!catalog.items.some(a=>a.id===id))throw new Error('Avatar não disponível');const ids=new Set(profile.favoriteIds);if(ids.has(id))ids.delete(id);else ids.add(id);return {...profile,favoriteIds:[...ids]}}
export function filterAvatars(catalog,{query='',region='',country='',favoritesOnly=false,favoriteIds=[],failedIds=[]}={}){
 const q=plainSearch(query),favorite=new Set(favoriteIds),failed=new Set(failedIds);
 return catalog.items.filter(a=>!failed.has(a.id)&&(!region||a.regions.includes(region))&&(!country||a.country===country)&&(!favoritesOnly||favorite.has(a.id))&&(!q||plainSearch([a.label,a.country,...a.regions].join(' ')).includes(q)));
}
export function surpriseAvatar(items,randomIndex){if(!items.length)return null;const i=randomIndex(items.length);if(!Number.isInteger(i)||i<0||i>=items.length)throw new Error('Índice surpresa inválido');return items[i]}
export function cosmeticRandomIndex(n){
 if(!Number.isInteger(n)||n<1)throw new Error('Coleção vazia');
 const range=0x100000000,limit=Math.floor(range/n)*n,buf=new Uint32Array(1);let value;
 do{crypto.getRandomValues(buf);value=buf[0]}while(value>=limit);return value%n;
}
export function participantEntry(catalog,profile,seat){return seat===0?catalog.items.find(a=>a.id===profile.selectedId)??null:catalog.opponents.find(a=>a.seat===seat)??null}
export function renderAvatar(slot,entry,{document:doc=globalThis.document,onError=()=>{}}={}){
 const name=entry?.label??entry?.name??'Você';slot.dataset.avatarId=entry?.id??'';
 const fallback=()=>{const initial=doc.createElement('span');initial.className='avatar-initial';initial.textContent=entry?.name?.[0]??'Você';initial.setAttribute('role','img');initial.setAttribute('aria-label',entry?'Imagem indisponível: '+name:'Escolha seu avatar');slot.replaceChildren(initial);slot.dataset.avatarState=entry?'unavailable':'empty'};
 if(!entry){fallback();return null}
 const img=doc.createElement('img');img.className='avatar';img.alt=name;img.width=128;img.height=128;img.decoding='async';
 img.onload=()=>{if(slot.dataset.avatarId===entry.id)slot.dataset.avatarState='ready'};
 img.onerror=()=>{if(slot.dataset.avatarId!==entry.id)return;fallback();onError(entry.id)};
 slot.dataset.avatarState='loading';slot.replaceChildren(img);img.src=entry.src;return img;
}
