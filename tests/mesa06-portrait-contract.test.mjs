import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {portraitTableViewport} from '../web/table-viewport.js';
import {TurnClock} from '../web/turn-clock.js';

const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../web/table-screen.css',import.meta.url),'utf8');
test('Mesa 06 remains portrait even when the device is landscape',()=>{
 for(const [w,h] of [[360,640],[412,915],[915,412],[800,360]]){
  const frame=portraitTableViewport(w,h);
  assert.equal(frame.rotated,false);
  assert.ok(frame.width<=frame.height);
  assert.ok(frame.width*frame.scale<=w+0.01);
  assert.ok(frame.height*frame.scale<=h+0.01);
 }
});
test('landscape suspends turn, bots and interactions, then resumes',()=>{
 assert.match(app,/rotationSuspended=sideways/);
 assert.match(app,/turnClock\.pause\(\);stopBotSequence\(\);cancelGesture\(\)/);
 assert.match(app,/turnClock\.resume\(\);sync\(\);scheduleBots\(\)/);
 assert.match(app,/if\(!tableActive\|\|rotationSuspended\|\|document\.hidden/);
 assert.match(app,/if\(rotationSuspended\)turnClock\.pause\(\)/);
 assert.match(app,/if\(!rotationSuspended\)turnClock\.resume\(\)/);
 assert.match(css,/#mesa-portrait-notice:not\(\[hidden\]\)/);
});
test('a suspended turn keeps its remaining time',()=>{
 let now=0;const clock=new TurnClock(()=>now);
 clock.start('round:turn');now=18000;clock.pause();now=180000;
 assert.equal(clock.remaining(),42);
 clock.resume();assert.equal(clock.remaining(),42);
 now+=42000;assert.equal(clock.claimExpiry(),true);
 assert.equal(clock.claimExpiry(),false);
});
