(function () {
    const W = 20, H = 20;
    const grid = color => Array.from({ length: H }, () => Array.from({ length: W }, () => ({ color, special: null })));
    const put = (g, x, y, color, special = null) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = { color, special }; };
    const disk = (g, cx, cy, rx, ry, color) => {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
            if (((x-cx)/rx) ** 2 + ((y-cy)/ry) ** 2 <= 1) put(g,x,y,color);
    };
    const ring = (g, cx, cy, rx, ry, color, width=0.24) => {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const d = ((x-cx)/rx) ** 2 + ((y-cy)/ry) ** 2;
            if (d <= 1 && d >= 1-width) put(g,x,y,color);
        }
    };
    const line = (g,x1,y1,x2,y2,color,w=0) => {
        const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))*3+1;
        for(let i=0;i<=n;i++){ const x=Math.round(x1+(x2-x1)*i/n), y=Math.round(y1+(y2-y1)*i/n); for(let a=-w;a<=w;a++) for(let b=-w;b<=w;b++) put(g,x+a,y+b,color); }
    };
    const rect = (g,x1,y1,x2,y2,color,fill=true) => {
        for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) if(fill||x===x1||x===x2||y===y1||y===y2) put(g,x,y,color);
    };
    const path = (g,points,color,closed=true) => {
        for(let i=0;i<points.length-(closed?0:1);i++){
            const a=points[i], b=points[(i+1)%points.length]; line(g,a[0],a[1],b[0],b[1],color);
        }
    };
    const magnet = painter => { const g=grid('Zwart'); painter(g,'Grijs'); return g; };
    const color = painter => { const g=grid('Wit'); painter(g); return g; };

    const items = [
        { id:'kuiken', theme:'Lente en Pasen', title:'Kuiken',
          magnet:magnet((g,c)=>{path(g,[[11,1],[13,1],[14,2],[14,4],[15,5],[15,6],[18,7],[15,8],[15,13],[14,15],[12,17],[9,18],[6,17],[4,15],[2,13],[1,10],[2,7],[4,6],[7,6],[9,5],[10,3]],c);path(g,[[5,7],[4,8],[4,10],[5,12],[7,12],[8,10],[8,8],[7,7]],c);put(g,12,4,c);line(g,7,17,6,19,c);line(g,11,17,12,19,c);}),
          color:color(g=>{disk(g,10,11,6,6,'Geel');disk(g,10,6,4,4,'Geel');disk(g,4,12,2,2,'Geel');disk(g,16,12,2,2,'Geel');put(g,8,6,'Wit','eye');put(g,12,6,'Wit','eye');put(g,10,8,'Oranje');line(g,9,17,8,19,'Oranje');line(g,11,17,12,19,'Oranje');}) },
        { id:'paasei', theme:'Lente en Pasen', title:'Paasei',
          magnet:magnet((g,c)=>{path(g,[[10,1],[7,2],[5,4],[4,7],[4,13],[5,16],[7,18],[10,19],[13,18],[15,16],[16,13],[16,7],[15,4],[13,2]],c);path(g,[[5,7],[7,9],[9,7],[11,9],[13,7],[15,9]],c,false);path(g,[[5,13],[7,11],[9,13],[11,11],[13,13],[15,11]],c,false);for(const [x,y] of [[8,4],[12,4],[7,15],[10,16],[13,15]])put(g,x,y,c);}),
          color:color(g=>{const rows=[[8,12],[7,13],[6,14],[6,14],[5,15],[5,15],[4,16],[4,16],[4,16],[4,16],[4,16],[5,15],[5,15],[6,14],[6,14],[7,13],[8,12]];rows.forEach(([min,max],i)=>{const y=i+2;for(let x=min;x<=max;x++){let c='Geel';if(y>=6&&y<=8)c='Roze';if(y>=12&&y<=14)c='Lichtgroen';if(y===10&&x%2===0)c='Paars';if(x===min||x===max)c='Paars';put(g,x,y,c);}});}) },
        { id:'vis', theme:'Dieren', title:'Vis',
          magnet:magnet((g,c)=>{ring(g,9,10,7,5,c);path(g,[[8,5],[11,2],[13,6]],c);path(g,[[8,15],[11,18],[13,14]],c);path(g,[[15,7],[19,4],[19,16],[15,13]],c);put(g,5,9,c);}),
          color:color(g=>{disk(g,9,10,7,5,'Lichtblauw');path(g,[[8,5],[11,2],[13,6]],'Blauw');path(g,[[8,15],[11,18],[13,14]],'Blauw');for(let y=5;y<=15;y++)line(g,16,y,19,10,'Geel');put(g,5,9,'Wit','eye');for(let x=8;x<=13;x+=2)put(g,x,10,'Blauw');}) },
        { id:'vlinder', theme:'Dieren', title:'Vlinder',
          magnet:magnet((g,c)=>{ring(g,6,8,5,5,c);ring(g,14,8,5,5,c);ring(g,6,14,4,4,c);ring(g,14,14,4,4,c);line(g,10,5,10,17,c);path(g,[[10,5],[8,3],[6,2]],c,false);path(g,[[10,5],[12,3],[14,2]],c,false);put(g,5,2,c);put(g,15,2,c);}),
          color:color(g=>{line(g,5,2,7,2,'Bruin');line(g,7,2,8,3,'Bruin');line(g,13,2,15,2,'Bruin');line(g,13,2,12,3,'Bruin');const upperLeft=[[3,8],[2,8],[2,8],[2,8],[1,8],[2,8],[2,8]];upperLeft.forEach(([a,b],i)=>line(g,a,i+4,b,i+4,'Roze'));const upperRight=[[12,17],[12,18],[12,18],[12,18],[12,19],[12,18],[12,18]];upperRight.forEach(([a,b],i)=>line(g,a,i+4,b,i+4,'Paars'));const lowerLeft=[[2,8],[3,8],[3,8],[2,8],[3,8],[3,8],[4,8],[6,6]];lowerLeft.forEach(([a,b],i)=>line(g,a,i+11,b,i+11,'Geel'));const lowerRight=[[12,18],[12,17],[12,17],[12,18],[12,18],[12,17],[12,16],[14,14]];lowerRight.forEach(([a,b],i)=>line(g,a,i+11,b,i+11,'Lichtblauw'));rect(g,9,4,11,18,'Bruin');for(const [x,y] of [[5,7],[4,8],[5,8]])put(g,x,y,'Paars');for(const [x,y] of [[15,7],[14,8],[15,8]])put(g,x,y,'Roze');for(const [x,y] of [[5,13],[4,14],[5,14],[5,15]])put(g,x,y,'Lichtblauw');for(const [x,y] of [[15,13],[14,14],[15,14],[15,15]])put(g,x,y,'Geel');}) },
        { id:'paddenstoel', theme:'Herfst', title:'Paddenstoel',
          magnet:magnet((g,c)=>{path(g,[[2,9],[3,6],[5,4],[8,3],[12,3],[15,4],[17,6],[18,9],[17,10],[13,10],[13,17],[12,18],[8,18],[7,17],[7,10],[3,10]],c);line(g,7,10,13,10,c);put(g,6,7,c);put(g,10,5,c);put(g,14,7,c);}),
          color:color(g=>{const segments={2:[[9,11]],3:[[8,9],[11,12]],4:[[6,8],[11,13]],5:[[5,8],[10,15]],6:[[4,5],[7,13],[15,16]],7:[[3,4],[7,12],[16,17]],8:[[2,4],[6,13],[15,18]],9:[[2,18]],10:[[1,19]],11:[[2,6],[14,18]]};Object.entries(segments).forEach(([y,ranges])=>ranges.forEach(([a,b])=>line(g,a,Number(y),b,Number(y),'Rood')));rect(g,7,11,13,18,'Lichtbruin');}) },
        { id:'eikel', theme:'Herfst', title:'Eikel',
          magnet:magnet((g,c)=>{path(g,[[6,8],[5,10],[5,13],[6,16],[8,18],[10,19],[12,18],[14,16],[15,13],[15,10],[14,8]],c);path(g,[[5,8],[6,6],[8,5],[12,5],[14,6],[15,8],[14,9],[6,9]],c);path(g,[[10,5],[10,3],[12,1],[13,2]],c,false);line(g,7,7,13,7,c);}),
          color:color(g=>{disk(g,10,12,5,6,'Lichtbruin');for(let y=6;y<=9;y++)line(g,5,y,15,y,'Bruin');line(g,10,6,12,3,'Bruin');}) },
        { id:'sneeuwman', theme:'Winter', title:'Sneeuwman',
          magnet:magnet((g,c)=>{ring(g,10,14,5,5,c);ring(g,10,7,4,4,c);line(g,6,4,14,4,c);rect(g,8,1,12,4,c,false);line(g,5,12,1,9,c);line(g,15,12,19,9,c);}),
          color:color(g=>{disk(g,10,14,6,5,'Lichtblauw');disk(g,10,14,4.5,3.5,'Wit');disk(g,10,7,5,4.5,'Lichtblauw');disk(g,10,7,3.5,3,'Wit');rect(g,8,1,12,4,'Zwart');line(g,6,4,14,4,'Zwart');put(g,8,7,'Zwart');put(g,11,7,'Zwart');put(g,10,8,'Oranje');put(g,11,8,'Oranje');put(g,12,8,'Oranje');put(g,13,8,'Oranje');put(g,10,12,'Zwart');put(g,10,15,'Zwart');}) },
        { id:'kerstboom', theme:'Winter', title:'Kerstboom',
          magnet:magnet((g,c)=>{line(g,10,2,3,16,c);line(g,10,2,17,16,c);line(g,3,16,17,16,c);rect(g,8,16,12,19,c,false);line(g,5,11,15,11,c);}),
          color:color(g=>{for(let y=2;y<=16;y++)line(g,10-y/2.2,y,10+y/2.2,y,'Groen');rect(g,8,16,12,19,'Bruin');for(const [x,y,c] of [[10,3,'Geel'],[7,9,'Rood'],[13,10,'Paars'],[9,14,'Blauw'],[14,15,'Geel']])put(g,x,y,c);}) },
        { id:'potlood', theme:'School', title:'Potlood',
          magnet:magnet((g,c)=>{path(g,[[2,15],[5,18],[18,5],[15,2]],c);line(g,4,14,7,17,c);line(g,14,3,17,6,c);line(g,2,15,2,18,c);line(g,2,18,5,18,c);put(g,2,18,c);}),
          color:color(g=>{rect(g,2,7,14,12,'Bruin');rect(g,3,8,13,11,'Geel');line(g,3,10,13,10,'Oranje');rect(g,1,8,3,11,'Roze');line(g,4,8,4,11,'Bruin');for(let y=8;y<=11;y++)line(g,14,y,18,10,'Lichtbruin');put(g,18,10,'Zwart');}) },
        { id:'boekentas', theme:'School', title:'Boekentas',
          magnet:magnet((g,c)=>{rect(g,4,6,16,18,c,false);ring(g,10,6,4,4,c);rect(g,7,11,13,16,c,false);line(g,4,9,2,15,c);line(g,16,9,18,15,c);}),
          color:color(g=>{rect(g,4,6,16,18,'Paars');rect(g,5,7,15,17,'Blauw');rect(g,7,8,13,9,'Lichtblauw');rect(g,7,11,13,16,'Paars');rect(g,8,12,12,15,'Lichtblauw');rect(g,9,12,11,13,'Geel');line(g,8,5,8,3,'Groen');line(g,8,3,12,3,'Groen');line(g,12,3,12,5,'Groen');path(g,[[3,11],[3,13],[2,14],[2,15],[3,16],[3,18]],'Groen',false);path(g,[[17,11],[17,13],[18,14],[18,15],[17,16],[17,18]],'Groen',false);}) },
        { id:'auto', theme:'Voertuigen', title:'Auto',
          magnet:magnet((g,c)=>{rect(g,3,9,17,14,c,false);line(g,6,9,8,5,c);line(g,8,5,14,5,c);line(g,14,5,16,9,c);ring(g,6,15,2,2,c);ring(g,14,15,2,2,c);}),
          color:color(g=>{rect(g,3,9,17,14,'Rood');for(let y=5;y<=9;y++)line(g,8,y,14,y,'Lichtblauw');disk(g,6,15,2,2,'Zwart');disk(g,14,15,2,2,'Zwart');}) },
        { id:'raket', theme:'Voertuigen', title:'Raket',
          magnet:magnet((g,c)=>{path(g,[[10,1],[8,3],[7,6],[7,13],[5,14],[4,17],[8,16],[10,18],[12,16],[16,17],[15,14],[13,13],[13,6],[12,3]],c);ring(g,10,7,2,2,c);line(g,8,13,12,13,c);line(g,9,18,10,19,c);line(g,11,18,10,19,c);}),
          color:color(g=>{put(g,10,1,'Blauw');line(g,9,2,11,2,'Blauw');put(g,10,2,'Lichtblauw');line(g,8,3,12,3,'Blauw');line(g,9,3,11,3,'Lichtblauw');for(let y=4;y<=11;y++){line(g,7,y,13,y,'Blauw');line(g,8,y,12,y,'Lichtblauw');if(y%2===0){put(g,9,y,'Blauw');put(g,11,y,'Blauw');}}put(g,7,4,'Lichtblauw');put(g,13,4,'Lichtblauw');line(g,6,11,7,11,'Rood');line(g,13,11,14,11,'Rood');line(g,5,12,7,12,'Rood');line(g,13,12,15,12,'Rood');line(g,4,13,7,13,'Rood');put(g,6,13,'Oranje');line(g,8,13,12,13,'Blauw');line(g,13,13,16,13,'Rood');line(g,3,14,7,14,'Rood');line(g,8,14,12,14,'Oranje');line(g,13,14,17,14,'Rood');line(g,2,15,7,15,'Rood');line(g,8,15,12,15,'Lichtblauw');line(g,13,15,18,15,'Rood');line(g,2,16,7,16,'Rood');line(g,8,16,12,16,'Lichtblauw');line(g,13,16,18,16,'Rood');put(g,8,17,'Oranje');line(g,9,17,11,17,'Geel');put(g,12,17,'Oranje');put(g,9,18,'Oranje');put(g,10,18,'Geel');put(g,11,18,'Oranje');put(g,10,19,'Oranje');}) }
    ];

    window.PIXELART_CATALOGUS = items;

    document.addEventListener('DOMContentLoaded', () => {
        const host=document.getElementById('pixelCatalogus'); if(!host) return;
        const discover=location.pathname.includes('/ontdek/');
        const freeThemes=new Set(['Lente en Pasen','Dieren','School']);
        let selected=null;
        const mode=()=>document.querySelector('input[name="mode"]:checked')?.value || 'bouwkaart';
        const dispatch=item=>window.dispatchEvent(new CustomEvent('zisa:pixelart-template',{detail:{id:item.id,label:item.title,mode:mode(),matrix:item[mode()==='bouwkaart'?'magnet':'color']}}));
        function paintPreview(canvas,matrix){const c=canvas.getContext('2d'),s=canvas.width/W;c.clearRect(0,0,canvas.width,canvas.height);const map={Wit:'#fff',Zwart:'#222',Grijs:'#ccc',Geel:'#ffd83d',Rood:'#f05a47',Oranje:'#ff942e',Blauw:'#338bd5',Groen:'#46ad5b',Paars:'#9b62ca',Bruin:'#935c36',Roze:'#f2a8c4',Lichtgroen:'#9ddc8e',Lichtblauw:'#9bd8ef',Lichtbruin:'#d49a68'};matrix.forEach((row,y)=>row.forEach((cell,x)=>{c.fillStyle=map[cell.color]||'#fff';c.beginPath();c.arc((x+.5)*s,(y+.5)*s,s*.4,0,Math.PI*2);c.fill();}));}
        function render(){host.innerHTML='<div class="catalog-head"><strong>Kies een voorbeeld uit de catalogus</strong><small>Je kunt daarna ieder bolletje nog aanpassen.</small></div><div class="catalog-grid"></div>';const list=host.querySelector('.catalog-grid');items.forEach(item=>{const locked=discover&&!freeThemes.has(item.theme);const b=document.createElement('button');b.type='button';b.className='catalog-card'+(locked?' locked':'')+(selected===item.id?' selected':'');b.innerHTML=`<canvas width="120" height="120"></canvas><span>${item.title}${locked?' <b>PRO</b>':''}</span><small>${item.theme}</small>`;paintPreview(b.querySelector('canvas'),item[mode()==='bouwkaart'?'magnet':'color']);b.onclick=()=>{if(locked){if(window.openOntdekProInfo)window.openOntdekProInfo(`Het thema “${item.theme}” en dit voorbeeld zijn beschikbaar in PRO.`);else alert('Dit thema is beschikbaar in PRO.');return;}selected=item.id;dispatch(item);render();};list.appendChild(b);});}
        render();
        document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener('change',()=>setTimeout(()=>{render();const item=items.find(x=>x.id===selected);if(item)dispatch(item);},0)));
    });
})();
