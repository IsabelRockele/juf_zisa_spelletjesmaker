(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const stories=[
    {text:'Op vrijdag vertrekt Noor op kamp. Op maandag komt ze weer thuis.',question:'Hoeveel nachten blijft Noor op kamp?',answer:'3 nachten. Vrijdag → zaterdag → zondag → maandag.'},
    {text:'Het is zaterdag. Over 4 nachten komt de poppenkast naar onze school.',question:'Op welke dag komt de poppenkast?',answer:'Woensdag. Zaterdag → zondag → maandag → dinsdag → woensdag.'},
    {text:'Het is dinsdag. Drie dagen geleden bakte Amir koekjes.',question:'Op welke dag bakte Amir koekjes?',answer:'Zaterdag. Tel terug: dinsdag → maandag → zondag → zaterdag.'}
  ];
  let index=0,revealed=false,pointer=null,path=null;
  const notes=stories.map(()=>[]),paper=$('story-paper'),ink=$('story-ink');
  const week=$('quiz-week').cloneNode(true);week.removeAttribute('id');week.removeAttribute('hidden');$('story-week').append(week);
  function render(){const story=stories[index];$('story-index').textContent=`Verhaaltje ${index+1} van ${stories.length}`;$('story-text').textContent=story.text;$('story-question').textContent=story.question;$('story-answer').textContent=revealed?story.answer:'';$('story-reveal').textContent=revealed?'Verberg antwoord':'Toon antwoord';ink.replaceChildren();notes[index].forEach(d=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);ink.append(p);});$('story-undo').disabled=!notes[index].length;}
  function next(delta){index=(index+delta+stories.length)%stories.length;revealed=false;render();}
  $('story-prev').onclick=()=>next(-1);$('story-next').onclick=()=>next(1);$('story-reveal').onclick=()=>{revealed=!revealed;render();};
  $('story-help').onclick=()=>{const show=$('story-week').hidden;$('story-week').hidden=!show;$('stories').classList.toggle('with-help',show);$('story-help').setAttribute('aria-expanded',String(show));$('story-help').textContent=show?'Verberg weekkring':'Toon weekkring';};
  function point(event){const p=paper.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(paper.getScreenCTM().inverse());}
  paper.addEventListener('pointerdown',event=>{if(event.button!==0||pointer!==null)return;event.preventDefault();pointer=event.pointerId;paper.setPointerCapture(pointer);const p=point(event);path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M${p.x} ${p.y}l.1 .1`);ink.append(path);});
  paper.addEventListener('pointermove',event=>{if(pointer!==event.pointerId||!path)return;event.preventDefault();const p=point(event);path.setAttribute('d',path.getAttribute('d')+`L${p.x} ${p.y}`);});
  function end(event){if(pointer!==event.pointerId)return;if(path)notes[index].push(path.getAttribute('d'));pointer=null;path=null;$('story-undo').disabled=!notes[index].length;}
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>paper.addEventListener(name,end));
  $('story-undo').onclick=()=>{notes[index].pop();render();};$('story-clear').onclick=()=>{notes[index]=[];render();};render();
})();
