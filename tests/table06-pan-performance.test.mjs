import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
test('pan updates existing board transform without rebuilding tiles on each pointermove',()=>{
 assert.match(app,/function paintPan\(\)\{const layer=\$\('table'\)\.querySelector\('\.board-layer'\)/);
 assert.match(app,/pan=\{x:panStart\.pan\.x\+p\.x-panStart\.point\.x,y:panStart\.pan\.y\+p\.y-panStart\.point\.y\};paintPan\(\)/);
 assert.doesNotMatch(app,/pan=\{x:panStart\.pan\.x\+p\.x-panStart\.point\.x,y:panStart\.pan\.y\+p\.y-panStart\.point\.y\};drawBoard\(/);
});
test('pan preserves camera rotation, zoom and translation',()=>{
 assert.match(app,/const scale=zoom\*camera\.scale/);
 assert.match(app,/camera\.quarterTurn\?90:0/);
 assert.match(app,/pan\.x/);
 assert.match(app,/pan\.y/);
});
