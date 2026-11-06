// Central navigation only; no match state or storage writes.
const $=id=>document.getElementById(id);
const sections={
 jornada:['Jornada Mundial','Do Brasil aos continentes: destinos turísticos, campeonatos estaduais, regionais e nacionais até o título de Lenda. A progressão territorial ainda está em preparação; não há progresso registrado para exibir nesta Central.'],
 competicoes:['Competições','Torneios e ligas serão disponibilizados em uma próxima etapa. As competições oficiais online exigirão autenticação. Você já pode testar a partida offline em Jogar Agora.'],
 ranking:['Ranking','O ranking competitivo oficial será exclusivamente online e exigirá uma conta autenticada. A classificação ainda não está disponível nesta prévia.'],
 conquistas:['Conquistas e passaporte','A Jornada terá medalhas offline e online por território. O registro de conquistas ainda não está integrado; nenhum resultado ilustrativo é apresentado como conquista real.'],
 perfil:['Perfil local','Seu avatar, quando escolhido, é recuperado deste navegador. A conta e a sincronização serão tratadas na Tela 03. Os dados locais não são transferidos automaticamente para outro aparelho e podem ser perdidos ao apagar os dados do navegador ou desinstalar o aplicativo.'],
 configuracoes:['Configurações','Nesta prévia, dificuldade e opções da partida continuam disponíveis na engrenagem da mesa. A tela completa de configurações será homologada em seu próprio ciclo. Sem música de fundo.'],
 ajuda:['Como jogar','Toque em Jogar Agora para uma mesa offline com quatro participantes individuais, seis pedras por jogador e quatro reservadas. Na sua vez, toque em uma pedra e depois numa ponta válida, ou arraste a pedra até a ponta. A mesa usa orientação horizontal.']
};
for(const button of document.querySelectorAll('[data-central-action]'))button.addEventListener('click',()=>{
 const [title,copy]=sections[button.dataset.centralAction];$('central-dialog-title').textContent=title;$('central-dialog-copy').textContent=copy;$('central-dialog').showModal();
});
$('central-play').addEventListener('click',()=>window.dispatchEvent(new Event('domino-tour:quick-play')));
