const baseWorlds = [
{id:'aqua',name:'Aquarium',icon:'🐠',color:'#097f99',hint:'Een zee vol zelfbedachte bewoners',ground:'zeebodem'},
{id:'garden',name:'Bloementuin',icon:'🦋',color:'#54822a',hint:'Het kriebelt, kruipt en fladdert',ground:'grond'},
{id:'space',name:'Ruimtewereld',icon:'🪐',color:'#7053bc',hint:'Op avontuur tussen de sterren',ground:'maanbodem'},
{id:'forest',name:'Fantasiebos',icon:'🌳',color:'#28745e',hint:'Hier woont de verbeelding',ground:'bosgrond'}];
export const seasonalWorlds = [
{id:'sint',name:'Sintdorp',icon:'🎁',color:'#a63637',hint:'Laat je eigen Sintfiguurtje door het dorp wandelen',ground:'dorpsplein'},
{id:'kerst',name:'Kerstwereld',icon:'🎄',color:'#24705b',hint:'Een winters dorp vol zelfgemaakte kerstfiguren',ground:'sneeuw'},
{id:'pasen',name:'Paastuin',icon:'🐣',color:'#7a6723',hint:'Breng je lentefiguurtje tot leven tussen de bloemen',ground:'tuingrond'}];
export const worlds = [...baseWorlds,...seasonalWorlds];
export type Motion='swim'|'fly'|'crawl'|'walk'|'float'|'tentacles'|'bubbles';
export const motions:Record<Motion,string>={swim:'Zwemmen · staart zwiept',fly:'Vliegen · vleugels klapperen',crawl:'Kruipen · lijf golft',walk:'Lopen · benen bewegen',float:'Zweven · armen wiebelen',tentacles:'Golven · tentakels bewegen',bubbles:'Zitten · bellen blazen'};
export type Template={id:string;world:string;name:string;kind:'kleur'|'ontwerp'|'vrij';motion:Motion;zone:'air'|'ground';index:number};
const names=[['Goudvis','Clownvis','Kogelvis','Maanvis','Zeepaardje','Haai','Rog','Octopus','Kwal','Zeeschildpad','Ronde vis','Lange vis','Driehoekige vis','Sluierstaartvis','Eigen kwal','Eigen octopus'],['Vlinder','Nachtvlinder','Bij','Hommel','Lieveheersbeestje','Libel','Kever','Sprinkhaan','Rups','Slak','Ronde vleugels','Puntige vleugels','Lange vleugels','Eigen kever','Eigen rups','Eigen slak'],['Eenoogwezen','Drieoogwezen','Tentakelwezen','Antennewezen','Sterrenwezen','Maanwezen','Langarmwezen','Zweefwezen','Ruimterobot','Ruimtekwal','Rond antennewezen','Lang ruimtewezen','Vierarmwezen','Eigen tentakelwezen','Eigen robot','Zweefwezen met vinnen'],['Bosmonster','Zittend draakje','Elfje','Kabouter','Boomwezen','Paddenstoelwezen','Blaadjeswezen','Pluizenbol','Fantasievogel','Eenhoorn','Rond monstertje','Langbenig monstertje','Eigen zittend draakje','Eigen elfje','Eigen boomwezen','Eigen paddenstoelwezen']];
export const templates:Template[]=baseWorlds.flatMap((w,wi)=>[...names[wi].map((name,i)=>{let motion:Motion=wi===0?'swim':wi===1?'fly':wi===2?'float':'walk';let zone:'air'|'ground'='air';if(wi===0&&[7,8,14,15].includes(i))motion='tentacles';if(wi===0&&[7,15].includes(i))zone='ground';if(wi===1&&[4,6,7,8,9,13,14,15].includes(i)){motion='crawl';zone='ground';}if(wi===2&&[2,9,13].includes(i))motion='tentacles';if(wi===3){zone='ground';if([2,8,13].includes(i)){motion='fly';zone='air';}if([1,12].includes(i)){motion='bubbles';zone='ground';}}return {id:`${w.id}-${String(i+1).padStart(2,'0')}`,world:w.id,name,kind:i<10?'kleur':'ontwerp',motion,zone,index:i} as Template;}),{id:`${w.id}-vrij`,world:w.id,name:'Helemaal zelf bedenken',kind:'vrij',motion:wi===0?'swim':wi===1?'crawl':wi===2?'float':'walk',zone:wi===1||wi===3?'ground':'air',index:16} as Template]);
export type Creature={id:string;world:string;name:string;template:string;motion:Motion;zone:'air'|'ground';image:string;size:number;flip:boolean;pivot:number;createdAt?:string};

templates.splice(templates.findIndex(t=>t.id==='forest-02')+1,0,{id:'forest-18',world:'forest',name:'Vliegend draakje',kind:'ontwerp',motion:'fly',zone:'air',index:17});

// Four coloring pages and two open design templates per seasonal world.
const seasonalFigures:Record<string,{name:string;motion:Motion;zone:'air'|'ground'}[]> = {
 sint: [
  {name:'Sinterklaas',motion:'walk',zone:'ground'},
  {name:'Piet',motion:'walk',zone:'ground'},
  {name:'Het paard van de Sint',motion:'walk',zone:'ground'},
  {name:'Speculaaspop',motion:'walk',zone:'ground'},
  {name:'Eigen pakjeswezen',motion:'walk',zone:'ground'},
  {name:'Eigen mijterwezen',motion:'walk',zone:'ground'}],
 kerst: [
  {name:'Kerstman',motion:'walk',zone:'ground'},
  {name:'Rendier',motion:'walk',zone:'ground'},
  {name:'Sneeuwman',motion:'walk',zone:'ground'},
  {name:'Kerstelf',motion:'walk',zone:'ground'},
  {name:'Eigen kerstbalwezen',motion:'float',zone:'air'},
  {name:'Eigen kerstster',motion:'float',zone:'air'}],
 pasen: [
  {name:'Paashaas',motion:'walk',zone:'ground'},
  {name:'Kuiken',motion:'walk',zone:'ground'},
  {name:'Kip',motion:'walk',zone:'ground'},
  {name:'Lammetje',motion:'walk',zone:'ground'},
  {name:'Eigen eierwezen',motion:'walk',zone:'ground'},
  {name:'Eigen bloemenwezen',motion:'walk',zone:'ground'}]
};
for(const w of seasonalWorlds){
 seasonalFigures[w.id].forEach((figure,i)=>templates.push({...figure,id:w.id+'-'+String(i+1).padStart(2,'0'),world:w.id,kind:i<4?'kleur':'ontwerp',index:i}));
 templates.push({id:w.id+'-vrij',world:w.id,name:'Helemaal zelf bedenken',kind:'vrij',motion:'walk',zone:'ground',index:6});
}
