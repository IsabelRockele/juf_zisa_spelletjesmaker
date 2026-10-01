// Public-domain melodies, arranged here as a single classroom melody in C.
// Each pair is [MIDI pitch, duration in quarter-note beats].
const line=(notes,durations)=>notes.map((n,i)=>[n,durations?.[i]??1]);
const SONGS={
 kortjakje:{name:'Altijd is Kortjakje ziek',note:'Zes kleuren. Dezelfde melodie als ‘Twinkel, twinkel, kleine ster’.',phrases:[
 line([60,60,67,67,69,69,67],[1,1,1,1,1,1,2]),
 line([65,65,64,64,62,62,60],[1,1,1,1,1,1,2]),
 line([67,67,65,65,64,64,62],[1,1,1,1,1,1,2]),
 line([67,67,65,65,64,64,62],[1,1,1,1,1,1,2]),
 line([60,60,67,67,69,69,67],[1,1,1,1,1,1,2]),
 line([65,65,64,64,62,62,60],[1,1,1,1,1,1,2])]},
 vader:{name:'Vader Jacob',note:'Versie voor acht standaardbuizen: de sol in het slot is een octaaf hoger.',phrases:[
 line([60,62,64,60,60,62,64,60]),
 line([64,65,67,64,65,67],[1,1,2,1,1,2]),
 line([67,69,67,65,64,60,67,69,67,65,64,60],[.5,.5,.5,.5,1,1,.5,.5,.5,.5,1,1]),
 line([60,67,60,60,67,60],[1,1,2,1,1,2])]},
 ode:{name:'Ode aan de vreugde',note:'Het bekende openingsthema van Beethoven. Vijf kleuren: do, re, mi, fa en sol.',phrases:[
 line([64,64,65,67,67,65,64,62]),
 line([60,60,62,64,64,62,62],[1,1,1,1,1.5,.5,2]),
 line([64,64,65,67,67,65,64,62]),
 line([60,60,62,64,62,60,60],[1,1,1,1,1.5,.5,2])]} };
function buildSong(song,part='all'){const phrases=part==='all'?song.phrases:[song.phrases[Number(part)]];let beat=0;const events=[];phrases.forEach((phrase,p)=>phrase.forEach(([pitch,duration])=>{events.push({pitch,duration,beat,phrase:part==='all'?p:Number(part)});beat+=duration}));return{events,beats:beat}}
