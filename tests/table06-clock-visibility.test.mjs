import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
test('portrait return does not resume a backgrounded turn clock',()=>{
 assert.match(app,/if\(!document\.hidden&&!decisionKind\)turnClock\.resume\(\);\s*sync\(\);scheduleBots\(\)/);
});
test('visibility return does not resume a decision-paused turn clock',()=>{
 assert.match(app,/if\(!rotationSuspended&&!decisionKind\)turnClock\.resume\(\);sync\(\);scheduleBots\(\)/);
});
test('table remains portrait-only and keeps touch controls',()=>{
 assert.match(app,/const sideways=tableActive&&width>height/);
 assert.match(app,/b\.setPointerCapture\(e\.pointerId\)/);
 assert.match(app,/if\(geometryChanged\)cancelGesture\(\)/);
});
