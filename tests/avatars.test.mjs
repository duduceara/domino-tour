import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as avatars from '../web/avatar-profile.js';
const catalog=JSON.parse(readFileSync(new URL('../web/avatar-catalog.json',import.meta.url)));
function storage(initial={}){const map=new Map(Object.entries(initial));return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}}
test('actual catalog has 50 unique approved crops and three correctly seated opponents, all intact WebP with alpha',()=>{
 avatars.validateCatalog(catalog);assert.equal(catalog.items.length,50);assert.equal(catalog.opponents.length,3);assert.deepEqual(catalog.opponents.map(a=>[a.name,a.seat,a.position]),[['RobiX',1,'left'],['AndroX',2,'top'],['DomiX',3,'right']]);
 for(const asset of [...catalog.items,...catalog.opponents]){const data=readFileSync(new URL('../web/'+asset.src,import.meta.url));assert.equal(data.length,asset.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.includes(Buffer.from('ALPH')),'explicit alpha channel');assert.equal(asset.sourceBounds.length,4)}
 assert.ok([...catalog.items,...catalog.opponents].reduce((n,a)=>n+a.bytes,0)<400000);
 const duplicate=structuredClone(catalog);duplicate.items.push(duplicate.items[0]);assert.throws(()=>avatars.validateCatalog(duplicate));
 const unsafe=structuredClone(catalog);unsafe.items[0].src='https://elsewhere/avatar.png';assert.throws(()=>avatars.validateCatalog(unsafe));
});
test('selection and favorites persist only in cosmetic profile, unrelated match keys remain untouched',()=>{
 const store=storage({'match:state':'untouched'});let profile=avatars.loadProfile(store,catalog);assert.equal(profile.selectedId,null);
 profile=avatars.selectProfileAvatar(profile,catalog.items[3].id,catalog);profile=avatars.toggleFavorite(profile,catalog.items[3].id,catalog);assert.ok(avatars.saveProfile(store,profile));assert.deepEqual(avatars.loadProfile(store,catalog),profile);assert.equal(store.getItem('match:state'),'untouched');assert.deepEqual([...store.map.keys()].sort(),[avatars.PROFILE_KEY,'match:state'].sort());
 assert.throws(()=>avatars.selectProfileAvatar(profile,'not-real',catalog));assert.throws(()=>avatars.selectProfileAvatar(profile,'robix',catalog),'opponents not invented selectable avatars');
});
test('blocked storage, bad JSON and removed IDs degrade safely, session selection still works',()=>{
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('quota')}};const p=avatars.loadProfile(denied,catalog);assert.equal(p.selectedId,null);const selected=avatars.selectProfileAvatar(p,catalog.items[0].id,catalog);assert.equal(avatars.saveProfile(denied,selected),false);assert.ok(selected.selectedId);
 assert.equal(avatars.loadProfile(storage({[avatars.PROFILE_KEY]:'{broken'}),catalog).selectedId,null);
 const removed=storage({[avatars.PROFILE_KEY]:JSON.stringify({version:1,selectedId:'removed',favoriteIds:['removed',catalog.items[0].id]})});assert.deepEqual(avatars.loadProfile(removed,catalog),{version:1,selectedId:null,favoriteIds:[catalog.items[0].id]});
});
test('search is accent-insensitive, region/country/favorites filter actual entries, surprise never invents entries',()=>{
 const brazil=avatars.filterAvatars(catalog,{region:'Brasil'});assert.ok(brazil.length>0);assert.ok(brazil.every(a=>a.regions.includes('Brasil')));
 assert.ok(avatars.filterAvatars(catalog,{query:'mexico'}).some(a=>a.country==='México'));assert.ok(avatars.filterAvatars(catalog,{country:'Japão'}).every(a=>a.country==='Japão'));
 const id=catalog.items[4].id;assert.deepEqual(avatars.filterAvatars(catalog,{favoritesOnly:true,favoriteIds:[id]}).map(a=>a.id),[id]);assert.equal(avatars.filterAvatars(catalog,{query:'does-not-exist'}).length,0);
 assert.equal(avatars.surpriseAvatar([],()=>0),null);const choices=avatars.filterAvatars(catalog,{failedIds:[catalog.items[0].id]});assert.equal(avatars.surpriseAvatar(choices,()=>0).id,choices[0].id);assert.throws(()=>avatars.surpriseAvatar(choices,()=>999));
});
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.listeners={};this.value='';this.hidden=false;this.textContent=''}
 setAttribute(k,v){this.attributes[k]=v}getAttribute(k){return this.attributes[k]}
 replaceChildren(...v){this.children=v}append(...v){this.children.push(...v)}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 querySelector(tag){return this.children.find(c=>c.tagName===tag.toUpperCase())??this.children.map(c=>c.querySelector(tag)).find(Boolean)??null}
 click(){if(!this.disabled)this.onclick?.()}
}
async function picker({initial={},denied=false,fetchFails=false}={}){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 const profiles=[new Element(),new Element()],seats=Array.from({length:8},(_,i)=>{const e=new Element();e.dataset.avatarSeat=String(i%4);return e});
 const doc={body:{dataset:{}},createElement:tag=>new Element(tag),getElementById:get,querySelectorAll:s=>s==='[data-profile-avatar]'?profiles:s==='[data-avatar-seat]'?seats:[]};
 const store=storage(initial),listeners=new Map();const win={localStorage:denied?{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}:store,addEventListener:(k,fn)=>listeners.set(k,fn),dispatchEvent:e=>listeners.get(e.type)?.(e)};
 const source=readFileSync(new URL('../web/avatar-picker.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('void loadCatalog();','await loadCatalog();');
 const ctx=vm.createContext({...avatars,renderAvatar:(slot,entry,options)=>avatars.renderAvatar(slot,entry,{...options,document:doc}),cosmeticRandomIndex:()=>0,document:doc,window:win,fetch:async()=>{if(fetchFails)throw Error('offline');return {ok:true,json:async()=>structuredClone(catalog)}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}});
 await vm.runInContext('(async()=>{'+source+'})()',ctx);return {get,doc,win,profiles,seats,store};
}
test('picker selects, persists, updates player slots and keeps the three approved opponents distinct',async()=>{
 const h=await picker({initial:{'match:state':'unchanged'}});assert.equal(h.get('avatar-grid').children.length,50);assert.equal(h.doc.body.dataset.avatarReady,'false');h.get('avatar-grid').children[0].children[0].click();assert.equal(h.doc.body.dataset.avatarReady,'true');assert.equal(h.get('avatar-continue').disabled,false);
 for(const slots of [h.seats.slice(0,4),h.seats.slice(4)]){assert.equal(slots[0].dataset.avatarId,catalog.items[0].id);assert.deepEqual(slots.slice(1).map(e=>e.dataset.avatarId),['robix','androx','domix']);assert.ok(slots.every(e=>e.children[0].tagName==='IMG'))}
 assert.equal(h.store.getItem('match:state'),'unchanged');const selected=h.store.getItem(avatars.PROFILE_KEY);const restored=await picker({initial:{[avatars.PROFILE_KEY]:selected}});assert.equal(restored.seats[0].dataset.avatarId,catalog.items[0].id);assert.equal(restored.doc.body.dataset.avatarReady,'true');
});
test('picker handles catalog failure, unavailable image and denied storage without broken-image leftovers',async()=>{
 const fail=await picker({fetchFails:true});assert.equal(fail.get('avatar-continue').disabled,true);assert.equal(fail.get('avatar-retry').hidden,false);
 const h=await picker({denied:true});h.get('avatar-grid').children[0].children[0].click();assert.match(h.get('avatar-status').textContent,/sessão/);const slot=h.profiles[0];const image=slot.children[0];image.onerror();assert.equal(slot.children[0].tagName,'SPAN');assert.equal(slot.dataset.avatarState,'unavailable');assert.equal(h.doc.body.dataset.avatarReady,'false');assert.equal(h.get('avatar-continue').disabled,true);assert.equal(h.get('avatar-grid').children.length,49);
 h.get('avatar-grid').children[0].children[0].click();assert.equal(h.doc.body.dataset.avatarReady,'true');
});
test('picker favorites, surprise and empty filtered results are functional',async()=>{
 const h=await picker();h.get('avatar-grid').children[0].children[1].click();h.get('avatar-favorites').click();assert.equal(h.get('avatar-grid').children.length,1);h.get('avatar-surprise').click();assert.equal(h.doc.body.dataset.avatarReady,'true');
 h.get('avatar-search').value='nothing-matches';h.get('avatar-search').listeners.input[0]();assert.equal(h.get('avatar-surprise').disabled,true);assert.match(h.get('avatar-grid').children[0].textContent,/Nenhum avatar/);
});
