import jsQR from 'jsqr';

// Millimetres, shared by the printer and scanner. Markers are outside the drawing.
export const sheet = {width:186,height:206,marker:18,inset:22};
export const corners = ['tl','tr','br','bl'] as const;
type Corner = typeof corners[number];
export type Point = {x:number;y:number};
export type Pixels = {width:number;height:number;data:Uint8ClampedArray};
export type Scan = {template?:string;points?:Point[];partial:boolean};

export function scanSheet(image:Pixels):Scan {
  const regions=[{x:0,y:0,w:image.width,h:image.height}];
  const rw=Math.ceil(image.width*.60),rh=Math.ceil(image.height*.60);
  for(const y of [0,image.height-rh])for(const x of [0,image.width-rw])regions.push({x,y,w:rw,h:rh});
  const groups=new Map<string,Partial<Record<Corner,Point>>>();
  let legacy:string|undefined;
  for(const region of regions){
   const work=new Uint8ClampedArray(region.w*region.h*4);
   for(let y=0;y<region.h;y++)work.set(image.data.subarray(((y+region.y)*image.width+region.x)*4,((y+region.y)*image.width+region.x+region.w)*4),y*region.w*4);
   for(let attempt=0;attempt<4;attempt++) {
    const code=jsQR(work,region.w,region.h,{inversionAttempts:'attemptBoth'});
    if(!code)break;
    const match=/^ZISA2:([a-z0-9-]+):(tl|tr|br|bl)$/.exec(code.data);
    const l=code.location;
    const vertices=[l.topLeftCorner,l.topRightCorner,l.bottomRightCorner,l.bottomLeftCorner];
    if(match){
      const group=groups.get(match[1])||{};
      // Diagonal intersection is the projective centre, unlike averaging corners.
      const [a,b,c,d]=vertices;
      const ux=c.x-a.x,uy=c.y-a.y,vx=d.x-b.x,vy=d.y-b.y;
      const det=ux*vy-uy*vx;
      if(Math.abs(det)>1){const t=((b.x-a.x)*vy-(b.y-a.y)*vx)/det;group[match[2] as Corner]={x:a.x+t*ux+region.x,y:a.y+t*uy+region.y};}
      groups.set(match[1],group);
    }else if(code.data.startsWith('ZISA:'))legacy=code.data.slice(5);
    // Erase this QR before looking for the next one, including its quiet zone.
    const left=Math.max(0,Math.floor(Math.min(...vertices.map(p=>p.x))-4));
    const right=Math.min(region.w-1,Math.ceil(Math.max(...vertices.map(p=>p.x))+4));
    const top=Math.max(0,Math.floor(Math.min(...vertices.map(p=>p.y))-4));
    const bottom=Math.min(region.h-1,Math.ceil(Math.max(...vertices.map(p=>p.y))+4));
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const i=(y*region.w+x)*4;work[i]=work[i+1]=work[i+2]=255;}
  }
  }
  const complete=[...groups].filter(([,g])=>corners.every(c=>g[c]));
  // Never combine corners from different pages, or guess when two sheets are shown.
  if(groups.size===1&&complete.length===1){
    const [template,g]=complete[0],points=corners.map(c=>g[c]!);
    if(validQuad(points))return {template,points,partial:false};
  }
  return {template:groups.size===1?[...groups.keys()][0]:legacy,partial:groups.size>0};
}

function validQuad(p:Point[]){
  const crosses=p.map((a,i)=>{const b=p[(i+1)%4],c=p[(i+2)%4];return (b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);});
  return crosses.every(v=>v>100)||crosses.every(v=>v< -100);
}

// Maps a unit rectangle to the photographed quadrilateral (perspective included).
export function projection(p:Point[]){
  const [a,b,c,d]=p,dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x;
  const dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y,det=dx1*dy2-dx2*dy1;
  if(Math.abs(det)<1e-8)throw Error('Het tekenvak is te schuin gefotografeerd. Maak een nieuwe foto recht van boven.');
  const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
  return (u:number,v:number)=>{const z=g*u+h*v+1;return {x:((b.x-a.x+g*b.x)*u+(d.x-a.x+h*d.x)*v+a.x)/z,y:((b.y-a.y+g*b.y)*u+(d.y-a.y+h*d.y)*v+a.y)/z};};
}

export function extractDrawing(image:Pixels,points:Point[]):Pixels {
  const map=projection(points),width=720,height=Math.round(width*(sheet.height-2*sheet.inset)/(sheet.width-2*sheet.inset));
  const data=new Uint8ClampedArray(width*height*4),half=sheet.marker/2;
  const u0=(sheet.inset-half)/(sheet.width-sheet.marker),v0=(sheet.inset-half)/(sheet.height-sheet.marker);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=map(u0+(1-2*u0)*(x+.5)/width,v0+(1-2*v0)*(y+.5)/height);
    const sx=Math.max(0,Math.min(image.width-1.001,p.x)),sy=Math.max(0,Math.min(image.height-1.001,p.y));
    const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,out=(y*width+x)*4;
    for(let ch=0;ch<3;ch++){
      const at=(xx:number,yy:number)=>image.data[(yy*image.width+xx)*4+ch];
      data[out+ch]=(at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;
    }
    data[out+3]=255;
  }
  return {width,height,data};
}
