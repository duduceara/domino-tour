from pathlib import Path
import subprocess,json,hashlib
import argparse
parser=argparse.ArgumentParser(description='Extract approved portraits without redrawing; ImageMagick required.')
parser.add_argument('--robots',type=Path,required=True)
parser.add_argument('--world',type=Path,required=True)
args=parser.parse_args()
repo=Path(__file__).resolve().parents[1];out=repo/'web/assets/avatars';out.mkdir(parents=True,exist_ok=True)
robots=args.robots;world=args.world
source_hash={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [robots,world]}
def extract(source,box,size,target,circle=False):
 x,y,w,h=box
 mask=f'circle {size/2},{size/2} {size/2},1' if circle else f'roundrectangle 0,0 {size-1},{size-1} 18,18'
 subprocess.run(['convert',str(source),'-crop',f'{w}x{h}+{x}+{y}','+repage','-resize',f'{size}x{size}','-background','none','-gravity','center','-extent',f'{size}x{size}','(','+clone','-alpha','extract','-fill','black','-colorize','100','-fill','white','-draw',mask,')','-alpha','off','-compose','CopyOpacity','-composite','-quality','96',str(target)],check=True)
 return {'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
opponents=[]
for seat,(name,box,personality,colors) in enumerate([
 ('RobiX',[130,215,414,414],'Estratégico e persistente',['azul','prateado']),
 ('AndroX',[632,278,370,370],'Analítico e preciso',['branco','dourado']),
 ('DomiX',[1172,194,440,440],'Criativo e ousado',['azul','dourado'])],1):
 filename=name.lower()+'.webp';meta=extract(robots,box,192,out/filename,True)
 opponents.append({'id':name.lower(),'name':name,'seat':seat,'position':['','left','top','right'][seat],'personality':personality,'colors':colors,'src':'assets/avatars/'+filename,'sourceFile':robots.name,'sourceBounds':box,**meta})
# Editorial search tags describe fictional artwork motifs, not real people's nationality.
labels=[
 ('Amazônia','Brasil',['Brasil','Américas']),('Viking','Noruega',['Europa']),('Flores do Japão','Japão',['Ásia']),('Exploração do Oeste','Estados Unidos',['Américas']),('Deserto','Emirados Árabes Unidos',['Oriente Médio']),('Cores da África','', ['África']),('Samurai','Japão',['Ásia']),('Mariachi','México',['Américas']),('Boina de Paris','França',['Europa']),('Aviação','',[]),
 ('Pirata','',[]),('Festa Brasileira','Brasil',['Brasil','Américas']),('Patrulha Canadense','Canadá',['Américas']),('Faraó','Egito',['África']),('Andes','Peru',['Américas']),('Chef','França',['Europa']),('Flamenco','Espanha',['Europa']),('Gaita Escocesa','Reino Unido',['Europa']),('Inverno','Rússia',['Europa','Ásia']),('Ilhas Floridas','', ['Oceania']),
 ('Astronauta','',[]),('Magia','',[]),('Trevo','Irlanda',['Europa']),('Chapéu de Palha','Vietnã',['Ásia']),('Lenço Floral','Rússia',['Europa','Ásia']),('Cangaço','Brasil',['Brasil','Américas','Nordeste']),('Verão','Brasil',['Brasil','Américas']),('Alegria da Bahia','Brasil',['Brasil','Américas','Nordeste']),('Coroa Dourada','',[]),('Aventura no Campo','Brasil',['Brasil','Américas']),
 ('Tucano Viajante','Brasil',['Brasil','Américas']),('Lobo Aviador','',[]),('Coruja Viajante','',[]),('Leão Real','', ['África']),('Panda Explorador','China',['Ásia']),('Pinguim Viajante','',[]),('Raposa Viajante','',[]),('Arara Pirata','Brasil',['Brasil','Américas']),('Capivara Viajante','Brasil',['Brasil','Américas']),('Tatu do Sertão','Brasil',['Brasil','Américas','Nordeste']),
 ('Unicórnio','',[]),('Robô Espacial','',[]),('Cacto Mexicano','México',['Américas']),('Mago','',[]),('Rainha dos Mares','',[]),('Guardião do Egito','Egito',['África']),('Raposa das Lendas','Japão',['Ásia']),('Dragão','China',['Ásia']),('Máscara Tropical','',[]),('Lenda Dourada','', ['Américas'])]
xs=[327,462,595,727,859,992,1124,1256,1389,1522,1664];ys=[155,297,435,564,693,830];items=[]
for i,(label,country,regions) in enumerate(labels):
 row,col=divmod(i,10);box=[xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row]];filename=f'world-{i+1:03}.webp';meta=extract(world,box,128,out/filename)
 items.append({'id':f'world-{i+1:03}','label':label,'country':country,'regions':regions,'src':'assets/avatars/'+filename,'sourceFile':world.name,'sourceBounds':box,**meta})
# Interleave source rows: humans, animals, mascots and cultural figures appear together.
items=[items[row*10+col] for col in range(10) for row in [0,3,4,1,2]]
catalog={'version':1,'plannedInitial':120,'plannedFuture':[500,1000],'sources':[{'file':robots.name,'libraryFileId':'libfile_7497fcb274388191849368cf7a6ad41d','sha256':source_hash[robots.name]},{'file':world.name,'libraryFileId':'libfile_08f1695987348191812b57797c1a6ef6','sha256':source_hash[world.name]}],'opponents':opponents,'items':items}
(repo/'web/avatar-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'opponents':opponents,'selectable':len(items),'totalBytes':sum(x['bytes'] for x in opponents+items),'largestAsset':max(x['bytes'] for x in opponents+items)},ensure_ascii=False))
