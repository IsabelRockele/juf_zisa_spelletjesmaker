// Package the catalog for authenticated delivery by readingApi. Does not publish it.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../zisa-lezen-m3-compleet');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const files=[...html.matchAll(/<script src="(data\/[^"?]+)(?:\?[^" ]*)?"><\/script>/g)].map(m=>m[1]);
if(files.length<10)throw new Error('Reading catalog incomplete');
const content=files.map(file=>`\n// ${file}\n${fs.readFileSync(path.join(root,file),'utf8')}\n;`).join('');
fs.mkdirSync(path.join(__dirname,'lib'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'lib/reading-content.js'),content);
console.log(`Reading catalog: ${files.length} sources packaged`);
