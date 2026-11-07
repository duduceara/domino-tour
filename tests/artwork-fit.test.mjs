import test from 'node:test';
import assert from 'node:assert/strict';
import {bandLayout} from '../web/artwork-fit.js';
import {readFileSync} from 'node:fs';
const configurations=[[1024,1536,[0,.59,.88,1]],[1024,1536,[0,.42,.83,1]],[941,1672,[0,.31,.65,.81,1]]];
test('approved foreground bands retain uniform proportions and reach both viewport edges',()=>{
 for(const [sw,sh,cuts]of configurations)for(const [w,h]of [[412,744],[412,915],[360,800],[412,600]]){
  const l=bandLayout(w,h,sw,sh,cuts);assert.equal(l.bands[0].top,0);const last=l.bands.at(-1);assert.ok(Math.abs(last.top+last.height-l.height)<1e-6);
  l.bands.forEach((b,i)=>{assert.ok(Math.abs(b.height/(b.end-b.start)-w*sh/sw)<1e-6);if(i)assert.ok(b.top>=l.bands[i-1].top+l.bands[i-1].height-1e-6)});
 }
});
test('original identity artwork and its interactive regions replace rejected native passport',()=>{
 const s=readFileSync(new URL('../web/identity-screen.js',import.meta.url),'utf8');assert.ok(s.includes('screen-05-identidade-oficial.png'));assert.ok(!s.includes('identity05-passport'));assert.ok(s.includes("action('play').focus"));
});
