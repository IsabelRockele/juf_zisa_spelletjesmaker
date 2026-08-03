document.addEventListener('DOMContentLoaded',()=>{
  const editor=document.getElementById('editorCanvas'),ectx=editor.getContext('2d');
  const sheet=document.getElementById('worksheetCanvas'),sctx=sheet.getContext('2d');
  const mask=document.createElement('canvas'),mctx=mask.getContext('2d');
  mask.width=mask.height=720;
  let source=null,sourceData='',points=[],denseOutline=[],mode='points',drag=-1,drawing=false,lastBrush=null,fileName='punttekening';
  const $=id=>document.getElementById(id);
  const isPro=location.pathname.replace(/\\/g,'/').includes('/pro/');
  const storageKey=isPro?'zisa-punttekening-pro-v2':'zisa-punttekening-v2';

  $('helpButton').addEventListener('click',()=>$('helpDialog').showModal());
  $('helpClose').addEventListener('click',()=>$('helpDialog').close());
  $('helpDialog').addEventListener('click',event=>{if(event.target===$('helpDialog'))$('helpDialog').close()});

  $('imageInput').addEventListener('change',event=>{
    const file=event.target.files?.[0];if(!file)return;
    fileName=file.name.replace(/\.[^.]+$/,'')||'punttekening';
    $('status').textContent=`${file.name} wordt verwerkt...`;
    const reader=new FileReader();
    reader.onload=()=>{const img=new Image();img.onload=()=>{source=img;sourceData=reader.result;mctx.clearRect(0,0,720,720);denseOutline=detectOutline(img,180);resample();autoKeepInsideLines();enableDownloads();save();render();$('status').textContent='De omtrek en binnenlijnen zijn automatisch geplaatst. Verbeter ze alleen waar nodig.'};img.src=reader.result};
    reader.readAsDataURL(file);
  });

  $('pointCount').addEventListener('input',()=>{$('pointCountValue').textContent=$('pointCount').value;resample();save();render()});
  $('simplifyButton').addEventListener('click',()=>{if(source){denseOutline=detectOutline(source,180);resample();save();render()}});
  $('closedPath').addEventListener('change',()=>{save();render()});
  $('brushSize').addEventListener('input',()=>{$('brushSizeValue').textContent=$('brushSize').value});
  $('clearDetails').addEventListener('click',()=>{mctx.clearRect(0,0,720,720);save();render()});
  $('autoKeepDetails').addEventListener('click',autoKeepInsideLines);
  function setEditorMode(nextMode){mode=nextMode;document.querySelectorAll('[data-mode]').forEach(button=>button.classList.toggle('active',button.dataset.mode===mode));const active=document.querySelector(`[data-mode="${mode}"]`);$('editorModeLabel').textContent=active?.textContent||'Punten verplaatsen';editor.style.cursor=mode==='points'?'crosshair':'cell';render()}
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setEditorMode(button.dataset.mode)));
  ['titleInput','imageOpacity','showSolution'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='imageOpacity')$('imageOpacityValue').textContent=`${$(id).value}%`;save();renderWorksheet()}));
  $('labelType').addEventListener('change',()=>{const letters=$('labelType').value!=='numbers';$('pointCount').max=letters?26:100;if(letters&&points.length>26){$('pointCount').value=26;$('pointCountValue').textContent='26';resample()}save();render()});
  $('downloadPng').addEventListener('click',()=>{renderWorksheet();const a=document.createElement('a');a.download=`${fileName}-punttekening.png`;a.href=sheet.toDataURL('image/png');a.click()});
  $('downloadPdf').addEventListener('click',()=>{renderWorksheet();const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});doc.addImage(sheet.toDataURL('image/png'),'PNG',0,0,210,297);doc.save(`${fileName}-punttekening.pdf`)});

  function fitRect(img,size=720,pad=.07){const scale=Math.min(size*(1-pad*2)/img.width,size*(1-pad*2)/img.height);const w=img.width*scale,h=img.height*scale;return{x:(size-w)/2,y:(size-h)/2,w,h}}
  function drawSource(ctx,alpha=1){if(!source)return;const r=fitRect(source);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(source,r.x,r.y,r.w,r.h);ctx.restore()}

  function detectOutline(img,count){
    const size=240,c=document.createElement('canvas'),cctx=c.getContext('2d',{willReadFrequently:true});c.width=c.height=size;cctx.fillStyle='#fff';cctx.fillRect(0,0,size,size);const r=fitRect(img,size,.05);cctx.drawImage(img,r.x,r.y,r.w,r.h);const d=cctx.getImageData(0,0,size,size).data;
    const foreground=(x,y)=>{if(x<0||y<0||x>=size||y>=size)return false;const i=(Math.floor(y)*size+Math.floor(x))*4;return d[i+3]>35&&(d[i]+d[i+1]+d[i+2]<690)};
    let sx=0,sy=0,n=0;for(let y=0;y<size;y+=2)for(let x=0;x<size;x+=2)if(foreground(x,y)){sx+=x;sy+=y;n++}if(!n)return[];const cx=sx/n,cy=sy/n,out=[];
    for(let step=0;step<count;step++){const a=-Math.PI/2+step*Math.PI*2/count;let hit=null;for(let rad=size*.72;rad>1;rad-=.75){const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;if(foreground(x,y)){hit={x:x/size*720,y:y/size*720};break}}if(hit)out.push(hit)}
    return out;
  }
  function resample(){if(!denseOutline.length)return;const count=Number($('pointCount').value);points=[];for(let i=0;i<count;i++)points.push({...denseOutline[Math.floor(i*denseOutline.length/count)]})}
  function closestProjection(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;if(!l)return{x:a.x,y:a.y};const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return{x:a.x+t*dx,y:a.y+t*dy}}
  function pos(event){const r=editor.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*720,y:(event.clientY-r.top)/r.height*720}}

  editor.addEventListener('pointerdown',event=>{if(!source)return;const p=pos(event);drawing=true;
    if(mode==='points'){
      let nearest={i:-1,d:Infinity};points.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<nearest.d)nearest={i,d}});
      if(nearest.d<14){drag=nearest.i;editor.setPointerCapture(event.pointerId)}else{let best={i:-1,d:Infinity,p:null};const limit=$('closedPath').checked?points.length:points.length-1;for(let i=0;i<limit;i++){const q=closestProjection(p,points[i],points[(i+1)%points.length]),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<best.d)best={i,d,p:q}}if(best.d<18){points.splice(best.i+1,0,best.p);drag=best.i+1;editor.setPointerCapture(event.pointerId);$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;$('status').textContent='Nieuw punt toegevoegd en vastgenomen.';save();render()}}
    }else if(mode==='remove'){
      let nearest={i:-1,d:Infinity};points.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<nearest.d)nearest={i,d}});if(nearest.d<18&&points.length>3){points.splice(nearest.i,1);$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;$('status').textContent='Punt verwijderd. Je kunt nu weer punten verplaatsen.';save();setEditorMode('points')}
    }else{lastBrush=p;paintMask(p,p,mode==='erase')}
  });
  editor.addEventListener('pointermove',event=>{if(!drawing)return;const p=pos(event);if(mode==='points'&&drag>=0){points[drag]=p;render()}else if(mode!=='points'&&lastBrush){paintMask(lastBrush,p,mode==='erase');lastBrush=p;render()}});
  const end=()=>{drawing=false;drag=-1;lastBrush=null;save();render()};editor.addEventListener('pointerup',end);editor.addEventListener('pointercancel',end);
  editor.addEventListener('dblclick',event=>{if(mode!=='points'||points.length<=3)return;const p=pos(event);let nearest={i:-1,d:Infinity};points.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<nearest.d)nearest={i,d}});if(nearest.d<18){points.splice(nearest.i,1);$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;save();render()}});
  function paintMask(a,b,erase){mctx.save();mctx.globalCompositeOperation=erase?'destination-out':'source-over';mctx.strokeStyle='#fff';mctx.lineWidth=Number($('brushSize').value);mctx.lineCap='round';mctx.beginPath();mctx.moveTo(a.x,a.y);mctx.lineTo(b.x,b.y);mctx.stroke();mctx.restore()}

  function pointInPolygon(x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))inside=!inside}return inside}
  function distanceToOutline(p){let best=Infinity;const limit=$('closedPath').checked?points.length:points.length-1;for(let i=0;i<limit;i++){const q=closestProjection(p,points[i],points[(i+1)%points.length]);best=Math.min(best,Math.hypot(p.x-q.x,p.y-q.y))}return best}
  function autoKeepInsideLines(){if(!source||points.length<3)return;const temp=document.createElement('canvas'),t=temp.getContext('2d',{willReadFrequently:true});temp.width=temp.height=720;t.fillStyle='#fff';t.fillRect(0,0,720,720);drawSource(t,1);const pixels=t.getImageData(0,0,720,720),out=mctx.createImageData(720,720);for(let y=0;y<720;y+=2)for(let x=0;x<720;x+=2){const i=(y*720+x)*4;if(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2]<660&&pointInPolygon(x,y)&&distanceToOutline({x,y})>18){for(let oy=0;oy<3;oy++)for(let ox=0;ox<3;ox++){const px=x+ox,py=y+oy;if(px<720&&py<720){const k=(py*720+px)*4;out.data[k]=out.data[k+1]=out.data[k+2]=255;out.data[k+3]=255}}}}mctx.clearRect(0,0,720,720);mctx.putImageData(out,0,0);$('status').textContent='De binnenlijnen zijn automatisch bewaard. Je kunt de selectie nog bijwerken.';save();render()}

  function selectedDetailsCanvas(){const c=document.createElement('canvas'),x=c.getContext('2d');c.width=c.height=720;drawSource(x,1);x.globalCompositeOperation='destination-in';x.drawImage(mask,0,0);return c}
  function render(){ectx.clearRect(0,0,720,720);ectx.fillStyle='#fff';ectx.fillRect(0,0,720,720);const editingDetails=mode==='keep'||mode==='erase';drawSource(ectx,editingDetails?0.82:0.16);ectx.drawImage(selectedDetailsCanvas(),0,0);if(editingDetails){ectx.save();ectx.globalAlpha=.28;ectx.fillStyle='#19a66a';ectx.fillRect(0,0,720,720);ectx.globalCompositeOperation='destination-in';ectx.drawImage(mask,0,0);ectx.restore()}if(points.length){ectx.strokeStyle='#2689d1';ectx.lineWidth=3;ectx.lineJoin='round';ectx.beginPath();points.forEach((p,i)=>i?ectx.lineTo(p.x,p.y):ectx.moveTo(p.x,p.y));if($('closedPath').checked)ectx.closePath();ectx.stroke();points.forEach((p,i)=>{ectx.fillStyle=i===drag?'#ff6856':'#fff';ectx.strokeStyle='#2773aa';ectx.lineWidth=2;ectx.beginPath();ectx.arc(p.x,p.y,7,0,Math.PI*2);ectx.fill();ectx.stroke()})}renderWorksheet()}
  function labelFor(i){const type=$('labelType').value;if(type==='numbers')return String(i+1);return String.fromCharCode((type==='upper'?65:97)+i)}
  function drawWorksheetPoints(){
    const labels=[];
    sctx.font='16px Segoe UI';
    sctx.textAlign='center';
    sctx.textBaseline='middle';
    points.forEach(p=>{sctx.fillStyle='#182f43';sctx.beginPath();sctx.arc(p.x,p.y,4,0,Math.PI*2);sctx.fill()});
    points.forEach((p,i)=>{
      const text=labelFor(i),width=sctx.measureText(text).width;
      let best=null;
      [14,23,33,43].forEach(radius=>{
        for(let step=0;step<12;step++){
          const angle=-Math.PI/2+step*Math.PI/6,x=p.x+Math.cos(angle)*radius,y=p.y+Math.sin(angle)*radius;
          const box={left:x-width/2-4,right:x+width/2+4,top:y-11,bottom:y+11};
          let score=radius;
          if(box.left<5||box.right>715||box.top<5||box.bottom>715)score+=50000;
          labels.forEach(other=>{if(box.left<other.right&&box.right>other.left&&box.top<other.bottom&&box.bottom>other.top)score+=10000});
          points.forEach((q,qi)=>{if(qi!==i&&q.x>box.left-4&&q.x<box.right+4&&q.y>box.top-4&&q.y<box.bottom+4)score+=1200});
          if(!best||score<best.score)best={x,y,box,score};
        }
      });
      labels.push(best.box);
      sctx.lineWidth=5;sctx.lineJoin='round';sctx.strokeStyle='rgba(255,255,255,.98)';sctx.strokeText(text,best.x,best.y);
      sctx.fillStyle='#182f43';sctx.fillText(text,best.x,best.y);
    });
    sctx.textAlign='left';sctx.textBaseline='alphabetic';
  }
  function renderWorksheet(){sctx.clearRect(0,0,794,1123);sctx.fillStyle='#fff';sctx.fillRect(0,0,794,1123);sctx.fillStyle='#173a5c';sctx.font='700 30px Segoe UI';sctx.fillText($('titleInput').value||'Punttekening',58,86);sctx.fillStyle='#617a90';sctx.font='14px Segoe UI';sctx.fillText('Verbind de punten in de juiste volgorde.',58,114);sctx.font='12px Segoe UI';sctx.fillText('Naam',520,65);sctx.fillText('Datum',650,65);sctx.strokeStyle='#9db1c1';sctx.lineWidth=1;sctx.beginPath();sctx.moveTo(520,83);sctx.lineTo(625,83);sctx.moveTo(650,83);sctx.lineTo(744,83);sctx.stroke();sctx.setLineDash([6,6]);sctx.strokeStyle='#d4e2ec';sctx.beginPath();sctx.moveTo(58,138);sctx.lineTo(744,138);sctx.stroke();sctx.setLineDash([]);
    if(!source||!points.length)return;const scale=.78,ox=117,oy=220;sctx.save();sctx.translate(ox,oy);sctx.scale(scale,scale);const opacity=Number($('imageOpacity').value)/100;if(opacity)drawSource(sctx,opacity);sctx.drawImage(selectedDetailsCanvas(),0,0);if($('closedPath').checked&&points.length>1&&!$('showSolution').checked){sctx.strokeStyle='#182f43';sctx.lineWidth=2.5;sctx.lineCap='round';sctx.beginPath();sctx.moveTo(points[points.length-1].x,points[points.length-1].y);sctx.lineTo(points[0].x,points[0].y);sctx.stroke()}if($('showSolution').checked){sctx.strokeStyle='#a8b7c2';sctx.lineWidth=2;sctx.beginPath();points.forEach((p,i)=>i?sctx.lineTo(p.x,p.y):sctx.moveTo(p.x,p.y));if($('closedPath').checked)sctx.closePath();sctx.stroke()}drawWorksheetPoints();sctx.restore();sctx.fillStyle='#9aa9b5';sctx.font='italic 10px Segoe UI';sctx.textAlign='center';sctx.fillText("juf Zisa's werkbladgenerator",397,1092);sctx.textAlign='left'}

  function enableDownloads(){$('downloadPng').disabled=false;$('downloadPdf').disabled=false}
  function save(){if(!sourceData)return;try{sessionStorage.setItem(storageKey,JSON.stringify({sourceData,points,denseOutline,mask:mask.toDataURL(),count:$('pointCount').value,closed:$('closedPath').checked,label:$('labelType').value,title:$('titleInput').value,opacity:$('imageOpacity').value}))}catch(_){}}
  function restore(){let saved;try{const stored=sessionStorage.getItem(storageKey)||(!isPro?sessionStorage.getItem('zisa-punttekening-nieuw'):null);saved=JSON.parse(stored||'null')}catch(_){return}if(!saved?.sourceData)return;const img=new Image();img.onload=()=>{source=img;sourceData=saved.sourceData;points=saved.points||[];denseOutline=saved.denseOutline||[];$('pointCount').value=saved.count||points.length||30;$('pointCountValue').textContent=$('pointCount').value;$('closedPath').checked=saved.closed!==false;$('labelType').value=saved.label||'numbers';$('titleInput').value=saved.title||'Punttekening';$('imageOpacity').value=saved.opacity||0;$('imageOpacityValue').textContent=`${$('imageOpacity').value}%`;if(saved.mask){const mi=new Image();mi.onload=()=>{mctx.drawImage(mi,0,0);render()};mi.src=saved.mask}else render();enableDownloads();$('status').textContent='Je vorige punttekening is teruggezet.'};img.src=saved.sourceData}
  renderWorksheet();restore();
});
