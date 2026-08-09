document.addEventListener('DOMContentLoaded',()=>{
  const editor=document.getElementById('editorCanvas'),ectx=editor.getContext('2d');
  const sheet=document.getElementById('worksheetCanvas'),sctx=sheet.getContext('2d');
  const mask=document.createElement('canvas'),mctx=mask.getContext('2d');
  mask.width=mask.height=720;
  let source=null,sourceData='',points=[],denseOutline=[],mode='points',drag=-1,drawing=false,lastBrush=null,fileName='punttekening',selectedPoint=-1,history=[];
  const $=id=>document.getElementById(id);
  const brushCursor=document.createElement('span');brushCursor.className='punt-brush-cursor';brushCursor.hidden=true;editor.parentElement.appendChild(brushCursor);
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
  window.addEventListener('zisa:catalog-image',event=>{const item=event.detail;if(!item?.src)return;fileName=item.name||'punttekening';$('status').textContent=`${item.label||'Afbeelding'} wordt uit de catalogus geladen...`;const img=new Image();img.onload=()=>{source=img;sourceData=item.src;mctx.clearRect(0,0,720,720);denseOutline=detectOutline(img,180);resample();autoKeepInsideLines();enableDownloads();save();render();$('status').textContent=`${item.label||'De afbeelding'} is gekozen. De punten en binnenlijnen zijn automatisch geplaatst.`};img.onerror=()=>{$('status').textContent='Deze catalogusafbeelding kon niet worden geladen. Probeer opnieuw.'};img.src=item.src});

  function remember(){if(!source)return;history.push({points:points.map(p=>({...p})),mask:mctx.getImageData(0,0,720,720)});if(history.length>8)history.shift();$('undoButton').disabled=false}
  function undo(){const previous=history.pop();if(!previous)return;points=previous.points;mctx.putImageData(previous.mask,0,0);selectedPoint=-1;$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;$('undoButton').disabled=!history.length;$('status').textContent='De laatste aanpassing is ongedaan gemaakt.';save();render()}
  $('undoButton').addEventListener('click',undo);
  $('pointCount').addEventListener('input',()=>{remember();$('pointCountValue').textContent=$('pointCount').value;resample();selectedPoint=-1;save();render()});
  $('simplifyButton').addEventListener('click',()=>{if(source){remember();denseOutline=detectOutline(source,180);resample();selectedPoint=-1;save();render();$('status').textContent='De punten zijn opnieuw automatisch verdeeld. Verplaats alleen de punten die nog niet goed staan.'}});
  $('closedPath').addEventListener('change',()=>{save();render()});
  $('brushSize').addEventListener('input',()=>{$('brushSizeValue').textContent=$('brushSize').value});
  $('clearDetails').addEventListener('click',()=>{remember();mctx.clearRect(0,0,720,720);save();render()});
  $('autoKeepDetails').addEventListener('click',()=>{remember();autoKeepInsideLines()});
  function setEditorMode(nextMode){mode=nextMode;selectedPoint=-1;document.querySelectorAll('[data-mode]').forEach(button=>button.classList.toggle('active',button.dataset.mode===mode));const active=document.querySelector(`[data-mode="${mode}"]`);$('editorModeLabel').textContent=active?.textContent?.replace(/^[^\p{L}\p{N}]+/u,'')||'Punten bewerken';editor.style.cursor=mode==='points'?'grab':mode==='add'?'copy':mode==='remove'?'not-allowed':'none';brushCursor.dataset.tool=mode;brushCursor.hidden=!['keep','erase'].includes(mode);if(mode==='keep')$('status').textContent='De volledige oorspronkelijke tekening blijft grijs zichtbaar. Het rondje met potlood toont exact waar je een lijn groen zult selecteren.';if(mode==='erase')$('status').textContent='De lijnen blijven zichtbaar. Het rondje met gom toont exact welk stukje van de groene selectie je zult verwijderen.';render()}
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setEditorMode(button.dataset.mode)));
  ['titleInput','imageOpacity','showSolution'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='imageOpacity')$('imageOpacityValue').textContent=`${$(id).value}%`;save();renderWorksheet()}));
  $('labelType').addEventListener('change',()=>{const letters=$('labelType').value!=='numbers';$('pointCount').max=letters?26:100;if(letters&&points.length>26){$('pointCount').value=26;$('pointCountValue').textContent='26';resample()}save();render()});
  $('downloadPng').addEventListener('click',()=>{renderWorksheet();const a=document.createElement('a');a.download=`${fileName}-punttekening.png`;a.href=sheet.toDataURL('image/png');a.click()});
  $('downloadPdf').addEventListener('click',()=>{renderWorksheet();const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});doc.addImage(sheet.toDataURL('image/png'),'PNG',0,0,210,297);doc.save(`${fileName}-punttekening.pdf`)});

  function fitRect(img,size=720,pad=.07){const scale=Math.min(size*(1-pad*2)/img.width,size*(1-pad*2)/img.height);const w=img.width*scale,h=img.height*scale;return{x:(size-w)/2,y:(size-h)/2,w,h}}
  function drawSource(ctx,alpha=1){if(!source)return;const r=fitRect(source);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(source,r.x,r.y,r.w,r.h);ctx.restore()}

  function detectOutline(img,count){
    const size=240,c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});c.width=c.height=size;ctx.clearRect(0,0,size,size);const r=fitRect(img,size,.05);ctx.drawImage(img,r.x,r.y,r.w,r.h);const data=ctx.getImageData(0,0,size,size).data,total=size*size;
    let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]<30)transparent++;
    const inside=new Uint8Array(total);
    if(transparent>total*.04){for(let i=0;i<total;i++)inside[i]=data[i*4+3]>45?1:0}
    else{
      const background=new Uint8Array(total),queue=new Int32Array(total);let head=0,tail=0;
      const light=i=>data[i*4]+data[i*4+1]+data[i*4+2]>570;
      const add=(x,y)=>{if(x<0||y<0||x>=size||y>=size)return;const i=y*size+x;if(background[i]||!light(i))return;background[i]=1;queue[tail++]=i};
      for(let x=0;x<size;x++){add(x,0);add(x,size-1)}for(let y=0;y<size;y++){add(0,y);add(size-1,y)}
      while(head<tail){const i=queue[head++],x=i%size,y=(i/size)|0;add(x+1,y);add(x-1,y);add(x,y+1);add(x,y-1)}
      for(let i=0;i<total;i++)inside[i]=background[i]?0:1;
    }
    const isInside=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&inside[y*size+x];
    let start=null;for(let y=1;y<size-1&&!start;y++)for(let x=1;x<size-1;x++)if(isInside(x,y)&&!isInside(x,y-1)){start={x,y};break}if(!start)return radialOutline(data,size,count);
    const dirs=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]],key=(x,y)=>`${x},${y}`;let current=start,back={x:start.x-1,y:start.y},second=null;const outline=[],max=size*size*2;
    for(let step=0;step<max;step++){
      outline.push({x:current.x/size*720,y:current.y/size*720});let backIndex=dirs.findIndex(([dx,dy])=>current.x+dx===back.x&&current.y+dy===back.y);if(backIndex<0)backIndex=7;let next=null,nextBack=null;
      for(let offset=1;offset<=8;offset++){const idx=(backIndex+offset)%8,[dx,dy]=dirs[idx],nx=current.x+dx,ny=current.y+dy;if(isInside(nx,ny)){next={x:nx,y:ny};const prev=(idx+7)%8;nextBack={x:current.x+dirs[prev][0],y:current.y+dirs[prev][1]};break}}
      if(!next)break;if(!second)second=next;else if(key(current.x,current.y)===key(start.x,start.y)&&key(next.x,next.y)===key(second.x,second.y)){outline.pop();break}back=nextBack;current=next;
    }
    if(outline.length<40||outline.length>max-2)return radialOutline(data,size,count);
    return centerOutlineOnInk(outline,data,size,isInside);
  }
  function centerOutlineOnInk(outline,data,size,isInside){return outline.map((p,i)=>{const prev=outline[(i-3+outline.length)%outline.length],next=outline[(i+3)%outline.length],x=p.x/720*size,y=p.y/720*size,tx=next.x-prev.x,ty=next.y-prev.y,len=Math.hypot(tx,ty)||1;let nx=-ty/len,ny=tx/len;if(!isInside(Math.round(x+nx*3),Math.round(y+ny*3))){nx=-nx;ny=-ny}const dark=[];for(let step=0;step<=10;step+=.5){const px=Math.round(x+nx*step),py=Math.round(y+ny*step);if(px<0||py<0||px>=size||py>=size)continue;const k=(py*size+px)*4;if(data[k+3]>30&&data[k]+data[k+1]+data[k+2]<510)dark.push(step)}if(!dark.length)return p;const middle=(dark[0]+dark[dark.length-1])/2+1.5;return{x:(x+nx*middle)/size*720,y:(y+ny*middle)/size*720}})}
  function radialOutline(data,size,count){const foreground=(x,y)=>{if(x<0||y<0||x>=size||y>=size)return false;const i=(Math.floor(y)*size+Math.floor(x))*4;return data[i+3]>35&&(data[i]+data[i+1]+data[i+2]<690)};let sx=0,sy=0,n=0;for(let y=0;y<size;y+=2)for(let x=0;x<size;x+=2)if(foreground(x,y)){sx+=x;sy+=y;n++}if(!n)return[];const cx=sx/n,cy=sy/n,out=[];for(let step=0;step<count;step++){const a=-Math.PI/2+step*Math.PI*2/count;for(let rad=size*.72;rad>1;rad-=.75){const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;if(foreground(x,y)){out.push({x:x/size*720,y:y/size*720});break}}}return out}
  function resample(){if(!denseOutline.length)return;const count=Number($('pointCount').value);points=[];for(let i=0;i<count;i++)points.push({...denseOutline[Math.floor(i*denseOutline.length/count)]})}
  function closestProjection(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;if(!l)return{x:a.x,y:a.y};const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return{x:a.x+t*dx,y:a.y+t*dy}}
  function pos(event){const r=editor.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*720,y:(event.clientY-r.top)/r.height*720}}

  editor.addEventListener('pointerdown',event=>{if(!source)return;editor.focus();const p=pos(event);drawing=true;
    if(mode==='points'){
      let nearest={i:-1,d:Infinity};points.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<nearest.d)nearest={i,d}});
      if(nearest.d<20){remember();drag=nearest.i;selectedPoint=nearest.i;editor.setPointerCapture(event.pointerId);$('status').textContent=`Punt ${nearest.i+1} geselecteerd. Sleep het of gebruik de pijltjestoetsen.`;render()}else{let best={i:-1,d:Infinity,p:null};const limit=$('closedPath').checked?points.length:points.length-1;for(let i=0;i<limit;i++){const q=closestProjection(p,points[i],points[(i+1)%points.length]),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<best.d)best={i,d,p:q}}if(best.d<22){remember();points.splice(best.i+1,0,best.p);drag=best.i+1;selectedPoint=drag;editor.setPointerCapture(event.pointerId);$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;$('status').textContent=`Nieuw punt ${selectedPoint+1} toegevoegd. Houd vast en sleep het meteen naar de juiste plaats.`;save();render()}else{$('status').textContent='Klik op een bestaand punt of op de blauwe lijn om een nieuw punt toe te voegen.'}}
    }else if(mode==='add'){
      let best={i:-1,d:Infinity,p:null};const limit=$('closedPath').checked?points.length:points.length-1;for(let i=0;i<limit;i++){const q=closestProjection(p,points[i],points[(i+1)%points.length]),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<best.d)best={i,d,p:q}}if(best.d<22){remember();points.splice(best.i+1,0,best.p);selectedPoint=best.i+1;$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;$('status').textContent=`Punt ${selectedPoint+1} toegevoegd. Gebruik de pijltjestoetsen om het precies te plaatsen.`;save();render()}else{$('status').textContent='Klik op of vlak naast de blauwe verbindingslijn om een punt toe te voegen.'}
    }else if(mode==='remove'){
      let nearest={i:-1,d:Infinity};points.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<nearest.d)nearest={i,d}});if(nearest.d<20&&points.length>3){remember();points.splice(nearest.i,1);selectedPoint=-1;$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;$('status').textContent='Punt verwijderd. Kies “Punten bewerken” om verder te verfijnen.';save();render()}else{$('status').textContent='Klik precies op het punt dat je wilt verwijderen.'}
    }else{remember();lastBrush=p;paintMask(p,p,mode==='erase');$('status').textContent=mode==='keep'?'Teken heel precies over de zichtbare lijn. Alleen het zwarte deel onder je penseel wordt hersteld.':'Gum alleen over het stukje binnenlijn dat weg moet.'}
  });
  editor.addEventListener('pointermove',event=>{if(!drawing)return;const p=pos(event);if(mode==='points'&&drag>=0){points[drag]=p;render()}else if(mode!=='points'&&lastBrush){paintMask(lastBrush,p,mode==='erase');lastBrush=p;render()}});
  function moveBrushCursor(event){if(!['keep','erase'].includes(mode)){brushCursor.hidden=true;return}const r=editor.getBoundingClientRect(),size=Math.max(4,Number($('brushSize').value)*r.width/720);brushCursor.hidden=false;brushCursor.dataset.tool=mode;brushCursor.style.width=`${size}px`;brushCursor.style.height=`${size}px`;brushCursor.style.left=`${event.clientX-r.left}px`;brushCursor.style.top=`${event.clientY-r.top}px`}
  editor.addEventListener('pointermove',moveBrushCursor);editor.addEventListener('pointerenter',moveBrushCursor);editor.addEventListener('pointerleave',()=>{brushCursor.hidden=true});
  const end=()=>{drawing=false;drag=-1;lastBrush=null;save();render()};editor.addEventListener('pointerup',end);editor.addEventListener('pointercancel',end);
  editor.addEventListener('keydown',event=>{if(selectedPoint<0||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();remember();const step=event.shiftKey?5:1,p=points[selectedPoint];if(event.key==='ArrowLeft')p.x-=step;if(event.key==='ArrowRight')p.x+=step;if(event.key==='ArrowUp')p.y-=step;if(event.key==='ArrowDown')p.y+=step;p.x=Math.max(0,Math.min(720,p.x));p.y=Math.max(0,Math.min(720,p.y));$('status').textContent=`Punt ${selectedPoint+1} heel precies verplaatst (${step} ${step===1?'stap':'stappen'}).`;save();render()});
  editor.addEventListener('dblclick',event=>{if(mode!=='points'||points.length<=3)return;const p=pos(event);let nearest={i:-1,d:Infinity};points.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<nearest.d)nearest={i,d}});if(nearest.d<18){points.splice(nearest.i,1);$('pointCount').value=points.length;$('pointCountValue').textContent=points.length;save();render()}});
  function paintMask(a,b,erase){mctx.save();mctx.globalCompositeOperation=erase?'destination-out':'source-over';mctx.strokeStyle='#fff';mctx.lineWidth=Number($('brushSize').value);mctx.lineCap='round';mctx.beginPath();mctx.moveTo(a.x,a.y);mctx.lineTo(b.x,b.y);mctx.stroke();mctx.restore()}

  function pointInPolygon(x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))inside=!inside}return inside}
  function distanceToOutline(p){let best=Infinity;const limit=$('closedPath').checked?points.length:points.length-1;for(let i=0;i<limit;i++){const q=closestProjection(p,points[i],points[(i+1)%points.length]);best=Math.min(best,Math.hypot(p.x-q.x,p.y-q.y))}return best}
  function autoKeepInsideLines(){if(!source||points.length<3)return;const temp=document.createElement('canvas'),t=temp.getContext('2d',{willReadFrequently:true});temp.width=temp.height=720;t.fillStyle='#fff';t.fillRect(0,0,720,720);drawSource(t,1);const pixels=t.getImageData(0,0,720,720),out=mctx.createImageData(720,720);for(let y=0;y<720;y+=2)for(let x=0;x<720;x+=2){const i=(y*720+x)*4;if(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2]<620){for(let oy=0;oy<3;oy++)for(let ox=0;ox<3;ox++){const px=x+ox,py=y+oy;if(px<720&&py<720){const k=(py*720+px)*4;out.data[k]=out.data[k+1]=out.data[k+2]=255;out.data[k+3]=255}}}}mctx.clearRect(0,0,720,720);mctx.putImageData(out,0,0);if(denseOutline.length>1){mctx.save();mctx.globalCompositeOperation='destination-out';mctx.strokeStyle='#000';mctx.lineWidth=16;mctx.lineCap='round';mctx.lineJoin='round';mctx.beginPath();denseOutline.forEach((p,i)=>i?mctx.lineTo(p.x,p.y):mctx.moveTo(p.x,p.y));mctx.closePath();mctx.stroke();mctx.restore()}$('status').textContent='Alle binnenlijnen zijn bewaard; alleen de echte buitenomtrek is weggehaald. Gebruik het fijne penseel voor kleine correcties.';save();render()}

  function selectedDetailsCanvas(){const c=document.createElement('canvas'),x=c.getContext('2d',{willReadFrequently:true});c.width=c.height=720;drawSource(x,1);x.globalCompositeOperation='destination-in';x.drawImage(mask,0,0);x.globalCompositeOperation='source-over';const image=x.getImageData(0,0,720,720),d=image.data;for(let i=0;i<d.length;i+=4){const darkness=255-(d[i]+d[i+1]+d[i+2])/3;if(d[i+3]&&darkness>28){d[i]=24;d[i+1]=47;d[i+2]=67;d[i+3]=Math.round(d[i+3]*Math.min(1,(darkness-28)/55))}else d[i+3]=0}x.putImageData(image,0,0);return c}
  function render(){ectx.clearRect(0,0,720,720);ectx.fillStyle='#fff';ectx.fillRect(0,0,720,720);const editingDetails=mode==='keep'||mode==='erase';drawSource(ectx,editingDetails?0.38:0.12);ectx.drawImage(selectedDetailsCanvas(),0,0);if(editingDetails){const overlay=document.createElement('canvas'),ox=overlay.getContext('2d');overlay.width=overlay.height=720;ox.fillStyle='#00c86b';ox.fillRect(0,0,720,720);ox.globalCompositeOperation='destination-in';ox.drawImage(mask,0,0);ectx.save();ectx.globalAlpha=.95;ectx.drawImage(overlay,0,0);ectx.restore()}if(points.length){ectx.strokeStyle='#2689d1';ectx.lineWidth=3;ectx.lineJoin='round';ectx.beginPath();points.forEach((p,i)=>i?ectx.lineTo(p.x,p.y):ectx.moveTo(p.x,p.y));if($('closedPath').checked)ectx.closePath();ectx.stroke();points.forEach((p,i)=>{const selected=i===selectedPoint||i===drag;ectx.fillStyle=selected?'#ffbf47':'#fff';ectx.strokeStyle=selected?'#b86500':'#2773aa';ectx.lineWidth=selected?3:2;ectx.beginPath();ectx.arc(p.x,p.y,selected?9:7,0,Math.PI*2);ectx.fill();ectx.stroke()})}renderWorksheet()}
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
