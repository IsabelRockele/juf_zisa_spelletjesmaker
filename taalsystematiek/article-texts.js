(() => {
const themes={neutral:'Neutraal',autumn:'Herfst',halloween:'Halloween',christmas:'Kerst',saint:'Sint',forest:'Het bos'};
// De eerste keuze vormt het leestekstje voor extra steun. Andere keuzes kunnen ook passen.
const texts={
neutral:[
'Noor vindt {een|het} boek. Ze legt {het|een} boek op {de|een} tafel.',
'Sam koopt {een|de} appel. Hij stopt {de|een} appel in {een|de} tas.',
'Op de bank zit {een|het} kind. {Het|Een} kind tekent {een|de} bloem.',
'Lina ziet {een|het} konijn. {Het|Een} konijn eet {een|de} wortel.',
'Mila pakt {een|de} bal. Ze rolt {de|een} bal naar {een|de} hond.',
'Omar bouwt {een|de} toren. Boven op {de|een} toren staat {een|het} vlaggetje.',
'Jules krijgt {een|de} brief. Hij legt {de|een} brief naast {het|een} bord.',
'Fien bakt {een|de} koek. Ze versiert {de|een} koek met {een|het} hartje.'
],
autumn:[
'Noor vindt {een|het} blad. Ze legt {het|een} blad in {een|de} mand.',
'Sam draagt {een|de} regenjas. Aan {de|een} regenjas hangt {een|de} kap.',
'Mila ziet {een|de} egel. {De|Een} egel kruipt onder {een|de} struik.',
'Omar raapt {een|de} kastanje op. Hij stopt {de|een} kastanje in {een|het} doosje.',
'Fien opent {een|de} paraplu. {De|Een} paraplu beschermt haar tegen {de|een} regen.',
'Jules springt in {een|de} plas. Naast {de|een} plas ligt {een|de} tak.',
'Lina ziet {een|de} paddenstoel. Naast {de|een} paddenstoel groeit {een|de} varen.',
'Bas plukt {een|de} peer. Hij legt {de|een} peer op {een|het} bord.'
],
halloween:[
'Noor maakt {een|het} spook. Ze hangt {het|een} spook aan {een|de} tak.',
'Sam tekent {een|de} pompoen. {De|Een} pompoen krijgt {een|de} mond.',
'Mila draagt {een|het} masker. Op {het|een} masker staat {een|de} spin.',
'Omar knipt {een|de} vleermuis uit. Hij plakt {de|een} vleermuis op {het|een} raam.',
'Fien vult {een|het} zakje. Ze stopt {een|het} snoepje in {het|een} zakje.',
'Jules ziet {een|de} heks. {De|Een} heks draagt {een|de} hoed.',
'Lina zet {een|de} lantaarn neer. In {de|een} lantaarn brandt {een|het} lampje.',
'Bas maakt {een|het} web van wol. In {het|een} web hangt {een|de} speelgoedspin.'
],
christmas:[
'Noor kiest {een|de} kerstbal. Ze hangt {de|een} kerstbal in {de|een} boom.',
'Sam maakt {een|de} ster. Hij plakt {de|een} ster op {een|de} kaart.',
'Mila krijgt {een|het} pakje. Rond {het|een} pakje zit {een|het} lint.',
'Omar bakt {een|het} koekje. Hij legt {het|een} koekje op {een|het} bord.',
'Fien ziet {een|de} slee. Naast {de|een} slee staat {een|het} rendier.',
'Jules bouwt {een|de} sneeuwman. {De|Een} sneeuwman draagt {een|de} sjaal.',
'Lina pakt {een|de} kaars. Ze zet {de|een} kaars op {de|een} tafel.',
'Bas maakt {een|het} klokje. Hij hangt {het|een} klokje aan {een|de} tak.'
],
saint:[
'Noor zet {een|de} schoen klaar. In {de|een} schoen ligt {een|de} wortel.',
'Sam maakt {een|de} tekening. Hij geeft {de|een} tekening aan {de|een} Sint.',
'Mila krijgt {een|het} pakje. Ze haalt {een|de} pop uit {het|een} pakje.',
'Omar ziet {een|het} paard. {Het|Een} paard staat naast {een|de} stal.',
'Fien vindt {een|de} letter van chocolade. Ze legt {de|een} letter op {een|het} bord.',
'Jules draagt {een|de} mijter van papier. Op {de|een} mijter kleeft {een|het} kruis.',
'Lina hoort {een|het} lied. Ze zingt {het|een} lied voor {de|een} Sint.',
'Bas ziet {een|de} boot. Op {de|een} boot staat {een|de} zak met pakjes.'
],
forest:[
'Noor ziet {een|de} eekhoorn. {De|Een} eekhoorn springt op {een|de} tak.',
'Sam vindt {een|het} nest. {Het|Een} nest ligt onder {een|de} boom.',
'Mila volgt {een|het} pad. Langs {het|een} pad groeit {een|de} struik.',
'Omar hoort {een|de} uil. {De|Een} uil zit op {een|de} tak.',
'Fien ontdekt {een|het} spoor. Ze tekent {het|een} spoor in {een|het} schrift.',
'Jules ziet {een|de} vos. {De|Een} vos loopt langs {een|de} beek.',
'Lina zoekt {een|de} dennenappel. Ze bewaart {de|een} dennenappel in {een|de} tas.',
'Bas vindt {een|de} veer. Hij bekijkt {de|een} veer met {een|het} vergrootglas.'
]};
const entries=Object.entries(texts).flatMap(([theme,list])=>list.map((text,i)=>{const options=[];return{id:theme+'-'+i,theme,text:text.replace(/\{([^}]+)\}/g,(_,choices)=>{options.push(choices.split('|'));return '{}'}),options}}));
window.TaalArticleTexts={themes,entries,pool:theme=>entries.filter(e=>!theme||theme==='all'||e.theme===theme)};
})();
