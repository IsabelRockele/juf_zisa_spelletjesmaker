export type Direction='up'|'right'|'down'|'left';
export type Point={x:number;y:number};
export type Level={name:string;cols:number;rows:number;start:Point;goal:Point;walls:Point[]};
const p=(x:number,y:number):Point=>({x,y});
export const levels:Level[]=[
 {name:'Rechtdoor',cols:3,rows:2,start:p(0,0),goal:p(2,0),walls:[]},
 {name:'Om het hoekje',cols:3,rows:2,start:p(0,0),goal:p(2,1),walls:[]},
 {name:'Naar boven',cols:3,rows:3,start:p(0,2),goal:p(2,0),walls:[]},
 {name:'De andere kant',cols:4,rows:3,start:p(3,2),goal:p(0,0),walls:[]},
 {name:'Een blok in de weg',cols:4,rows:3,start:p(0,1),goal:p(3,1),walls:[p(1,1)]},
 {name:'Rond de muur',cols:4,rows:4,start:p(0,0),goal:p(3,0),walls:[p(1,0),p(1,1),p(1,2)]},
 {name:'Twee bochten',cols:5,rows:4,start:p(0,3),goal:p(4,3),walls:[p(2,1),p(2,2),p(2,3)]},
 {name:'Door de opening',cols:5,rows:5,start:p(0,4),goal:p(4,0),walls:[p(2,0),p(2,1),p(2,3),p(2,4),p(3,1)]},
 {name:'Een omweg',cols:5,rows:5,start:p(0,0),goal:p(4,0),walls:[p(1,0),p(1,1),p(1,2),p(3,2),p(3,3),p(3,4)]},
 {name:'Slalom',cols:6,rows:5,start:p(0,0),goal:p(5,4),walls:[p(1,0),p(1,1),p(1,2),p(3,2),p(3,3),p(3,4),p(5,0),p(5,1),p(5,2)]},
 {name:'Heen en terug',cols:6,rows:6,start:p(0,0),goal:p(0,5),walls:[p(0,1),p(1,1),p(2,1),p(3,1),p(4,1),p(1,3),p(2,3),p(3,3),p(4,3),p(5,3)]},
 {name:'Robotexpert',cols:6,rows:6,start:p(0,0),goal:p(5,5),walls:[p(1,0),p(1,1),p(1,2),p(1,3),p(3,2),p(3,3),p(3,4),p(3,5),p(5,0),p(5,1),p(5,2),p(5,3)]},
];
export const moves:Record<Direction,Point>={up:p(0,-1),right:p(1,0),down:p(0,1),left:p(-1,0)};
export const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
export function step(level:Level,from:Point,direction:Direction):{position:Point;error:'edge'|'wall'|null}{
 const delta=moves[direction];const to=p(from.x+delta.x,from.y+delta.y);
 if(to.x<0||to.y<0||to.x>=level.cols||to.y>=level.rows)return {position:from,error:'edge'};
 if(level.walls.some(w=>same(w,to)))return {position:from,error:'wall'};
 return {position:to,error:null};
}
