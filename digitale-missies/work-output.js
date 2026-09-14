/* Local work export. Sharing happens only after a pupil chooses a destination. */
function addAuthorField(area){
 const label=document.createElement('label');label.className='work-author';label.textContent='Mijn voornaam';
 const input=document.createElement('input');input.type='text';input.maxLength=40;input.autocomplete='off';input.placeholder='Typ je voornaam';label.append(input);area.prepend(label);
 area.addEventListener('click',e=>{if(!e.target.closest('[data-save]'))return;if(session.answered){e.preventDefault();e.stopImmediatePropagation();return}if(!input.value.trim()){e.preventDefault();e.stopImmediatePropagation();note('Typ eerst je voornaam bij je werk.');input.focus()}},true);
 return input;
}
const createWithOutput=renderCreate;
renderCreate=function(task){createWithOutput(task);addAuthorField($('#taskArea .work-panel'))};
const drawingWithOutput=renderDrawing;
renderDrawing=function(task){drawingWithOutput(task);addAuthorField($('#taskArea .work-panel'))};
async function makeWorkFile(name,item){
 const picture=new Image();picture.src=item.image||item.src;await picture.decode();
 const canvas=document.createElement('canvas');canvas.width=1000;
 let ctx=canvas.getContext('2d');ctx.font='32px sans-serif';const lines=[];let line='';
 for(const char of item.text||''){if(char==='\n'||ctx.measureText(line+char).width>880){lines.push(line);line=char==='\n'?'':char}else line+=char}if(line)lines.push(line);
 canvas.height=740+lines.length*44;ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#173f5f';ctx.font='bold 30px sans-serif';ctx.fillText(item.author||'Mijn werk',60,55,880);
 const ratio=Math.min(880/picture.naturalWidth,550/picture.naturalHeight),w=picture.naturalWidth*ratio,h=picture.naturalHeight*ratio;
 ctx.drawImage(picture,(1000-w)/2,95+(550-h)/2,w,h);ctx.font='32px sans-serif';ctx.textAlign='center';lines.forEach((value,i)=>ctx.fillText(value,500,700+i*44));
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Geen afbeelding');
 const filename=((item.author||'werk')+'-'+name).replace(/[^a-z0-9À-ÿ_-]/gi,'-')+'.png';
 return {file:new File([blob],filename,{type:'image/png'}),url:canvas.toDataURL('image/png')};
}
async function addWorkOutput(container,name,item){
 const box=document.createElement('div');box.className='work-output';box.innerHTML='<p role="status">Je werk wordt klaargezet…</p>';container.append(box);
 try{const {file,url}=await makeWorkFile(name,item);if(!box.isConnected)return;box.innerHTML='<div class="tool-row"><button data-download>Download PNG</button><button data-share>Delen met de leerkracht</button><button data-print>Afdrukken</button></div><p role="status">Je werk blijft op dit toestel tot je het zelf deelt.</p>';
 const status=box.querySelector('[role="status"]');box.querySelector('[data-download]').onclick=()=>{const link=document.createElement('a');link.href=url;link.download=file.name;link.click();status.textContent='Bewaar de afbeelding op je toestel. Je voornaam staat op je werk.'};
 const share=box.querySelector('[data-share]');if(!navigator.canShare?.({files:[file]})){share.disabled=true;status.textContent='Rechtstreeks delen is hier niet beschikbaar. Download de PNG en voeg die samen met je leerkracht toe in jullie klasapp.'}
 share.onclick=async()=>{try{await navigator.share({files:[file],title:'Mijn werk: '+(item.author||name)});status.textContent='Het deelvenster is gesloten. Controleer samen met je leerkracht of het werk is aangekomen.'}catch(e){status.textContent=e.name==='AbortError'?'Delen geannuleerd. Je werk blijft bewaard.':'Delen lukte niet. Download de PNG en voeg die toe in jullie klasapp.'}};
 box.querySelector('[data-print]').onclick=()=>{const popup=window.open('','_blank');if(!popup){status.textContent='Sta het afdrukvenster toe, of download de afbeelding om ze af te drukken.';return}popup.document.title=file.name;const style=popup.document.createElement('style');style.textContent='@page{size:A4;margin:12mm}body{margin:0;text-align:center}img{max-width:100%;max-height:260mm;object-fit:contain}button{margin:16px;padding:12px}@media print{button{display:none}}';popup.document.head.append(style);const button=popup.document.createElement('button');button.textContent='Afdrukken';button.onclick=()=>popup.print();const image=popup.document.createElement('img');image.alt='Werk van '+(item.author||'de leerling');image.onload=()=>{popup.focus();popup.print()};popup.document.body.append(button,image);image.src=url};
 }catch{box.textContent='De afbeelding kon niet worden klaargezet. Je werk staat nog bij Mijn bewaarde werk.'}
}
const saveNamedWork=saveWork;
saveWork=function(name,item){
 if(item.kind==='card'||item.kind==='drawing')item={...item,author:$('#taskArea .work-author input')?.value.trim()||''};
 saveNamedWork(item.author?name+'-'+item.author+'-'+Date.now():name,item);
 if(item.kind==='card'||item.kind==='drawing'){const panel=$('#taskArea .work-panel');queueMicrotask(()=>{if(panel?.isConnected){panel.querySelector('.work-author input').readOnly=true;addWorkOutput(panel,name,item)}})}
};
const showSavedWork=$('#viewWork').onclick;
$('#viewWork').onclick=function(){showSavedWork();const entries=Object.entries(readWork());body.querySelectorAll('.saved-gallery article').forEach((article,i)=>{const [name,item]=entries[i];if(item.author){const p=document.createElement('p');p.textContent='Gemaakt door '+item.author;article.prepend(p)}if(item.kind==='card'||item.kind==='drawing')addWorkOutput(article,name,item)})};
