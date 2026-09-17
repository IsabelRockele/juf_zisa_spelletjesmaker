const $r=s=>document.querySelector(s);
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const freshReport=()=>({version:1,id:crypto.randomUUID(),age:'6-7',count:3,period:1,pupil:'',className:'',date:localDay(),views:{}});
let report=freshReport(),qrResult=null,dirty=false;
const viewKey=()=>`${report.age}/${report.count}/${report.period}`;
function currentView(){return report.views[viewKey()]||(report.views[viewKey()]={ids:proposedReportGoals(report.age,report.count,report.period).map(g=>g.id),ratings:{}})}
function selectedGoals(){const ids=currentView().ids;return goalsForReport(report.age).filter(g=>ids.includes(g.id))}
function assessment(id){return currentView().ratings[id]||(currentView().ratings[id]={color:'',note:'',positive:false,practice:false,custom:''})}
function colorInfo(id){return reportColors.find(c=>c.id===id)}
function dot(color,mark=''){return `<span class="dot ${color}" aria-hidden="true">${mark}</span>`}
function chosenFeedback(g){const r=assessment(g.id);return [r.positive?g.positive:'',r.practice?g.practice:'',r.custom.trim()].filter(Boolean)}
function observedGoals(){return selectedGoals().filter(g=>colorInfo(assessment(g.id).color))}
function changed(){dirty=true;$r('#saveStatus').textContent='Gewijzigd. Alleen in dit open formulier; bewaar of druk af als je het wilt behouden.'}
function syncFields(){for(const [id,key] of [['reportAge','age'],['reportCount','count'],['pupil','pupil'],['className','className'],['reportDate','date']])$r('#'+id).value=report[key]}
function periodOptions(){if(report.period>report.count)report.period=1;$r('#reportPeriod').innerHTML=Array.from({length:report.count},(_,i)=>`<option value="${i+1}">Rapport ${i+1}</option>`).join('');$r('#reportPeriod').value=report.period}
function renderReportForm(){
 syncFields();periodOptions();const goals=selectedGoals(),all=goalsForReport(report.age);
 $r('#periodEyebrow').textContent=`${report.age} jaar · ${report.count} rapportperiodes · ${goals.length} observatiedoelen`;
 $r('#periodTitle').textContent=`Rapport ${report.period}: ${reportThemes[report.count][report.period-1]}`;
 $r('#yearPlan').innerHTML=Array.from({length:report.count},(_,i)=>`<article><h3>Rapport ${i+1}</h3><p>${reportThemes[report.count][i]}</p><ul>${proposedReportGoals(report.age,report.count,i+1).map(g=>`<li>${html(g.label)}<small class="codes">${g.codes.join(' · ')}</small></li>`).join('')}</ul></article>`).join('');
 $r('#goalPicker').innerHTML=all.map(g=>`<label><input type="checkbox" data-goal="${g.id}" ${currentView().ids.includes(g.id)?'checked':''}><span>${html(g.label)} <small class="codes">${g.codes.join(' · ')}</small></span></label>`).join('');
 $r('#goalPicker').querySelectorAll('input').forEach(input=>input.onchange=()=>{const v=currentView();v.ids=input.checked?[...new Set([...v.ids,input.dataset.goal])]:v.ids.filter(id=>id!==input.dataset.goal);changed();renderReportForm()});
 $r('#observationRows').innerHTML=goals.map(g=>{const r=assessment(g.id);return `<tr data-row="${g.id}"><td><strong>${html(g.label)}</strong><span class="codes">${g.codes.join(' · ')}</span><details><summary>Waar let ik op?</summary><p>${html(g.look)}</p><a href="index.html?leeftijd=${report.age}&missie=${g.mission}" target="_blank" rel="noopener">Bekijk de bijhorende missie</a></details></td><td><fieldset class="rating"><legend class="visually-hidden">${html(g.label)}</legend>${reportColors.map(c=>`<label title="${c.name}: ${c.meaning}"><input type="radio" name="color-${g.id}" value="${c.id}" aria-label="${c.name}: ${c.meaning}" ${r.color===c.id?'checked':''}><span class="dot ${c.id}"><b aria-hidden="true">×</b></span></label>`).join('')}</fieldset><span class="rating-text">${colorInfo(r.color)?.meaning||'Niet geobserveerd'}</span><button class="clear-rating" data-clear="${g.id}">Leegmaken</button></td><td><textarea data-note="${g.id}" maxlength="600" aria-label="Observatienotitie bij ${html(g.label)}" placeholder="Optioneel: situatie, hulp en observatiedatum">${html(r.note)}</textarea></td></tr>`}).join('')||'<tr><td colspan="3">Er zijn nog geen doelen gekozen voor deze periode. Kies ze hierboven.</td></tr>';
 $r('#observationRows').querySelectorAll('input[type=radio]').forEach(input=>input.onchange=()=>{const id=input.closest('[data-row]').dataset.row;assessment(id).color=input.value;input.closest('td').querySelector('.rating-text').textContent=colorInfo(input.value).meaning;changed();renderFeedback()});
 $r('#observationRows').querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>{const r=assessment(b.dataset.clear);r.color='';r.positive=false;r.practice=false;r.custom='';changed();renderReportForm()});
 $r('#observationRows').querySelectorAll('[data-note]').forEach(input=>input.oninput=()=>{assessment(input.dataset.note).note=input.value;changed()});
 renderFeedback();invalidateQR();
}
function renderFeedback(){
 const goals=observedGoals();$r('#feedbackRows').innerHTML=goals.map(g=>{const r=assessment(g.id);return `<article class="feedback-goal" data-feedback="${g.id}"><h3>${html(g.label)}</h3><span class="codes">${g.codes.join(' · ')} · ${colorInfo(r.color).meaning}</span><label><input type="checkbox" data-kind="positive" ${r.positive?'checked':''}><span><strong>Dit lukt al:</strong> ${html(g.positive)}</span></label><label><input type="checkbox" data-kind="practice" ${r.practice?'checked':''}><span><strong>Verder oefenen:</strong> ${html(g.practice)}</span></label><label class="custom-feedback">Eigen aanvulling (optioneel)<textarea data-kind="custom" maxlength="600">${html(r.custom)}</textarea></label></article>`}).join('')||'<p>Beoordeel eerst een doel. Daarna kun je hier feedback kiezen.</p>';
 $r('#feedbackRows').querySelectorAll('input,textarea').forEach(input=>input.oninput=()=>{const r=assessment(input.closest('[data-feedback]').dataset.feedback);r[input.dataset.kind]=input.type==='checkbox'?input.checked:input.value;changed();renderPreview()});renderPreview();
}
function reportItems(){return observedGoals().map(g=>{const r=assessment(g.id),c=colorInfo(r.color);return `<article class="report-preview-item"><h3>${dot(c.id,'×')}<span>${html(g.label)}</span></h3><small>${g.codes.join(' · ')} · ${c.name}: ${c.meaning}</small>${chosenFeedback(g).map(t=>`<p>${html(t)}</p>`).join('')}</article>`}).join('')}
function renderPreview(){
 $r('#reportPreview').innerHTML=`<h3>${html(report.pupil||'Naam leerling')} · ${html(report.className||'Klas')} · Rapport ${report.period}</h3><p>${report.age} jaar · ${html(report.date)}</p>`+(observedGoals().length?reportItems():'<p>Nog geen doelen geobserveerd. Er verschijnt geen beoordeling voor lege doelen.</p>');
 $r('#reportPrint').disabled=$r('#copyFeedback').disabled=!observedGoals().length;
}
$r('#legend').innerHTML=reportColors.map(c=>`<span>${dot(c.id)}<span><strong>${c.name}</strong><br>${c.meaning}</span></span>`).join('');
for(const [id,key] of [['reportAge','age'],['reportCount','count'],['reportPeriod','period']])$r('#'+id).onchange=e=>{report[key]=key==='age'?e.target.value:Number(e.target.value);changed();renderReportForm()};
for(const [id,key] of [['pupil','pupil'],['className','className'],['reportDate','date']])$r('#'+id).oninput=e=>{report[key]=e.target.value;changed();renderPreview()};
$r('#restorePlan').onclick=()=>{currentView().ids=proposedReportGoals(report.age,report.count,report.period).map(g=>g.id);changed();renderReportForm()};
$r('#newPupil').onclick=()=>{if(dirty&&!confirm('Begin een leeg formulier? Bewaar of druk het huidige formulier eerst af als je het wilt behouden.'))return;const {age,count,period,className}=report;report={...freshReport(),age,count,period,className};dirty=false;$r('#saveStatus').textContent='Nieuw formulier. Geen beoordelingen van de vorige leerling overgenomen.';renderReportForm()};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

// Local, explicit saving only. Imported values are validated before replacing the form.
const reportStorageKey='zisa-report-forms-v1';
function savedForms(){try{const data=JSON.parse(localStorage.getItem(reportStorageKey)||'[]');return Array.isArray(data)?data:[]}catch{return []}}
function refreshSaved(){const select=$r('#savedReports');select.innerHTML='<option value="">Kies een bewaard formulier</option>'+savedForms().map(r=>`<option value="${html(r.id)}">${html(r.pupil||'Zonder naam')} · ${html(r.age)} · ${html(r.date)}</option>`).join('')}
function validateReport(raw){
 if(!raw||raw.version!==1||!['6-7','7-8'].includes(raw.age)||![3,4].includes(raw.count)||!Number.isInteger(raw.period)||raw.period<1||raw.period>raw.count)throw Error('Dit is geen geldig ICT-observatieformulier.');
 const clean={...freshReport(),age:raw.age,count:raw.count,period:raw.period};
 for(const key of ['id','pupil','className','date']){if(typeof raw[key]!=='string'||raw[key].length>100)throw Error('Onjuist formulierveld.');clean[key]=raw[key]}
 if(!raw.views||typeof raw.views!=='object'||Object.keys(raw.views).length>28)throw Error('Onjuiste rapportperiodes.');
 for(const [key,v] of Object.entries(raw.views)){
  const match=/^(6-7|7-8)\/(3|4)\/([1-4])$/.exec(key);if(!match||Number(match[3])>Number(match[2]))throw Error('Onjuiste periode.');
  const allowed=goalsForReport(match[1]).map(g=>g.id);if(!v||!Array.isArray(v.ids)||v.ids.some(id=>!allowed.includes(id))||!v.ratings||typeof v.ratings!=='object')throw Error('Onjuiste doelen.');
  const item={ids:[...new Set(v.ids)],ratings:{}};
  for(const [id,r] of Object.entries(v.ratings)){if(!allowed.includes(id)||!r||(!colorInfo(r.color)&&r.color!==''))throw Error('Onjuiste beoordeling.');if(typeof r.note!=='string'||typeof r.custom!=='string'||r.note.length>600||r.custom.length>600)throw Error('Onjuiste feedback.');item.ratings[id]={color:r.color,note:r.note,custom:r.custom,positive:r.positive===true,practice:r.practice===true};}
  clean.views[key]=item;
 }return clean;
}
$r('#saveLocal').onclick=()=>{try{const rows=savedForms().filter(r=>r.id!==report.id);rows.push(report);localStorage.setItem(reportStorageKey,JSON.stringify(rows));dirty=false;refreshSaved();$r('#saveStatus').textContent='Bewaard in deze browser op deze laptop. Niet naar een server verstuurd.'}catch{$r('#saveStatus').textContent='Lokaal bewaren lukt niet. Download het bewerkbare formulier.'}};
$r('#loadLocal').onclick=()=>{const saved=savedForms().find(r=>r.id===$r('#savedReports').value);if(!saved)return;if(dirty&&!confirm('Het huidige onbewaarde formulier vervangen?'))return;try{report=validateReport(saved);dirty=false;renderReportForm();$r('#saveStatus').textContent='Bewaard formulier geopend.'}catch(e){$r('#saveStatus').textContent=e.message}};
$r('#deleteLocal').onclick=()=>{const id=$r('#savedReports').value;if(!id||!confirm('Dit bewaarde formulier op deze laptop verwijderen?'))return;try{localStorage.setItem(reportStorageKey,JSON.stringify(savedForms().filter(r=>r.id!==id)));refreshSaved();$r('#saveStatus').textContent='Het bewaarde formulier is verwijderd. Een open formulier blijft zichtbaar.'}catch{$r('#saveStatus').textContent='Verwijderen lukte niet.'}};
function downloadFile(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
$r('#downloadDraft').onclick=()=>{downloadFile(JSON.stringify(report,null,2),'ict-observatieformulier.json','application/json');dirty=false;$r('#saveStatus').textContent='Download klaargezet. Bewaar het bestand om later verder te werken.'};
$r('#importDraft').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Dit bestand is te groot voor een observatieformulier.');const data=validateReport(JSON.parse(await file.text()));if(dirty&&!confirm('Het huidige onbewaarde formulier vervangen?'))return;report=data;dirty=false;renderReportForm();$r('#saveStatus').textContent='Gedownload formulier geopend. Er is niets naar een server gestuurd.'}catch(error){$r('#saveStatus').textContent=error.message||'Het formulier kon niet worden geopend.'}finally{e.target.value=''}};

function feedbackText(){return [`ICT · Rapport ${report.period} · ${report.age} jaar`,report.pupil,report.className,report.date,'',...observedGoals().flatMap(g=>[g.label+' ('+g.codes.join(', ')+')',colorInfo(assessment(g.id).color).meaning,...chosenFeedback(g),''])].filter(x=>x!==undefined).join('\n')}
$r('#copyFeedback').onclick=async()=>{try{await navigator.clipboard.writeText(feedbackText());$r('#reportStatus').textContent='Rapporttekst gekopieerd.'}catch{$r('#reportStatus').innerHTML='<label>Kopieer deze tekst handmatig<textarea id="manualCopy" rows="12"></textarea></label>';$r('#manualCopy').value=feedbackText();$r('#manualCopy').select()}};

const printStyles=`@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:11pt/1.45 Arial,sans-serif;color:#173f54;margin:0}h1{font-size:20pt;margin:0 0 5mm}h2{font-size:14pt;margin-top:8mm}h3{font-size:11pt}p{margin:3mm 0}.meta{border-bottom:2px solid #173f54;padding-bottom:5mm}.legend{font-size:9pt;display:flex;flex-wrap:wrap;gap:4mm;margin:5mm 0}.legend>span{display:flex;gap:2mm;align-items:center}.dot{display:inline-grid;place-items:center;width:6mm;height:6mm;border-radius:50%;border:1pt solid #173f54;font-weight:bold;color:white;vertical-align:middle;flex-shrink:0;background:var(--dot);print-color-adjust:exact;-webkit-print-color-adjust:exact}.red{--dot:#c9363e}.yellow{--dot:#e8bf2d;color:#173f54}.green{--dot:#20824e}.blue{--dot:#256cb9}table{width:100%;border-collapse:collapse;font-size:10pt}th,td{padding:3mm;border:1px solid #91aab6;text-align:left;vertical-align:top}th{background:#eaf4f7}tr,article,.feedback-choice{break-inside:avoid}thead{display:table-header-group}small{font-size:8.5pt;display:block}.print-balls{width:52mm;white-space:nowrap}.print-ratings{display:flex;gap:5mm}.print-rating{display:flex;flex-direction:column;align-items:center;gap:2mm}.print-rating .box{width:5mm;height:5mm;line-height:4mm}.print-balls small{margin-top:2mm}.report-preview-item{border-bottom:1px solid #9fb7c2;padding:2mm 0}.report-preview-item h3{display:flex;gap:3mm;margin-bottom:1mm}.report-preview-item p,.report-preview-item small{margin-left:9mm}article h3{margin-bottom:2mm}.choice{display:flex;gap:3mm;align-items:flex-start;margin:3mm 0}.box{display:inline-block;width:4mm;height:4mm;border:1px solid #173f54;flex-shrink:0;line-height:3mm;text-align:center}.feedback-choice{margin:5mm 0}.print-note{min-height:9mm;white-space:pre-wrap}.controls{padding:12px;background:#edf4f7;margin-bottom:20px}.controls button{font:inherit;padding:12px;cursor:pointer}.qr-card{text-align:center;margin:10mm auto;max-width:160mm}.qr-card svg{width:85mm;height:auto;max-width:100%;background:white}.qr-card a{word-break:break-all;font-size:9pt}.print-source{font-size:8pt;margin-top:6mm;color:#426575}@media print{.controls{display:none}}`;
function printLegend(){return `<div class="legend">${reportColors.map(c=>`<span>${dot(c.id)} ${c.name}: ${c.meaning}</span>`).join('')}</div><p><small>Leeg = niet geobserveerd. Blauw is een extra toepassing, geen verplicht eindniveau.</small></p>`}
function printHeader(title,blank){return `<h1>${title}</h1><div class="meta"><p><strong>Leerling:</strong> ${blank?'________________________________':html(report.pupil||'________________________________')} &nbsp; <strong>Klas:</strong> ${html(report.className||'____________')}</p><p>${report.age} jaar · Rapport ${report.period} van ${report.count} · Datum: ${blank?'________________':html(report.date)}</p><p>${reportThemes[report.count][report.period-1]}</p></div>`}
function observationPrint(blank){
 const goals=selectedGoals();return printHeader('ICT · Observatieformulier',blank)+printLegend()+`<table><thead><tr><th>Wat wil je zien?</th><th>Rood · Geel · Groen · Blauw</th></tr></thead><tbody>${goals.map(g=>{const r=assessment(g.id);return `<tr><td>${html(g.label)}<small>${g.codes.join(' · ')}</small></td><td class="print-balls"><div class="print-ratings">${reportColors.map(c=>`<span class="print-rating">${dot(c.id)}<span class="box">${!blank&&r.color===c.id?'×':''}</span></span>`).join('')}</div><small>${blank?'Kruis één hokje aan':colorInfo(r.color)?.meaning||'Niet geobserveerd'}</small></td></tr>`}).join('')}</tbody></table><h2>Feedback om aan te duiden</h2><p>Duid alleen feedback aan bij een doel dat je observeerde. Een eigen aanvulling kan ook.</p>${(blank?goals:observedGoals()).map(g=>{const r=assessment(g.id);return `<article class="feedback-choice"><h3>${html(g.label)} <small>${g.codes.join(' · ')}</small></h3><div class="choice"><span class="box">${!blank&&r.positive?'×':''}</span><span>${html(g.positive)}</span></div><div class="choice"><span class="box">${!blank&&r.practice?'×':''}</span><span>${html(g.practice)}</span></div><p>Eigen aanvulling: ${!blank&&r.custom?html(r.custom):'_________________________________________________'}</p></article>`}).join('')}<p class="print-source">Bron: Doelenset BaO ICT. Schoolvoorstel voor periodeverdeling; geen automatische uitspraak over beheersing. Voor de concrete kijkpunten: open het doel op de laptop.</p>`;
}
function openPrint(title,content){
 const w=window.open('','_blank');if(!w){$r('#saveStatus').textContent='Sta het afdrukvenster toe in je browser en probeer opnieuw.';return;}
 w.document.documentElement.lang='nl';w.document.title=title;const meta=w.document.createElement('meta');meta.charset='utf-8';const style=w.document.createElement('style');style.textContent=printStyles;w.document.head.append(meta,style);
 w.document.body.innerHTML='<div class="controls"><button type="button">Afdrukken / bewaren als PDF</button><p>Kies in het afdrukvenster je printer of Bewaren als PDF.</p></div>'+content;
 w.document.querySelector('button').onclick=()=>w.print();
}
$r('#blankPrint').onclick=()=>openPrint('ICT blanco observatieformulier',observationPrint(true));
$r('#filledPrint').onclick=()=>openPrint('ICT ingevuld observatieformulier',observationPrint(false));
$r('#reportPrint').onclick=()=>{if(observedGoals().length)openPrint('ICT rapportbijlage',printHeader('ICT · Dit heb ik geoefend',false)+printLegend()+reportItems())};

function isLoopback(host){return /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(host)}
const localPreview=isLoopback(location.hostname)||location.protocol==='file:';
$r('#publicUrl').value=localPreview?'https://tools.jufzisa.be/digitale-missies/':new URL('./',location.href).href;
$r('#qrWarning').textContent=localPreview?'Je bekijkt een lokale proefversie. De nieuwe oefenrondes moeten eerst op dit online adres gepubliceerd worden. Een QR naar localhost of 127.0.0.1 werkt niet op de iPad.':'Gebruik het online adres dat de iPads kunnen openen. Test de QR-code één keer op een school-iPad.';
function invalidateQR(){qrResult=null;$r('#qrResult').innerHTML='';$r('#printQR').disabled=$r('#downloadQR').disabled=true;$r('#qrStatus').textContent='Maak een QR-code voor de huidige leeftijd en periode.'}
$r('#publicUrl').oninput=invalidateQR;
function makeStudentUrl(base){
 const url=new URL(base);if(!['https:','http:'].includes(url.protocol)||isLoopback(url.hostname)||url.username||url.password)throw Error('Gebruik een bereikbaar online webadres, geen localhost of lokaal laptopadres.');
 if(!url.pathname.endsWith('/')&&!url.pathname.endsWith('.html'))url.pathname+='/';
 url.search='';url.hash='';url.searchParams.set('leeftijd',report.age);url.searchParams.set('perioden',report.count);url.searchParams.set('rapport',report.period);
 // Customised goal choices are encoded as public activity IDs, never learner information.
 url.searchParams.set('doelen',selectedGoals().filter(g=>g.mission!=='systemen').map(g=>g.id).join(','));return url.href;
}
$r('#makeQR').onclick=()=>{try{
 if(!selectedGoals().some(g=>g.mission!=='systemen'))throw Error('Deze doelen voer je met papieren A5-kaarten uit. Open Slimme systemen bij de leerkracht; een QR is hiervoor niet nodig.');
 const url=makeStudentUrl($r('#publicUrl').value.trim()),qr=qrcode(0,'M');qr.addData(url);qr.make();
 const svg=qr.createSvgTag({cellSize:6,margin:24,scalable:true,alt:'Scan om de digitale oefenronde te openen'});
 qrResult={url,svg,age:report.age,period:report.period,count:report.count};$r('#qrResult').innerHTML=`${svg}<h3>${report.age} jaar · Oefenronde ${report.period}</h3><a href="${html(url)}" target="_blank" rel="noopener">Open de leerlinglink</a>`;
 $r('#printQR').disabled=$r('#downloadQR').disabled=false;$r('#qrStatus').textContent=localPreview?'QR-code klaargezet voor het online adres. De nieuwe ronde werkt daar na publicatie.':'QR-code klaar. Laat de kinderen scannen met Camera op de iPad.';
 }catch(e){invalidateQR();$r('#qrStatus').textContent=e.message||'De QR-code kon niet worden gemaakt.'}};
$r('#printQR').onclick=()=>{if(qrResult)openPrint('Zisa digitale oefenronde',`<section class="qr-card"><h1>Scan en start je digitale missie</h1><h2>${qrResult.age} jaar · Oefenronde ${qrResult.period}</h2>${qrResult.svg}<p>Open Camera op je iPad. Richt op de code en tik op de link.</p><p>Geen login nodig. Je leerkracht kijkt mee.</p><a href="${html(qrResult.url)}">${html(qrResult.url)}</a>${localPreview?'<p><strong>Voor de leerkracht:</strong> test deze ronde na publicatie op de school-iPad.</p>':''}</section>`)};
$r('#downloadQR').onclick=()=>{if(qrResult)downloadFile(qrResult.svg,`zisa-ict-${qrResult.age}-ronde-${qrResult.period}.svg`,'image/svg+xml')};
const initialAge=new URLSearchParams(location.search).get('leeftijd');if(['6-7','7-8'].includes(initialAge))report.age=initialAge;
renderReportForm();refreshSaved();
