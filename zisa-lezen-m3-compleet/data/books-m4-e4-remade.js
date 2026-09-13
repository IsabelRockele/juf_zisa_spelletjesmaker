(()=>{
const S=(folder,i)=>`images/${folder}/${String(i+1).padStart(2,"0")}.webp?v=2`;
const C=(q,a,correct,hint)=>({q,a,correct,hint});
const B=(id,level,title,blurb,folder,texts,tasks)=>({id,level,title,blurb,cover:S(folder,0),pages:texts.map((text,i)=>({text,image:S(folder,i),...(tasks[i]?{task:tasks[i]}:{})}))});

window.ZISA_BOOKS.push(
B("m4-deur-trap","M4","De deur onder de trap","Een kleine opdracht leidt naar een groot geheim.","m4-deur",[
"Na school vraagt meester Raf om hulp.\nHij geeft Sami een oude sleutel.\nLina krijgt een doos met boeken.",
"Samen lopen ze door de stille gang.\nDe doos moet in de berging onder de trap.\nSami houdt de sleutel goed vast.",
"Bij de kleine deur blijft Lina staan.\nSami steekt de sleutel in het slot.\nMet een klik gaat de deur open.",
"Achter de deur is het donker en stoffig.\nSami houdt de deur open voor Lina.\nVoorzichtig dragen ze de doos naar binnen.",
"Ze zetten de boeken op een lege plank.\nDan horen ze verderop: tik... tik... tik.\nVerbaasd kijken ze dezelfde kant op.",
"Sami schijnt met een kleine lamp vooruit.\nEen witte pijl wijst tussen de kisten door.\nZe volgen het getik en de pijl.",
"Achter de kisten staat een oud uurwerk.\nGrote tandwielen zitten vast aan een dik touw.\nHet touw verdwijnt door het plafond.",
"Sami ziet dat één tandwiel scheef staat.\nHij wil dichterbij kijken, maar Lina houdt hem tegen.\n‘We halen meester Raf,’ zegt ze.",
"Bij de deur roept Lina de meester.\nMeester Raf komt met zijn gereedschapskist.\nSami toont hem het scheve tandwiel.",
"Meester Raf zet het tandwiel voorzichtig recht.\nSami en Lina blijven veilig naast hem staan.\nLangzaam beginnen de wielen weer te draaien.",
"Het grote wiel trekt aan het dikke touw.\nHoog in de toren zwaait de schoolbel.\nBim-bam! De bel doet het weer.",
"Meester Raf bedankt zijn twee helpers.\nSami en Lina geven elkaar een high five.\nNu kennen ze het geheim onder de trap."
],{1:C("Wat dragen Sami en Lina naar de berging?",["een doos met boeken","een grote klok","een zak met ballen"],0,"Lees wat Lina bij zich heeft."),3:C("Waarom houdt Sami de deur open?",["Omdat de sleutel stuk is.","Omdat Lina de doos draagt.","Omdat de gang te donker is."],1,"Kijk wat Lina in haar handen heeft."),5:C("Wat wijst de weg tussen de kisten?",["een rij lampen","een rood touw","een witte pijl"],2,"Lees de middelste zin."),8:C("Waarom halen de kinderen meester Raf?",["Een tandwiel staat scheef.","De boekendoos is leeg.","De sleutel is weg."],0,"Denk aan wat Sami ontdekt."),10:C("Wat gebeurt er nadat het wiel aan het touw trekt?",["De deur valt dicht.","De schoolbel luidt.","De lamp gaat uit."],1,"Lees de volgende zin.")}),

B("m4-wolkenwolf","M4","Mira en de wolkenwolf","Mira helpt een verdwaalde wolkenwolf naar huis.","m4-wolkenwolf",[
"Na een hevige storm kijkt Mira uit het zolderraam.\nBoven de daken zit een kleine wolkenwolf.\nHij jankt en kijkt steeds naar de rivier.",
"Mira denkt dat de wolf zijn familie kwijt is.\nZe haalt haar feloranje vlieger uit de kast.\nDie is tussen donkere wolken goed te zien.",
"Via het zolderluik stapt Mira op het platte dak.\nZe laat de oranje vlieger hoog stijgen.\nDe wolf volgt het lange lint.",
"De wolf komt voorzichtig dichterbij.\nMira raakt zacht zijn wolkensnuit aan.\nNu weet hij dat hij haar kan vertrouwen.",
"Vanaf de watertoren kunnen ze ver kijken.\nMira wijst de hoge toren aan.\nSamen gaan ze die kant op.",
"Plots trekt een windstoot hard aan de vlieger.\nMira komt los van het dak.\nDe wolkenwolf vliegt onder haar en vangt haar op.",
"Veilig op zijn zachte rug vliegt Mira mee.\nOnder hen glinstert de brede rivier.\nDan horen ze in de verte een wolvenroep.",
"Boven de rivier zien ze drie grote wolkenwolven.\nDe kleine wolf roept blij terug.\nMira weet dat zijn familie is gevonden.",
"De wolkenfamilie sluit de kleine wolf in hun midden.\nZe wrijven blij met hun snuiten tegen elkaar.\nMira kijkt opgelucht toe.",
"Een grote wolkenwolf brengt Mira terug naar huis.\nDe kleine wolf vliegt de hele weg naast haar.\nBij haar dak nemen ze afscheid.",
"De volgende ochtend ligt er iets op de vensterbank.\nHet is een zachte, zilveren wolkenpluim.\nEr glinstert nog wat wolkenstof omheen.",
"Mira houdt de wolkenpluim bij het open raam.\nBoven de rivier ziet ze vier wolkenwolven samen.\nHaar nieuwe vriend is weer veilig thuis."
],{1:C("Waarom kiest Mira een oranje vlieger?",["Hij kan de wind stoppen.","Hij is tussen de wolken goed te zien.","De wolf houdt van oranje."],1,"Lees de laatste zin."),3:C("Hoe merkt de wolf dat hij Mira kan vertrouwen?",["Ze raakt zijn snuit zacht aan.","Ze sluit het zolderluik.","Ze gooit de vlieger weg."],0,"Lees wat Mira doet."),5:C("Hoe voorkomt de wolf dat Mira valt?",["Hij roept heel luid.","Hij vangt haar op.","Hij trekt haar naar de toren."],1,"Lees de laatste zin."),7:C("Waar vindt de wolf zijn familie?",["boven de school","achter de watertoren","boven de rivier"],2,"Lees de eerste zin."),10:C("Wat vindt Mira op de vensterbank?",["een zilveren wolkenpluim","een stuk oranje lint","een blauwe steen"],0,"Kijk en lees wat er ligt.")}),

B("e4-licht-molen","E4","Het licht in de oude molen","Een verdwenen lamp leidt naar een dier in nood.","e4-molen",[
"Yara en Otis kamperen bij opa in de wei.\nVoor het donker zet opa een zonnelamp naast het pad.\nDe oude molen staat stil op de achtergrond.",
"Later willen ze naar hun tent lopen.\nDe zonnelamp is verdwenen.\nIn de zachte aarde vinden ze kleine pootafdrukken.",
"Het spoor loopt in de richting van de molen.\nPlots beweegt achter een hoog raam een geel licht.\nNu weten ze waar de lamp is.",
"Opa gaat voorop met een zaklamp.\nDe grote molendeur zit vast met een hangslot.\nLangs deze deur kunnen ze niet naar binnen.",
"Yara volgt de pootafdrukken rond de molen.\nHet spoor eindigt bij een klein zijluik.\nOtis roept opa erbij.",
"Opa opent het luik heel voorzichtig.\nDe kinderen blijven veilig achter hem.\nVan binnen klinkt een zacht gepiep.",
"In de molen zit een jonge vos.\nZijn poot zit vast in het draaglint van de zonnelamp.\nBij elke beweging zwaait het licht heen en weer.",
"Opa belt meteen de dierenhulp.\nYara schijnt door het luik en Otis blijft stil.\nSamen wachten ze op deskundige hulp.",
"Een dierenhelper trekt handschoenen aan.\nZe knipt het draaglint voorzichtig los.\nDaarna controleert ze de poot van de vos.",
"De jonge vos rust even bij het open luik.\nWanneer hij sterk genoeg is, loopt hij de wei in.\nIedereen blijft rustig op afstand.",
"Aan de rand van de wei verschijnt een moedervos.\nHet jong rent meteen naar haar toe.\nDe twee vossen raken hun snuiten aan.",
"Bij zonsopgang zitten Yara en Otis weer bij de tent.\nDe zonnelamp staat veilig naast opa.\nIn de verte verdwijnen twee rode staarten."
],{1:C("Welke aanwijzing vinden Yara en Otis?",["een blauw lint","kleine pootafdrukken","een gebroken tak"],1,"Kijk naar de zachte aarde."),3:C("Waarom nemen ze niet de grote deur?",["Die zit vast met een hangslot.","Daar brandt geen licht.","Opa is de sleutel kwijt."],0,"Lees de middelste zin."),6:C("Waarom beweegt het licht achter het raam?",["De molen draait rond.","De vos laat de lamp zwaaien.","Otis schijnt met een zaklamp."],1,"Lees wat er gebeurt wanneer de vos beweegt."),8:C("Waarom draagt de dierenhelper handschoenen?",["Ze wil de lamp dragen.","Ze heeft koude handen.","Ze helpt een wild dier veilig."],2,"Denk aan wie ze gaat helpen."),10:C("Hoe vindt het jong zijn moeder terug?",["Ze verschijnt aan de rand van de wei.","Opa brengt haar naar de tent.","De lamp wijst de weg."],0,"Lees de eerste zin.")}),

B("e4-kapitein-kat","E4","De kaart van Kapitein Kat","Finn en Kato volgen elke aanwijzing op een oude kaart.","e4-kapitein-kat",[
"In de havenbibliotheek vinden Finn en Kato een oude kaart.\nDaarop staan rotsen als kattenoren, een grot en een trap.\nEen rij gouden stippen eindigt bij een rode schatplek.",
"Finn stopt de kaart veilig in zijn rugzak.\nSamen stappen ze in hun kleine blauwe zeilboot.\nKato staat als een echte kapitein vooraan.",
"De wind duwt de boot over de golven.\nIn de verte verschijnen twee spitse rotsen.\nZe lijken wel op kattenoren.",
"Finn vergelijkt de rotsen met de kaart.\nTussen de twee punten ziet hij een donkere grot.\nDe eerste aanwijzing klopt.",
"Voorzichtig varen ze tussen de rotsen door.\nDe boot glijdt de donkere grot in.\nFinn houdt de kaart klaar.",
"Binnen vliegen kleine, gouden lichtdiertjes.\nZe verlichten een pijl die in de rots is gekrast.\nFinn en Kato volgen de richting van de pijl.",
"De pijl brengt hen bij een oude stenen trap.\nDe treden lopen omhoog naar het zonlicht.\nFinn en Kato klimmen naar boven.",
"Boven ligt een grote kompasroos in de stenen vloer.\nDe langste punt wijst naar één palmboom.\nOok dit teken stond op de kaart.",
"Naast de palmboom beginnen ze te graven.\nHun schep stoot tegen een houten deksel.\nSamen maken ze een half begraven kist vrij.",
"In de kist liggen zakjes met zaden.\nEen tekening toont bloemen in de zon.\nDit is geen gouden schat, maar een groeischat.",
"Finn en Kato maken kuiltjes op de zonnige plek.\nZe zaaien de zaden en geven ze water.\nDe eerste groene sprietjes komen boven.",
"Na enkele weken staat de plek vol bloemen.\nDe eilandbewoners helpen de tuin verzorgen.\nFinn en Kapitein Kato hebben hun schat gevonden."
],{1:C("Waar bewaart Finn de kaart tijdens de tocht?",["in een houten kist","onder het zeil","in zijn rugzak"],2,"Lees de eerste zin."),3:C("Hoe herkennen ze de juiste grot?",["De rotsen lijken op kattenoren.","Er hangt een rode vlag.","Iemand roept vanuit de grot."],0,"Vergelijk de rotsen met de kaart."),5:C("Wat maken de gouden lichtdiertjes zichtbaar?",["een houten deur","een pijl in de rots","een zak met goud"],1,"Lees de middelste zin."),8:C("Hoe ontdekken ze de kist?",["Kato ruikt eraan.","De wind blaast hem open.","Hun schep raakt het deksel."],2,"Lees wat er tijdens het graven gebeurt."),10:C("Wat doen Finn en Kato na het zaaien?",["Ze geven de zaden water.","Ze varen meteen weg.","Ze sluiten de grot."],0,"Lees de middelste zin.")})
);

window.ZISA_LEVEL_GAMES={
"m4-deur-trap":[C("Waarom halen Sami en Lina de meester?",["Ze durven de boeken niet dragen.","Het uurwerk moet veilig worden hersteld.","Ze willen de deur sluiten."],1,"Denk aan het scheve tandwiel."),{type:"sequence",icon:"⏳",title:"Van opdracht tot bel",q:"Zet de gebeurtenissen in de juiste volgorde.",items:["Meester Raf geeft de sleutel.","De kinderen horen getik.","Ze ontdekken het uurwerk.","De schoolbel luidt weer."],hint:"Lees het hele verhaal opnieuw."},{type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin goed.",image:S("m4-deur",9),parts:[{text:"Meester Raf",role:"wie"},{text:"herstelt",role:"doet"},{text:"het oude uurwerk",role:"wat"}]},C("Wat betekent voorzichtig?",["zonder goed te kijken","rustig en met veel zorg","zo snel mogelijk"],1,"Denk aan hoe meester Raf het tandwiel herstelt."),{type:"choice",icon:"🔎",title:"Zoek de woordsoort",q:"Welk woord is een zelfstandig naamwoord?",a:["stoffig","sleutel","voorzichtig"],correct:1,hint:"Een zelfstandig naamwoord noemt een mens, dier, plant of ding."},{type:"sound",icon:"👂",title:"Doffe e",q:"In welk woord hoor je een doffe e?",sentence:"De sleutel ligt bij het uurwerk.",a:["sleutel","ligt","klok"],correct:0,kind:"doffe e"}],
"m4-wolkenwolf":[C("Waarom is de watertoren nuttig?",["Daar kan Mira slapen.","Daar stopt de storm.","Vanaf die hoge plek kunnen ze ver kijken."],2,"Denk aan wat ze zoeken."),{type:"sequence",icon:"⏳",title:"Van storm tot thuis",q:"Zet de gebeurtenissen in de juiste volgorde.",items:["Mira ziet de eenzame wolf.","De wolf vangt Mira op.","Ze vinden de wolkenfamilie.","Mira krijgt een wolkenpluim."],hint:"Lees het hele verhaal opnieuw."},{type:"sentence",icon:"🧩",title:"Bouw de zin",q:"Zet de zin goed.",image:S("m4-wolkenwolf",6),parts:[{text:"De wolkenwolf",role:"wie"},{text:"draagt",role:"doet"},{text:"Mira",role:"wat"},{text:"boven de stad",role:"waar"}]},C("Wat betekent opgelucht?",["boos omdat iets mislukt","blij omdat het goed afloopt","bang voor een harde wind"],1,"Mira ziet dat de wolf zijn familie terugvindt."),{type:"choice",icon:"🎨",title:"Welk woord maakt de zin rijker?",q:"Welk woord vertelt hoe de vlieger eruitziet?",a:["Mira","feloranje","neemt"],correct:1,hint:"Zoek het woord dat meer vertelt over de vlieger."},{type:"sound",icon:"👂",title:"Doffe e",q:"In welk woord hoor je een doffe e?",sentence:"De kleine wolf volgt de vlieger.",a:["kleine","wolf","volgt"],correct:0,kind:"doffe e"}],
"e4-licht-molen":[C("Hoe kwam de zonnelamp in de molen?",["De molenaar hing hem op.","De vos raakte verstrikt en nam hem mee.","De wind blies hem door het raam."],1,"Denk aan het draaglint rond de poot."),{type:"sequence",icon:"⏳",title:"Volg het spoor",q:"Zet de gebeurtenissen in de juiste volgorde.",items:["De zonnelamp verdwijnt.","Ze volgen pootafdrukken.","De dierenhelper bevrijdt de vos.","Het jong vindt zijn moeder."],hint:"Lees het hele verhaal opnieuw."},{type:"sentence",icon:"🧩",title:"Bouw een langere zin",q:"Zet de zin goed.",image:S("e4-molen",8),parts:[{text:"De dierenhelper",role:"wie"},{text:"knipt los",role:"doet"},{text:"het draaglint",role:"wat"},{text:"in de molen",role:"waar"}]},C("Wat betekent deskundig?",["ergens bang voor zijn","ergens veel van weten","iets snel vergeten"],1,"De dierenhelper weet hoe ze een vos veilig helpt."),{type:"choice",icon:"📍",title:"Zoek het voorzetsel",q:"Welk woord vertelt waar de lamp staat?",a:["lamp","staat","naast"],correct:2,hint:"Het voorzetsel staat voor ‘het pad’."},{type:"sound",icon:"✍️",title:"Open lettergreep",q:"Welk woord heeft een open eerste lettergreep?",sentence:"De molen staat naast de tent.",a:["molen","staat","tent"],correct:0,kind:"open lettergreep mo"}],
"e4-kapitein-kat":[C("Waarom kunnen Finn en Kato de kist vinden?",["Ze volgen elke aanwijzing op de kaart.","Een bewoner verklapt de plek.","De kist ligt naast hun boot."],0,"Denk aan de hele route."),{type:"sequence",icon:"⏳",title:"Volg de kaart",q:"Zet de aanwijzingen in de juiste volgorde.",items:["Ze herkennen de kattenoorrotsen.","De lichtdiertjes tonen een pijl.","De kompasroos wijst naar de palm.","Ze graven de kist op."],hint:"Lees het hele verhaal opnieuw."},{type:"sentence",icon:"🧩",title:"Bouw een langere zin",q:"Zet de zin goed.",image:S("e4-kapitein-kat",8),parts:[{text:"Finn en Kato",role:"wie"},{text:"graven op",role:"doet"},{text:"een houten kist",role:"wat"},{text:"naast de palmboom",role:"waar"}]},C("Wat is een groeischat?",["iets dat groter wordt door het te planten","een kist die vanzelf groeit","goud dat onder een boom ligt"],0,"Denk aan wat er in de zakjes zit."),{type:"choice",icon:"🐞",title:"Zoek het verkleinwoord",q:"Welk woord is een verkleinwoord?",a:["lichtdiertjes","gouden","tonen"],correct:0,hint:"Een verkleinwoord eindigt vaak op -je, -tje of -pje."},{type:"sound",icon:"✍️",title:"Gesloten lettergreep",q:"Welk woord begint met een gesloten lettergreep?",sentence:"Finn bekijkt de kompasroos.",a:["kompasroos","Finn","bekijkt"],correct:0,kind:"gesloten lettergreep kom"}]};

window.ZISA_SPEED_GAMES={
"m4-deur-trap":{type:"speed",words:["school","sleutel","boeken","berging","donker","stoffig","plank","getik","pijl","kisten","uurwerk","tandwiel","meester","veilig","draaien","schoolbel"]},
"m4-wolkenwolf":{type:"speed",words:["storm","zolder","wolkenwolf","rivier","oranje","vlieger","donker","snuit","vertrouwen","watertoren","windstoot","zachte","wolvenroep","familie","afscheid","vensterbank"]},
"e4-licht-molen":{type:"speed",words:["kamperen","zonnelamp","verdwenen","pootafdrukken","windmolen","hangslot","zijluik","draaglint","beweging","deskundige","dierenhulp","handschoenen","controleert","afstand","moedervos","zonsopgang"]},
"e4-kapitein-kat":{type:"speed",words:["havenbibliotheek","schatkaart","kattenoren","zeilboot","rugzak","aanwijzing","lichtdiertjes","rotswand","stenen","kompasroos","palmboom","begraven","deksel","groeischat","sprietjes","verzorgen"]}
};
})();
