import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function entry(readyState='complete',search=''){
 const callbacks=new Map(),cards=Array.from({length:6},(_,i)=>({hidden:false,hasAttribute:name=>name==='data-entry-require-avatar'&&i===2})),flow={hidden:false,dataset:{}};
 const play={addEventListener:(k,f)=>callbacks.set('play',f)};
 const next=Array.from({length:5},(_,i)=>({addEventListener:(k,f)=>callbacks.set('next'+i,f)}));
 const back=Array.from({length:4},(_,i)=>({addEventListener:(k,f)=>callbacks.set('back'+i,f)}));
 const document={readyState,body:{dataset:{}},getElementById:id=>id==='entry-flow'?flow:play,querySelectorAll:s=>s==='[data-entry-step]'?cards:s==='[data-entry-next]'?next:back};
 let timer,delay,entered=0;const handlers=new Map(),window={addEventListener:(k,fn)=>handlers.set(k,fn),dispatchEvent:()=>entered++};
 vm.runInNewContext(readFileSync(new URL('../web/entry-flow.js',import.meta.url),'utf8'),{document,window,location:{search},URLSearchParams,setTimeout:(fn,ms)=>{timer=fn;delay=ms;return 0},Event:class{}});
 return {callbacks,cards,flow,document,handlers,timer:()=>timer(),delay:()=>delay,entered:()=>entered};
}
test('six entry stages lead to table through access, avatar, menu, offline and preparation',()=>{
 const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');assert.equal((html.match(/data-entry-step/g)||[]).length,6);
 for(const id of ['entry-play','avatar-continue','avatar-grid','avatar-search','avatar-region','avatar-country','avatar-favorites','avatar-surprise'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/src="\.\/avatar-picker\.js"/);assert.match(html,/src="\.\/entry-flow\.js"/);assert.match(html,/src="\.\/app\.js"/);
});
test('navigation requires a valid avatar, advances one screen at a time and enters exactly once',()=>{
 const h=entry();assert.equal(h.cards.filter(c=>!c.hidden).length,1);h.callbacks.get('next0')();assert.equal(h.flow.dataset.step,'1');h.timer();assert.equal(h.flow.dataset.step,'2');
 h.callbacks.get('play')();assert.equal(h.entered(),0,'cannot bypass preparation');h.callbacks.get('next1')();assert.equal(h.flow.dataset.step,'3');h.callbacks.get('next2')();assert.equal(h.flow.dataset.step,'3','no avatar cannot bypass identity');
 h.document.body.dataset.avatarReady='true';for(let i=2;i<5;i++){h.callbacks.get('next'+i)();assert.equal(h.flow.dataset.step,String(i+2));assert.equal(h.cards.filter(c=>!c.hidden).length,1)}
 h.timer();assert.equal(h.flow.dataset.step,'6');h.callbacks.get('play')();assert.equal(h.flow.hidden,true);assert.equal(h.entered(),1);h.callbacks.get('play')();assert.equal(h.entered(),1,'duplicate entry is ignored');
});
test('splash waits for real load as well as the three-second minimum',()=>{
 const h=entry('interactive');assert.equal(h.delay(),3000);h.timer();assert.equal(h.flow.dataset.step,'1');h.handlers.get('load')();assert.equal(h.flow.dataset.step,'2');
});

test('screen 01 review stays on the approved splash after real load and minimum',()=>{
 const h=entry('interactive','?homologacao=tela01');
 h.timer();assert.equal(h.flow.dataset.step,'1');h.handlers.get('load')();
 assert.equal(h.flow.dataset.step,'1');assert.equal(h.entered(),0);
});
test('real load alone cannot bypass the three-second minimum',()=>{
 const h=entry('interactive');h.handlers.get('load')();
 assert.equal(h.flow.dataset.step,'1');h.timer();assert.equal(h.flow.dataset.step,'2');
});

test('quick play cannot bypass splash and enters offline without avatar from Central',()=>{
 const h=entry();h.handlers.get('domino-tour:quick-play')();assert.equal(h.entered(),0);
 h.timer();assert.equal(h.flow.dataset.step,'2');assert.equal(h.document.body.dataset.avatarReady,undefined);
 h.handlers.get('domino-tour:quick-play')();assert.equal(h.entered(),1);assert.equal(h.flow.hidden,true);
 h.handlers.get('domino-tour:quick-play')();assert.equal(h.entered(),1);
});
