// Presentation only. Receives public hand counts, never opponents' faces.
export function mountTableScreen(app){
 app.classList.add('premium06');app.dataset.tableLayout='portrait';
 const header=app.querySelector('header');
 header.querySelector('strong').innerHTML='<span class="mesa-logo" aria-label="DOMINÓ TOUR — EDVÓRIA"></span>';
 const info=document.createElement('div');info.className='mesa-info';info.innerHTML='<span id="mesa-mode">Partida Offline</span><span id="mesa-target"></span><span id="mesa-deal"></span>';header.querySelector('strong').after(info);
 const exit=document.createElement('button');exit.id='leave-table';exit.textContent='Sair';exit.setAttribute('aria-label','Sair da mesa e voltar ao menu');header.append(exit);
 const arena=app.querySelector('.arena');
 const hidden=document.createElement('div');hidden.id='opponent-hands';hidden.setAttribute('aria-label','Pedras restantes dos adversários');arena.append(hidden);
 const remaining=document.createElement('div');remaining.id='remaining-count';remaining.className='mesa-counter';arena.append(remaining);
 const dock=document.createElement('div');dock.className='mesa-dock';dock.innerHTML='<button id="table-chat" aria-label="Frases e figurinhas">💬</button><div id="sleeping-rack" aria-label="Pedras dormidas"></div><div id="turn-clock" role="timer" aria-label="Tempo para jogar"><strong>01:00</strong><meter min="0" max="60" value="60"></meter><small>Jogada automática ao zerar</small></div>';app.append(dock);
 const humanRow=document.createElement('div');humanRow.className='mesa-human-row';
 const human=document.createElement('div');human.id='human-profile';humanRow.append(human,dock.querySelector('#sleeping-rack'));app.append(humanRow);
 const controls=app.querySelector('.play-controls');controls.append(dock.querySelector('#turn-clock'));
 const actions=document.createElement('div');actions.className='mesa-actions';actions.append(dock.querySelector('#table-chat'),app.querySelector('#organize'));
 app.querySelector('#settings-panel').append(app.querySelector('.view-controls'));app.append(actions);
 app.querySelector('#organize').setAttribute('aria-label','Organizar pedras');
 header.querySelector('#settings').textContent='☰';header.querySelector('#settings').setAttribute('aria-label','Menu da mesa');
 app.querySelector('#settings-panel').append(header.querySelector('#fullscreen'));
 app.querySelector('#fullscreen').setAttribute('aria-label','Tela cheia opcional');
 dock.remove();
 const chat=document.createElement('dialog');chat.id='table-chat-dialog';chat.className='mesa-dialog';chat.innerHTML='<h2>Frases e figurinhas</h2><p>Mensagens locais nesta partida offline.</p><div class="quick-messages"></div><form method="dialog"><button>Fechar</button></form>';app.append(chat);
 const bubble=document.createElement('p');bubble.id='table-message-bubble';bubble.setAttribute('role','status');bubble.hidden=true;app.append(bubble);let bubbleTimer;
 for(const phrase of ['BOA JOGADA!','CADA PEDRA CONTA!','QUE COMECE A VIAGEM!','SEGUIMOS NA DISPUTA!','FOCO NA JOGADA!','ESSA FOI BOA!','VAMOS À PRÓXIMA!','PARTIDA EQUILIBRADA!','😄','👏','🎉']){const b=document.createElement('button');b.textContent=phrase;b.onclick=()=>{chat.close();bubble.textContent=phrase;bubble.hidden=false;clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>bubble.hidden=true,2500)};chat.querySelector('.quick-messages').append(b)}
 app.querySelector('#table-chat').onclick=()=>chat.showModal();
 const decision=document.createElement('dialog');decision.id='mesa-decision';decision.className='mesa-dialog';decision.innerHTML='<h2></h2><p></p><div class="decision-actions"></div>';app.append(decision);
 return {decision,placeHuman(node){if(node)human.replaceChildren(node)},clearMessages(){clearTimeout(bubbleTimer);bubble.hidden=true;if(chat.open)chat.close()}};
}
export function paintTableScreen(view){
 const get=id=>document.getElementById(id);
 get('mesa-mode').textContent='🤖 Offline · '+({easy:'Fácil',medium:'Médio',hard:'Difícil'}[view.difficulty]);
 get('mesa-target').textContent='🎯 Meta: '+view.target+' pontos';get('mesa-deal').textContent=view.deal===6?'28 pedras · 6 por jogador + 4 dormidas':'28 pedras · 7 por jogador';
 get('remaining-count').textContent='Peças restantes\n'+view.remaining;
 const hands=get('opponent-hands');hands.replaceChildren();
 for(const seat of view.opponents){const row=document.createElement('div');row.className='opponent-hand opponent-'+seat.seat;row.setAttribute('aria-label',seat.name+': '+seat.count+' pedras viradas para baixo');for(let i=0;i<seat.count;i++){const back=document.createElement('span');back.className='domino-back';back.setAttribute('aria-hidden','true');row.append(back)}hands.append(row)}
 const sleeping=get('sleeping-rack');sleeping.hidden=view.sleeping===0;sleeping.replaceChildren();if(view.sleeping){const label=document.createElement('span');label.textContent=view.sleeping+' dormidas';sleeping.append(label);for(let i=0;i<view.sleeping;i++){const back=document.createElement('i');back.className='domino-back';sleeping.append(back)}}
}
