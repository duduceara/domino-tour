import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const screen=readFileSync(new URL('../web/table-screen.js',import.meta.url),'utf8');
test('round and match results share one reusable dialog',()=>{
 assert.match(screen,/decision\.id='mesa-decision'/);
 assert.match(app,/const finished=s\.phase==='finished'/);
 assert.match(app,/finished\?'Resultado da Partida':'Resultado da Rodada'/);
});
test('each result removes prior trophy, ranking and reward note',()=>{
 const cleanup="for(const old of d.querySelectorAll('.result-trophy,.result-ranking,.result-rewards-note'))old.remove()";
 assert.ok(app.includes(cleanup));
 assert.ok(app.indexOf(cleanup)<app.indexOf("d.classList.add('premium-result')"));
 assert.match(app,/tableUI\.decision\.classList\.remove\('premium-result'\)/);
});
test('results preserve next round, new match and menu choices',()=>{
 assert.match(app,/\['Próxima rodada'/);
 assert.match(app,/\['Jogar novamente'/);
 assert.match(app,/\['Voltar ao menu'/);
});
