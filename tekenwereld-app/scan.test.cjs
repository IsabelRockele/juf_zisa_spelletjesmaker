const assert=require('node:assert/strict');
const fs=require('node:fs');
const QR=require('qrcode');
const {PNG}=require('pngjs');
require('esbuild').buildSync({entryPoints:['lib/sheet-scan.ts'],outfile:'.preview/scan-test.cjs',bundle:true,platform:'node',format:'cjs'});
const {scanSheet,extractDrawing,sheet,corners}=require('./.preview/scan-test.cjs');
function blank(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4).fill(255)};}
function pixel(im,x,y,color){const i=(y*im.width+x)*4;im.data.set([...color,255],i);}
function makePage(missing=false,mixed=false){
 const scale=6,im=blank(1260,1782),left=72,top=312;
 for(const [n,corner] of corners.entries()){
  if(missing&&n===3)continue;
  const qr=QR.create(`ZISA2:${mixed&&n===2?'garden-01':'aqua-01'}:${corner}`,{errorCorrectionLevel:'M'}),size=sheet.marker*scale;
  const x0=left+(n===1||n===2?(sheet.width-sheet.marker)*scale:0),y0=top+(n>=2?(sheet.height-sheet.marker)*scale:0);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const mx=Math.floor(x/size*(qr.modules.size+6))-3,my=Math.floor(y/size*(qr.modules.size+6))-3;
   if(mx>=0&&my>=0&&mx<qr.modules.size&&my<qr.modules.size&&qr.modules.get(my,mx))pixel(im,x0+x,y0+y,[0,0,0]);
  }
 }
 // Printed frame, name and header must not end up in the extraction.
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
  const mmx=(x-left)/scale,mmy=(y-top)/scale;
  if((Math.abs(mmx-21)<.2||Math.abs(mmx-165)<.2)&&mmy>=21&&mmy<=185 || (Math.abs(mmy-21)<.2||Math.abs(mmy-185)<.2)&&mmx>=21&&mmx<=165)pixel(im,x,y,[100,100,100]);
  if(y>120&&y<150&&x>100&&x<800 || y>1580&&y<1595&&x>140&&x<900)pixel(im,x,y,[0,0,0]);
  // Asymmetric coloured figure: red body, blue eye, yellow tail.
  if(((mmx-90)/40)**2+((mmy-103)/30)**2<1)pixel(im,x,y,[225,60,40]);
  if(((mmx-73)/5)**2+((mmy-94)/5)**2<1)pixel(im,x,y,[0,70,190]);
  if(mmx>126&&mmx<150&&Math.abs(mmy-103)<(mmx-126)*.7)pixel(im,x,y,[240,180,0]);
 }
 return im;
}
function rotate(im){const out=blank(im.height,im.width);for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const a=(y*im.width+x)*4,b=(x*out.width+im.height-1-y)*4;out.data.set(im.data.subarray(a,a+4),b);}return out;}
function perspective(im){
 // Independently invert this projective camera transform.
 const h=[.84,.10,80,-.035,.86,120,.000035,.00009,1],out=blank(1400,1800);
 const [a,b,c,d,e,f,g,k,l]=h;
 const inv=[e*l-f*k,c*k-b*l,b*f-c*e,f*g-d*l,a*l-c*g,c*d-a*f,d*k-e*g,b*g-a*k,a*e-b*d];
 for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){
  const z=inv[6]*x+inv[7]*y+inv[8],sx=Math.round((inv[0]*x+inv[1]*y+inv[2])/z),sy=Math.round((inv[3]*x+inv[4]*y+inv[5])/z);
  if(sx>=0&&sy>=0&&sx<im.width&&sy<im.height){const j=(sy*im.width+sx)*4;out.data.set(im.data.subarray(j,j+4),(y*out.width+x)*4);}
 }
 return out;
}
const original=makePage();
for(const [label,input] of [['recht',original],['90 graden',rotate(original)],['180 graden',rotate(rotate(original))],['270 graden',rotate(rotate(rotate(original)))],['perspectief',perspective(original)]]){
 const started=Date.now(),scan=scanSheet(input);assert.equal(scan.template,'aqua-01',label);assert.ok(scan.points,label+' vier codes');
 const cut=extractDrawing(input,scan.points);let dark=0,red=0;
 for(let i=0;i<cut.data.length;i+=4){if(cut.data[i]<130&&cut.data[i+1]<130&&cut.data[i+2]<130)dark++;if(cut.data[i]>180&&cut.data[i+1]<100)red++;}
 assert.ok(dark<100,label+' kader, tekst en QR verwijderd: '+dark);assert.ok(red>60000,label+' kleur behouden');
 const eye=((Math.round((94-22)/162*cut.height)*cut.width)+Math.round((73-22)/142*cut.width))*4;
 assert.ok(cut.data[eye+2]>150&&cut.data[eye]<40,label+' juiste oriëntatie');
 console.log('PASS',label,Date.now()-started+'ms');
 fs.writeFileSync(`.preview/scan-${label==='perspectief'?'skew':label==='recht'?'straight':label.split(' ')[0]}.png`,PNG.sync.write({width:input.width,height:input.height,data:Buffer.from(input.data)}));
}
assert.equal(scanSheet(makePage(true)).points,undefined,'ontbrekende code: geen gegokte uitsnede');
assert.equal(scanSheet(makePage(false,true)).points,undefined,'codes van verschillende bladen niet combineren');
assert.equal(scanSheet(blank(800,1000)).points,undefined,'lege foto niet herkennen');
console.log('PASS ontbrekende, gemengde en onleesbare hoekcodes');
