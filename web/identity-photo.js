// All decoding and resizing stays in this browser. No upload or network requests.
export async function processLocalPhoto(file,{read=readFile,decode=decodeImage,canvas=()=>document.createElement('canvas')}={}){
 if(!file)return null;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Escolha uma foto JPG, PNG ou WebP de até 8 MB.');
 const image=await decode(await read(file));
 if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw new Error('Essa foto é muito grande ou inválida. Escolha outra.');
 const scale=Math.min(1,512/Math.max(image.naturalWidth,image.naturalHeight)),out=canvas();out.width=Math.max(1,Math.round(image.naturalWidth*scale));out.height=Math.max(1,Math.round(image.naturalHeight*scale));
 const ctx=out.getContext('2d');if(!ctx)throw new Error('Não foi possível processar a foto.');ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(image,0,0,out.width,out.height);
 const data=out.toDataURL('image/jpeg',.82);if(data.length>=600000)throw new Error('Não foi possível reduzir essa foto. Escolha outra.');return data;
}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.onabort=()=>reject(new Error('Leitura da foto cancelada.'));reader.readAsDataURL(file)})}
function decodeImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Arquivo de imagem inválido.'));img.src=src})}
