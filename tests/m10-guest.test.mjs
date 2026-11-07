import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {guestOptions,localGuest} from '../web/guest-session.js';
import {createMatchConfig} from '../web/match-config.js';
import {LocalSession} from '../dist/src/session.js';
import {readOffline,writeOffline} from '../web/offline-save.js';
test('guest options preserve difficulty, target and visual theme without authentication',()=>{
 const c={...createMatchConfig(),difficulty:'hard',target:200,tableStyle:'blue'};
 assert.deepEqual(guestOptions(c),{mode:'offline',guest:true,resume:false,name:'Visitante',difficulty:'hard',target:200,tableStyle:'blue',deal:6,accepted:false});
 assert.deepEqual(c,{mode:'offline',difficulty:'hard',target:200,tableStyle:'blue'});
});
test('Online and invalid configurations cannot prepare a guest game',()=>{
 for(const c of [{...createMatchConfig(),mode:'online'},{...createMatchConfig(),target:300},{...createMatchConfig(),difficulty:'invalid'}])assert.throws(()=>guestOptions(c));
});
test('visitor identity is local and explicitly unauthenticated, including unavailable storage',()=>{
 const saved=new Map(),s={setItem:(k,v)=>saved.set(k,v)};
 const g=localGuest(s,'test-id');assert.equal(g.authenticated,false);assert.equal(g.kind,'guest');assert.deepEqual(JSON.parse(saved.get('domino-tour:guest:v1')),g);
 assert.equal(localGuest({setItem(){throw Error('blocked')}},'memory-id').name,'Visitante');
});
test('existing engine adapter accepts guest choices and rejects Online without a new session',()=>{
 const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
 const listener=app.match(/window.addEventListener\('domino-tour:offline-options',e=>\{([\s\S]*?)\n\}\);/)[1];
 const nodes=new Map();const $=id=>id==='entry-flow'?{hidden:false,dataset:{step:'2'}}:nodes.get(id)??(nodes.set(id,{}),nodes.get(id));
 const context=vm.createContext({turnClock:{stop(){}},completedKey:null,$,LocalSession,stopBotSequence(){},cancelGesture(){},chooseRoute:()=> 'classic',secureIndex(){},game:null,routeStyle:null,offlineName:null,e:{detail:guestOptions({...createMatchConfig(),difficulty:'hard',target:200})}});
 vm.runInContext("(()=>{"+listener+"})()",context);assert.equal(context.e.detail.accepted,true);assert.equal(context.game.state.target,200);assert.equal(context.game.difficulty,'hard');assert.equal(context.game.state.dealSize,6);assert.equal(context.offlineName,'Visitante');
 const prior=context.game;context.e={detail:{...guestOptions(createMatchConfig()),mode:'online'}};vm.runInContext("(()=>{"+listener+"})()",context);assert.equal(context.e.detail.accepted,false);assert.equal(context.game,prior);
});
test('guest match saves and restores using the existing offline persistence',()=>{
 const m=new Map(),storage={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 const c=guestOptions({...createMatchConfig(),difficulty:'hard',target:200});const game=new LocalSession(c.target,c.deal,c.difficulty);
 assert.equal(writeOffline(storage,game,'classic',c.name),true);const restored=readOffline(storage);assert.equal(restored.name,'Visitante');assert.equal(restored.session.state.target,200);assert.equal(restored.session.difficulty,'hard');
});
test('account artwork is the exact approved original and not a replacement of the current menu',()=>{
 const b=readFileSync(new URL('../web/assets/approved/screen-02.png',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),'179b81c7304c829b88180e1f4b3efe6dc5d3bb9a332b8bfbdfe92b1ed134e554');
 const js=readFileSync(new URL('../web/guest-access.js',import.meta.url),'utf8');assert.equal((js.match(/ disabled aria-label=/g)||[]).length,3);assert.ok(js.includes('./assets/approved/screen-02.png'));
});
