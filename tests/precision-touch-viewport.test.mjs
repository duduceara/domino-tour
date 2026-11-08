import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
test('offset-only viewport changes preserve active gesture and zoom',()=>{
 assert.match(app,/const geometryChanged=app\.style\.width!==v\.width\+'px'\|\|app\.style\.height!==v\.height\+'px'/);
 assert.match(app,/if\(geometryChanged\)cancelGesture\(\)/);
 assert.match(app,/if\(geometryChanged\)\{zoom=1;pan=\{x:0,y:0\}\}/);
 assert.doesNotMatch(app,/viewportSignature=signature;cancelGesture\(\)/);
});
test('hand drag preserves tile dimensions and pointer ownership',()=>{
 assert.match(app,/floatingTile\.style\.width=\(source\.offsetWidth\|\|34\)\+'px'/);
 assert.match(app,/floatingTile\.style\.height=\(source\.offsetHeight\|\|68\)\+'px'/);
 assert.match(app,/b\.setPointerCapture\(e\.pointerId\)/);
 assert.match(app,/b\.addEventListener\('pointercancel'/);
 assert.match(app,/b\.addEventListener\('lostpointercapture'/);
});
