const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}:{})});const results=[];
for(const [width,height] of [[320,568],[360,640],[375,667],[390,844],[412,915],[430,932],[384,854],[412,760],[320,400]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/web/index.html');
 await page.waitForTimeout(1000);assert.equal(await page.locator('#entry-flow').getAttribute('data-step'),'1');
 await page.locator('#official02-image').waitFor({state:'visible'});await page.waitForTimeout(100);
 const geometry=await page.evaluate(()=>{const stage=document.querySelector('.official02-stage'),img=document.querySelector('#official02-image'),host=document.querySelector('.official-presentation');const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {stage:rect(stage),image:rect(img),host:rect(host),natural:[img.naturalWidth,img.naturalHeight],scroll:host.scrollHeight>host.clientHeight+1,buttons:[...stage.querySelectorAll('button')].map(b=>{const r=rect(b);return {action:b.dataset.officialAction,...r,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b}})}});
 assert.deepEqual(geometry.natural,[1024,1536]);assert.ok(Math.abs(geometry.image.width/geometry.image.height-2/3)<.001);assert.deepEqual(geometry.stage,geometry.image);assert.equal(geometry.buttons.length,11);
 for(const b of geometry.buttons){assert.ok(b.width>=24&&b.height>=24,b.action+' target size');if(!geometry.scroll)assert.ok(b.hit,b.action+' center occluded');}
 if(height>=568)assert.equal(geometry.scroll,false);
 for(const action of ['settings','coins','rewards','journey','tournaments','profile','ranking','achievements','rules','goals','quick']){await page.locator(`[data-official-action="${action}"]`).tap();await page.locator('#official02-dialog').waitFor({state:'visible'});if(action==='rewards')assert.match(await page.locator('#official02-message').innerText(),/Nenhuma moeda/);await page.getByRole('button',{name:'Voltar',exact:true}).click();assert.equal(await page.locator('#entry-flow').getAttribute('data-step'),'2');}
 await page.locator('[data-official-action="settings"]').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#official02-dialog').isVisible());await page.keyboard.press('Escape');
 await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:`docs/m07-evidence/${width}x${height}.png`});
 // Browser chrome height changes: fit must respond without reloading.
 await page.setViewportSize({width,height:height-70});await page.waitForTimeout(100);assert.ok(await page.locator('#official02-image').isVisible());
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.locator('[data-official-action="rewards"]').tap();assert.ok(await page.locator('#official02-dialog').isVisible());await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);results.push({width,height,...geometry});await page.close();
}
fs.writeFileSync('docs/m07-evidence/geometry.json',JSON.stringify(results,null,2));await browser.close();console.log('PASS: 9 viewports, real geometry, 99 action taps, keyboard, resize, text enlargement, splash minimum, no page errors');})().catch(e=>{console.error(e);process.exit(1)});
