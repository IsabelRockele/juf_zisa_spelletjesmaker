/* Begrip van het halfuur: het vorige en het volgende hele uur. */
const HalfuurVragen = (() => {
  const uur12 = uur => ((uur - 1) % 12 + 12) % 12 + 1;
  function schud(lijst) {
    for (let i = lijst.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lijst[i], lijst[j]] = [lijst[j], lijst[i]];
    }
    return lijst;
  }
  function maakVraag(uur, soort) {
    const antwoord = soort === 'voorbij' ? uur12(uur - 1) : uur;
    return {
      uur, soort, antwoord,
      tekst: `Als het half ${uur} is, welk uur ${soort === 'voorbij' ? 'is er dan net voorbij' : 'gaat er dan komen'}?`,
      keuzes: schud([-1, 0, 1].map(n => uur12(antwoord + n)))
    };
  }
  function leesInstellingen() {
    const soort = document.querySelector('input[name="halfVraagSoort"]:checked')?.value || 'mix';
    const aantal = Math.min(12, Math.max(4, Number(document.getElementById('halfVraagAantal').value) || 4));
    const uren = {voorbij:schud(Array.from({length:12}, (_,i)=>i+1)), komt:schud(Array.from({length:12}, (_,i)=>i+1))};
    const vragen = Array.from({length:aantal}, (_,i) => {
      const richting = soort === 'mix' ? (i % 2 ? 'komt' : 'voorbij') : soort;
      return maakVraag(uren[richting].pop(), richting);
    });
    return {type:'begrippen', variant:'halfuurvragen', soort, vragen:schud(vragen)};
  }
  function tekenPreviewHtml(container, inst) {
    container.replaceChildren();
    inst.vragen.slice(0, 2).forEach(vraag => {
      const blok = document.createElement('div'); blok.style.cssText='padding:10px 4px;border-bottom:1px solid #cbd8e3;line-height:1.5;';
      const zin = document.createElement('div'); zin.textContent=vraag.tekst;
      const opties = document.createElement('div'); opties.style.cssText='display:flex;gap:14px;margin-top:6px;flex-wrap:wrap;';
      vraag.keuzes.forEach(uur => {const optie=document.createElement('span');optie.textContent=`☐ ${uur} uur`;opties.append(optie);});
      blok.append(zin,opties);container.append(blok);
    });
    const info=document.createElement('p');info.style.cssText='font-size:11px;color:#64758a;';info.textContent=`Voorbeeld van 2 vragen · ${inst.vragen.length} vragen op het werkblad`;container.append(info);
  }
  function tekenInPdf(doc, inst, y, margin, volgendePagina) {
    const w=(doc.internal.pageSize.getWidth()-margin*2)/2, h=33;
    for(let start=0;start<inst.vragen.length;start+=2) {
      if(y+h>doc.internal.pageSize.getHeight()-margin-5) y=volgendePagina();
      inst.vragen.slice(start,start+2).forEach((vraag,col)=>{
        const x=margin+col*w;
        doc.setFont(undefined,'normal');doc.setFontSize(11);doc.setTextColor(25,25,25);
        doc.text(doc.splitTextToSize(vraag.tekst,w-10),x+4,y+7);
        vraag.keuzes.forEach((uur,i)=>{
          const ox=x+4+i*(w-8)/3, oy=y+24;
          doc.setDrawColor(40,40,40);doc.setLineWidth(.2);doc.rect(ox,oy-3,3.2,3.2);
          const juist=inst.oplossingen && uur===vraag.antwoord;
          doc.setTextColor(...(juist?[8,126,174]:[25,25,25]));
          doc.text(`${uur} uur`,ox+4.5,oy);
          if(juist) {
            doc.setDrawColor(8,126,174);doc.setLineWidth(.5);
            doc.line(ox+.5,oy-2.5,ox+2.7,oy-.3);doc.line(ox+.5,oy-.3,ox+2.7,oy-2.5);
          }
        });
        doc.setDrawColor(170,192,208);doc.setLineWidth(.25);
        doc.line(x,y+h-2,x+w,y+h-2);
        if(col===0)doc.line(x+w,y+1,x+w,y+h-2);
      });
      y+=h;
    }
    doc.setTextColor(0,0,0);return y+4;
  }
  return {leesInstellingen, tekenPreviewHtml, tekenInPdf, maakVraag};
})();
