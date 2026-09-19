/* Recognizable grayscale illustrations for tracing parallel lines. */
(() => {
  const imageUrl=new URL('lijnen/evenwijdige-figuren.png',document.currentScript.src).href;
  const style=document.createElement('style');
  style.textContent=`.parallel-picture{position:relative;width:100%;aspect-ratio:3 / 2;margin:4mm 0 0}.parallel-picture img{display:block;width:100%;height:100%;object-fit:contain}.parallel-picture svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.parallel-picture-note{font-size:10pt;color:#256944;margin:3mm 0 0}`;
  document.head.append(style);
  const baseRender=renderEx;
  renderEx=function(ex,index) {
    const html=baseRender(ex,index);
    if(ex.type!=='parallelFind')return html;
    const holder=document.createElement('div');holder.innerHTML=html;
    holder.querySelector('.prompt').textContent='Zoek in elke figuur minstens twee evenwijdige lijnen. Overtrek ze met groen. Gebruik je lat.';
    const scenes=holder.querySelector('.parallel-scenes');
    const picture=document.createElement('div');picture.className='parallel-picture';
    // Explicit image dimensions reserve the print layout before the PNG has loaded.
    picture.innerHTML=`<img src="${imageUrl}" width="1536" height="1024" alt="Een ladder, een schrift met schrijflijnen, een huis en een hek, getekend in grijswaarden.">${state.solutionMode?'<svg viewBox="0 0 1536 1024" aria-label="Voorbeelden van evenwijdige lijnen in groen"><g fill="none" stroke="#20914c" stroke-width="9" stroke-linecap="round" opacity=".8"><path d="M256 33V491 M522 33V491"/><path d="M956 118H1328 M956 175H1328"/><path d="M148 716V960 M627 716V960"/><path d="M870 624V954 M988 624V954"/></g></svg>':''}`;
    scenes.replaceWith(picture);
    if(state.solutionMode)picture.insertAdjacentHTML('afterend','<p class="parallel-picture-note">Voorbeelden in groen. Andere juiste paren zijn ook goed, zoals de sporten van de ladder, de randen van de ramen en de latten van het hek.</p>');
    return holder.innerHTML;
  };
})();
