import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('original gallery preserves bytes, all 16 positions, missing journey and reused table',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../web/approved-interfaces.json',import.meta.url)));
 assert.deepEqual(catalog.map(s=>s.number),Array.from({length:16},(_,i)=>i+1));
 assert.equal(catalog.filter(s=>s.src).length,15);
 assert.equal(catalog[3].src,null);
 assert.equal(catalog[7].src,catalog[5].src);
 for(const screen of catalog.filter(s=>s.src)){
  const bytes=readFileSync(new URL('../web/'+screen.src,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),screen.sha256);
 }
});
