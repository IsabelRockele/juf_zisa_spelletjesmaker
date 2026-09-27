// Rebuild the curated game bank from the existing spelling library and local pictures.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
const context = {window:{SpellingWoordenbibliotheek:{registreerGraad(n,d){this[n]=d;}}}};
vm.createContext(context);
for (const file of ['graad1.js','dictee-zinnen-graad1.js']) vm.runInContext(fs.readFileSync(path.join(root,'spelling/woordenbiblio',file),'utf8'),context);
const library=context.window.SpellingWoordenbibliotheek[1];
const sentences=context.window.SpellingDicteeZinnen.graad1;
const images={};
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.png')){const word=entry.name.slice(0,-4);images[word]??=path.relative(__dirname,full).replaceAll('\\','/');}}}
walk(path.join(root,'spelling/afbeeldingen/graad1'));
const categories=[];
function add(id,label,group,sources,list,extra={}){
 const candidates=sources.flatMap(source=>library[source].woorden.map(w=>({...w,source})));
 const words=list.split('|').map(word=>{
  const original=candidates.find(w=>w.tekst===word);
  if(!original)throw Error('Woord ontbreekt: '+id+' '+word);
  const {tekst,lidwoord,verklein,meervoud,verlengd,source}=original;
  const preferred=path.join(root,'spelling/afbeeldingen/graad1',source,tekst+'.png');
  return {word:tekst,article:lidwoord||null,small:verklein||null,plural:meervoud||null,long:verlengd||null,image:fs.existsSync(preferred)?path.relative(__dirname,preferred).replaceAll('\\','/'):images[tekst]||null,sentence:sentences[library[source].groep+'|'+tekst]||null};
 });
 categories.push({id,label,group,...extra,words});
}
add('kort','Korte klanken','MKM-woorden',['mkm-a','mkm-e','mkm-i','mkm-o','mkm-u'],'man|kat|bal|tas|pan|dak|kam|bel|pet|hek|pen|mes|kip|vis|lip|rok|zon|pot|bus|mus');
add('lang','Lange klanken','MKM-woorden',['lk-aa','lk-ee','lk-oo','lk-uu'],'maan|haan|kaas|vaas|been|veer|beek|meer|boom|boot|doos|rook|vuur|muur');
add('tweeteken','Tweetekenklanken: ie, oe, eu, ui','MKM-woorden',['tw-ie','tw-oe','tw-eu','tw-ui'],'bier|mier|wiel|boek|koek|doek|voet|neus|deur|reus|huis|muis|tuin');
add('aai','aai','Lange klankstukken',['tw-aai'],'haai|kraai|draai|zwaai|maai|zaai',{chunk:'aai'});
add('ooi','ooi','Lange klankstukken',['tw-ooi'],'kooi|hooi|mooi|gooi|strooi|prooi',{chunk:'ooi'});
add('oei','oei','Lange klankstukken',['tw-oei'],'boei|groei|bloei|knoei|roei|loeit',{chunk:'oei'});
add('mmkm','MMKM','Medeklinkers samen',['mmkm'],'stip|brug|kruk|klok|knop|klas|slot|blok|vlam|snor|trap|vlag');
add('mkmm','MKMM','Medeklinkers samen',['mkmm'],'melk|wolf|hark|balk|helm|hals|kalf|lamp|harp|kerk|golf|lift');
add('mmmkm','MMMKM','Medeklinkers samen',['mmmkm'],'straat|strik|straal|stroop|spreuk|spraak|streep|struik');
// Herfst is an explicit extra requested alongside the MKMMM practice words.
add('mkmmm','MKMMM + herfst','Medeklinkers samen',['mkmmm'],'worst|kerst|dorst|borst|kunst|markt|herfst');
add('eeuw','eeuw','Lange klankstukken',['tw-eeuw'],'leeuw|sneeuw|eeuw|spreeuw|meeuw|geeuw',{chunk:'eeuw'});
add('ieuw','ieuw','Lange klankstukken',['tw-ieuw'],'kieuw|nieuw|opnieuw|nieuws',{chunk:'ieuw'});
add('uw','uw','Lange klankstukken',['tw-uw'],'duw|sluw|ruw',{chunk:'uw'});
add('ch-g','ch of g','Kiezen en onthouden',['ch-woorden','mmkm','mkm-o'],'lach|pech|brug|vlag',{choices:['ch','g']});
add('cht-gt','cht of gt','Kiezen en onthouden',['cht-woorden','gt-woorden'],'acht|nacht|licht|lucht|recht|hij zegt|hij legt|hij vliegt|hij veegt|hij ligt',{choices:['cht','gt']});
add('ei-ij','ei of ij','Kiezen en onthouden',['tw-ei','tw-ij'],'geit|trein|zeil|plein|klein|tijd|vijf|lijn|rijst|pijp',{choices:['ei','ij']});
add('au-ou','au of ou','Kiezen en onthouden',['tw-au','tw-ou'],'pauw|klauw|saus|blauw|goud|hout|touw|koud',{choices:['au','ou']});
add('sch','sch','Medeklinkers samen',['sch-woorden'],'school|schoen|schip|schaar|schaap|schaal|schat|schop',{choices:['sch','schr']});
add('ng-nk','ng of nk','Kiezen en onthouden',['ng-woorden','nk-woorden'],'ring|tong|slang|wang|bang|bank|pink|plank|vink|flink',{choices:['ng','nk']});
add('d-t','Eindletter d of t','De laatste letter',['verlengingsregel'],'hand|hoed|tand|bed|hond|mond|poort|taart|paard|beurt',{choices:['d','t'],ending:true});
add('b-p','Eindletter b of p','De laatste letter',['verlengingsregel'],'krab|web|rib|trap|step|klap|pop|kip',{choices:['b','p'],ending:true});
add('tje','Verkleinwoord op -tje','Woorden veranderen',['verklein-tje'],'stoel|deur|schoen|trein|kraan|tuin|muur|broer',{transform:'small'});
add('je','Verkleinwoord op -je','Woorden veranderen',['verklein-je'],'boek|huis|muis|neus|voet|fiets|hand|plant',{transform:'small'});
add('pje','Verkleinwoord op -pje','Woorden veranderen',['verklein-pje'],'boom|raam|bloem|duim|arm|droom|riem',{transform:'small'});
add('en','Meervoud op -en','Woorden veranderen',['meervoud-en','meervoud-verdubbel','meervoud-verenkel'],'boek|broek|deur|neus|voet|trein|kat|bal|kip|boom|raam|maan',{transform:'plural'});
add('s','Meervoud op -s','Woorden veranderen',['meervoud-s'],'tafel|tijger|beker|wortel|vlinder|winkel|sleutel|appel',{transform:'plural'});
add('lidwoord','de of het','Lidwoorden',['mkm-a','mkm-e','mkm-i','lk-aa','lk-oo','tw-oe','tw-ui','sch-woorden'],'kat|bal|dak|hek|mes|vis|maan|boom|boek|huis|schip|schaap',{transform:'article'});
function custom(id,label,words,extra={}){categories.push({id,label,group:'Medeklinkers samen',...extra,words:words.map(([word,sentence,article])=>({word,sentence,article:article||null,image:images[word]||null}))});}
custom('mmkmm','MMKMM',[
 ['krant','Papa leest de krant.','de'],['plant','De plant krijgt water.','de'],['klomp','De klomp is van hout.','de'],['klant','De klant koopt een brood.','de'],['prent','In mijn boek staat een prent.','de'],['brand','De brand wordt geblust.','de'],['kwast','Ik schilder met een kwast.','de'],['plank','De plank is van hout.','de']]);
custom('schr','schr',[
 ['schroef','De schroef zit in de plank.','de'],['schram','Ik heb een schram op mijn knie.','de'],['schrik','Ik schrik van het lawaai.'],['schrijf','Ik schrijf in mijn schrift.'],['schrift','Ik werk in mijn schrift.','het'],['schroefje','Het schroefje is heel klein.','het']],{choices:['sch','schr']});
// The source library occasionally stores "hij ..."; retain it as context, not as the answer.
for(const c of categories)for(const w of c.words){if(w.word.startsWith('hij ')){w.sentence??=w.word[0].toUpperCase()+w.word.slice(1)+'.';w.word=w.word.slice(4);}if(c.transform&&!w[c.transform])throw Error('Vorm ontbreekt '+w.word);}
const pairs=[
 {cats:['kort','lang'],words:['man','maan'],sentences:['De … draagt een jas.','De … schijnt aan de hemel.']},
 {cats:['kort','lang'],words:['ram','raam'],sentences:['De … is een mannelijk schaap.','Ik kijk door het … naar buiten.']},
 {cats:['kort','lang'],words:['bom','boom'],sentences:['De … ontploft met een knal.','Aan de … groeien bladeren.']},
 {cats:['kort','lang'],words:['rok','rook'],sentences:['Ik draag een … met stippen.','Uit de schoorsteen komt … .']}
];
fs.writeFileSync(path.join(__dirname,'data.js'),'// Curated snapshot. Rebuild with node build-data.cjs.\nwindow.SpellingData = '+JSON.stringify({categories,pairs},null,2)+';\n');
console.log(categories.length+' categorieën, '+categories.reduce((n,c)=>n+c.words.length,0)+' woorden');
