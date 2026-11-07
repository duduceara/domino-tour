import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {INITIAL_AVATAR_IDS,PROFILE_KEY,avatarUnlocked,normalizeProfile,loadProfile,saveProfile,selectProfileAvatar,validateNickname,participantEntry} from '../web/avatar-profile.js';
import {processLocalPhoto} from '../web/identity-photo.js';
import {guestOptions,localGuest} from '../web/guest-session.js';
import {createMatchConfig} from '../web/match-config.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=JSON.parse(read('web/avatar-catalog.json'));
const storage=()=>{const map=new Map([['other-data','keep']]);return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
const photo='data:image/jpeg;base64,/9j/AA==';
test('ten initial real portraits contain five humans and five animals; other choices remain locked',()=>{
 assert.equal(INITIAL_AVATAR_IDS.length,10);assert.equal(new Set(INITIAL_AVATAR_IDS).size,10);
 assert.equal(INITIAL_AVATAR_IDS.filter(id=>Number(id.slice(-3))<=30).length,5);
 assert.ok(INITIAL_AVATAR_IDS.every(id=>catalog.items.some(a=>a.id===id)));
 const p=normalizeProfile(null,catalog);assert.equal(catalog.items.filter(a=>avatarUnlocked(p,a.id)).length,10);
 assert.throws(()=>selectProfileAvatar(p,'world-041',catalog));assert.throws(()=>selectProfileAvatar(p,'missing',catalog));
});
test('legacy selected avatar, favorites and explicit unlocks survive identity changes and reload',()=>{
 const store=storage();store.setItem(PROFILE_KEY,JSON.stringify({version:1,selectedId:'world-041',favoriteIds:['world-041'],unlockedIds:['world-042']}));
 let p=loadProfile(store,catalog);assert.ok(avatarUnlocked(p,'world-041'));assert.ok(avatarUnlocked(p,'world-042'));
 p=selectProfileAvatar(p,'world-001',catalog);p={...p,nickname:'Carlos',photo};assert.equal(saveProfile(store,p),true);p=loadProfile(store,catalog);
 assert.equal(p.nickname,'Carlos');assert.equal(p.photo,photo);assert.ok(p.unlockedIds.includes('world-041'));assert.ok(p.unlockedIds.includes('world-042'));assert.deepEqual(p.favoriteIds,['world-041']);assert.equal(store.getItem('other-data'),'keep');
 assert.equal(participantEntry(catalog,p,0).src,photo);assert.equal(participantEntry(catalog,p,1).id,'robix');
 p=selectProfileAvatar(p,'world-031',catalog);assert.equal(p.photo,undefined);assert.equal(participantEntry(catalog,p,0).id,'world-031');
});
test('nickname length matches existing 24-character game contract and blank names never launch',()=>{
 assert.equal(validateNickname('  Carlos  '),'Carlos');assert.equal(validateNickname('x'.repeat(24)).length,24);
 for(const name of ['', '   ', 'x'.repeat(25),'a\nb'])assert.throws(()=>validateNickname(name));
});
test('photo cancel, invalid type, oversize and decode failure preserve prior choice without sending data',async()=>{
 assert.equal(await processLocalPhoto(null),null);
 await assert.rejects(processLocalPhoto({type:'image/svg+xml',size:100}));
 await assert.rejects(processLocalPhoto({type:'image/png',size:9*1024*1024}));
 await assert.rejects(processLocalPhoto({type:'image/png',size:100},{read:async()=>{throw Error('read failure')}}));
 await assert.rejects(processLocalPhoto({type:'image/png',size:100},{read:async()=>'',decode:async()=>{throw Error('decode failure')}}));
 assert.equal(normalizeProfile({version:1,selectedId:'world-001',photo:'https://external/photo'},catalog).photo,undefined);
});
test('photo conversion limits the longest side to 512 and uses only local canvas output',async()=>{
 const out={getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=>photo};
 const result=await processLocalPhoto({type:'image/png',size:100},{read:async()=> 'local-bytes',decode:async()=>({naturalWidth:2000,naturalHeight:1000}),canvas:()=>out});
 assert.equal(result,photo);assert.equal(out.width,512);assert.equal(out.height,256);
});
test('visitor entry defers session creation until identity JOGAR and starts only once with original options',()=>{
 class Element{constructor(){this.hidden=false;this.inert=true;this.dataset={};this.listeners={}}setAttribute(){}append(){}focus(){}addEventListener(k,f){this.listeners[k]=f}querySelector(s){return s==='#guest04-play'?play:status}}
 const play=new Element(),status=new Element(),setup=new Element(),app=new Element(),flow=new Element();flow.dataset.step='2';let root,callbacks;const listeners={},events=[];let guestCount=0;
 const doc={body:{dataset:{},append(){}},querySelector:s=>({'#entry-flow':flow,'#match-setup':setup,'#app':app}[s]),createElement:()=>root=new Element()};
 const store=storage();const win={localStorage:store,addEventListener:(k,f)=>listeners[k]=f,dispatchEvent:e=>{events.push(e);if(e.type==='domino-tour:offline-options')e.detail.accepted=true;listeners[e.type]?.(e)}};
 const c={...createMatchConfig(),difficulty:'hard',target:200,tableStyle:'blue'};
 const context=vm.createContext({document:doc,window:win,readPendingIdentification:()=>c,guestOptions,localGuest:(...a)=>{guestCount++;return localGuest(...a)},openIdentity:o=>callbacks=o,crypto:{randomUUID:()=> 'guest-id'},Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}}});
 vm.runInContext(read('web/guest-access.js').replace(/^import .*;\n/gm,''),context);
 listeners['domino-tour:identify-guest']();play.listeners.click();assert.equal(guestCount,0);assert.equal(events.length,0);
 callbacks.onBack();assert.equal(root.hidden,false);play.listeners.click();
 assert.equal(callbacks.onPlay({nickname:'Carlos'}),true);assert.equal(callbacks.onPlay({nickname:'Carlos'}),false);
 assert.equal(guestCount,1);assert.equal(events.filter(e=>e.type==='domino-tour:quick-play').length,1);
 const o=events.find(e=>e.type==='domino-tour:offline-options').detail;assert.equal(o.name,'Carlos');assert.equal(o.difficulty,'hard');assert.equal(o.target,200);assert.equal(o.deal,6);assert.equal(o.tableStyle,'blue');assert.equal(app.dataset.guestTheme,'blue');assert.equal(doc.body.dataset.session,'guest');
});
test('approved identity PNG bytes and all earlier screen sections are preserved',()=>{
 const bytes=readFileSync(new URL('../web/assets/approved/screen-05-identidade-oficial.png',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),'c7f38447eaa0ebe5e62b843297cf296e0f4e23a946640e4a22ee2620b5594867');
 assert.equal(bytes.readUInt32BE(16),941);assert.equal(bytes.readUInt32BE(20),1672);
 const html=read('web/index.html');const section=html.match(/<section data-entry-step class="official-presentation"[\s\S]*?<\/section>/)[0];assert.equal(createHash('sha256').update(section).digest('hex'),'a94e0739422a9ca06c90d9bb762a9d4b0fc83e34f5ed2842c9d0dd788cb02a42');
});
