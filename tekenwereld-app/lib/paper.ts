// Estimate the photographed paper from the empty margin, per colour channel.
// This compensates for exposure, colour casts and shadows without recolouring ink.
function paperField(p:Uint8ClampedArray,w:number,h:number){
 const strip=Math.max(2,Math.round(Math.min(w,h)*.025));
 function edge(horizontal:boolean,end:boolean){
  const len=horizontal?w:h,depth=horizontal?h:w,values=new Float32Array(len*3);
  for(let i=0;i<len;i++)for(let ch=0;ch<3;ch++){
   const samples:number[]=[];
   for(let j=0;j<strip;j++){
    const d=end?depth-1-j:j,x=horizontal?i:d,y=horizontal?d:i;
    const k=(y*w+x)*4;if(p[k+3]>200)samples.push(p[k+ch]);
   }
   samples.sort((a,b)=>a-b);values[i*3+ch]=samples[Math.floor((samples.length-1)*.65)]??255;
  }
  const smooth=new Float32Array(values.length),r=Math.max(2,Math.round(len*.015));
  for(let i=0;i<len;i++)for(let ch=0;ch<3;ch++){
   const samples:number[]=[];for(let j=Math.max(0,i-r);j<=Math.min(len-1,i+r);j++)samples.push(values[j*3+ch]);
   samples.sort((a,b)=>a-b);smooth[i*3+ch]=samples[Math.floor(samples.length/2)];
  }
  return smooth;
 }
 const top=edge(true,false),bottom=edge(true,true),left=edge(false,false),right=edge(false,true);
 return (x:number,y:number,ch:number)=>{
  const u=x/(w-1),v=y/(h-1);
  const tl=(top[ch]+left[ch])/2,tr=(top[(w-1)*3+ch]+right[ch])/2;
  const bl=(bottom[ch]+left[(h-1)*3+ch])/2,br=(bottom[(w-1)*3+ch]+right[(h-1)*3+ch])/2;
  const corner=(1-v)*((1-u)*tl+u*tr)+v*((1-u)*bl+u*br);
  return Math.max(45,Math.min(255,(1-u)*left[y*3+ch]+u*right[y*3+ch]+(1-v)*top[x*3+ch]+v*bottom[x*3+ch]-corner));
 };
}

// Close small outline breaks only in the flood-fill barrier, not in the artwork.
function closeOutline(mask:Uint8Array,w:number,h:number,r:number){
 const pass=(a:Uint8Array,horizontal:boolean,dilate:boolean)=>{const b=new Uint8Array(a.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=dilate?0:1;for(let k=-r;k<=r;k++){const xx=horizontal?x+k:x,yy=horizontal?y:y+k;if(xx<0||xx>=w||yy<0||yy>=h)continue;const bit=a[yy*w+xx];if(dilate?bit:!bit){v=dilate?1:0;break;}}b[y*w+x]=v;}return b;};
 return pass(pass(pass(pass(mask,true,true),false,true),true,false),false,false);
}

export function removePaperPixels(p:Uint8ClampedArray,w:number,h:number,threshold=220){
 if(w<2||h<2)throw Error('Maak een nieuwe foto van het hele tekenblad.');
 const background=paperField(p,w,h),ink=new Uint8Array(w*h),limit=threshold/255;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=y*w+x,k=n*4;
  const rgb=[0,1,2].map(ch=>p[k+ch]/background(x,y,ch));
  const min=Math.min(...rgb),max=Math.max(...rgb);
  ink[n]=p[k+3]>0&&!(min>=limit&&max-min<.16)?1:0;
 }
 const barrier=closeOutline(ink,w,h,Math.max(2,Math.min(8,Math.round(Math.min(w,h)*.016))));
 const seen=new Uint8Array(w*h),q=new Int32Array(w*h);let a=0,b=0;
 const add=(n:number)=>{if(n<0||n>=w*h||seen[n])return;seen[n]=1;if(!barrier[n]&&!ink[n]){q[b++]=n;p[n*4+3]=0;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(a<b){const n=q[a++],x=n%w;if(x>0)add(n-1);if(x<w-1)add(n+1);add(n-w);add(n+w);}
 // A largely opaque rectangle is not a cut-out. Do not offer it for sending.
 let opaque=0,total=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1){total++;if(p[(y*w+x)*4+3]>30)opaque++;}
 if(opaque/total>.35)throw Error('Het papier kon niet goed verwijderd worden. Maak een nieuwe foto met het hele blad in beeld, zonder sterke schaduw.');
 return p;
}
