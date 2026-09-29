/* Pure game rules, shared by the UI and the local checks. */
(function (root) {
  'use strict';
  const shuffle = (values, random = Math.random) => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const jumble = (values, random = Math.random) => {
    const result=shuffle(values,random);
    if(result.join('')===values.join('')) {
      const other=result.findIndex(v=>v!==result[0]);
      if(other>0)[result[0],result[other]]=[result[other],result[0]];
    }
    return result;
  };
  const normalize = value => value.normalize('NFC').trim().toLocaleLowerCase('nl').replace(/\s+/g, ' ');
  const target = (cat, word) => cat.transform ? word[cat.transform] : word.word;
  function makeQueue(categories, count, random = Math.random, recent = []) {
    if (!categories.length || categories.length > count) throw Error('Kies minstens één categorie en minstens evenveel opdrachten als categorieën.');
    const order = shuffle(categories, random), used = new Map();
    const history = new Map(recent.map((word,i)=>[normalize(word),i+1]));
    const queue=Array.from({length: count}, (_, index) => {
      let cat = order[index % order.length];
      if(cat.words.every(w=>used.has(normalize(w.word)))) {
        const fresh=order.find(c=>c.words.some(w=>!used.has(normalize(w.word))));
        if(fresh)cat=fresh;
      }
      const candidates=shuffle(cat.words,random).sort((a,b)=>
        (used.get(normalize(a.word))||0)-(used.get(normalize(b.word))||0)||
        (history.get(normalize(a.word))||0)-(history.get(normalize(b.word))||0));
      const word=candidates[0],key=normalize(word.word);
      used.set(key,(used.get(key)||0)+1);
      return {cat, word, repeat: false};
    });
    // Shuffle the selected set too, so a fully practised small pool has a new order.
    const occurrences=new Map();
    return shuffle(queue,random).map(item=>{
      const key=normalize(item.word.word),pass=occurrences.get(key)||0;
      occurrences.set(key,pass+1);return {item,pass};
    }).sort((a,b)=>a.pass-b.pass).map(entry=>entry.item);
  }
  function hint(cat, word) {
    if (cat.ending) return `Maak het woord langer: ${word.long}. Welke letter hoor je vóór de uitgang?`;
    if (cat.id === 'lidwoord') return `Zeg het woord met de en met het. Bij ${word.word} hoort ${word.article}. Onthoud ze samen.`;
    if (cat.transform === 'small') return `Maak het woord klein. Denk aan de uitgangen -je, -tje en -pje. Bij ${word.word} hoort -${word.small.slice(word.word.length)}.`;
    if (cat.transform === 'plural') {
      if (word.plural === word.word + 'en') return 'Het worden er meer. Zet -en achter het woord.';
      if (word.plural === word.word + 's') return 'Het worden er meer. Zet -s achter het woord.';
      if (word.plural === word.word + word.word.slice(-1) + 'en') return 'Je hoort een korte klank. Schrijf de medeklinker dubbel vóór -en.';
      return 'Je hoort een lange klank in een open lettergreep. Schrijf daar één klinker.';
    }
    if (cat.id === 'ei-ij' || cat.id === 'au-ou') {
      const part = cat.choices.find(c => word.word.includes(c));
      return `Dit is een onthoudwoord. Bij ${word.word} schrijf je ${part}. Bekijk het stukje en onthoud het.`;
    }
    if (cat.id === 'cht-gt') return word.word.includes('gt') ? `Denk aan ${word.word === 'ligt' ? 'liggen' : word.word === 'zegt' ? 'zeggen' : word.word === 'legt' ? 'leggen' : word.word === 'veegt' ? 'vegen' : 'vliegen'}. Daar staat een g. Die blijft in ${word.word}.` : `Onthoud het stukje cht in ${word.word}.`;
    if (cat.id === 'ch-g') return `Onthoud dit woord: ${word.word}. Het stukje is ${word.word.includes('ch') ? 'ch' : 'g'}.`;
    if (cat.chunk) return `Luister naar het hele klankstuk. Je schrijft ${cat.chunk}; laat geen letter weg.`;
    if (cat.id === 'kort') return 'Luister langzaam. Je hoort een korte klank: a, e, i, o of u. Schrijf één klinker.';
    if (cat.id === 'lang') return 'Je hoort een lange klank in dit woord: aa, ee, oo of uu.';
    if (cat.id === 'tweeteken') return 'De klank in het midden schrijf je met twee verschillende letters.';
    if (cat.id === 'ng-nk') return 'Zeg het woord langzaam. Hoor je achteraan de k, zoals in bank, of ng, zoals in ring?';
    if (cat.id === 'sch' || cat.id === 'schr') return 'Luister naar het begin. Hoor je na sch ook een r?';
    return 'Zeg het woord langzaam. Luister naar elke medeklinker voor en na de klank.';
  }
  function spellingChoices(cat, word) {
    const chunk = cat.chunk;
    const mistakes = {aai:['ai','aaj'],ooi:['oi','ooj'],oei:['ooi','oej'],eeuw:['eew','eeu'],ieuw:['iew','ieu'],uw:['uuw','u']};
    return [word.word, ...mistakes[chunk].map(part => word.word.replace(chunk, part))];
  }
  function makeExercise(item, mode, index, pairs, random = Math.random, recent = []) {
    const {cat,word}=item, answer=target(cat,word);
    // A delayed repeat always asks for independent production.
    if (mode === 'detective' || item.repeat) return {type:'type',answer};
    if (cat.transform === 'article') return {type:'choice',answer,options:shuffle(['de','het'],random),blank:word.word};
    if (cat.transform) return {type:'shuffle',answer,tokens:jumble([...answer],random)};
    if ((cat.id === 'kort' || cat.id === 'lang') && index % 3 === 0 && pairs.length) {
      const history=new Map(recent.map((word,i)=>[normalize(word),i+1]));
      const score=p=>history.get('zin:'+p.words.slice().sort().join('|'))||0;
      const original=shuffle(pairs,random).sort((a,b)=>score(a)-score(b))[0];
      const order=shuffle([0,1],random),pair={...original,words:order.map(i=>original.words[i]),sentences:order.map(i=>original.sentences[i])};
      return {type:'sentences',answer:pair.words.join('|'),pair,tokens:shuffle(pair.words,random)};
    }
    if (cat.chunk && index % 2 === 0) return {type:'choice',answer,options:shuffle(spellingChoices(cat,word),random)};
    if (cat.choices && index % 3 !== 2) {
      const part=cat.ending?word.word.slice(-1):[...cat.choices].sort((a,b)=>b.length-a.length).find(c=>word.word.includes(c));
      const pos=cat.ending?word.word.length-1:word.word.indexOf(part);
      return {type:'gap',answer:part,options:shuffle(cat.choices,random),blank:word.word.slice(0,pos)+' … '+word.word.slice(pos+part.length)};
    }
    return {type:'shuffle',answer,tokens:jumble([...answer],random)};
  }
  function scheduleRepeat(queue,index,item) {
    if (item.repeat || queue.filter(q=>q.repeat).length>=3) return false;
    // Replace a later word in the same category to keep the category balance.
    const destination=queue.findIndex((q,i)=>i>=index+3&&!q.repeat&&q.cat.id===item.cat.id);
    if(destination<0)return false;
    queue[destination]={...item,repeat:true};return true;
  }
  function repairLetters(typed,answer){
    // Align edits so an extra or missing letter does not mark every later letter wrong.
    const a=[...normalize(typed)],b=[...answer],d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)d[i][0]=i;
    for(let j=0;j<=b.length;j++)d[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    const cells=Array(b.length).fill('');let i=a.length,j=b.length;
    while(i||j){
      if(i&&j&&a[i-1]===b[j-1]&&d[i][j]===d[i-1][j-1]){cells[j-1]=b[j-1];i--;j--;}
      else if(i&&j&&d[i][j]===d[i-1][j-1]+1){i--;j--;}
      else if(i&&d[i][j]===d[i-1][j]+1)i--;else j--;
    }
    // If deleting extras would give the whole answer away, ask for a fresh attempt.
    return cells.every(Boolean)?null:cells;
  }
  root.SpellingEngine={shuffle,normalize,target,makeQueue,hint,spellingChoices,makeExercise,scheduleRepeat,repairLetters};
})(typeof window==='undefined'?globalThis:window);
