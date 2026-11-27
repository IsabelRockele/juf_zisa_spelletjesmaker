// Zelfstandige papieren leesactiviteiten in de eigen Leesbooster-opmaak.
window.LeesbundelExtraSpellen={
  moodFace(i){
    const mouths=['M20 34 Q32 48 44 34','M27 36 a5 7 0 1 0 10 0 a5 7 0 1 0 -10 0','M22 42 Q32 34 42 42','M22 42 Q32 30 42 42','M22 35 Q32 43 42 35','M25 39 Q32 30 39 39 Q32 45 25 39'];
    const brows=['M18 21 Q22 18 26 21 M38 21 Q42 18 46 21','M18 18 L26 16 M38 16 L46 18','M18 20 L27 24 M37 24 L46 20','M18 22 L27 18 M37 18 L46 22','M18 21 L26 21 M38 21 L46 21','M18 19 L27 22 M37 22 L46 19'];
    return '<svg class="mood-face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#fff8df" stroke="currentColor" stroke-width="2"/><g fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"><path d="'+brows[i]+'"/><path d="'+mouths[i]+'"/></g><g fill="currentColor"><circle cx="23" cy="28" r="2.5"/><circle cx="41" cy="28" r="2.5"/></g>'+(i===3?'<path d="M45 33 Q38 43 45 45 Q52 43 45 33" fill="#78b5ce"/>':'')+'</svg>';
  },
  slingers(words){return Array.from({length:3},(_,i)=>words.slice(i*4,i*4+4));},
  render({included,selected,words,page,writing,escape,start}){
    let number=start,html='';
    if(included.includes('emotion')){
      const moods=['Blij','Verbaasd','Boos','Verdrietig','Trots','Bang'];
      html+=page(++number,'Het leestheater',`<p class="game-badge">MET TWEE · STEMMEN RADEN</p><p class="instruction">Kies in het geheim een kaart. Lees de vier woorden met het gevoel op de kaart. Je maatje raadt het gevoel. Wissel daarna van rol. Spreek duidelijk; schreeuwen hoeft niet.</p><div class="theatre-cards">${moods.map((m,i)=>`<section class="mood-card mood-${i}"><h3>${this.moodFace(i)}<span class="mood-title"><small>SPEELKAART ${i+1}</small>${m}</span><span class="stage-star" aria-hidden="true">★</span></h3><div>${Array.from({length:4},(_,j)=>`<p>${escape(words[(i*4+j)%words.length])}</p>`).join('')}</div><p class="played"><span><i></i> gespeeld</span><span><i></i> geraden</p></section>`).join('')}</div><div class="repeats"><b>De slotvoorstelling</b><br>Kies één woord. Bedenk samen een korte zin met dat woord. Lees dezelfde zin met twee verschillende gevoelens.</div>`);
    }
    if(included.includes('ribbon')){
      const rows=this.slingers(words);
      html+=page(++number,'De woordenslingers',`<p class="game-badge">ALLEEN · LEZEN EN ONTRAFELEN</p><p class="instruction">In elke slinger zitten vier woorden aan elkaar. Zet een streep tussen de woorden. Lees de vier woorden hardop. Schrijf rechts naast elke slinger het langste woord op. Zijn er twee even lang? Kies er één.</p><div class="word-ribbons">${rows.map((row,i)=>`<section><h3><span class="ribbon-number">${i+1}</span> Ontrafel de slinger <small>4 woorden</small></h3><div class="ribbon-task"><div class="ribbon-text">${escape(row.join(''))}</div><div class="ribbon-answer"><b>Het langste woord</b>${writing()}</div></div></section>`).join('')}</div><h3>Maak je eigen slinger</h3><p>Kies drie woorden uit de woordrijtjes. Schrijf ze hier aan elkaar. Laat je maatje de woorden scheiden en voorlezen.</p>${writing()}`);
    }
    if(included.includes('truefalse')&&selected.statements){
      html+=page(++number,'De verhaaldetective',`<p class="game-badge">ALLEEN · BEWIJS ZOEKEN</p><p class="instruction">Lees <b>${escape(selected.storyTitle)}</b> nog eens. Klopt de zin met het verhaal? Kleur de grote cirkel bij waar of niet waar. Zoek bij elke zin het bewijs in de tekst.</p><div class="detective-cards">${selected.statements.map(([text],i)=>`<section><b>${i+1}</b><p>${escape(text)}</p><div class="truth-choices"><span><i></i>waar</span><span><i></i>niet waar</span></div></section>`).join('')}</div><h3>Maak het weer waar</h3><p>Kies twee zinnen die niet waar zijn. Schrijf ze zo dat ze wel bij het verhaal passen.</p>${writing(2)}`);
    }
    if(included.includes('wordbuilder')&&selected.wordParts){
      const chosen=selected.columns.map(c=>c.words[0]);
      const endings=[...chosen].reverse().map(w=>selected.wordParts[w][1]);
      html+=page(++number,'Woordbouwers',`<p class="game-badge">ALLEEN · BOUW EN LEES</p><p class="instruction">Maak bij elk beginstuk een bestaand samengesteld woord. Kies een passend eindstuk uit het vak hieronder. Gebruik elk eindstuk één keer. Schrijf het eindstuk in het lege vak en het hele woord op de schrijflijn. Lees je woord hardop.</p><div class="builder-endings"><b>Eindstukken:</b> ${endings.map(escape).join(' · ')}</div><div class="compound-builders">${chosen.map((w,i)=>`<section><h3>${i+1}. <span>${escape(selected.wordParts[w][0])}</span> + <span class="part-space"></span></h3>${writing()}</section>`).join('')}</div><h3>Bedenk zelf een nieuw samengesteld woord</h3><p>Bedenk een samengesteld woord dat nog niet in deze bundel staat. Schrijf het eerste losse woord links en het tweede losse woord rechts. Lees de twee woorden daarna samen als één woord.</p><div class="split-word"><div><b>Eerste woord</b>${writing()}</div><span aria-label="plus">+</span><div><b>Tweede woord</b>${writing()}</div></div>`);
    }
    return {html,number};
  },
  answers({included,selected,words,escape}){
    let html='';
    if(included.includes('ribbon'))html+=`<h3>Woordenslingers</h3><ol class="answer-list">${this.slingers(words).map(row=>`<li>${row.map(escape).join(' | ')}<br>Langste: ${row.filter(w=>w.length===Math.max(...row.map(w=>w.length))).map(escape).join(' of ')}</li>`).join('')}</ol><p>Eigen slinger: eigen antwoord.</p>`;
    if(included.includes('truefalse')&&selected.statements)html+=`<h3>De verhaaldetective</h3><ol class="answer-list">${selected.statements.map(([,correct,fix])=>`<li>${correct?'Waar.':'Niet waar. '+escape(fix)}</li>`).join('')}</ol><p>Bij het herschrijven zijn andere juiste formuleringen ook goed.</p>`;
    if(included.includes('wordbuilder')&&selected.wordParts)html+='<h3>Woordbouwers · mogelijke antwoorden</h3><p>'+selected.columns.map(c=>{const w=c.words[0];return selected.wordParts[w].map(escape).join(' + ')+' = '+escape(w);}).join('<br>')+'</p><p>Andere bestaande samenstellingen zijn ook goed als elk eindstuk één keer gebruikt is. Eigen samengesteld woord: eigen antwoord. Controleer of het woord nog niet in de bundel staat en of de twee losse woorden samen een bestaand samengesteld woord vormen.</p>';
    return html;
  }
};
