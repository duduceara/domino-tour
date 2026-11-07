import {fitApprovedArtwork} from './artwork-fit.js';
import {validateCatalog,loadProfile,saveProfile,selectProfileAvatar,avatarUnlocked,INITIAL_AVATAR_IDS,validateNickname,NICKNAME_LIMIT,participantEntry} from './avatar-profile.js';
import {processLocalPhoto} from './identity-photo.js';
const root=document.createElement('section');root.id='identity-screen';root.className='identity05';root.hidden=true;root.setAttribute('aria-label','Tela 05 — Crie sua Identidade');
root.innerHTML='<div class="identity05-stage"><img class="identity05-art" src="./assets/approved/screen-05-identidade-oficial.png" width="941" height="1672" alt="DOMINÓ TOUR — Crie sua Identidade — Passaporte do Jogador"><img class="identity05-portrait" alt="Retrato selecionado"><input class="identity05-name" aria-label="Seu apelido" autocomplete="nickname" enterkeyhint="done" maxlength="24"><button type="button" class="identity05-hit" data-identity-action="photo" aria-label="Usar foto" style="left:50.7%;top:49.1%;width:27.6%;height:4%"></button><input id="identity-photo-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="identity05-options" role="group" aria-label="Escolha seu avatar"></div><button type="button" class="identity05-hit" data-identity-action="previous" aria-label="Avatares anteriores" style="left:1.7%;top:69%;width:5.5%;height:4.8%"></button><button type="button" class="identity05-hit" data-identity-action="next" aria-label="Próximos avatares" style="left:92.8%;top:69%;width:5.5%;height:4.8%"></button><button type="button" class="identity05-hit" data-identity-action="more" aria-label="Mais avatares" style="left:32.6%;top:77.4%;width:34.5%;height:3.3%"></button><button type="button" class="identity05-hit" data-identity-action="play" aria-label="JOGAR" style="left:12.5%;top:81.8%;width:75%;height:9.2%"></button><button type="button" class="identity05-hit" data-identity-action="back" aria-label="Voltar" style="left:39%;top:91.8%;width:22%;height:3.3%"></button></div><p class="identity05-status" role="status" aria-live="polite"></p><dialog class="identity05-collection" aria-labelledby="identity-collection-title"><header><h2 id="identity-collection-title">Coleção de avatares</h2><button type="button" data-identity-action="close-collection" aria-label="Fechar coleção">Fechar</button></header><p class="identity05-count"></p><div class="identity05-grid"></div><p>Avatares com cadeado estão indisponíveis nesta versão de teste.</p></dialog>';
document.body.append(root);
for(const [selector,top,height]of [['.identity05-portrait','33%','23.7%'],['.identity05-name','43.5%','3.1%'],['.identity05-options','66.65%','9.65%']]){const e=root.querySelector(selector);e.style.top=top;e.style.height=height}
fitApprovedArtwork(root.querySelector('.identity05-stage'),root,[0,.31,.65,.81,1],941,1672);
const $=s=>root.querySelector(s),action=name=>$(`[data-identity-action="${name}"]`),input=$('.identity05-name'),portrait=$('.identity05-portrait'),row=$('.identity05-options'),dialog=$('dialog'),status=$('[role="status"]'),file=$('#identity-photo-file');
let storage=null;try{storage=window.localStorage}catch{}
let catalog=null,profile=null,items=[],callbacks=null,page=0,busy=false,processing=false,photoEpoch=0,ready=null;
function notify(text){status.textContent=text}
function persist(){
 try{profile={...profile,nickname:validateNickname(input.value)}}catch{return false}
 const saved=saveProfile(storage,profile);if(!saved)notify('Escolhas mantidas nesta sessão. O armazenamento local está indisponível.');return saved;
}
function imageButton(item,collection=false){
 const button=document.createElement('button');button.type='button';button.className=collection?'':'identity05-option';button.dataset.avatarChoice=item.id;button.disabled=!avatarUnlocked(profile,item.id);button.setAttribute('aria-label',item.label+(button.disabled?' — bloqueado':''));button.setAttribute('aria-pressed',String(!profile.photo&&profile.selectedId===item.id));
 const img=new Image();img.src=item.src;img.alt='';img.width=128;img.height=128;button.append(img);
 if(collection){const label=document.createElement('span');label.textContent=item.label;button.append(label)}
 button.addEventListener('click',()=>{if(processing||button.disabled)return;profile=selectProfileAvatar(profile,item.id,catalog);persist();notify('Avatar selecionado.');render();if(dialog.open)dialog.close()});return button;
}
function render(){
 const selected=participantEntry(catalog,profile,0);portrait.src=selected.src;portrait.alt='Retrato selecionado: '+(profile.photo?'Sua foto':selected.label);
 row.replaceChildren(...items.slice(page*6,page*6+6).map(a=>imageButton(a)));
 if(dialog.open)renderCollection();
}
function renderCollection(){
 $('.identity05-grid').replaceChildren(...items.map(a=>imageButton(a,true)));
 $('.identity05-count').textContent=`${items.filter(a=>avatarUnlocked(profile,a.id)).length} desbloqueados · ${items.length} disponíveis no catálogo`;
}
async function load(){
 const response=await fetch('./avatar-catalog.json');if(!response.ok)throw new Error('Não foi possível carregar os avatares.');const raw=validateCatalog(await response.json());
 // Only actual successfully loaded assets are offered, even in the locked collection.
 const available=await Promise.all(raw.items.map(item=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(item);img.onerror=()=>resolve(null);img.src=item.src})));
 catalog={...raw,items:available.filter(Boolean)};if(!catalog.items.length)throw new Error('Os retratos estão indisponíveis. Tente novamente.');
 profile=loadProfile(storage,catalog);const first=INITIAL_AVATAR_IDS.find(id=>catalog.items.some(a=>a.id===id));
 if(!profile.selectedId&&!profile.photo){if(!first)throw new Error('Nenhum avatar inicial pôde ser carregado.');profile={...profile,selectedId:first}}
 items=[...INITIAL_AVATAR_IDS.map(id=>catalog.items.find(a=>a.id===id)).filter(Boolean),...catalog.items.filter(a=>!INITIAL_AVATAR_IDS.includes(a.id))];
 input.value=profile.nickname||'Visitante';input.maxLength=NICKNAME_LIMIT;
 if(catalog.items.length<raw.items.length)notify(`${raw.items.length-catalog.items.length} retratos não puderam ser carregados e foram removidos das opções.`);
 render();
}
export async function openIdentity(options){
 callbacks=options;busy=false;root.hidden=false;action('play').disabled=true;
 try{ready??=load();await ready;action('play').disabled=false;action('play').focus({preventScroll:true});root.scrollTop=0}catch(error){ready=null;notify(error.message);action('back').focus({preventScroll:true})}
}
input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');persist()});
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}});
action('previous').addEventListener('click',()=>{if(!catalog)return;page=(page-1+Math.ceil(items.length/6))%Math.ceil(items.length/6);render()});
action('next').addEventListener('click',()=>{if(!catalog)return;page=(page+1)%Math.ceil(items.length/6);render()});
action('more').addEventListener('click',()=>{if(!catalog)return;dialog.showModal();renderCollection()});
action('close-collection').addEventListener('click',()=>dialog.close());
action('back').addEventListener('click',()=>{if(busy)return;photoEpoch++;processing=false;persist();if(dialog.open)dialog.close();root.hidden=true;callbacks?.onBack()});
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open){e.preventDefault();action('back').click()}});
action('photo').addEventListener('click',()=>{if(!catalog||processing)return;file.value='';file.click()});
file.addEventListener('change',async()=>{
 const chosen=file.files?.[0];if(!chosen)return;const epoch=++photoEpoch;processing=true;action('play').disabled=true;notify('Processando foto neste aparelho…');
 try{const photo=await processLocalPhoto(chosen);if(epoch!==photoEpoch)return;profile={...profile,photo};persist();render();notify('Foto pronta. Ela permanece somente neste aparelho.')}
 catch(error){if(epoch===photoEpoch)notify(error.message)}
 finally{if(epoch===photoEpoch){processing=false;action('play').disabled=false}}
});
action('play').addEventListener('click',()=>{
 if(busy||processing||!catalog||!profile||root.hidden)return;
 try{profile={...profile,nickname:validateNickname(input.value)}}catch(error){input.setAttribute('aria-invalid','true');notify(error.message);input.focus();return}
 if(!profile.photo&&!avatarUnlocked(profile,profile.selectedId)){notify('Escolha um avatar desbloqueado.');return}
 busy=true;persist();window.dispatchEvent(new CustomEvent('domino-tour:identity-saved',{detail:{profile}}));
 if(callbacks?.onPlay(profile)===true){root.hidden=true;return}busy=false;notify('Não foi possível preparar a partida. Tente novamente.');
});
