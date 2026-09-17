export type Mover = {
  id: string; stationary?:boolean; x: number; y: number; vx: number; vy: number;
  w: number; h: number; ground: boolean; facingRight: boolean;
  targetX: number; targetY: number; turnIn: number; journey: number; speed: number;
};
function seed(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function bounds(m: Mover, W: number, H: number) {
  return { left: m.w * .57 + 8, right: W - m.w * .57 - 8,
    top: m.h * .57 + 12, bottom: H * .82 - m.h * .57 };
}
function chooseDestination(m: Mover, W: number, H: number) {
  const b = bounds(m, W, H);
  const r = seed(m.id + ':' + m.journey++);
  if (m.ground) {
    m.targetX = m.facingRight ? b.right : b.left;
    m.targetY = H * .84 - m.h / 2;
    m.turnIn = 60;
    return;
  }
  // Each creature alternates broad diagonal journeys with clear vertical ones.
  // Its private schedule never depends on another creature's position.
  const vertical = m.journey % 3 === 1;
  m.targetX = vertical
    ? Math.max(b.left, Math.min(b.right, m.x + (r - .5) * W * .06))
    : b.left + (b.right - b.left) * (m.x < W * .5 ? .70 + r * .27 : .03 + r * .27);
  m.targetY = b.top + (b.bottom - b.top) *
    (m.y < (b.top + b.bottom) / 2 ? .78 + r * .19 : .03 + r * .19);
  m.turnIn = 7 + r * 5;
}
export function createMovers(items: {id:string;ground:boolean;aspect:number;size:number;stationary?:boolean}[], W:number, H:number): Mover[] {
  const groundCount = items.filter(c => c.ground).length, airCount = items.length - groundCount;
  let groundIndex = 0, airIndex = 0;
  return items.map(c => {
    const s = seed(c.id), count = c.ground ? groundCount : airCount;
    const index = c.ground ? groundIndex++ : airIndex++;
    const cols = c.ground ? Math.max(1,count) : Math.max(1,Math.ceil(Math.sqrt(count*1.7)));
    const rows = c.ground ? 1 : Math.ceil(count/cols);
    const target = Math.min(H*.21,140)*c.size;
    const h = Math.min(target,(W/Math.max(4,c.ground?count:cols)-12)/Math.max(.6,c.aspect),c.ground?H*.20:H*.49/Math.max(1,rows));
    const width = Math.max(18,h*c.aspect), height = Math.max(18,h);
    const direction = s > .5 ? 1 : -1;
    const m: Mover = {
      id:c.id, stationary:c.stationary, x:(index%cols+.5)*W/cols,
      y:c.ground?H*.84-height/2:H*(.19+(Math.floor(index/cols)+.5)*.48/Math.max(1,rows)),
      vx:0,vy:0,w:width,h:height,ground:c.ground,facingRight:direction>0,
      targetX:0,targetY:0,turnIn:0,journey:Math.floor(s*31),
      speed:Math.min(W,H)*(c.ground?.039:.095)*(.8+s*.55)
    };
    chooseDestination(m,W,H);
    const dx=m.targetX-m.x,dy=m.targetY-m.y,d=Math.hypot(dx,dy)||1;
    m.vx=dx/d*m.speed;m.vy=c.ground?0:dy/d*m.speed;
    return m;
  });
}
export function stepMovers(items:Mover[],dt:number,W:number,H:number) {
  for (const m of items) {
    if(m.stationary){m.vx=0;m.vy=0;continue;}
    m.turnIn -= dt;
    const dx=m.targetX-m.x,dy=m.targetY-m.y,d=Math.hypot(dx,dy);
    if(d<Math.max(12,m.speed*.35)||m.turnIn<=0) {
      if(m.ground)m.facingRight=!m.facingRight;
      chooseDestination(m,W,H);
    }
    const tx=m.targetX-m.x,ty=m.targetY-m.y,dist=Math.hypot(tx,ty)||1;
    const ease=1-Math.exp(-dt*1.25);
    m.vx+=(tx/dist*m.speed-m.vx)*ease;
    m.vy+=((m.ground?0:ty/dist*m.speed)-m.vy)*ease;
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    const b=bounds(m,W,H);
    m.x=Math.max(b.left,Math.min(b.right,m.x));
    m.y=m.ground?H*.84-m.h/2:Math.max(b.top,Math.min(b.bottom,m.y));
    // Keep the face steady during a vertical journey instead of flickering.
    if(Math.abs(m.vx)>m.speed*.15)m.facingRight=m.vx>0;
  }
}
