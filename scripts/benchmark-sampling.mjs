// node --expose-gc scripts/benchmark-sampling.mjs before|after [repetitions=5] [soak]
// CPU/memory measurements run in separate processes, same public corpus and calls.
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {samplingCorpus} from '../tests/helpers/sampling-corpus.mjs';
import {samplePublicHands as beforeSample} from '../tests/fixtures/bot-sampling-before-speed.mjs';
import {samplePublicHands as afterSample} from '../dist/src/bot-sampling.js';
import {chooseBotMove as beforeMove} from '../tests/fixtures/bots-before-speed.mjs';
import {chooseBotMove as afterMove} from '../dist/src/bots.js';
const version=process.argv[2],repetitions=Number(process.argv[3]??5);
if(!['before','after'].includes(version)||!Number.isInteger(repetitions)||repetitions<1)throw Error('Expected before|after and positive repetitions');
if(!global.gc)throw Error('Use --expose-gc for retained-heap measurements');
const {views,outcomes}=samplingCorpus();
const sample=version==='before'?beforeSample:afterSample,move=version==='before'?beforeMove:afterMove;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function measure(fn){
 for(let warmup=0;warmup<3;warmup++)for(let i=0;i<views.length;i++)fn(views[i]);
 global.gc();const initial=process.memoryUsage(),cpu=process.cpuUsage(),start=performance.now(),times=[];
 let heapPeak=initial.heapUsed,rssPeak=initial.rss,arrayBuffersPeak=initial.arrayBuffers,heapAndBuffersPeak=initial.heapUsed+initial.arrayBuffers,checksum=0;
 for(let repeat=0;repeat<repetitions;repeat++)for(let i=0;i<views.length;i++){
  const at=performance.now(),result=fn(views[i]);times.push(performance.now()-at);
  checksum+=result.samples?result.samples.length:result.tileId??-1;
  if(i%16===0){const memory=process.memoryUsage();heapPeak=Math.max(heapPeak,memory.heapUsed);rssPeak=Math.max(rssPeak,memory.rss);arrayBuffersPeak=Math.max(arrayBuffersPeak,memory.arrayBuffers);heapAndBuffersPeak=Math.max(heapAndBuffersPeak,memory.heapUsed+memory.arrayBuffers);}
 }
 const wallMs=performance.now()-start,usage=process.cpuUsage(cpu);global.gc();const final=process.memoryUsage();times.sort((a,b)=>a-b);
 return {calls:times.length,checksum,wallMs,cpuUserMs:usage.user/1000,cpuSystemMs:usage.system/1000,cpuTotalMs:(usage.user+usage.system)/1000,p50ms:times[Math.floor(times.length*.5)],p95ms:times[Math.floor(times.length*.95)],p99ms:times[Math.floor(times.length*.99)],maxMs:times.at(-1),heapBeforeBytes:initial.heapUsed,heapAfterGcBytes:final.heapUsed,retainedHeapDeltaBytes:final.heapUsed-initial.heapUsed,heapPeakObservedBytes:heapPeak,heapGrowthObservedBytes:heapPeak-initial.heapUsed,arrayBuffersBeforeBytes:initial.arrayBuffers,arrayBuffersAfterGcBytes:final.arrayBuffers,arrayBuffersPeakObservedBytes:arrayBuffersPeak,heapAndBuffersPeakObservedBytes:heapAndBuffersPeak,rssPeakObservedBytes:rssPeak,processMaxRssBytes:process.resourceUsage().maxRSS*1024};
}
const report={version,node:process.version,repetitions,warmupPasses:3,corpus:{positions:views.length,withPasses:views.filter(v=>v.history.some(e=>e.type==='pass')).length,hash:digest(views),outcomesHash:digest(outcomes)},sampler:measure(sample),decision:measure(v=>move(v,'hard'))};
if(process.argv[4]==='soak'){
 global.gc();const initial=process.memoryUsage(),windows=[];let checksum=0;
 for(let batch=0;batch<10;batch++){
  for(const view of views)checksum+=sample(view).samples.length;
  global.gc();const memory=process.memoryUsage();windows.push({batch,heapUsed:memory.heapUsed,arrayBuffers:memory.arrayBuffers,rss:memory.rss});
 }
 report.soak={calls:views.length*10,checksum,initial,windows,retainedHeapDeltaBytes:windows.at(-1).heapUsed-initial.heapUsed,retainedArrayBuffersDeltaBytes:windows.at(-1).arrayBuffers-initial.arrayBuffers};
}
console.log(JSON.stringify(report,null,2));
