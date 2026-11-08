import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const APPROVED_BASE='2ee84db2a3e044c2373af4e07eaf5220eb6de597';
export const LOCKED_PRESENTATION=Object.freeze([
 'web/assets/approved/screen-01.png','web/assets/approved/screen-02-oficial.png',
 'web/layout.css','web/premium-polish.css','web/index.html','index.html',
 'web/entry-flow.js','web/navigation-fit.js','web/presentation-fit.js','web/presentation-layout.js'
]);
const ART_REFERENCE='docs/m13-r/approved-art-reference.json';
const CSS_SCOPES={
 'web/table-screen.css':/^(?:\.app\.premium06|\.premium06|body\[data-entry="playing"\]\s+\.app\.premium06)/,
 'web/identity-screen.css':/^\.identity05(?:[-\s.#:[>+~]|$)/,
 'web/match-setup.css':/^\.config03(?:[-\s.#:[>+~]|$)/,
 'web/guest-access.css':/^(?:\.guest04(?:[-\s.#:[>+~]|$)|\.app\[data-guest-theme=)/
};
export function cssScopeErrors(path,source){
 const allowed=CSS_SCOPES[path];if(!allowed)return ['Unknown CSS scope: '+path];
 const errors=[],css=source.replace(/\/\*[\s\S]*?\*\//g,'');
 for(const match of css.matchAll(/([^{}]+)\{/g)){
  const selector=match[1].trim();if(selector.startsWith('@')||/^(?:from|to|\d+(?:\.\d+)?%)$/.test(selector))continue;
  for(const part of selector.split(','))if(!allowed.test(part.trim()))errors.push('CSS_SCOPE '+path+': '+part.trim());
 }
 return errors;
}
export function imageDimensions(b){
 if(b.length>=24&&b.toString('hex',0,8)==='89504e470d0a1a0a')return {format:'PNG',width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
 if(b[0]!==255||b[1]!==216)return null;
 let i=2;const sof=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);
 while(i+3<b.length){
  if(b[i++]!==255)return null;while(i<b.length&&b[i]===255)i++;const marker=b[i++];
  if(marker===217||marker===218)return null;if(marker===1||marker>=208&&marker<=215)continue;
  const n=b.readUInt16BE(i);if(n<2||i+n>b.length)return null;
  if(sof.has(marker)&&n>=7)return {format:'JPEG',width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};
  i+=n;
 }return null;
}
export function auditArchitecture(readCurrent,readApproved){
 const errors=[],historicalMetadataWarnings=[],read=(p)=>Buffer.from(readCurrent(p));
 const approvedManifest=Buffer.from(readApproved(ART_REFERENCE));
 if(!read(ART_REFERENCE).equals(approvedManifest))errors.push('ART_REFERENCE_CHANGED: authorization and reviewed reference required');
 const manifest=JSON.parse(approvedManifest);
 for(const [path,r]of Object.entries(manifest.files)){
  const b=read(path),hash=createHash('sha256').update(b).digest('hex');
  if(hash!==r.sha256)errors.push('ART_HASH '+path);
  const dimensions=imageDimensions(b);
  const expected=dimensions?.format==='JPEG'?imageDimensions(Buffer.from(readApproved(path))):{format:'PNG',width:r.width,height:r.height};
  if(!dimensions||!expected||JSON.stringify(dimensions)!==JSON.stringify(expected))errors.push('ART_DIMENSIONS '+path);
  if(expected?.format==='JPEG')historicalMetadataWarnings.push({path,actual:expected,recorded:{width:r.width,height:r.height},reason:'Historical .png file contains JPEG; original bytes preserved'});
 }
 // Express owner-authorized replacement: narrow entry-point exception, not a baseline refresh.
 const replacement=JSON.parse(read('docs/architecture/SCREEN02_REPLACEMENT_AUTHORIZATION.json'));
 const authorizedEntry="import './presentation-official.js';\n";
 if(replacement.sha256!=='1a04ec265596f7cde5d7afff5d4df4215dcca2cd3f48f805b09ea9813ca5f3da'||replacement.implementationStatus!=='pending owner visual and functional homologation')errors.push('INVALID_SCREEN02_AUTHORIZATION');
 const newArt=read('web/assets/approved/screen-02-menu-oficial-r02.jpg');
 if(createHash('sha256').update(newArt).digest('hex')!==replacement.sha256||JSON.stringify(imageDimensions(newArt))!==JSON.stringify({format:'JPEG',width:708,height:1536}))errors.push('SCREEN02_NEW_ART_INTEGRITY');
 for(const path of LOCKED_PRESENTATION){
  if(path==='web/presentation-fit.js'&&read(path).toString()===authorizedEntry)continue;
  if(!read(path).equals(Buffer.from(readApproved(path))))errors.push('APPROVED_UI_CHANGED '+path);
 }
 for(const path of Object.keys(CSS_SCOPES))errors.push(...cssScopeErrors(path,read(path).toString()));
 return {ok:errors.length===0,approvedBase:APPROVED_BASE,approvedImages:Object.keys(manifest.files).length,lockedFiles:LOCKED_PRESENTATION.length,cssScopes:Object.keys(CSS_SCOPES).length,historicalMetadataWarnings,errors,pixelCertification:'PENDING_APPROVED_VIEWPORT_SCREENSHOTS'};
}
export function repositoryReaders(root=resolve(dirname(fileURLToPath(import.meta.url)),'..')){
 const cache=new Map();return {
  readCurrent:p=>readFileSync(resolve(root,p)),
  readApproved:p=>{if(!cache.has(p))cache.set(p,execFileSync('git',['show',APPROVED_BASE+':'+p],{cwd:root,maxBuffer:12*1024*1024}));return cache.get(p)}
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const r=repositoryReaders(),result=auditArchitecture(r.readCurrent,r.readApproved);console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1}
 catch(error){console.error('Architecture guard failed: '+error.message);process.exitCode=1}
}
