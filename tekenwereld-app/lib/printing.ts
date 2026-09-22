import QRCode from 'qrcode';
import {Template,worlds} from './worlds';
import {sheet,corners} from './sheet-scan';

export async function sheetMarkup(t:Template,img:string){
 const markers=await Promise.all(corners.map(async corner=>`<img class="marker ${corner}" alt="Herkenningspunt ${corner}" src="${await QRCode.toDataURL('ZISA2:'+t.id+':'+corner,{margin:3,width:240,errorCorrectionLevel:'M'})}"/>`));
 return `<article><header><small>ZISA TEKENWERELD · ${worlds.find(w=>w.id===t.world)!.name.toUpperCase()}</small><h1>${t.name}</h1><p>${t.kind==='vrij'?'Teken één groot wezen binnen het kader.':'Kleur of versier je wezen.'} Houd het papier rondom wit.</p></header><section class="drawing">${markers.join('')}<div class="drawing-frame">${img?`<img src="${img}" alt="${t.name}"/>`:''}</div></section><footer><p>Naam van mijn wezen: ................................................................</p><small>Fotografeer het hele blad met de vier hoekcodes. Je figuurtje wordt automatisch uitgeknipt.</small></footer></article>`;
}
export const sheetStyles=`@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#111}article{width:186mm;height:270mm;break-after:page;page-break-after:always;display:flex;flex-direction:column}article:last-child{break-after:auto;page-break-after:auto}header{height:40mm;flex-shrink:0;overflow:hidden}h1{font-size:24px;margin:3mm 0}p{font-size:14px;line-height:1.4;margin:2mm 0}small{font-size:11px}.drawing{position:relative;width:${sheet.width}mm;height:${sheet.height}mm;flex-shrink:0}.marker{position:absolute;width:${sheet.marker}mm;height:${sheet.marker}mm}.tl{top:0;left:0}.tr{top:0;right:0}.br{bottom:0;right:0}.bl{bottom:0;left:0}.drawing-frame{position:absolute;inset:${sheet.inset-1}mm;border:.3mm dashed #888;padding:3mm;display:flex;align-items:center;justify-content:center}.drawing-frame>img{width:100%;height:100%;object-fit:contain}footer{height:24mm;padding-top:3mm;flex-shrink:0}button{margin:20px;padding:12px;font-size:16px}@media screen{body{background:#eee}article{background:white;margin:20px auto;box-sizing:content-box;padding:12mm}}@media print{button{display:none}}`;
export async function printSheets(list:Template[]){
 const win=window.open('','_blank');if(!win)throw Error('Sta pop-upvensters toe om de printbladen te openen.');
 win.document.write('<html lang="nl"><title>Tekenbladen voorbereiden</title><body><p>De tekenbladen worden voorbereid…</p></body></html>');
 try{
  const pages=await Promise.all(list.map(async t=>{
   const img=t.kind==='vrij'?'':await fetch('/tekenwereld/art/'+t.id+'.png').then(async r=>{if(!r.ok)throw Error('Een tekenblad kon niet geladen worden. Probeer opnieuw.');const blob=await r.blob();return await new Promise<string>(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result as string);fr.readAsDataURL(blob);});});
   return sheetMarkup(t,img);
  }));
  win.document.open();win.document.write(`<!doctype html><html lang="nl"><head><title>Zisa Tekenbladen</title><style>${sheetStyles}</style></head><body><button onclick="window.print()">Afdrukken / bewaren als PDF</button>${pages.join('')}</body></html>`);win.document.close();
  await Promise.all(Array.from(win.document.images).map(im=>im.complete?Promise.resolve():new Promise<void>(resolve=>{im.onload=()=>resolve();im.onerror=()=>resolve();})));win.focus();win.print();
 }catch(e){win.document.body.textContent='De printbladen konden niet worden geladen. Sluit dit venster en probeer opnieuw.';throw e;}
}

export async function printClassQr(session:{code:string;world:string;expires:number}){
 if(session.expires<=Date.now())throw Error('Deze klas-QR is verlopen. Maak eerst een nieuwe klas-QR.');
 const win=window.open('','_blank');if(!win)throw Error('Sta pop-upvensters toe om de klas-QR af te drukken.');
 win.document.write('<html lang="nl"><title>Klas-QR voorbereiden</title><body>De klas-QR wordt voorbereid…</body></html>');
 try{
 const qr=await QRCode.toDataURL(location.origin+'/tekenwereld/meedoen.html#'+session.code,{width:900,margin:4,errorCorrectionLevel:'M'});
 const name=worlds.find(w=>w.id===session.world)?.name||'Tekenwereld';
 const expires=new Date(session.expires).toLocaleString('nl-BE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 win.document.open();win.document.write(`<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Klas-QR · ${name}</title><style>@page{size:A4 portrait;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;background:white;margin:0}article{max-width:174mm;margin:auto;text-align:center}h1{font-size:32px;margin:12mm 0 4mm}h2{font-size:25px;margin:0 0 6mm}.qr{display:block;width:105mm;height:105mm;margin:3mm auto}ol{display:inline-block;text-align:left;font-size:21px;line-height:1.6;padding-left:8mm}p{font-size:17px;line-height:1.5}.teacher{border-top:1px solid #999;padding-top:6mm;font-size:13px}.toolbar{margin:16px;padding:12px;font-size:16px}@media print{.toolbar{display:none}}</style></head><body><button class="toolbar" onclick="window.print()">Afdrukken / bewaren als PDF</button><article><h1>Breng je tekening tot leven!</h1><h2>${name}</h2><img class="qr" src="${qr}" alt="Klas-QR voor ${name}"><ol><li>Scan de QR met de camera van je iPad.</li><li>Maak een foto van je tekening.</li><li>Volg de stappen en stuur je wezen door.</li><li>Kijk naar het smartboard!</li></ol><p>Ben je klaar? Je mag op jouw moment scannen.</p><p class="teacher"><b>Zisa Tekenwereld · Geldig tot ${expires}</b><br>Laat de klasomgeving open op het smartboard.<br>Deze QR vervalt ook als de leerkracht het insturen sluit of een nieuwe klas-QR maakt.</p></article></body></html>`);win.document.close();
 await Promise.all(Array.from(win.document.images).map(im=>im.complete?Promise.resolve():new Promise<void>((resolve,reject)=>{im.onload=()=>resolve();im.onerror=()=>reject(Error('De QR-afbeelding kon niet laden.'));})));win.focus();win.print();
 }catch(e){win.document.body.textContent='De klas-QR kon niet worden klaargezet. Sluit dit venster en probeer opnieuw.';throw e;}
}
