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
 const document={body:{dataset:{}},getElementById:id=>id==='entry-flow'?flow:play,querySelectorAll:selector=>selector==='[data-entry-step]'?cards:selector==='[data-entry-next]'?next:back};
 let timer;let entered=0;const window={dispatchEvent:()=>entered++};
 vm.runInNewContext(readFileSync(new URL('../web/entry-flow.js',import.meta.url),'utf8'),{document,window,setTimeout:fn=>{timer=fn;return 0},Event:class{}});
 assert.equal(cards.filter(c=>!c.hidden).length,1);
 for(let i=0;i<4;i++){callbacks.get('next'+i)();assert.equal(flow.dataset.step,String(i+2));assert.equal(cards.filter(c=>!c.hidden).length,1);assert.equal(entered,0)}
 timer();assert.equal(flow.dataset.step,'5','splash timer must not skip a later screen');callbacks.get('play')();assert.equal(flow.hidden,true);assert.equal(entered,1);
});
