import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('five entry steps exist and final action opens offline game',()=>{
 const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
 assert.equal((html.match(/data-entry-step/g)||[]).length,5);
 assert.match(html,/id="entry-play"/);
 assert.match(html,/src="\.\/entry-flow\.js"/);
 assert.match(html,/src="\.\/app\.js"/);
});
test('navigation progresses one screen at a time and only play dismisses entry',()=>{
 const callbacks=new Map(),cards=Array.from({length:5},()=>({hidden:false}));
 const flow={hidden:false,dataset:{}};
 const play={addEventListener:(k,f)=>callbacks.set('play',f)};
 const next=Array.from({length:4},(_,i)=>({addEventListener:(k,f)=>callbacks.set('next'+i,f)}));
 const back=Array.from({length:4},(_,i)=>({addEventListener:(k,f)=>callbacks.set('back'+i,f)}));
 const document={readyState:'complete',body:{dataset:{}},getElementById:id=>id==='entry-flow'?flow:play,querySelectorAll:selector=>selector==='[data-entry-step]'?cards:selector==='[data-entry-next]'?next:back};
 let timer;let entered=0;const window={addEventListener:()=>{},dispatchEvent:()=>entered++};
 vm.runInNewContext(readFileSync(new URL('../web/entry-flow.js',import.meta.url),'utf8'),{document,window,setTimeout:fn=>{timer=fn;return 0},Event:class{}});
 assert.equal(cards.filter(c=>!c.hidden).length,1);
 callbacks.get('next0')();assert.equal(flow.dataset.step,'1','early tap cannot skip the splash');
 timer();assert.equal(flow.dataset.step,'2');
 for(let i=1;i<4;i++){callbacks.get('next'+i)();assert.equal(flow.dataset.step,String(i+2));assert.equal(cards.filter(c=>!c.hidden).length,1);assert.equal(entered,0)}
 timer();assert.equal(flow.dataset.step,'5','splash timer must not skip a later screen');callbacks.get('play')();assert.equal(flow.hidden,true);assert.equal(entered,1);
});
test('splash waits for real load as well as its minimum delay',()=>{
 const handlers=new Map(),flow={hidden:false,dataset:{}},cards=Array.from({length:5},()=>({hidden:true}));
 const button={addEventListener:()=>{}};
 const document={readyState:'interactive',body:{dataset:{}},getElementById:id=>id==='entry-flow'?flow:button,querySelectorAll:s=>s==='[data-entry-step]'?cards:[]};
 let timer,delay;const window={addEventListener:(name,fn)=>handlers.set(name,fn),dispatchEvent:()=>{}};
 vm.runInNewContext(readFileSync(new URL('../web/entry-flow.js',import.meta.url),'utf8'),{document,window,setTimeout:(fn,ms)=>{timer=fn;delay=ms},Event:class{}});
 assert.equal(delay,2000);timer();assert.equal(flow.dataset.step,'1');handlers.get('load')();assert.equal(flow.dataset.step,'2');
});
