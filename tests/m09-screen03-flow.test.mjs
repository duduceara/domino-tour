import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as config from '../web/match-config.js';
import {setArtRegion} from '../web/art-regions.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
class Element {
 constructor(){this.children=[];this.dataset={};this.hidden=false;this.inert=false;this.style={setProperty(){}};this.classList={add(){}};this.listeners={};this.attributes={};}
 append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n)}}
 remove(){this.parent.children=this.parent.children.filter(n=>n!==this)}
 get firstElementChild(){return this.children[0]}
 setAttribute(k,v){this.attributes[k]=v} removeAttribute(k){delete this.attributes[k]}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 click(){for(const f of this.listeners.click||[])f({})}
 focus(){document.activeElement=this}
 showModal(){this.open=true} close(){this.open=false}
 querySelectorAll(s){const a=[];for(const n of this.children){if(s==='[data-config-field]'&&n.dataset.configField||s==='.config03-hit'&&n.className==='config03-hit'||s.startsWith('[data-config-action=')&&n.dataset.configAction===s.match(/="([^"]+)"/)[1])a.push(n);a.push(...n.querySelectorAll(s))}return a}
 querySelector(s){return this.querySelectorAll(s)[0]}
}
let document;
test('Jogar Rápido opens screen 03; Offline/Online, help and back preserve screen 02 and app',()=>{
 const root=new Element(),page=new Element(),dialog=new Element(),title=new Element(),message=new Element(),flow=new Element(),app=new Element(),quick=new Element(),other=new Element();
 root.hidden=true;root.append(page);flow.dataset.step='2';quick.dataset.officialAction='quick';other.dataset.officialAction='rules';
 root.querySelector=s=>s==='.config03-page'?page:Element.prototype.querySelector.call(root,s);
 dialog.querySelector=s=>s==='h2'?title:message;
 const ids={'match-setup':root,'entry-flow':flow,app,'config03-dialog':dialog,'official02-dialog':new Element()};
 document={activeElement:null,querySelector:s=>s==='[data-official-action="quick"]'?quick:ids[s.slice(1)],querySelectorAll:()=>[quick,other],getElementById:id=>ids[id]??=(new Element()),createElement:()=>new Element()};
 const listeners={};const events=[];
 const window={addEventListener(k,f){(listeners[k]??=[]).push(f)},dispatchEvent(e){events.push(e.type);for(const f of listeners[e.type]||[])f(e)}};
 const context=vm.createContext({document,window,Image:Element,Event:class{constructor(type){this.type=type}},...config,setArtRegion,readOffline(){throw Error('Old dialog must not open')}});
 vm.runInContext(read('web/match-setup.js').replace(/^import .*;\n/gm,'').replace('export function readPendingIdentification','function readPendingIdentification'),context);
 vm.runInContext('{'+read('web/central.js').replace(/^import .*;\n/gm,'')+'}',context);
 quick.click();assert.equal(root.hidden,false);assert.equal(root.dataset.mode,'offline');assert.equal(flow.inert,true);assert.equal(app.inert,true);
 const action=k=>root.querySelector(`[data-config-action="${k}"]`);
 const choice=(f,v)=>root.querySelectorAll('[data-config-field]').find(n=>n.dataset.configField===f&&n.dataset.configValue===v);
 choice('difficulty','hard').click();action('online').click();assert.equal(root.dataset.mode,'online');action('online-create').click();assert.equal(dialog.open,true);assert.equal(title.textContent,'Jogar Online');dialog.close();
 action('offline').click();assert.equal(choice('difficulty','hard').attributes['aria-pressed'],'true');action('start').click();assert.equal(dialog.open,false);dialog.close();
 action('back').click();assert.equal(root.hidden,true);assert.equal(flow.inert,false);assert.equal(app.inert,false);assert.equal(document.activeElement,quick);
 other.click();assert.equal(ids['official02-title'].textContent,'Regras');assert.equal(ids['official02-dialog'].open,true);
 assert.deepEqual(events,['domino-tour:configure-match','domino-tour:identify-guest']);
});
