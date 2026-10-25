'use strict';
async function makeWorksheetPdf(){
 const art=selectedArtwork(),solution=$('answers').checked;
 const svg=$('preview').querySelector('svg').cloneNode(true);
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
 svg.setAttribute('width',art.width);svg.setAttribute('height',art.height);
 if(svg.querySelector('image')){
  const source=new Image();source.src=art.src;await source.decode();
  const asset=document.createElement('canvas');asset.width=source.naturalWidth;asset.height=source.naturalHeight;
  asset.getContext('2d').drawImage(source,0,0);
  svg.querySelector('image').setAttribute('href',asset.toDataURL('image/png'));
 }
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
 let picture;
 try{picture=new Image();picture.src=url;await picture.decode();}
 finally{URL.revokeObjectURL(url);}
 const canvas=document.createElement('canvas');canvas.width=2200;canvas.height=Math.round(2200*art.height/art.width);
 const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(picture,0,0,canvas.width,canvas.height);
 const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
 const margin=14,pageWidth=210,pageHeight=297,contentWidth=pageWidth-2*margin;
 doc.setTextColor(20);doc.setFont('helvetica','bold');doc.setFontSize(17);
 const titleLines=doc.splitTextToSize(art.title,contentWidth-8);
 const titleTop=margin,titleHeight=Math.max(13,titleLines.length*6+5);
 doc.setDrawColor(20);doc.setLineWidth(.4);doc.rect(margin,titleTop,contentWidth,titleHeight);
 doc.text(titleLines,pageWidth/2,titleTop+8,{align:'center',lineHeightFactor:1});
 const nameY=titleTop+titleHeight+9;
 doc.setFont('helvetica','normal');doc.setFontSize(10);
 doc.text('Naam:',margin,nameY);doc.setLineWidth(.2);doc.setDrawColor(60);
 doc.line(margin+14,nameY+1,pageWidth/2-8,nameY+1);
 doc.text('Datum:',pageWidth/2+8,nameY);
 doc.line(pageWidth/2+24,nameY+1,pageWidth-margin,nameY+1);
 doc.setFontSize(9);
 const instruction='Los elke oefening op. Zoek de uitkomst in de kleurcode en kleur het vak.'+(current.some(e=>e.op==='split')?' Zoek bij het lege vakje het ontbrekende deel.':'');
 const lines=doc.splitTextToSize(instruction,contentWidth);
 doc.text(lines,pageWidth/2,nameY+7,{align:'center'});
 let top=nameY+10+lines.length*3.5;
 if(solution){doc.setFont('helvetica','bold');doc.text('Oplossing',pageWidth/2,top,{align:'center'});top+=5;doc.setFont('helvetica','normal');}
 const key=window.worksheet.key,columns=3,rowHeight=7,legendHeight=Math.ceil(key.length/columns)*rowHeight;
 const maxHeight=pageHeight-margin-top-legendHeight-7;
 const height=Math.min(maxHeight,contentWidth*art.height/art.width),width=height*art.width/art.height;
 doc.addImage(canvas.toDataURL('image/png'),'PNG',(pageWidth-width)/2,top,width,height,undefined,'FAST');
 const legendTop=top+height+6,legendLeft=(pageWidth-width)/2,legendWidth=width;
 doc.setFontSize(11);
 key.forEach(({n,color},i)=>{
  const x=legendLeft+(i%columns)*legendWidth/columns,y=legendTop+Math.floor(i/columns)*rowHeight;
  const hex=palette[color][1],rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
  doc.setFillColor(...rgb);doc.setDrawColor(90);doc.setLineWidth(.15);doc.circle(x+1.9,y-1.2,1.9,'FD');
  doc.setTextColor(20);doc.text(`${n} = ${palette[color][0]}`,x+6,y);
 });
 // Also used by automated print checks: every element stays inside this box.
 doc.worksheetLayout={margin,top,width,height,legendBottom:legendTop+(Math.ceil(key.length/columns)-1)*rowHeight+2};
 return doc;
}
$('downloadPdf').onclick=async()=>{
 const button=$('downloadPdf'),label=button.textContent;button.disabled=true;button.textContent='Pdf makenâ€¦';
 try{const doc=await makeWorksheetPdf();const filename=selectedArtwork().title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(location.pathname.includes('/ontdek/')){
   const trial=window.OntdekTrial||(window.parent!==window?window.parent.OntdekTrial:null);
   if(!trial?.authorizeDownload)throw new Error('De accountverbinding is nog niet klaar. Probeer het straks opnieuw.');
   await trial.authorizeDownload(doc.internal.getNumberOfPages());
  }
  doc.save(`${filename}-${$('answers').checked?'oplossing':'werkblad'}.pdf`);}
 catch(error){$('status').textContent=location.pathname.includes('/ontdek/')?error.message:'De pdf kon niet gemaakt worden. Probeer opnieuw.';console.error(error);}
 finally{button.disabled=false;button.textContent=label;}
};
