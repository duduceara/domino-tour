// node scripts/homologate-engine.mjs [seedCount=4]
import {homologationMatrix} from './lib/homologation-matrix.mjs';
console.log(JSON.stringify(homologationMatrix(Number(process.argv[2]??4)),null,2));
