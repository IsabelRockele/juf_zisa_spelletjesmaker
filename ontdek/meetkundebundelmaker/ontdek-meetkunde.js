import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null, currentTrial = null;
function statusTekst(pro = false) {
  if (pro) return 'PRO actief · onbeperkt afdrukken en downloaden';
  if (currentUser && currentTrial) {
    const gebruikt = Number(currentTrial.byTool?.meetkundebundel || 0);
    const over = Math.max(0, Number(currentTrial.toolLimit || 3) - gebruikt);
    return `${currentTrial.totalRemaining} van ${currentTrial.totalLimit} downloads over · ${over} voor Meetkunde`;
  }
  return 'Gratis account nodig voor een PDF zonder watermerk';
}
startOntdekAuth({ onState: ({ user, pro, trial }) => {
  currentUser=user; currentTrial=trial;
  document.querySelectorAll('.ontdek-download-status').forEach(el=>{el.textContent=statusTekst(pro);});
} });
function foutmelding(error) {
  const raw=String(error?.message||error?.details||'');
  if(raw.includes('PAGE_LIMIT')) return "Deze meetkundebundel telt meer dan 3 pagina's. Verwijder oefeningen of kies PRO zonder paginalimiet.";
  if(raw.includes('TOOL_LIMIT')) return 'Je 3 gratis downloads voor Meetkunde zijn opgebruikt. Je kunt blijven samenstellen en bekijken.';
  if(raw.includes('TOTAL_LIMIT')) return 'Je 15 gratis Ontdek-downloads zijn opgebruikt. Je kunt blijven samenstellen en bekijken.';
  return 'De gratis download kon niet worden gecontroleerd. Probeer het straks opnieuw.';
}
async function authorizeDownload(pages) {
  if(!currentUser){window.openOntdekAuth?.('registreren');const e=new Error('Maak eerst je gratis account. Daarna kun je de leerlingbundel zonder watermerk afdrukken of als PDF opslaan.');e.code='ONTDEK_LOGIN';throw e;}
  const app=getApps().length?getApp():null;if(!app)throw new Error('De accountverbinding is nog niet klaar.');
  try{const reserve=httpsCallable(getFunctions(app,'europe-west1'),'reserveDiscoverDownload');const result=(await reserve({toolId:'meetkundebundel',pages})).data;currentTrial=result;document.querySelectorAll('.ontdek-download-status').forEach(el=>{el.textContent=statusTekst(Boolean(result.pro));});return result;}
  catch(error){const wrapped=new Error(foutmelding(error));wrapped.code='ONTDEK_LIMIT';throw wrapped;}
}
window.OntdekTrial={authorizeDownload,get status(){return currentTrial;}};

function blokkeerPro(id, melding){const knop=document.getElementById(id);if(!knop)return;knop.onclick=null;knop.classList.add('ontdek-pro-slot');knop.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();alert(melding);},true);}
function start(){
  const uitleg=document.createElement('div');uitleg.className='ontdek-uitleg';uitleg.innerHTML='<strong>Ontdek-versie.</strong> Maak een leerlingbundel van maximaal 3 pagina’s. Oplossingen zijn PRO; PRO heeft geen paginalimiet. De preview heeft een watermerk, de toegestane leerling-PDF niet. <a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk en koop PRO</a>';document.body.insertAdjacentElement('afterbegin',uitleg);
  const actions=document.querySelector('.toolbar-actions'),print=document.getElementById('print');
  const paginaStatus=document.createElement('span');paginaStatus.className='ontdek-pagina-status';
  const downloadStatus=document.createElement('span');downloadStatus.className='ontdek-download-status';downloadStatus.textContent=statusTekst(false);
  actions?.insertAdjacentElement('afterbegin',downloadStatus);actions?.insertAdjacentElement('afterbegin',paginaStatus);
  blokkeerPro('solutions','Oplossingen bekijken is uitsluitend beschikbaar in PRO.');
  blokkeerPro('printSolutions','Oplossingen afdrukken is uitsluitend beschikbaar in PRO.');
  function update(){const pages=document.querySelectorAll('#pages .page-wrap').length;if(!pages){paginaStatus.dataset.status='';paginaStatus.textContent="Ontdek: maximaal 3 pagina's · PRO: geen paginalimiet · voeg oefeningen toe";print.disabled=true;return;}const ok=pages<=3;paginaStatus.dataset.status=ok?'goed':'teveel';paginaStatus.textContent=ok?`${pages} van maximaal 3 pagina${pages===1?'':"'s"} · download mogelijk · PRO heeft geen paginalimiet`:`${pages} pagina's · download niet mogelijk in Ontdek (max. 3) · PRO heeft geen paginalimiet`;print.disabled=!ok;}
  if(print){print.onclick=null;print.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const pages=document.querySelectorAll('#pages .page-wrap').length;try{await authorizeDownload(pages);document.body.classList.add('ontdek-clean-output');document.title=document.getElementById('title')?.value||'Meetkundebundel';window.print();}catch(error){alert(error.message);}},true);}
  window.addEventListener('afterprint',()=>document.body.classList.remove('ontdek-clean-output'));
  const pages=document.getElementById('pages');if(pages)new MutationObserver(update).observe(pages,{childList:true,subtree:true});update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
