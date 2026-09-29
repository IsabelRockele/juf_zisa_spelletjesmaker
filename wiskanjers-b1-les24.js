(() => {
  'use strict';
  const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
  const node=(tag,attrs={},text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  const result=e=>e.op==='+'?e.a+e.b:e.a-e.b;
  function category(e){const bridge=e.op==='+'?e.a<10&&result(e)>10:e.a>10&&e.a<20&&e.b<10&&result(e)<10;return (e.op==='+'?'plus':'minus')+(bridge?'-bridge':'-plain');}
  const sum=(a,op,b)=>({a,op,b});
  const sums=[sum(9,'+',7),sum(17,'−',9),sum(12,'+',4),sum(18,'−',3),sum(8,'+',5),sum(14,'−',6),sum(10,'+',8),sum(16,'−',10),sum(7,'+',6),sum(13,'−',7),sum(6,'+',9),sum(15,'−',8),sum(11,'+',6),sum(19,'−',13),sum(5,'+',8),sum(12,'−',5),sum(20,'−',6),sum(20,'−',13),sum(14,'+',3),sum(18,'−',16),sum(4,'+',9),sum(11,'−',4),sum(20,'−',15),sum(10,'+',6)];
  const missing=[{a:14,op:'−',b:5,hole:'b'},{a:13,op:'−',b:4,hole:'a'},{a:6,op:'+',b:9,hole:'b'},{a:7,op:'+',b:8,hole:'a'},{a:18,op:'−',b:12,hole:'r',reverse:true},{a:8,op:'+',b:6,hole:'a',reverse:true},{a:20,op:'−',b:11,hole:'b'},{a:16,op:'−',b:7,hole:'a',reverse:true},{a:4,op:'+',b:9,hole:'r',reverse:true},{a:17,op:'−',b:8,hole:'b',reverse:true},{a:9,op:'+',b:3,hole:'a'},{a:15,op:'−',b:6,hole:'b'}];
  const stories=[{text:'In de tuin staan 3 rode en 4 gele bloemen. Noor plant er 5 witte en 2 paarse bloemen bij. Hoeveel bloemen staan er nu in de tuin?',equation:'3 + 4 + 5 + 2',answer:14,prefix:'Er staan',suffix:'bloemen in de tuin.',steps:['Tel eerst de rode en gele bloemen: 3 + 4 = 7.','Tel de nieuwe bloemen: 5 + 2 = 7.','Tel samen: 7 + 7. Splits de tweede 7 in 3 en 4.','7 + 3 = 10. Dan 10 + 4 = 14.'],work:['3 + 4 = 7','5 + 2 = 7','7 + 7 = 7 + 3 + 4','10 + 4 = 14']},{text:'Er zitten 18 kinderen in de turnzaal. Er gaan 11 kinderen naar de speelplaats. Hoeveel kinderen blijven in de turnzaal?',equation:'18 − 11',answer:7,prefix:'Er blijven',suffix:'kinderen in de turnzaal.',steps:['Wat weten we? Er zijn 18 kinderen. Er gaan er 11 weg.','Splits 11 in 10 en 1.','Neem eerst 10 weg: 18 − 10 = 8.','Neem nog 1 weg: 8 − 1 = 7.'],work:['18 − 11','11 = 10 + 1','18 − 10 = 8','8 − 1 = 7']}];
  let mode='sums',filter='mixed',list=[...sums],index=0,step=0,reveal=false,showSteps=false,custom=null;
  const current=()=>custom||list[index];
  const guides=$('guides'),ink=$('ink'),paper=$('paper');
  const text=(x,y,value,size=48,color='#243b45',anchor='middle')=>guides.append(node('text',{x,y,'font-size':size,fill:color,'text-anchor':anchor,'font-family':'Nunito,Arial', 'font-weight':700},value));
  const line=(x1,y1,x2,y2,color='#bcced0',width=2)=>guides.append(node('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width}));
  function plan(e){
    if(category(e).endsWith('-bridge'))return {steps:[
      'Teken splitsbenen.',
      'Maak eerst 10. Groene kring + 10.',
      'Splits.',
      e.op==='+'?'10 + ___ =':'10 − ___ ='
    ]};
    if(e.op==='−'&&e.b>10)return {steps:['Splits het tweede getal in een tiental en eenheden.','Trek eerst het tiental af. Schrijf de tussenstap.','Trek daarna de eenheden af.','Vul je antwoord in en controleer.']};
    return {steps:['Kijk naar het bewerkingsteken: komt er iets bij of gaat er iets af?','Reken met de tientallen en de eenheden.','Schrijf een tussenstap als dat helpt.','Vul je antwoord in en controleer.']};
  }
  function draw(){paper.setAttribute('viewBox',mode==='sums'?'0 0 1200 480':'0 0 1000 480');guides.replaceChildren();const e=current();let instructions=[];
    if(mode==='stories'){
      $('story-question').hidden=false;$('story-question').textContent=e.text;instructions=['Lees het verhaal. Wat weet je al en wat moet je zoeken?','Welke getallen heb je nodig? Kies de passende bewerking(en).','Reken uit. Noteer tussenstappen als dat helpt.','Vul de antwoordzin in en lees ze na.'];
      text(35,38,'Bewerkingen',25,'#60746b','start');line(35,135,965,135);line(35,245,965,245);text(35,300,'Antwoordzin',25,'#60746b','start');text(35,385,e.prefix,29,'#243b45','start');line(225,400,355,400);text(380,385,e.suffix,29,'#243b45','start');
      if(reveal){text(500,105,e.equation+' = '+e.answer,38,'#258446');text(290,385,e.answer,42,'#258446');}
    }else{
      $('story-question').hidden=true;const r=result(e);
      if(mode==='missing'){
        const values={a:e.a,b:e.b,r};const tokens=e.reverse?['r','=','a',e.op,'b']:['a',e.op,'b','=','r'];tokens.forEach((key,i)=>{const x=180+i*160;if(key===e.hole&&!reveal)line(x-55,128,x+55,128);else text(x,115,values[key]??key,65,key===e.hole?'#258446':'#243b45');});
        instructions=['Welke plaats is leeg? Wat vertellen de andere getallen je?','Welke bewerking helpt je het ontbrekende getal te vinden? Denk aan de omgekeerde bewerking.','Noteer je berekening op de schrijflijnen.','Vul je getal in en controleer of beide kanten van het gelijkteken evenveel zijn.'];line(130,325,870,325);line(130,430,870,430);
      }else{
        const p=plan(e);instructions=p.steps;line(650,240,1170,240);line(650,375,1170,375);text(240,100,e.a,68);text(365,100,e.op,62);text(500,100,e.b,68);text(655,100,'=',62);if(reveal)text(860,100,r,68,'#258446');else line(740,115,980,115);
      }
    }
    $('progress').textContent=custom?'Eigen bewerking':`Oefening ${index+1} van ${list.length}`;$('step-instruction').replaceChildren();instructions.forEach(instruction=>{const li=document.createElement('li');li.textContent=instruction;$('step-instruction').append(li);});$('answer').textContent=reveal?'Verberg antwoord':'Toon antwoord';$('kind').hidden=mode!=='sums';$('custom').hidden=mode!=='sums';$('shuffle').hidden=mode==='stories';$('toggle-steps').setAttribute('aria-pressed',String(showSteps));$('toggle-steps').textContent=showSteps?'Stappenplan verbergen':'Stappenplan tonen';document.querySelector('.lesson-work').classList.toggle('show-steps',showSteps);
  }
  let color='#243b45',erase=false,pointer=null,path=null,versions=[];
  function fresh(){step=0;reveal=false;ink.replaceChildren();versions=[];draw();}
  function selectList(){custom=null;list=mode==='sums'?sums.filter(e=>filter==='mixed'||category(e)===filter):mode==='missing'?[...missing]:[...stories];index=0;fresh();}
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));selectList();});$('kind').onchange=()=>{filter=$('kind').value;selectList();};
  function next(d){custom=null;index=(index+d+list.length)%list.length;fresh();}$('previous').onclick=()=>next(-1);$('next').onclick=()=>next(1);$('shuffle').onclick=()=>{custom=null;for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}index=0;fresh();};$('reset').onclick=fresh;
  $('toggle-steps').onclick=()=>{showSteps=!showSteps;draw();};$('answer').onclick=()=>{reveal=!reveal;draw();};
  $('custom-form').onsubmit=e=>{e.preventDefault();const exercise=sum(Number($('custom-a').value),$('custom-op').value,Number($('custom-b').value));if(!Number.isInteger(exercise.a)||!Number.isInteger(exercise.b)||exercise.a<0||exercise.b<0||exercise.a>20||exercise.b>20||result(exercise)<0||result(exercise)>20){$('custom-error').textContent='Kies een bewerking met getallen en een uitkomst van 0 tot 20.';return;}$('custom-error').textContent='';custom=exercise;$('custom').open=false;fresh();};
  function selectPen(){document.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(!erase&&color===b.dataset.color)));$('eraser').setAttribute('aria-pressed',String(erase));}document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;erase=false;selectPen();});$('eraser').onclick=()=>{erase=!erase;selectPen();};
  function point(e){const p=paper.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(paper.getScreenCTM().inverse());}function rub(p){for(const n of [...ink.children])for(let d=0;d<=n.getTotalLength();d+=5){const q=n.getPointAtLength(d);if(Math.hypot(p.x-q.x,p.y-q.y)<15){n.remove();break;}}}
  paper.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;paper.setPointerCapture(pointer);versions.push(ink.innerHTML);if(versions.length>100)versions.shift();const p=point(e);if(erase)rub(p);else{path=node('path',{d:`M${p.x} ${p.y}l.1 .1`,stroke:color,'stroke-width':4});ink.append(path);}});paper.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const p=point(e);if(erase)rub(p);else path.setAttribute('d',path.getAttribute('d')+`L${p.x} ${p.y}`);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>paper.addEventListener(type,()=>{pointer=null;path=null;}));$('undo').onclick=()=>{if(versions.length)ink.innerHTML=versions.pop();};$('clear').onclick=()=>{versions.push(ink.innerHTML);ink.replaceChildren();};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('message').textContent='Gebruik eventueel F11.';}};draw();
})();