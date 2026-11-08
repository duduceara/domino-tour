import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
test('dialog action never resumes the clock when backgrounded or rotated',()=>{
 assert.match(app,/d\.close\(\);decisionKind=null;if\(!document\.hidden&&!rotationSuspended\)turnClock\.resume\(\);run\(\)/);
});
test('dialog cancellation never resumes the clock when backgrounded or rotated',()=>{
 assert.match(app,/tableUI\.decision\.close\(\);decisionKind=null;if\(!document\.hidden&&!rotationSuspended\)turnClock\.resume\(\);keepPlaying\(\)/);
});
