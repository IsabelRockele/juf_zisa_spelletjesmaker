import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(here,'../..');
const out=path.resolve(source,'../digitale-missies');
const base='/digitale-missies/';
const routes=['kijken','robotroutes','veilig','zoeken','opzoeken','ontdekken','doelen'];
const publicNames=await fs.readdir(path.join(source,'public'));
function rewrite(text){
  text=text.replace(/(['"`])\/leerkracht(?=[?'"`])/g,`$1${base}inleverplek.html`);
  for(const route of routes) text=text.replace(new RegExp('([\'"`])/'+route+'(?=[?\'"`])','g'),`$1${base}${route}/`);
  for(const name of publicNames){
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    text=text.replace(new RegExp('([\'"`(])/'+escaped+'(?=[/\'"`)?#])','g'),`$1${base}v2/${name}`);
  }
  return text.replace(/(['"`])\/(?=['"`])/g,`$1${base}`);
}
await fs.mkdir(path.join(out,'v2'),{recursive:true});
await fs.cp(path.join(source,'public'),path.join(out,'v2'),{recursive:true});
for(const name of publicNames){
  if(!/\.(js|css|html)$/.test(name))continue;
  const dest=path.join(out,'v2',name);
  let text=rewrite(await fs.readFile(dest,'utf8'));
  if(name==='app.js') text=text.split('\n').filter(line=>!line.startsWith("$('#send-form').onsubmit=")).join('\n');
  if(name==='atelier.html'){
    text=text.replace('</body>','<script src="../inlever-config.js"></script><script type="module" src="atelier-inlever.js"></script></body>');
  }
  await fs.writeFile(dest,text);
}
await fs.copyFile(path.join(here,'atelier-inlever.js'),path.join(out,'v2/atelier-inlever.js'));
await fs.copyFile(path.join(here,'submit-work.js'),path.join(out,'v2/submit-work.js'));

const entry=`import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '${source.replaceAll('\\','/')}/app/page.tsx';
${routes.map((r,i)=>`import Page${i} from '${source.replaceAll('\\','/')}/app/${r}/page.tsx';`).join('\n')}
import '${source.replaceAll('\\','/')}/app/globals.css';
import '${source.replaceAll('\\','/')}/app/compact.css';
const pages={${routes.map((r,i)=>`'${r}':Page${i}`).join(',')}};
const route=location.pathname.slice('${base}'.length).split('/')[0];
const Page=pages[route]||Home;
// Keep upload-only class links through navigation, without persisting secrets.
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href,location.href);if(url.origin===location.origin&&url.pathname.startsWith('${base}')&&location.hash.includes('sleutel='))a.hash=location.hash;});
createRoot(document.getElementById('root')).render(<><Page/>{(!route||route==='index.html')&&<p style={{textAlign:'center',padding:12}}><a href="/index.html#digitaal">Terug naar de gratis tools</a></p>}</>);`;

await build({stdin:{contents:entry,loader:'tsx',resolveDir:here},bundle:true,format:'esm',minify:true,jsx:'automatic',outfile:path.join(out,'v2/missions.js'),nodePaths:[path.join(here,'node_modules')],alias:{'@':source},plugins:[{
  name:'host-paths',setup(b){
    b.onResolve({filter:/^\/digitale-missies\//},args=>({path:args.path,external:true}));
    b.onLoad({filter:/\.(tsx?|json)$/},async args=>{
      if(args.path.includes('node_modules'))return;
      if(args.path.endsWith('card-delivery.tsx'))return {contents:await fs.readFile(path.join(here,'card-delivery.tsx'),'utf8'),loader:'tsx',resolveDir:here};
      return {contents:rewrite(await fs.readFile(args.path,'utf8')),loader:path.extname(args.path).slice(1),resolveDir:path.dirname(args.path)};
    });
    b.onLoad({filter:/globals\.css$/},async args=>{
      const css=await postcss([tailwind({base:source})]).process(await fs.readFile(args.path,'utf8'),{from:path.join(here,'globals.css')});
      return {contents:rewrite(css.css),loader:'css',resolveDir:here};
    });
    b.onLoad({filter:/\.css$/},async args=>({contents:rewrite(await fs.readFile(args.path,'utf8')),loader:'css',resolveDir:path.dirname(args.path)}));
  }
}],logLevel:'warning'});
await fs.appendFile(path.join(out,'v2/missions.css'),'\n@media print{body>#root{display:block!important}}\n');

const html='<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer"><title>Zisa’s digitale missies</title><link rel="icon" href="'+base+'v2/icon.svg"><link rel="stylesheet" href="'+base+'v2/missions.css"></head><body><div id="root"></div><noscript>Schakel JavaScript in om de missies te openen.</noscript><script src="'+base+'inlever-config.js"></script><script type="module" src="'+base+'v2/missions.js"></script></body></html>';
for(const route of ['',...routes]){await fs.mkdir(path.join(out,route),{recursive:true});await fs.writeFile(path.join(out,route,'index.html'),html);}
console.log('Gebouwd: startscherm, 7 missieroutes en tekenatelier op '+base);
