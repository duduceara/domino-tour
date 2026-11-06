import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalSession} from '../dist/src/session.js';
import {readOffline,writeOffline,SAVE_KEY} from '../web/offline-save.js';
import {legalTiles} from '../dist/src/engine.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data}};
test('offline snapshot restores actual game, score, difficulty and nickname after a move',()=>{
 const storage=memory(),game=new LocalSession(150,7,'hard');
 if(game.state.turn===0){const t=legalTiles(game.state,0)[0];game.humanPlay(t.id,'left')}else game.advanceBots(1);
 assert.equal(writeOffline(storage,game,'classic','Carlos'),true);
 const restored=readOffline(storage);assert.equal(restored.kind,'saved');assert.deepEqual(restored.session.state,game.state);assert.equal(restored.name,'Carlos');assert.equal(restored.session.difficulty,'hard');assert.deepEqual(restored.session.orderedHand(),game.orderedHand());
});
test('unavailable storage reports failure without pretending to save',()=>{assert.equal(writeOffline({setItem(){throw Error('quota')}},new LocalSession(),'classic'),false)});
test('corrupted snapshot is retained and never silently deleted',()=>{const s=memory();s.setItem(SAVE_KEY,'broken');assert.equal(readOffline(s).kind,'unavailable');assert.equal(s.getItem(SAVE_KEY),'broken')});
test('unsupported snapshot version is preserved',()=>{const s=memory();s.setItem(SAVE_KEY,'{"version":99}');assert.equal(readOffline(s).kind,'unavailable');assert.equal(s.getItem(SAVE_KEY),'{"version":99}')});

test('official screen 02 PNG matches original approved bytes and every image control has an action',async()=>{
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');
 const png=readFileSync(new URL('../web/assets/approved/screen-02-apresentacao-rumo-a-lenda.png',import.meta.url));
 assert.equal(createHash('sha256').update(png).digest('hex'),'f668011054b12323ece150bacb6c915fcad84b981f8c66a63c3178c7ac35b83c');
 const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');const code=readFileSync(new URL('../web/central.js',import.meta.url),'utf8');
 const actions=[...html.matchAll(/data-official-action="([a-z]+)"/g)].map(m=>m[1]);assert.equal(actions.length,16);
 for(const action of new Set(actions)){if(action!=='quick')assert.ok(code.includes(action+':['),action)}
 assert.match(code,/if\(\$\('official02-mode'\).value!=='offline'\)return/);
});
