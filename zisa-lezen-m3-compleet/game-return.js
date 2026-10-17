// Return to the same access mode and reading level.
(()=>{const storyId=location.pathname.endsWith('boot-stil.html')?'e4-sint-rust':location.hash.slice(1);const level=storyId.split('-')[0].toUpperCase();if(!['E3','M4','E4'].includes(level))return;
 const url=new URL('index.html',location.href);const params=new URLSearchParams(location.search);for(const key of ['gratis','ontdek','teacher','code','methode'])if(params.has(key))url.searchParams.set(key,params.get(key));url.searchParams.set('niveau',level);
 const booksUrl=url.href;url.searchParams.set('verhaal',storyId);const storyUrl=url.href;
 const header=document.querySelector('header a');header.textContent='‹ Boekjes '+level;header.href=booksUrl;
 const win=document.querySelector('#win');win.querySelector('button').textContent='Opnieuw spelen';const back=win.querySelector('a');back.textContent='Terug naar boekjes '+level;back.href=booksUrl;
 const story=document.createElement('a');story.textContent='Terug naar verhaal';story.href=storyUrl;win.append(story);
})();
