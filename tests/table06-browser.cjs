const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path');const root=path.resolve(__dirname,'..');const output=process.env.QA_OUTPUT_DIR||path.join(require('node:os').tmpdir(),'domino-tour-table06');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});
 const evidence=[];
 for(const [width,height]of [[915,412],[844,390],[800,360],[412,915]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/web/app.js',async route=>{
   await route.fulfill({contentType:'application/javascript',body:fs.readFileSync(root+'/web/app.js','utf8')+`
window.__mesaQA={drawBoard,get game(){return game},sync,scheduleBots,stopBotSequence,turnClock,get tableActive(){return tableActive},
forceHuman(){stopBotSequence();game.state.turn=0;turnClock.stop();sync();scheduleBots()},
finishRound(final=false){stopBotSequence();const s=game.state,all=[...s.players.flatMap(p=>p.hand),...s.sleeping,...s.chain],tile=all.find(t=>t.a===6&&t.b===6),rest=all.filter(t=>t.id!==tile.id);s.phase='playing';s.turn=0;s.left=null;s.right=null;s.chain=[];s.placements=[];s.lastPlayed=null;s.openingRequiredTileId=null;s.players[0].hand=[tile];for(let i=1;i<4;i++)s.players[i].hand=rest.slice((i-1)*9,i*9);s.sleeping=[];s.players[0].score=final?s.target*2-5:s.target;game.refresh();game.humanPlay(tile.id,'right');sync();}
};`});
  });
  await page.goto((process.env.QA_URL||'http://127.0.0.1:8765')+'/web/index.html');
  await page.locator('#official02-image').waitFor({state:'visible'});
  async function enter(){
   await page.locator('[data-official-action=quick]').click();await page.locator('[data-config-action=start]').click();await page.locator('#guest04-play').click();await page.locator('[data-identity-action=play]').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-identity-action=play]').disabled);await page.locator('.identity05-name').fill('Carlos');await page.locator('[data-identity-action=play]').click();await page.waitForTimeout(150);
  }
  await enter();await page.evaluate(()=>window.__mesaQA.forceHuman());
  assert.equal(await page.locator('#hand .piece').count(),6);assert.match(await page.locator('.seat[data-seat="0"]').innerText(),/Carlos/);
  assert.equal(await page.locator('#opponent-hands .domino-back').count(),18);
  assert.equal(await page.locator('#sleeping-rack .domino-back').count(),4);
  assert.equal(await page.locator('#turn-clock strong').innerText(),'01:00');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  await page.locator('#table').click({position:{x:100,y:100}});
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  const geo=await page.evaluate(()=>{
   const r=e=>e.getBoundingClientRect().toJSON();return {table:r(document.getElementById('table')),hand:r(document.getElementById('hand')),pieces:[...document.querySelectorAll('#hand .piece')].map(r),organize:r(document.getElementById('organize')),rightSeat:r(document.querySelector('.seat[data-seat="3"]'))}
  });
  assert.ok(geo.table.width>0&&geo.table.height>0);
  for(const p of geo.pieces)assert.ok(width<height?p.width>p.height:p.height>p.width);
  const noOverlap=(a,b)=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top;
  assert.ok(noOverlap(geo.organize,geo.rightSeat),'organize overlaps DomiX');
  const eventsBefore=await page.evaluate(()=>window.__mesaQA.game.state.events.length);
  await page.locator('#organize').click();assert.equal(await page.evaluate(()=>window.__mesaQA.game.state.events.length),eventsBefore);
  await page.locator('#table-chat').click();await page.getByRole('button',{name:'Sua vez! 😉',exact:true}).click();assert.equal(await page.locator('#table-message-bubble').innerText(),'Sua vez! 😉');
  await page.locator('#leave-table').click();assert.ok(await page.locator('#mesa-decision').isVisible());assert.match(await page.locator('#mesa-decision').innerText(),/perde esta partida/);await page.getByRole('button',{name:'Continuar na mesa',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__mesaQA.tableActive),true);
  await page.evaluate(()=>{window.__mesaQA.turnClock.deadline=Date.now()+9900});await page.waitForTimeout(250);assert.equal(await page.locator('#turn-clock').getAttribute('data-warning'),'true');
  await page.evaluate(()=>{window.__mesaQA.turnClock.deadline=Date.now()-1});await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>window.__mesaQA.game.state.events.filter(e=>e.type==='play'&&e.seat===0).length),1);
  await page.evaluate(()=>window.__mesaQA.finishRound());
  await page.locator('#mesa-decision').waitFor({state:'visible'});
  assert.match(await page.locator('#mesa-decision h2').innerText(),/Rodada encerrada/);
  await page.getByRole('button',{name:'Próxima rodada',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__mesaQA.game.state.phase),'playing');
  assert.equal(await page.locator('#hand .piece').count(),6);
  await page.evaluate(()=>window.__mesaQA.finishRound(true));
  await page.locator('#mesa-decision').waitFor({state:'visible'});
  assert.match(await page.locator('#mesa-decision h2').innerText(),/Partida encerrada/);
  assert.equal(await page.getByRole('button',{name:'Próxima rodada',exact:true}).count(),0);
  await page.getByRole('button',{name:'Nova partida',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__mesaQA.game.state.roundsCompleted),0);
  await page.evaluate(()=>{const q=window.__mesaQA;q.game.newMatch(100,7);q.sync();q.stopBotSequence()});assert.equal(await page.locator('#hand .piece').count(),7);assert.equal(await page.locator('#opponent-hands .domino-back').count(),21);assert.equal(await page.locator('#sleeping-rack').isVisible(),false);
  await page.evaluate(()=>{const q=window.__mesaQA;q.game.newMatch(100,6);q.forceHuman()});
  await page.screenshot({path:path.join(output,'mesa-'+width+'x'+height+'.png')});
  await page.locator('#leave-table').click();await page.getByRole('button',{name:'Sair e voltar ao menu',exact:true}).click();
  await page.locator('#official02-image').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.__mesaQA.tableActive),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('domino-tour:offline-match:v1')),null);
  assert.ok(await page.evaluate(()=>localStorage.getItem('domino-tour:profile:v1')));
  await enter();assert.equal(await page.evaluate(()=>window.__mesaQA.tableActive),true);
  assert.deepEqual(errors,[]);
  evidence.push({width,height,geo,errors,flow:'entry, counts, organize, chat, cancel abandonment, timeout once, next round, match end, new match, exit, reenter'});
  await page.close();
 }
 fs.writeFileSync(path.join(output,'browser-evidence.json'),JSON.stringify(evidence,null,2));await browser.close();console.log('PASS',evidence.length,'viewports');
})().catch(e=>{console.error(e);process.exit(1)});
