import {normalizeProfile,avatarUnlocked,validateCatalog,loadProfile,saveProfile,selectProfileAvatar,toggleFavorite,filterAvatars,surpriseAvatar,cosmeticRandomIndex,participantEntry,renderAvatar} from './avatar-profile.js';
const $=id=>document.getElementById(id);
let catalog=null,profile=null,storage=null,favoritesOnly=false;const failedIds=new Set();
try{storage=window.localStorage}catch{}
function status(message){$('avatar-status').textContent=message}
function selectionReady(){return !!catalog&&(!!profile?.photo||!!profile?.selectedId&&!failedIds.has(profile.selectedId))}
function publishProfile(){
 document.body.dataset.avatarReady=String(selectionReady());$('avatar-continue').disabled=!selectionReady();
 const selected=catalog&&profile?participantEntry(catalog,profile,0):null;
 $('selected-avatar-name').textContent=selected?.label??'Escolha seu avatar';
 for(const slot of document.querySelectorAll('[data-profile-avatar]'))paint(slot,selected??null);
 paintParticipants();window.dispatchEvent(new CustomEvent('domino-tour:profile-changed',{detail:{avatarId:profile?.selectedId??null}}));
}
function paint(slot,entry){
 if(slot.dataset.avatarId===(entry?.id??'')&&slot.dataset.avatarState&&slot.dataset.avatarSource===(entry?.src??''))return;
 slot.dataset.avatarSource=entry?.src??'';
 renderAvatar(slot,entry,{onError:id=>{
  if(failedIds.has(id))return;failedIds.add(id);
  if(catalog.items.some(a=>a.id===id)){status('Uma imagem não pôde ser carregada. Você pode escolher outro avatar.');document.body.dataset.avatarReady=String(selectionReady());$('avatar-continue').disabled=!selectionReady();renderGrid()}
 }});
}
function paintParticipants(){if(!catalog||!profile)return;for(const slot of document.querySelectorAll('[data-avatar-seat]'))paint(slot,participantEntry(catalog,profile,Number(slot.dataset.avatarSeat)))}
function persist(){const saved=saveProfile(storage,profile);status(saved?'Escolha salva neste aparelho.':'Escolha mantida nesta sessão; não foi possível salvá-la neste aparelho.');publishProfile()}
function choose(id){if(!catalog||failedIds.has(id)||!avatarUnlocked(profile,id))return;profile=selectProfileAvatar(profile,id,catalog);persist();renderGrid()}
function visibleItems(){return filterAvatars(catalog,{query:$('avatar-search').value,region:$('avatar-region').value,country:$('avatar-country').value,favoritesOnly,favoriteIds:profile.favoriteIds,failedIds:[...failedIds]})}
function renderGrid(){
 if(!catalog)return;
 const items=visibleItems();$('avatar-count').textContent=`${items.length} de ${catalog.items.length} avatares`;
 $('avatar-grid').replaceChildren();
 for(const item of items){
  const card=document.createElement('div');card.className='avatar-card';
  const button=document.createElement('button');button.type='button';button.className='avatar-choice';button.setAttribute('aria-label','Selecionar '+item.label);button.setAttribute('aria-pressed',String(profile.selectedId===item.id));button.disabled=!avatarUnlocked(profile,item.id);if(button.disabled)button.setAttribute('aria-label',item.label+' — bloqueado');
  const portrait=document.createElement('span');portrait.className='avatar-portrait';paint(portrait,item);
  const img=portrait.querySelector('img');if(img){img.loading='lazy';img.width=128;img.height=128}
  const label=document.createElement('span');label.className='avatar-label';label.textContent=item.label+(button.disabled?' 🔒':'');button.append(portrait,label);button.onclick=()=>choose(item.id);
  const favorite=document.createElement('button');favorite.type='button';favorite.className='avatar-favorite';favorite.textContent=profile.favoriteIds.includes(item.id)?'★':'☆';favorite.setAttribute('aria-label','Favoritar '+item.label);favorite.setAttribute('aria-pressed',String(profile.favoriteIds.includes(item.id)));favorite.onclick=()=>{profile=toggleFavorite(profile,item.id,catalog);persist();renderGrid()};
  card.append(button,favorite);$('avatar-grid').append(card);
 }
 if(!items.length){const empty=document.createElement('p');empty.className='avatar-empty';empty.textContent='Nenhum avatar encontrado. Ajuste a busca ou os filtros.';$('avatar-grid').append(empty)}
 $('avatar-surprise').disabled=items.filter(a=>avatarUnlocked(profile,a.id)).length===0;
}
$('avatar-search').addEventListener('input',renderGrid);
for(const id of ['avatar-region','avatar-country'])$(id).addEventListener('change',renderGrid);
$('avatar-favorites').onclick=()=>{favoritesOnly=!favoritesOnly;$('avatar-favorites').setAttribute('aria-pressed',String(favoritesOnly));renderGrid()};
$('avatar-surprise').onclick=()=>{if(!catalog)return;const item=surpriseAvatar(visibleItems().filter(a=>avatarUnlocked(profile,a.id)),cosmeticRandomIndex);if(item)choose(item.id)};
window.addEventListener('domino-tour:participants-rendered',paintParticipants);
window.addEventListener('domino-tour:identity-saved',event=>{if(!catalog)return;profile=event.detail?.profile?normalizeProfile(event.detail.profile,catalog):loadProfile(storage,catalog);publishProfile();renderGrid()});
async function loadCatalog(){
 $('avatar-retry').hidden=true;$('avatar-surprise').disabled=true;
 try{
  const response=await fetch('./avatar-catalog.json');if(!response.ok)throw new Error('catalog');catalog=validateCatalog(await response.json());profile=loadProfile(storage,catalog);
  for(const [id,values]of [['avatar-region',[...new Set(catalog.items.flatMap(a=>a.regions))]],['avatar-country',[...new Set(catalog.items.map(a=>a.country).filter(Boolean))]]]){
   $(id).replaceChildren();const all=document.createElement('option');all.value='';all.textContent=id==='avatar-region'?'Todas as regiões':'Todos os países';$(id).append(all);
   for(const value of values.sort((a,b)=>a.localeCompare(b,'pt-BR'))){const option=document.createElement('option');option.value=value;option.textContent=value;$(id).append(option)}
  }
  publishProfile();renderGrid();status(profile.selectedId?'Avatar recuperado deste aparelho.':'Escolha um dos avatares disponíveis para continuar.');
 }catch{document.body.dataset.avatarReady='false';$('avatar-continue').disabled=true;status('Não foi possível abrir a biblioteca. Tente novamente.');$('avatar-retry').hidden=false}
}
$('avatar-retry').onclick=loadCatalog;
void loadCatalog();
