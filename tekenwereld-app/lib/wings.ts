type Point=[number,number];
type Wing={outline:Point[];hinge:Point;angle:number};
const rigs:Record<string,Wing[]>={
 'forest-18':[{outline:[[.39,.70],[.29,.36],[.30,.13],[.88,-.08],[.87,.31],[.72,.56],[.49,.71]],hinge:[.42,.69],angle:.065}],
 'forest-02':[{outline:[[.46,.53],[.47,.39],[.62,.19],[.77,.24],[.98,.43],[.98,.56],[.72,.60],[.56,.57]],hinge:[.48,.53],angle:.12}],
 'forest-13':[{outline:[[.43,.51],[.46,.37],[.55,.24],[.72,.27],[.90,.46],[.82,.55],[.56,.59]],hinge:[.45,.52],angle:.12}],
 'forest-09':[
  {outline:[[-.05,.09],[.14,.10],[.39,.32],[.47,.45],[.43,.59],[.28,.71],[.04,.69],[-.05,.48]],hinge:[.43,.53],angle:-.10},
  {outline:[[.68,.49],[.76,.42],[1.04,.21],[1.06,.62],[.86,.73],[.66,.72]],hinge:[.69,.60],angle:.10}
 ]
};
function mask(p:Point,poly:Point[]){let inside=false,min=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));min=Math.min(min,Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy));}if(!inside)return 0;const s=Math.min(1,min/.09);return s*s*(3-2*s);}
export function wingWarp(x:number,y:number,t:number,template=''):[number,number]{const wings=rigs[template];if(wings){let ox=0,oy=0;for(const wing of wings){const weight=mask([x,y],wing.outline);if(!weight)continue;const a=Math.sin(t*5.5)*wing.angle,dx=x-wing.hinge[0],dy=y-wing.hinge[1];ox+=(Math.cos(a)*dx-Math.sin(a)*dy-dx)*weight;oy+=(Math.sin(a)*dx+Math.cos(a)*dy-dy)*weight;}return [x+ox,y+oy];}
 // A butterfly's central body stays completely rigid; flap the outer wings only.
 const side=x-.5,d=Math.abs(side),reach=Math.max(0,d-.18),flap=Math.sin(t*7);
 if(!reach)return[x,y];
 return[x-Math.sign(side)*reach*.18*(.5+.5*flap),y+reach*.10*flap];
}
