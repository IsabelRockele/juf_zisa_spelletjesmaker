const {createHash}=require('node:crypto');
const worlds=new Set(['aqua','garden','space','forest']);
class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new ApiError(status,message);};
const ownerId=uid=>createHash('sha256').update('zisa-collegas:'+uid).digest('hex');
const codeHash=code=>createHash('sha256').update(code).digest('hex');
const validCode=code=>typeof code==='string'&&/^[a-f0-9]{24}$/.test(code);
function requireSession(owner,code,now){
  if(!validCode(code)||!owner?.session||owner.session.code!==code||owner.session.expires<=now)
    fail(403,'Deze klasverbinding is gesloten of verlopen. Vraag een nieuwe klas-QR.');
  return owner.session;
}
function validateDrawing(x){
  if(!x||!worlds.has(x.world)||!['swim','fly','crawl','walk','float','tentacles','bubbles'].includes(x.motion)||!['air','ground'].includes(x.zone)||typeof x.name!=='string'||x.name.length>60||!Number.isFinite(x.size)||x.size<.5||x.size>2||!Number.isFinite(x.pivot)||x.pivot<.2||x.pivot>.8||typeof x.flip!=='boolean')fail(400,'Controleer de gegevens van je tekening.');
  if(typeof x.image!=='string'||x.image.length>2500000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(x.image))fail(400,'Kies een geldige, kleinere tekening.');
  const bytes=Buffer.from(x.image.slice(22),'base64');
  if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',12,16)!=='IHDR')fail(400,'De tekening is geen geldige PNG-afbeelding.');
  const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
  if(w<1||h<1||w>1024||h>1024)fail(400,'Maak eerst een kleiner uitgesneden voorbeeld.');
  return {bytes,data:{world:x.world,name:x.name.trim(),template:typeof x.template==='string'?x.template.slice(0,50):'',motion:x.motion,zone:x.zone,size:x.size,flip:x.flip,pivot:x.pivot}};
}
module.exports={ApiError,fail,worlds,ownerId,codeHash,validCode,requireSession,validateDrawing};
