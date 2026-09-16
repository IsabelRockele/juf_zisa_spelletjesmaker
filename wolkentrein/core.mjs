export const MODES={ten:'Tot 10',twenty:'Tot 20 · zonder brug',bridge:'Tot 20 · met brug',all:'Tot 20 · alles'};
export function pool(mode='ten',operation='mix'){
 const out=[];for(const op of ['+','−']){if(operation==='add'&&op!=='+'||operation==='sub'&&op!=='−')continue;for(let a=0;a<=20;a++)for(let b=1;b<=9;b++){const answer=op==='+'?a+b:a-b;if(answer<0||answer>20)continue;const crossing=op==='+'?a<10&&answer>10:a>10&&answer<10;
 if(mode==='ten'&&(a>10||answer>10))continue;if(mode==='twenty'&&(a<10&&answer<10||crossing))continue;if(mode==='bridge'&&!crossing)continue;
 out.push({id:`${a}${op}${b}`,a,b,op,answer});}}
 return out;
}
export function shuffle(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
export function chooseNext(questions,history,index,recent=[],retry=[],random=Math.random){const due=retry.find(x=>x.at<=index&&!recent.slice(-2).includes(x.id));if(due){retry.splice(retry.indexOf(due),1);const q=questions.find(q=>q.id===due.id);if(q)return {...q};}
 const eligible=questions.filter(q=>!recent.slice(-4).includes(q.id));const candidates=eligible.length?eligible:questions;const ranked=shuffle(candidates,random).map(q=>{const h=history[q.id];let weight=!h?5:h.lastWrong?9:Math.max(1,6-h.fluent);if(h&&Date.now()-h.lastSeen>86400000)weight+=3;return {q,rank:random()*weight}}).sort((a,b)=>b.rank-a.rank);return {...ranked[0].q};}
export function record(history,q,{wrong,helped,seconds},today=new Date().toLocaleDateString('sv-SE')){const h=history[q.id]||{seen:0,correct:0,fluent:0,days:[],lastSeen:0};h.seen++;const independent=!wrong&&!helped;if(independent)h.correct++;const quick=independent&&seconds<=6;if(quick){h.fluent++;if(!h.days.includes(today))h.days.push(today);}h.lastWrong=!!wrong;h.lastSeen=Date.now();history[q.id]=h;return {independent,quick,known:h.days.length>=3&&h.fluent>=3};}
export function explanation(q){const {a,b,op,answer}=q;if(op==='+'){if(a<10&&answer>10)return `${a} + ${10-a} = 10. Dan nog ${b-(10-a)} erbij: ${answer}.`;return `Begin met ${a}. Doe er ${b} bij. Samen ${answer}.`;}if(a>10&&answer<10)return `${a} − ${a-10} = 10. Dan nog ${b-(a-10)} eraf: ${answer}.`;return `Begin met ${a}. Haal er ${b} weg. Er blijven ${answer} over.`;}
