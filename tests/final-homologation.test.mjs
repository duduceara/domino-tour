import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homologationMatrix} from '../scripts/lib/homologation-matrix.mjs';
test('final homologation: 120 full matches, all focal levels/seats, five opponent profiles and two deals',()=>{
 const r=homologationMatrix(1);assert.equal(r.matches,120);assert.ok(r.passes>0);assert.ok(r.duplicateRejections>=120);
 for(const level of ['easy','medium','hard']){assert.equal(r.focal[level].matches,40);assert.deepEqual(r.focal[level].seats,[10,10,10,10]);}
 assert.equal(Object.keys(r.profiles).length,10);
 console.log('FINAL_HOMOLOGATION',JSON.stringify(r));
});
