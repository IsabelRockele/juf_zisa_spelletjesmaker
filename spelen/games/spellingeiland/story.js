/* Story progression for the detective; the workshop keeps its own construction game. */
(() => {
  const Base=window.SpellingAdventure;
  const chapters=['Het eerste spoor','Over het water','Pip is dichtbij','Samen naar huis'];
  const clues=['Pips sjaaltje! De wind blies het naar de overkant.','Een veertje! Volg het pad naar de hoge bomen.','Pootafdrukken! Dit is de weg naar Pips schuilplaats.'];
  window.SpellingAdventure=class extends Base {
    constructor(options){
      super(options);
      this.storyFound=0;this.storyStep=-1;
      const art=new Image();art.src='assets/pip-verhaal.png';this.images.story=art;art.onload=()=>this.measureStory();
      const pip=new Image();pip.src='assets/pip-beweging.png';this.images.pipCycle=pip;pip.onload=()=>this.measurePip();
      const route=['bridge','bridge','boat','balloon','bridge','boat','bridge','balloon','bridge','boat','balloon','bridge','boat','bridge','balloon','boat','bridge','balloon','boat','bridge'];
      const titles={bridge:'Herstel het pad',chest:'Zoek de aanwijzing',boat:'Volg het spoor over water',gate:'Open het bospad',balloon:'Kijk boven de bomen'};
      this.gates.forEach((g,i)=>{g.type=route[i];g.title=titles[g.type];});
      this.gates[this.count-1].type='bridge';this.gates[this.count-1].title='Maak het pad naar Pip';
      const map=document.createElement('div');map.id='story-map';map.setAttribute('aria-label','De route naar Pip');
      map.innerHTML='<span>Zoek Pip</span><div>'+Array.from({length:4},(_,i)=>'<i data-story-stop="'+i+'">'+(i+1)+'</i>').join('<b>—</b>')+'</div>';
      this.root.append(map);this.storyMap=map;
      this.message('Pip is verdwaald! Zoek zijn spullen en volg het spoor.');
    }
    measureStory(){
      this.storyRects=[[0,0,512,480],[512,0,512,480],[1024,0,512,480],[0,480,512,520],[512,480,512,520],[1024,512,512,512]];
      this.storyRects=this.trimRects(this.images.story,this.storyRects);
    }
    trimRects(im,rects){
      const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const cx=cv.getContext('2d');cx.drawImage(im,0,0);const d=cx.getImageData(0,0,cv.width,cv.height).data;
      return rects.map(([x,y,w,h])=>{let l=x+w,r=x,t=y+h,b=y;for(let py=y;py<Math.min(y+h,cv.height);py++)for(let px=x;px<Math.min(x+w,cv.width);px++)if(d[(py*cv.width+px)*4+3]>80){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}return[l,t,r-l+1,b-t+1];});
    }
    measurePip(){const im=this.images.pipCycle;this.pipRects=this.trimRects(im,Array.from({length:8},(_,i)=>[(i%4)*im.naturalWidth/4,Math.floor(i/4)*im.naturalHeight/2,im.naturalWidth/4,im.naturalHeight/2]));}
    storySprite(cell,x,y,w,h){
      const im=this.images.story,r=this.storyRects?.[cell];if(!r)return;
      const scale=Math.min(w/r[2],h/r[3]);this.ctx.drawImage(im,...r,x-r[2]*scale/2,y-r[3]*scale,r[2]*scale,r[3]*scale);
    }
    image(key,x,y,w,h,flip=false){
      if(key==='zisa'&&this.images.cycle?.complete){
        const poses=[[50,50,377,465],[447,63,759,463],[813,53,1134,465],[1198,56,1519,440],[66,537,345,962],[453,513,719,881]];
        const t=this.finishTime,frame=this.finaleFrame??4,r=poses[frame],sw=r[2]-r[0],sh=r[3]-r[1],size=h/425;
        this.ctx.drawImage(this.images.cycle,r[0],r[1],sw,sh,x-sw*size/2,y-sh*size,sw*size,sh*size);return;
      }
      if(key!=='pip'||!this.pipRects)return super.image(key,x,y,w,h,flip);
      const frame=this.pipPose??(Math.floor(this.time*1.5)%3===0?5:4);
      const r=this.pipRects[frame],size=h/this.pipRects[4][3],c=this.ctx;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(this.images.pipCycle,...r,-r[2]*size/2,-r[3]*size,r[2]*size,r[3]*size);c.restore();
    }
    drawStoryScenery(){
      const goal=this.count*620+190;
      this.storySprite(3,goal,410,220,220);
      if(this.done===this.count)this.image('pip',goal-8,410,70,85,true);
      else this.storySprite(5,goal+Math.sin(this.time*5)*2,410,145,90);

    }
    solve(word){
      super.solve(word);
      if(this.done===this.count){this.message('Het pad is klaar! Ga naar Pip.');this.burst(this.count*620+190,320,45);}
    }
    update(dt){
      if(this.phase==='finale'){
        this.finishTime+=dt;this.pressed.clear();this.root.querySelector('.world-controls').hidden=true;
        const t=this.finishTime,step=t<2?0:t<4.4?1:t<9.4?2:3;
        if(step!==this.storyStep){this.storyStep=step;this.message(['Pip! Daar ben je. Kom, we gaan naar huis.','Stap maar in, Pip. Zisa gaat met je mee.','Samen varen we terug naar huis.','Thuis! Pip is weer veilig. Dank je wel!'][step]);this.root.querySelector('#world-place').textContent=chapters[3];this.storyMap.querySelector('span').textContent=step===3?'Pip is thuis!':'Pip gevonden!';this.storyMap.querySelectorAll('i').forEach(e=>e.classList.add('found'));}
        if(t>14){this.phase='complete';this.onFinish();}return;
      }
      super.update(dt);
      if(this.collected.size!==this.storyFound){
        this.storyFound=this.collected.size;
        const i=Math.max(...this.collected);this.message(clues[Math.min(i,2)]);this.storyMap.querySelector('span').textContent=this.gates[i]?.title||'Naar Pip';
        this.storyMap.querySelectorAll('i').forEach((e,n)=>e.classList.toggle('found',n<Math.ceil(this.storyFound/this.count*3)));
      }
      if(this.phase==='explore'){
        if(this.done===this.count){this.action.textContent='Samen naar huis';this.message('Daar is Pip! Tik op Samen naar huis.');}
        const chapter=Math.min(2,Math.floor(this.done/this.count*3));this.root.querySelector('#world-place').textContent=chapters[chapter];
        if(this.done>=this.count-2&&!this.heardPip&&this.x>this.gates[this.count-2].x-220){this.heardPip=true;this.message('Hoor je Pip? Hij zit bij de holle boom!');this.tone(880);setTimeout(()=>{if(!this.destroyed)this.tone(660);},220);}
      }
    }
    draw(){
      if(this.phase==='finale'){this.drawHome();return;}
      // The old parchment collectibles are replaced by useful, varied clues.
      const finds=this.images.finds;this.images.finds=null;
      // Base renderer expects an image object even when it has not loaded.
      this.images.finds={complete:false};super.draw();this.images.finds=finds;
      const c=this.ctx;c.save();c.scale(this.scale,this.scale);c.translate(-this.camera,(this.vh-600)*.45);
      this.items.forEach((p,i)=>{
        if(!this.collected.has(i))this.storySprite(Math.min(i,2),p.x,p.y+32+Math.sin(this.time*2)*4,72,72);
        else if(i===this.done){c.fillStyle='#fff4be';c.font='bold 35px Trebuchet MS';c.fillText('→',p.x+70,395);}
      });
      c.restore();
    }
    finaleState(t){
      const end=this.vw-260,u=Math.max(0,Math.min(1,(t-4.4)/5)),boatX=280+(end-280)*u;
      const board=(from,to,start,end,seatedEnd)=>{const p=Math.max(0,Math.min(1,(t-start)/(end-start)));return{x:from+(to-from)*p,y:410+(seatedEnd-410)*p-48*Math.sin(Math.PI*p),air:p>0&&p<1};};
      let z={x:135,y:410,air:false,seated:false},p={x:80,y:410,air:false,seated:false};
      if(t>=2&&t<3.2)z=board(135,248,2,3.2,440);
      else if(t>=3.2)z={x:boatX-32,y:440,seated:true};
      if(t>=3.2&&t<4.4)p=board(80,325,3.2,4.4,434);
      else if(t>=4.4)p={x:boatX+45,y:434,seated:true};
      if(t>=9.4&&t<10.6){z=board(end-32,this.vw-160,9.4,10.6,410);z.y=440+(410-440)*Math.min(1,(t-9.4)/1.2)-48*Math.sin(Math.PI*Math.min(1,(t-9.4)/1.2));}
      else if(t>=10.6)z={x:this.vw-160,y:410};
      if(t>=10.6&&t<11.8){p=board(end+45,this.vw-80,10.6,11.8,410);p.y=434+(410-434)*Math.min(1,(t-10.6)/1.2)-42*Math.sin(Math.PI*Math.min(1,(t-10.6)/1.2));}
      else if(t>=11.8)p={x:this.vw-80,y:410};
      return{boatX,z,p};
    }
    drawHome(){
      const c=this.ctx,t=this.finishTime,W=this.w,H=this.h;c.clearRect(0,0,W,H);
      const bg=this.images.background;if(bg.complete){const s=Math.max(W/bg.naturalWidth,H/bg.naturalHeight);c.drawImage(bg,(W-bg.naturalWidth*s)/2,(H-bg.naturalHeight*s)/2,bg.naturalWidth*s,bg.naturalHeight*s);}
      c.save();c.scale(this.scale,this.scale);c.translate(0,(this.vh-600)*.45);
      const {boatX,z,p}=this.finaleState(t),ground=this.images.platform;
      if(ground.complete){c.drawImage(ground,-140,378,330,100);c.drawImage(ground,this.vw-220,378,360,100);}
      this.storySprite(4,this.vw-115,410,195,215);
      this.image('boat',boatX,475,250,155);
      if(z.seated){const im=this.images.sitting;if(im.complete)c.drawImage(im,boatX-78,280,107.52,161.28);}
      else{this.finaleFrame=z.air?5:4;this.image('zisa',z.x,z.y,95,130);}
      this.pipPose=p.seated?6:p.air?7:t>=11.8?5:4;
      this.image('pip',p.x,p.y,65,85,t>=11.8);
      // Only passengers are occluded by the hull; landing characters stay in front.
      if(z.seated||p.seated){c.save();c.beginPath();c.rect(boatX-130,400,260,85);c.clip();this.image('boat',boatX,475,250,155);c.restore();}
      this.finaleFrame=undefined;this.pipPose=undefined;c.restore();
    }
  };
})();
