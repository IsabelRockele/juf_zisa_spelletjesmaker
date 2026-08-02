(() => {
  const doelen = window.LEESBOOSTER_DOELEN;
  const $ = s => document.querySelector(s);
  const state = { family:'combinaties', vorm:'woorden', selectedGoals:[], blocks:[], nonce:0, storySequence:0 };
  const vormen = [
    ['woorden','Woordenrijen'],['zoek','Zoek het leesstuk'],['piramide','Leespiramide'],
    ['zinnen','Zinnen lezen'],['tekst','Korte leestekst'],['verhaal','Verhaal + vragen']
  ];
  const niveauNaam = {steun:'★',basis:'★★',vlot:'★★★'};
  const kleuren = {combinaties:'#4a90d9',lettergrepen:'#43a064',uitspraak:'#e69a2e'};
  const vocab = {
    'wr':[['wrak','de resten van een kapot schip'],['wrikken','met korte bewegingen iets losmaken'],['wrijven','met je hand heen en weer bewegen']],
    'th':[['thema','het onderwerp waarover iets gaat'],['theater','een gebouw waar voorstellingen plaatsvinden'],['therapie','een behandeling om iemand te helpen']],
    'i-ie':[['diploma','een bewijs dat je een opleiding afrondde'],['studio','een ruimte waar beeld of geluid wordt opgenomen'],['liter','een maat waarmee je inhoud meet']],
    'au-ou':[['applaus','klappen om te tonen dat je iets goed vindt'],['gebouw','een bouwwerk waarin mensen kunnen wonen of werken'],['pauze','een korte tijd waarin je stopt met werken']],
    'ei-ij':[['reiziger','iemand die onderweg is'],['vijver','een kleine aangelegde waterplas'],['wedstrijd','een gebeurtenis waarbij deelnemers proberen te winnen']],
    'aai-ooi-oei':[['loeien','het geluid maken van een koe'],['prooi','een dier dat door een ander dier wordt gevangen'],['groeien','groter of langer worden']],
    'eeuw-ieuw-uw':[['ruw','niet glad of zacht'],['waarschuwen','iemand vooraf voor gevaar verwittigen'],['opnieuw','nog een keer']],
    'ng-nk':[['flink','goed, sterk of moedig'],['bedanken','zeggen dat je blij bent met iemands hulp'],['koning','het mannelijke hoofd van een koninkrijk']],
    'ch-g':[['goochelaar','iemand die trucs uitvoert'],['kachel','een toestel dat een ruimte verwarmt'],['verschijnen','zichtbaar worden of tevoorschijn komen']],
    'cht-gt':[['bocht','een kromming in een weg of rivier'],['volgen','achter iemand of iets aangaan'],['zacht','niet hard of ruw']],
    'oo-ch':[['verdwijnen','opeens niet meer te zien zijn'],['goocheltruc','een handeling die onmogelijk lijkt'],['begrijpen','weten wat iets betekent']],
    'kort-open-ch':[['echo','een geluid dat terugkaatst'],['glimlachen','vriendelijk lachen zonder geluid'],['kachel','een toestel dat een ruimte verwarmt']],
    'ds':[['loods','een groot gebouw om spullen te bewaren'],['gids','iemand die bezoekers uitleg en de weg toont'],['sinds','vanaf een bepaald moment tot nu']],
    'teit-heid':[['kwaliteit','hoe goed iets is'],['veiligheid','een toestand waarin er weinig gevaar is'],['mogelijkheid','iets wat kan gebeuren of gedaan worden']],
    'uitgangen':[['tentoonstelling','een plek waar voorwerpen worden getoond'],['officieel','formeel en volgens de regels'],['praktisch','handig en bruikbaar']],
    'gesloten':[['boswachter','iemand die voor het bos zorgt'],['ontdekken','iets vinden dat je nog niet kende'],['ondertussen','in de tijd dat iets anders gebeurt']],
    'open':[['avontuur','een spannende belevenis'],['vakantie','een periode waarin je niet naar school of werk hoeft'],['buren','mensen die dicht bij je wonen']],
    'politie':[['informatie','uitleg of gegevens die je iets vertellen'],['actie','iets wat iemand doet om een doel te bereiken'],['presentatie','een uitleg die je aan een groep geeft']],
    'eau':[['tableau','een groot schilderij of een grote afbeelding'],['plateau','een hoog en vlak stuk grond'],['niveau','een trap of moeilijkheidsgraad']]
  };
  const lettergreepHulp={gesloten:['bom-men','tas-sen','fles-sen','bal-len','kam-men','mus-sen','kat-ten','kip-pen','vis-sen','sok-ken','rug-gen','bak-ken','bel-len','ren-nen','stop-pen','zwem-men','bin-nen','lek-ker','let-ter','num-mer','ap-pel','win-ter','dok-ter','man-tel','var-ken','won-der','ham-ster','rug-zak','zak-lamp','voet-bal','school-tas','hand-doek','tand-arts','pick-nick','bas-ket-bal','knut-se-len','ver-tel-len','ont-dek-ken','ver-stop-pen','ver-trek-ken','ver-za-me-len','ver-schil-lend','kin-de-ren','on-der-tus-sen','span-nend','grap-pig','mak-ke-lijk','rus-tig'],open:['ta-fel','bo-men','le-zen','mu-ren','vo-gel','ja-ren','dro-men','ra-men','ste-nen','be-nen','zo-mer','wa-ter','la-ter','me-ter','bo-ter','do-zen','gla-zen','lo-pen','ko-ken','spe-len','ge-ven','ma-ken','pra-ten','dra-gen','we-gen','ze-ven','ne-gen','bo-ven','o-ma','o-pa','ra-di-o','pi-a-no','to-ma-ten','ba-na-nen','va-kan-tie','a-von-tu-ren','te-le-fo-ne-ren','bi-bli-o-theek','be-wo-ners','be-we-gen','ge-lo-ven','pro-be-ren','ver-ha-len','op-ha-len','re-ke-nen','te-ke-nen','be-le-ven','ver-de-len','ver-ge-ten']};
  const storyBits = {
    'wr':['Bij een oud wrak wriemelt iets dat zich tussen twee planken wringt.','Noor wrikt een plank los en wrijft het natte zand van een klein gouden slot.'],
    'th':['Het spoor loopt door een oud theater waar het thema van de voorstelling over een geheim in de bibliotheek gaat.','Naast een thermos vindt Noor een kaartje voor een nieuwe theaterscène.'],
    'i-ie':['Een taxi brengt Noor naar een studio waar een gitaar naast een piano staat.','Op de tafel liggen een video en een diploma met een onbekende naam.'],
    'au-ou':['Buiten wacht een blauwe auto bij een oud gebouw.','Een vrouw opent de deur en krijgt luid applaus van een kleine kabouter.'],
    'ei-ij':['Een trein voert Noor naar een plein met een fonkelende vijver.','Bij het gordijn vindt ze eindelijk een klein deel van de geheime kaart.'],
    'aai-ooi-oei':['Een kraai vliegt uit een kooi en wijst de weg naar een mooie wei.','Terwijl de bloemen groeien, loeien de koeien alsof ze Noor willen waarschuwen.'],
    'eeuw-ieuw-uw':['Bij de zee vliegt een meeuw boven een nieuwe boot.','Noor duwt de boot door de ruwe sneeuw die opeens op het strand ligt.'],
    'ng-nk':['In de verte klinkt gezang uit een donkere winkel.','Een flinke jongen legt een ring op de bank en wijst naar de linkse deur.'],
    'ch-g':['Achter de deur staat een goochelaar naast een warme kachel.','Hij laat een vogel verschijnen en iedereen begint te lachen.'],
    'cht-gt':['In de nacht volgt Noor een licht door een scherpe bocht.','Een zachte stem zegt dat ze moet kijken waar de vogel vliegt.'],
    'oo-ch':['Een goochelaar haalt een kaart uit zijn hoge hoed.','Na de goocheltruc verschijnt het volgende stukje van de kaart.'],
    'kort-open-ch':['Noor hoort gelach en een echo in een lange gang.','Bij de kachel glimlacht een kind dat haar een sleutel geeft.'],
    'ds':['Een gids wacht bij een oude loods aan de rand van de stad.','Ginds ligt een schip dat sinds gisteren niemand meer heeft gezien.'],
    'teit-heid':['In een geheime kamer onderzoekt Noor de kwaliteit van de kaart.','Voor haar veiligheid moet ze de juiste mogelijkheid kiezen.'],
    'uitgangen':['Een officiële gids toont Noor een speciale tentoonstelling.','Een praktisch toestel maakt een digitaal deel van de kaart zichtbaar.'],
    'gesloten':['In een winters bos ontdekt Noor een varken achter een hek.','De boswachter vertelt dat het dier een stuk van de kaart heeft gevonden.'],
    'open':['Hoge bomen buigen opzij en tonen een tafel vol rozen.','Tijdens dit avontuur moet Noor de tekens op de tafel lezen.'],
    'politie':['Bij het station vraagt Noor informatie aan de politie.','Door een actie vertrekt de trein later, maar haar reis kan doorgaan.'],
    'eau':['Op een bureau ligt een cadeau naast een kleurrijk tableau.','In het cadeau vindt Noor het laatste stukje van de kaart.']
  };
  const storyThemes = {
    wrak:{title:'Het geheim van het wrak',image:'afbeeldingen/verhalen/het-geheim-van-het-wrak.png',base:['Noor wandelt langs het strand wanneer ze bij een oud wrak een klein kistje vindt.','Onder een losse plank ontdekt ze een gouden slot dat precies op een gevonden sleutel past.','Wanneer het kistje opengaat, rolt er een geheimzinnige kaart over het zand.'],transitions:['Het eerste spoor op de kaart leidt Noor langs de kapotte planken.','Even later licht aan de rand van de kaart een nieuwe plek op.','Daarna draait de gouden pijl naar een volgend teken.','Bij het laatste teken hoort Noor zacht geritsel.'],end:['Als de zon begint te zakken, bewaart Noor de kaart zorgvuldig in het kistje.','Morgen wil ze terugkomen om het volgende geheim te ontdekken.']},
    theater:{title:'Het geheim achter het doek',image:'afbeeldingen/verhalen/het-geheim-van-het-theater.png',base:['Na de repetitie mag Noor nog even achter het grote rode toneeldoek kijken.','Tussen de kostuums vindt ze een gouden kaartje zonder naam of nummer.','Zodra het zaallicht dooft, wijst een fonkelende ster op het kaartje naar een oude reiskoffer.'],transitions:['In de koffer ontdekt Noor het eerste spoor.','Achter een volgend gordijn beweegt plots een nieuw decor.','Een warme spot verlicht daarna een tweede aanwijzing.','Vlak voor het podium vindt Noor het laatste teken.'],end:['Net voor de conciërge komt, legt Noor alles voorzichtig terug.','Ze weet zeker dat de volgende repetitie nog een verrassing zal brengen.']},
    bos:{title:'De deur in de oude boom',image:'afbeeldingen/verhalen/de-deur-in-het-bos.png',base:['Tijdens een avondwandeling ziet Noor lichtgevende tekens op het bospad.','De tekens leiden haar naar een oude boom met een piepklein houten deurtje.','Naast het deurtje ligt een opgerolde kaart die warm aanvoelt.'],transitions:['Het eerste spoor kronkelt tussen de wortels van de boom.','Verderop wijst de kaart naar een nieuwe open plek.','Een uil vliegt voor Noor uit naar het volgende teken.','Bij het laatste spoor blijft een nieuwsgierig konijn wachten.'],end:['Wanneer de maan hoog staat, sluit Noor het kleine deurtje voorzichtig.','Ze neemt de kaart mee, want het bos heeft nog lang niet al zijn geheimen verteld.']},
    museum:{title:'Het museum na sluitingstijd',image:'afbeeldingen/verhalen/het-museum-na-sluitingstijd.png',base:['Noor blijft na sluitingstijd even bij de jonge museumgids wachten.','In een glazen kast begint een oude kaart plots goud te glanzen.','Naast de kaart ligt een sleutel die op geen enkele gewone deur past.'],transitions:['Het eerste spoor loopt langs een oud scheepsmodel.','Daarna wijst de kaart naar een zaal achter een zwaar gordijn.','Onder het skelet van een dinosaurus verschijnt een nieuwe aanwijzing.','Het laatste teken eindigt bij een kleine deur in de muur.'],end:['De gids bergt de sleutel veilig op voordat de lichten uitgaan.','Noor mag morgen terugkomen om samen de geheime deur te openen.']},
    winterbos:{families:['lettergrepen'],title:'De sporen in het winterbos',image:'afbeeldingen/verhalen/de-deur-in-het-bos.png',base:['Tijdens een winterwandeling ontdekt Noor vreemde sporen tussen de hoge bomen.','De sporen lopen langs een bevroren vijver naar een kleine houten hut.','Op de deur hangt een briefje met woorden die Noor hardop moet lezen.'],transitions:['Na het eerste woord verschijnt er een pijl in de sneeuw.','Verderop ontdekt Noor een nieuw spoor tussen de wortels.','Een vogel vliegt naar de volgende aanwijzing.','Bij de hut wacht het laatste raadsel.'],end:['Wanneer Noor het laatste woord leest, gaat de deur van de hut open.','Binnen wacht warme chocolademelk en een brief van de boswachter.']},
    boomhut:{families:['lettergrepen'],title:'Het geheim van de boomhut',image:'afbeeldingen/verhalen/de-deur-in-het-bos.png',base:['Achter in de tuin vindt Noor een ladder tegen een oude boom.','Boven de takken staat een boomhut die ze nog nooit eerder heeft gezien.','Op de tafel ligt een boek met een klein houten sleuteltje.'],transitions:['Op de eerste bladzijde staat een korte aanwijzing.','Daarna wijst een tekening naar een kastje in de muur.','Onder een kussen vindt Noor een tweede briefje.','Het laatste spoor loopt naar het raam.'],end:['Met het sleuteltje opent Noor een kist vol oude verhalen.','Ze kiest één boek en begint meteen te lezen.']},
    radiostudio:{families:['uitspraak'],title:'Het raadsel in de radiostudio',image:'afbeeldingen/verhalen/het-geheim-van-het-theater.png',base:['Noor mag een middag meekijken in een echte radiostudio.','Op het bureau staat een microfoon naast een pakje zonder naam.','Wanneer het rode licht aangaat, hoort ze een geheimzinnige boodschap.'],transitions:['De eerste aanwijzing klinkt door de grote koptelefoon.','Daarna verschijnt een boodschap op het scherm.','Een nieuwe stem vertelt waar Noor verder moet zoeken.','Bij de microfoon ligt het laatste raadsel.'],end:['Noor vindt in het pakje een kleine gouden radio.','De presentator belooft dat ze morgen zelf iets mag vertellen.']},
    cadeau:{families:['uitspraak'],title:'Het verdwenen cadeau',image:'afbeeldingen/verhalen/het-museum-na-sluitingstijd.png',base:['Op het bureau van de directeur ligt alleen nog een leeg lint.','Het cadeau voor de school is vlak voor de presentatie verdwenen.','Noor vindt naast het lint een kaartje met een vreemde aanwijzing.'],transitions:['Het eerste spoor leidt naar de lange gang.','Bij het station op de kaart staat een nieuw teken.','Daarna hoort Noor muziek uit een kleine radio.','Achter een tableau vindt ze het laatste briefje.'],end:['In een kast ontdekt Noor het cadeau veilig onder een doek.','Net op tijd brengt ze het naar de feestzaal voor de presentatie.']},
    dierenpark:{focus:['aai-ooi-oei','eeuw-ieuw-uw','ng-nk','ei-ij'],title:'Het geheim van het dierenpark',image:'afbeeldingen/verhalen/het-geheim-van-het-dierenpark.png',base:['Noor volgt een kraai door het dierenpark.','Bij de mooie vijver loeit een koe terwijl jonge planten langs het water groeien.','Een flinke verzorger waarschuwt Noor dat een nieuw dierenverblijf nog gesloten is.'],transitions:['De kraai vliegt naar een kooi bij de weide.','Een konijn springt langs de linkse oever.','Bij een ruwe bank vindt Noor een ring.','De prooi van de leeuw blijkt een speelgoedmuis te zijn.'],end:['Achter het houten hek ontdekt Noor een veilig nest met jonge dieren.','De koning van het dierenpark, een oude leeuw, brult haar vriendelijk gedag.']},
    goochelwedstrijd:{focus:['ch-g','cht-gt','oo-ch','kort-open-ch'],title:'De magische goochelwedstrijd',image:'afbeeldingen/verhalen/de-magische-goochelwedstrijd.png',base:['In de nacht volgt Noor een zacht licht naar een goochelwedstrijd.','Een goochelaar staat bij een warme kachel en laat een vogel verschijnen.','Noor begint te lachen wanneer zijn hoge hoed plots verdwijnt.'],transitions:['Een lichtstraal vliegt door een scherpe bocht.','In de gang hoort Noor een echo terugkaatsen.','Na de goocheltruc verschijnt een gouden kaart.','Noor begrijpt dat ze de vogel moet volgen.'],end:['De vogel landt op de kist met de hoofdprijs.','De goochelaar glimlacht en geeft Noor de geheime kaart.']},
    stadsraadsel:{focus:['th','i-ie','au-ou','ei-ij','ds'],title:'Het raadsel van de oude stad',image:'afbeeldingen/verhalen/het-raadsel-van-de-stad.png',base:['Een taxi brengt Noor van het station naar een oud plein.','Naast het theater staat een groot gebouw met een kleine studio.','Een gids toont een kaart waarop de bibliotheek en een vijver zijn getekend.'],transitions:['Een reiziger wijst naar de trein achter het gordijn.','Tijdens de pauze drinkt Noor uit een thermos.','In een loods vindt ze een video en een diploma.','Sinds gisteren wacht daar een blauwe auto.'],end:['Het thema van de route blijkt een reis door de stad te zijn.','De gids krijgt applaus wanneer Noor het laatste spoor vindt.']},
    uitvindersbeurs:{focus:['teit-heid','uitgangen','politie','eau'],title:'De geheime uitvindersbeurs',image:'afbeeldingen/verhalen/de-geheime-uitvindersbeurs.png',base:['Noor bezoekt een officiële tentoonstelling vol bijzondere uitvindingen.','Op een bureau staan een gouden radio en een cadeau.','Aan de muur hangt een kleurrijk tableau van een uitvinding.','Een praktische machine controleert de kwaliteit en veiligheid van elke uitvinding.'],transitions:['De politie geeft informatie over een verdwenen toestel.','Noor onderzoekt elke mogelijkheid op een digitaal plateau.','Een speciale actie brengt de machine naar een hoger niveau.','De officiële gids start daarna zijn presentatie.'],end:['In de machine vindt Noor het verdwenen toestel veilig terug.','De uitvinder bedankt haar en geeft haar het cadeau.']}
  };
  storyThemes.wrak.base=['Noor wandelt langs het strand en ziet een oud wrak bij het water.','Tussen de planken wriemelt iets kleins heen en weer.','Noor wrikt voorzichtig een losse plank omhoog en wrijft het natte zand weg.','Onder de plank vindt ze een kistje met een gouden slot en een geheimzinnige kaart.'];
  storyThemes.theater.base=['Na de repetitie blijft Noor nog even in het oude theater.','Het thema van de voorstelling is een geheim achter het grote rode toneeldoek.','Tussen de kostuums vindt ze een gouden kaartje zonder naam of nummer.','Wanneer het zaallicht dooft, wijst een fonkelende ster op het kaartje naar een oude reiskoffer.'];
  storyThemes.dierenpark.transitions=['De kraai vliegt naar een kooi bij de weide.','Op de kooi staat een pijl die naar de linkse oever wijst.','Bij een ruwe bank vindt Noor een ring met de afbeelding van een leeuw.','De ring past precies in een opening naast het houten hek.'];
  storyThemes.stadsraadsel.transitions=['Een reiziger wijst Noor naar een gordijn in de hal van het theater.','Achter het gordijn vindt ze een plattegrond met een trein erop.','Tijdens de pauze drinkt Noor uit een thermos en bestudeert ze de route.','In een oude loods ontdekt ze een video en een diploma met het laatste teken.'];
  storyThemes.cadeau.transitions=['Het eerste spoor leidt Noor door de lange gang.','Op een tableau van het station ontdekt ze een klein muzieknootje.','Wanneer Noor erop drukt, hoort ze muziek uit een kast.','Achter de kastdeur vindt ze het laatste briefje.'];
  storyThemes.uitvindersbeurs.transitions=['De politie geeft informatie over het verdwenen toestel.','Noor onderzoekt elke mogelijkheid op het digitale bedieningspaneel.','Met een speciale actie opent ze een verborgen deel van de machine.','De officiële gids helpt haar om de machine veilig uit te schakelen.'];
  storyThemes.uitvindersbeurs.end=['In de machine vindt Noor het verdwenen toestel veilig terug.','Daarna hervat de gids zijn presentatie en bedankt de uitvinder Noor met een mooi cadeau.'];
  storyThemes.museum.end=['De gids bergt de sleutel veilig op, zodat niemand hem kan kwijtraken.','Noor mag morgen terugkomen om samen de geheime deur te openen.'];
  const themeFocus={wrak:['wr'],theater:['th'],bos:['gesloten','open'],museum:['ds'],winterbos:['gesloten','open'],boomhut:['gesloten','open'],radiostudio:['i-ie'],cadeau:['eau','politie']};
  const focusFor=(id,theme)=>themeFocus[id]||theme.focus||[];
  const storyQuestions = {
    wrak:{q1:'Waar vindt Noor de geheimzinnige kaart?',a1:['in een kistje bij het wrak','in haar boekentas','onder een strandstoel'],q2:'Wat helpt Noor om de route te volgen?',a2:['het spoor op de kaart','een bord op het strand','een bericht op haar telefoon'],q3:'Waarom wil Noor de volgende dag terugkomen?',a3:['om het volgende geheim te ontdekken','om haar jas te zoeken','om te gaan zwemmen']},
    theater:{q1:'Wat vindt Noor tussen de kostuums?',a1:['een gouden kaartje','een zaklamp','een oud boek'],q2:'Waardoor weet Noor waar ze moet zoeken?',a2:['door een fonkelende ster op het kaartje','door een brief van de conciërge','door een pijl op de vloer'],q3:'Waarom legt Noor alles voorzichtig terug?',a3:['omdat de conciërge eraan komt','omdat de voorstelling begint','omdat ze het kaartje niet mooi vindt']},
    bos:{q1:'Waar leiden de lichtgevende tekens Noor naartoe?',a1:['naar een oude boom','naar een station','naar het strand'],q2:'Welke dieren helpen Noor de sporen te volgen?',a2:['een uil en een konijn','een hond en een poes','een vos en een beer'],q3:'Waarom neemt Noor de kaart mee naar huis?',a3:['omdat het bos nog meer geheimen heeft','omdat de kaart van haar is','omdat ze de kaart wil verkopen']},
    museum:{q1:'Wat begint in de glazen kast te gloeien?',a1:['een oude kaart','een schilderij','een kroon'],q2:'Waar eindigt het laatste teken?',a2:['bij een kleine deur in de muur','bij de ingang van het museum','onder een schilderij'],q3:'Waarom bewaart de gids de sleutel veilig?',a3:['zodat niemand hem kwijtraakt','omdat hij niet meer werkt','omdat Noor hem niet mooi vindt']},
    winterbos:{q1:'Waar leiden de sporen Noor naartoe?',a1:['naar een houten hut','naar het station','naar een winkel'],q2:'Wat moet Noor met de woorden op het briefje doen?',a2:['ze hardop lezen','ze overschrijven','ze in haar jas stoppen'],q3:'Wat wacht er in de hut?',a3:['warme chocolademelk en een brief','een gouden kroon en een kaart','een slapende beer']},
    boomhut:{q1:'Wat vindt Noor op de tafel?',a1:['een boek en een sleuteltje','een radio en een beker','een jas en een kaart'],q2:'Waar vindt Noor een tweede briefje?',a2:['onder een kussen','in haar jaszak','onder de ladder'],q3:'Wat zit er in de kist?',a3:['oude verhalen','speelgoedauto’s','potten verf']},
    radiostudio:{q1:'Wat staat er naast de microfoon?',a1:['een pakje zonder naam','een vaas met bloemen','een stapel kranten'],q2:'Waar hoort Noor de eerste aanwijzing?',a2:['door de grote koptelefoon','uit haar telefoon','bij de deur'],q3:'Wat mag Noor de volgende dag doen?',a3:['zelf iets vertellen','een lied zingen op het podium','het cadeau naar huis brengen']},
    cadeau:{q1:'Wat ligt er nog op het bureau?',a1:['een leeg lint','een gouden sleutel','een boek'],q2:'Waar vindt Noor het laatste briefje?',a2:['achter een tableau','onder het bureau','in de feestzaal'],q3:'Waarom brengt Noor het cadeau snel naar de feestzaal?',a3:['omdat de presentatie bijna begint','omdat ze naar huis wil','omdat het cadeau te zwaar is']},
    dierenpark:{q1:'Welk dier volgt Noor?',a1:['een kraai','een meeuw','een uil'],q2:'Wat vindt Noor bij de ruwe bank?',a2:['een ring','een sleutel','een boek'],q3:'Wie is de koning van het dierenpark?',a3:['een oude leeuw','een koe','een konijn']},
    goochelwedstrijd:{q1:'Waar staat de goochelaar?',a1:['bij een warme kachel','bij een vijver','bij een trein'],q2:'Wat verschijnt na de goocheltruc?',a2:['een gouden kaart','een blauw lint','een oude sleutel'],q3:'Welk dier moet Noor volgen?',a3:['de vogel','de hond','het konijn']},
    stadsraadsel:{q1:'Hoe komt Noor in de oude stad?',a1:['met een taxi','met een boot','met de fiets'],q2:'Wat vindt Noor in de loods?',a2:['een video en een diploma','een kroon en een ring','een boek en een sleutel'],q3:'Waarom krijgt de gids applaus?',a3:['omdat Noor het laatste spoor vindt','omdat hij een lied zingt','omdat de trein vertrekt']},
    uitvindersbeurs:{q1:'Wat controleert de praktische machine?',a1:['kwaliteit en veiligheid','kleur en gewicht','tijd en temperatuur'],q2:'Wie geeft informatie over het verdwenen toestel?',a2:['de politie','de koning','de boswachter'],q3:'Waar vindt Noor het toestel?',a3:['in de machine','onder het bureau','achter het tableau']}
  };
  storyQuestions.cadeau.q2='Waar vindt Noor het cadeau en het laatste briefje?';storyQuestions.cadeau.a2=['achter de kastdeur','onder het bureau','in de feestzaal'];
  const supportThemes={
    wrak:{start:['Noor wandelt op het strand.','Ze ziet een oud wrak bij het water.','Onder een losse plank vindt ze een klein kistje.','In het kistje ligt een geheimzinnige kaart.','Op de kaart staat een duidelijk spoor.','Noor volgt het spoor langs de planken.','Zo vindt ze stap voor stap de juiste weg.'],end:['Noor legt de kaart veilig terug in het kistje.','Morgen komt ze terug om het volgende geheim te ontdekken.']},
    theater:{start:['Noor is in een oud theater.','Ze kijkt achter het rode doek.','Tussen de kostuums vindt ze een gouden kaartje.','Op het kaartje staat een fonkelende ster.','De ster wijst naar een oude koffer.','Noor opent de koffer.','Daar vindt ze een nieuw spoor.'],end:['De conciërge komt eraan en Noor legt alles terug.','Bij de volgende repetitie wil ze verder zoeken.']},
    bos:{start:['Noor wandelt in het bos.','Op het pad ziet ze lichtgevende tekens.','De tekens leiden naar een oude boom.','In de boom zit een klein deurtje.','Een uil wijst Noor de weg.','Bij het volgende spoor wacht een konijn.','Naast het deurtje vindt Noor een kaart.'],end:['Noor neemt de kaart mee naar huis.','Het bos heeft nog meer geheimen.']},
    museum:{start:['Noor is na sluitingstijd in het museum.','In een glazen kast begint een oude kaart te gloeien.','Naast de kaart ligt een kleine sleutel.','Het spoor loopt door verschillende zalen.','Noor volgt elk teken op de kaart.','Het laatste teken wijst naar een kleine deur in de muur.','De sleutel past precies op die deur.'],end:['De gids bergt de sleutel veilig op zodat niemand hem kwijtraakt.','Morgen openen Noor en de gids samen de deur.']},
    winterbos:{start:['Noor wandelt door een wit winterbos.','In de sneeuw ziet ze vreemde sporen.','De sporen leiden naar een houten hut.','Op de deur hangt een briefje.','Op het briefje staan moeilijke woorden.','Noor moet de woorden hardop lezen.','Na elk woord verschijnt een nieuwe pijl.'],end:['Na het laatste woord gaat de deur open.','In de hut wachten warme chocolademelk en een brief.']},
    boomhut:{start:['Noor ziet een ladder tegen een oude boom.','Boven in de boom staat een boomhut.','Noor klimt voorzichtig naar boven.','Op de tafel liggen een boek en een sleuteltje.','In het boek staat een korte aanwijzing.','Onder een kussen vindt Noor een tweede briefje.','Het briefje wijst naar een kleine kist.'],end:['In de kist zitten oude verhalen.','Noor kiest een boek en begint te lezen.']},
    radiostudio:{start:['Noor bezoekt een echte radiostudio.','Op het bureau staat een microfoon.','Naast de microfoon ligt een pakje zonder naam.','Dan gaat het rode licht aan.','Noor zet de grote koptelefoon op.','Door de koptelefoon hoort ze de eerste aanwijzing.','Ze volgt de boodschap op het scherm.'],end:['In het pakje vindt Noor een gouden radio.','Morgen mag ze zelf iets vertellen op de radio.']},
    cadeau:{start:['Op het bureau ligt alleen een leeg lint.','Het cadeau voor de school is verdwenen.','Noor vindt een kaartje met een aanwijzing.','Ze volgt het spoor door de lange gang.','Daar hoort ze muziek uit een kleine radio.','Achter een tableau vindt ze het laatste briefje.','Het briefje wijst naar een kast.'],end:['Noor brengt het cadeau snel naar de feestzaal omdat de presentatie bijna begint.','Ze komt precies op tijd aan.']},
    dierenpark:{start:['Noor loopt door het dierenpark.','Ze volgt een zwarte kraai.','Bij de vijver loeit een koe.','Een konijn springt naar een ruwe bank.','Bij de bank vindt Noor een ring.','De kraai vliegt naar een houten hek.','Achter het hek ligt een veilig nest.'],end:['Een oude leeuw brult vriendelijk naar Noor.','Hij is de koning van het dierenpark.']},
    goochelwedstrijd:{start:['Noor bezoekt een goochelwedstrijd.','Het is nacht en een zacht licht wijst de weg.','Een goochelaar staat bij een warme kachel.','Hij laat een witte vogel verschijnen.','Daarna voert hij een goocheltruc uit.','Na de truc verschijnt een gouden kaart.','Op de kaart staat een vogel.'],end:['Noor begrijpt dat ze de vogel moet volgen.','De vogel brengt haar naar de hoofdprijs.']},
    stadsraadsel:{start:['Een taxi brengt Noor naar de oude stad.','Ze stapt uit op een groot plein.','Daar ontmoet ze een vriendelijke gids.','De gids toont haar het theater en de bibliotheek.','In een loods vindt Noor een video en een diploma.','Daarna volgt ze een spoor langs de vijver.','Zo vindt Noor het laatste teken.'],end:['De gids krijgt applaus omdat Noor het laatste spoor vindt.','Samen keren ze terug naar het station.']},
    uitvindersbeurs:{start:['Noor bezoekt een uitvindersbeurs.','Een officiële gids toont een praktische machine.','De machine controleert kwaliteit en veiligheid.','Dan blijkt een toestel verdwenen.','De politie geeft Noor informatie.','Noor onderzoekt de machine.','Binnenin vindt ze het verdwenen toestel.'],end:['De uitvinder bedankt Noor voor haar hulp.','Als beloning krijgt ze een mooi cadeau.']}
  };
  supportThemes.wrak.start=['Noor wandelt op het strand.','Ze ziet een oud wrak bij het water.','Tussen de planken wriemelt iets kleins.','Noor wrikt een losse plank omhoog.','Ze wrijft het natte zand weg.','Onder de plank vindt ze een klein kistje.','In het kistje ligt een geheimzinnige kaart.'];
  supportThemes.theater.start=['Noor is in een oud theater.','Het thema van de voorstelling is een geheim achter het rode doek.','Na de repetitie kijkt Noor tussen de kostuums.','Daar vindt ze een gouden kaartje.','Op het kaartje staat een fonkelende ster.','De ster wijst naar een oude koffer.','In de koffer vindt Noor een nieuw spoor.'];
  supportThemes.dierenpark.start=['Noor loopt door het dierenpark.','Ze volgt een zwarte kraai.','Bij de vijver loeit een koe.','De kraai vliegt naar een kooi bij de weide.','Op de kooi staat een pijl naar een ruwe bank.','Bij de bank vindt Noor een ring met een leeuw erop.','De ring opent het houten hek.'];
  supportThemes.stadsraadsel.start=['Een taxi brengt Noor naar de oude stad.','Ze stapt uit op een groot plein.','Daar ontmoet ze een vriendelijke gids.','De gids toont haar het theater en de bibliotheek.','Achter een gordijn vindt Noor een kaart met een trein erop.','De kaart leidt naar een oude loods.','Daar vindt ze een video en een diploma met het laatste teken.'];
  supportThemes.stadsraadsel.end=['Op het plein vertelt Noor hoe ze het raadsel heeft opgelost.','De gids krijgt applaus en samen keren ze terug naar het station.'];
  supportThemes.cadeau.start=['Op het bureau ligt alleen een leeg lint.','Het cadeau voor de school is verdwenen.','Noor vindt een kaartje met een aanwijzing.','Ze volgt het spoor door de lange gang.','Op een tableau van het station ziet ze een muzieknootje.','Wanneer ze erop drukt, hoort ze muziek uit een kast.','Achter de kastdeur vindt ze het cadeau en het laatste briefje.'];
  const supportBits={
    'wr':['Noor ziet het wrak van een kapot schip.','Ze wrikt een plank los en wrijft het zand eraf.'],
    'th':['In het theater ziet Noor een voorstelling met de zee als thema.','Een acteur vertelt dat therapie mensen kan helpen om zich beter te voelen.'],
    'i-ie':['In een studio neemt iemand muziek en geluid op.','Aan de muur hangt een diploma en op tafel staat een fles van één liter.'],
    'au-ou':['Noor loopt een groot gebouw binnen en neemt even pauze.','Na de voorstelling klapt het publiek luid: wat een applaus!'],
    'ei-ij':['Een reiziger is onderweg met de trein.','Bij een vijver ziet Noor kinderen oefenen voor een wedstrijd.'],
    'aai-ooi-oei':['Een koe begint luid te loeien in de wei.','Een vos zoekt een prooi en de jonge planten blijven groeien.'],
    'eeuw-ieuw-uw':['De ruwe plank voelt niet glad aan.','Noor waarschuwt haar vriend voor een gat en probeert de sprong opnieuw.'],
    'ng-nk':['Een flinke jongen durft als eerste naar binnen.','Hij bedankt de koning voor zijn hulp.'],
    'ch-g':['Een goochelaar toont trucs aan het publiek.','Bij de warme kachel laat hij plots een duif verschijnen.'],
    'cht-gt':['De weg maakt een scherpe bocht naar links.','Noor moet het licht volgen en hoort daarna een zachte stem.'],
    'oo-ch':['Een goochelaar voert een wonderlijke goocheltruc uit.','De kaart lijkt te verdwijnen, maar Noor begrijpt hoe de truc werkt.'],
    'kort-open-ch':['Noor hoort een echo: haar stem kaatst terug.','Bij de warme kachel begint een kind vriendelijk te glimlachen.'],
    'ds':['Een gids toont Noor de weg en geeft uitleg.','Sinds vandaag bewaart hij spullen in een grote loods.'],
    'teit-heid':['Noor controleert de kwaliteit en kijkt hoe goed de kaart is gemaakt.','Voor haar veiligheid kiest ze de mogelijkheid zonder gevaar.'],
    'uitgangen':['Een officiële gids werkt volgens de regels.','Op de tentoonstelling gebruikt hij een praktisch, handig toestel.'],
    'gesloten':['De boswachter zorgt elke dag voor het bos.','Ondertussen ontdekt Noor iets wat ze nog niet kende.'],
    'open':['Deze spannende tocht is een echt avontuur.','In de vakantie vertellen de buren wat zij hebben gezien.'],
    'politie':['De politie geeft Noor informatie over wat er is gebeurd.','Daarna komt iedereen in actie en begint Noor haar presentatie.'],
    'eau':['Aan de muur hangt een kleurrijk tableau van een schip op zee.','Op het bureau ligt een cadeau naast een klein plateau.']
  };
  const pictureVocabulary={
    cadeau:{image:'afbeeldingen/verhalen/het-museum-na-sluitingstijd.png',items:[['luchtballon',14,17],['zeilschip',7,43],['skelet',78,27],['wereldbol',91,70],['sleutel',46,82]]},
    uitvindersbeurs:{image:'afbeeldingen/verhalen/de-geheime-uitvindersbeurs.png',items:[['machine',55,45],['radio',69,78],['cadeau',87,79],['vulkaan',7,70]]},
    wrak:{image:'afbeeldingen/verhalen/het-geheim-van-het-wrak.png',items:[['wrak',72,29],['kistje',48,69],['meeuw',67,53],['schelp',15,86]]}
  };

  function shuffle(a, salt=0){
    const x=[...a]; let seed=(123457+salt*101+state.nonce*997)%2147483647;
    for(let i=x.length-1;i>0;i--){seed=seed*16807%2147483647;const j=seed%(i+1);[x[i],x[j]]=[x[j],x[i]]}return x;
  }
  function renderDoelen(){
    const list=doelen.filter(d=>d.family===state.family);
    $('#doelKeuzes').innerHTML=list.map(d=>`<label class="goal-choice ${state.selectedGoals.includes(d.id)?'selected':''}"><input type="checkbox" value="${d.id}" ${state.selectedGoals.includes(d.id)?'checked':''}><span><b>${d.label}</b><small>${d.tip}</small></span></label>`).join('');
    updateDoelInfo();
  }
  function selectedDoelen(){return state.selectedGoals.map(id=>doelen.find(d=>d.id===id)).filter(Boolean)}
  function allowedStoryThemeIds(){
    const families=[...new Set(selectedDoelen().map(d=>d.family))];
    const selectedIds=selectedDoelen().map(d=>d.id);
    const special=Object.entries(storyThemes).filter(([id,theme])=>theme.families?.some(f=>families.includes(f))&&(!focusFor(id,theme).length||focusFor(id,theme).some(goal=>selectedIds.includes(goal)))).map(([id])=>id);
    const focused=Object.entries(storyThemes).filter(([id,theme])=>focusFor(id,theme).some(goal=>selectedIds.includes(goal))).map(([id])=>id);
    const generic=Object.entries(storyThemes).filter(([,theme])=>!theme.families&&!theme.focus).map(([id])=>id);
    if(focused.length)return [...new Set([...focused,...special,...generic])];
    return families.length===1&&special.length?special:Object.entries(storyThemes).filter(([,theme])=>!theme.families).map(([id])=>id);
  }
  function bestStoryThemeId(ids,ds=selectedDoelen()){
    return ids.map((id,index)=>{const theme=storyThemes[id];const text=[...theme.base,...theme.transitions,...theme.end].join(' ').toLowerCase();const score=ds.reduce((total,d)=>total+(focusFor(id,theme).includes(d.id)?20:0)+d.words.reduce((n,w)=>n+(text.includes(w.toLowerCase())?1:0),0),0);return{id,index,score}}).sort((a,b)=>b.score-a.score||a.index-b.index)[0]?.id||ids[0];
  }
  function updateStoryThemes(){
    const select=$('#verhaalThema');if(!select)return;const previous=select.value;const ids=allowedStoryThemeIds();
    const best=bestStoryThemeId(ids);select.innerHTML=`<option value="verrassing">Beste verhaal voor mijn keuze: ${storyThemes[best]?.title||''}</option>`+ids.map(id=>`<option value="${id}">${storyThemes[id].title}</option>`).join('');
    select.value=ids.includes(previous)||previous==='verrassing'?previous:'verrassing';
  }
  function updateDoelInfo(){
    const selected=selectedDoelen();
    $('#mixStatus').textContent=!selected.length?'Nog geen leesdoel gekozen':selected.length===1?`Gericht oefenen: ${selected[0].label}`:`Mix van ${selected.length} leesdoelen: ${selected.map(d=>d.label).join(' · ')}`;
    $('#mixStatus').classList.toggle('mixed',selected.length>1);
    $('#woordVoorbeeld').innerHTML=selected.slice(0,4).flatMap(d=>d.words.slice(0,3).map(w=>`<span>${w}</span>`)).join('');
    updateStoryThemes();
  }
  function renderVormen(){
    $('#vormKeuzes').innerHTML=vormen.map(([id,label])=>`<button class="choice ${id===state.vorm?'active':''}" data-vorm="${id}">${label}</button>`).join('');
    updateLevelAvailability();
  }
  function updateLevelAvailability(){
    const vlot=$('#niveauKeuzes input[value="vlot"]');
    const limited=state.vorm==='piramide';
    vlot.closest('label').hidden=limited;
    if(limited) vlot.checked=false;
    $('#alleNiveaus').textContent=limited?'Selecteer beide niveaus':'Selecteer alle 3';
    $('#niveauBeperking').hidden=!limited;
  }
  function markeerLettergrepen(text,id){
    const parts=lettergreepHulp[id]||[],index=new Map(parts.map(split=>[split.replaceAll('-',''),split]));if(!parts.length)return text;
    const words=[...index.keys()].sort((a,b)=>b.length-a.length).join('|'),re=new RegExp(`(^|[^\\p{L}])(${words})(?=$|[^\\p{L}])`,'giu');
    return text.replace(re,(all,prefix,word)=>{let pieces=index.get(word.toLowerCase()).split('-');if(word[0]===word[0].toUpperCase())pieces[0]=pieces[0][0].toUpperCase()+pieces[0].slice(1);return prefix+pieces.map((piece,i)=>`<span class="syllable-part ${i%2?'syllable-b':'syllable-a'}">${piece}</span>`).join('<i class="syllable-hyphen">-</i>')});
  }
  function markeer(word,d){
    if(d.id==='gesloten'||d.id==='open')return markeerLettergrepen(word,d.id);
    if(d.id==='i-ie') return word.replace(/i/gi,m=>`<span class="leesstuk">${m}</span>`);
    if(d.id==='politie') return word.replace(/ti(?=[ea])/gi,m=>`<span class="leesstuk">${m}</span>`);
    if(d.id==='eau') return word.replace(/eau/gi,m=>`<span class="leesstuk">${m}</span>`);
    const parts=d.label.split(/, | en | klinkt.*/).map(x=>x.replace(/[^a-z-]/gi,'')).filter(x=>x.length>1).sort((a,b)=>b.length-a.length);
    const re=parts.length?new RegExp(parts.map(x=>x.replace('-','')).join('|'),'gi'):null;
    return re?word.replace(re,m=>`<span class="leesstuk">${m}</span>`):word;
  }
  function sentences(d){ return window.LEESBOOSTER_TEKSTEN[d.id]?.sentences || []; }
  function pyramidSentence(d,niveau,salt){
    const available=[...sentences(d)].filter(Boolean).sort((a,b)=>a.split(/\s+/).length-b.split(/\s+/).length);
    if(!available.length) return `${d.words[0]} staat in deze zin.`;
    const part=niveau==='steun'?available.slice(0,Math.max(1,Math.ceil(available.length/2))):niveau==='vlot'?available.slice(Math.floor(available.length/2)):available;
    return part[salt%part.length];
  }
  function pyramidLines(sentence){
    const words=sentence.replace(/[.!?]+$/,'').split(/\s+/).filter(Boolean);
    const stops=[2,3,Math.min(5,words.length),words.length].filter((n,i,a)=>n<=words.length&&a.indexOf(n)===i);
    return stops.map(n=>words.slice(0,n).join(' ')+(n===words.length?(sentence.match(/[.!?]+$/)?.[0]||'.'):''));
  }
  function shortenStorySentence(sentence){
    let s=sentence;
    if(/^Wanneer /i.test(s)&&s.includes(','))s=s.split(',').slice(1).join(',').trim();
    else for(const joiner of [' wanneer ',' die ',' dat ',' terwijl ',' voordat ']){if(s.toLowerCase().includes(joiner)){s=s.slice(0,s.toLowerCase().indexOf(joiner));break}}
    if(s.split(/\s+/).length>11&&s.includes(','))s=s.split(',')[0];
    if(s.split(/\s+/).length>11&&s.includes(' en '))s=s.split(' en ')[0];
    s=s.replace(/[.!?]*$/,'.').trim();return s.charAt(0).toUpperCase()+s.slice(1);
  }
  function storySentences(ds,theme,niveau='basis'){
    const themeId=Object.keys(storyThemes).find(id=>storyThemes[id]===theme);
    if(niveau==='steun'){
      const easy=supportThemes[themeId];
      return [...easy.start,'Noor kijkt nog één keer goed om zich heen.',...easy.end];
    }
    const story=[...theme.base,...theme.transitions,'Noor denkt rustig na over alle aanwijzingen die ze heeft gevonden.'];
    if(niveau==='vlot')story.push('Plots begrijpt ze hoe de aanwijzingen samen één duidelijke boodschap vormen.');
    return [...story,...theme.end].slice(0,15);
  }
  function storyWordBank(ds,niveau){
    if(niveau==='vlot')return '';
    const count=niveau==='steun'?6:8;const pool=[...new Set(ds.flatMap(d=>d.words))].sort((a,b)=>niveau==='steun'?a.length-b.length:a.localeCompare(b,'nl')).slice(0,count);
    const words=pool.map(word=>{const d=ds.find(goal=>goal.words.includes(word));return `<span>${niveau==='steun'?markeer(word,d):word}</span>`}).join('');
    return `<section class="story-wordbank ${niveau}"><b>Lees eerst deze woorden:</b><div>${words}</div></section>`;
  }
  function questionHtml(type,themeId){
    const q=storyQuestions[themeId];
    const open=(nr,q,lines=2)=>`<div class="question"><b>${nr}. ${q}</b>${'<div class="answer-line"></div>'.repeat(lines)}</div>`;
    const multi=(nr,q,opts)=>`<div class="question"><b>${nr}. ${q}</b><div class="answers">${opts.map((x,i)=>`<label><span class="answer-box"></span><span>${String.fromCharCode(65+i)}. ${x}</span></label>`).join('')}</div></div>`;
    if(type==='open') return open(1,q.q1)+open(2,q.q2)+open(3,q.q3,3);
    if(type==='meerkeuze') return multi(1,q.q1,q.a1)+multi(2,q.q2,q.a2)+multi(3,q.q3,q.a3);
    return multi(1,q.q1,q.a1)+open(2,q.q2)+open(3,q.q3,3);
  }
  function levelStoryTasksHtml(themeId,niveau){
    const q=storyQuestions[themeId],theme=storyThemes[themeId],themeIndex=Object.keys(storyThemes).indexOf(themeId);
    const open=(q,lines=2)=>`<div class="question"><b>${q}</b>${'<div class="answer-line"></div>'.repeat(lines)}</div>`;
    const multi=(q,opts)=>`<div class="question"><b>${q}</b><div class="answers">${opts.map((x,i)=>`<label><span class="answer-box"></span><span>${String.fromCharCode(65+i)}. ${x}</span></label>`).join('')}</div></div>`;
    const truth=()=>`<div class="question task-box"><b>Waar of niet waar?</b><p>Kruis het juiste antwoord aan.</p>${[theme.base[0],theme.transitions.at(-1),'Noor vindt geen enkele aanwijzing.'].map(s=>`<div class="truth-row"><span>${s}</span><label><span class="answer-box"></span> waar</label><label><span class="answer-box"></span> niet waar</label></div>`).join('')}</div>`;
    const order=()=>{const lines=[...theme.base.slice(0,3)];const shown=themeIndex%2?[lines[1],lines[2],lines[0]]:[lines[2],lines[0],lines[1]];return `<div class="question task-box"><b>Zet in de juiste volgorde.</b><p>Schrijf 1, 2 en 3 in de vakjes.</p>${shown.map(s=>`<div class="order-row"><span class="order-box"></span><span>${s}</span></div>`).join('')}</div>`};
    const words=theme.base[0].replace(/[.!?]/g,'').split(' '),rotated=[...words.slice(2),...words.slice(0,2)].join(' · ');
    const writing=niveau==='steun'?`<div class="writing-task"><b>Maak een goede zin.</b><p>Zet de woorden in de juiste volgorde: <span class="scrambled">${rotated}</span></p><div class="answer-line"></div></div>`:niveau==='basis'?`<div class="writing-task"><b>Vul de zin aan.</b><p>${theme.base[1].replace(/\b[\p{L}’'-]+([.!?])$/u,'________________$1')}</p><div class="answer-line"></div></div>`:`<div class="writing-task"><b>Schrijf zelf een goede zin over het verhaal.</b><p>Vertel iets dat belangrijk was in het verhaal.</p><div class="answer-line"></div><div class="answer-line"></div></div>`;
    const reminder='<p class="writing-reminder">Denk aan een hoofdletter, goede woordvolgorde en een leesteken.</p>';
    if(niveau==='steun')return multi(q.q1,q.a1)+(themeIndex%2?truth():order())+open(q.q3,1)+writing+reminder;
    if(niveau==='basis')return (themeIndex%2?multi(q.q1,q.a1):order())+open(q.q2,1)+open(q.q3,2)+writing+reminder;
    return open(q.q1,2)+open(q.q2,2)+open(q.q3,2)+writing+reminder;
  }
  function readingTasksHtml(themeId,niveau,ds){
    const q=storyQuestions[themeId],theme=storyThemes[themeId],idx=Object.keys(storyThemes).indexOf(themeId);
    const open=(q,lines=2)=>`<div class="question"><b>${q}</b>${'<div class="answer-line"></div>'.repeat(lines)}</div>`;
    const multi=(q,opts)=>`<div class="question"><b>${q}</b><div class="answers">${opts.map((x,i)=>`<label><span class="answer-box"></span><span>${String.fromCharCode(65+i)}. ${x}</span></label>`).join('')}</div></div>`;
    const taskLines=storySentences(ds,theme,niveau),statements=[taskLines[0],taskLines.at(-2),'Noor vindt geen enkele aanwijzing.'];
    const truth=`<div class="question task-box"><b>Waar of niet waar?</b><p>Kruis het juiste antwoord aan.</p>${statements.map(s=>`<div class="truth-row"><span>${s}</span><label><span class="answer-box"></span> waar</label><label><span class="answer-box"></span> niet waar</label></div>`).join('')}</div>`;
    const original=taskLines.slice(0,3),shown=idx%2?[original[1],original[2],original[0]]:[original[2],original[0],original[1]];
    const order=`<div class="question task-box"><b>Zet de gebeurtenissen in de juiste volgorde.</b><p>Schrijf 1, 2 en 3 in de vakjes.</p>${shown.map(s=>`<div class="order-row"><span class="order-box"></span><span>${s}</span></div>`).join('')}</div>`;
    if(niveau==='steun')return multi('1. '+q.q1,q.a1)+multi('2. '+q.q2,q.a2)+truth+order+open('5. '+q.q3,2);
    if(niveau==='basis')return multi('1. '+q.q1,q.a1)+truth+order+open('4. '+q.q2,2)+open('5. '+q.q3,3);
    return open('1. '+q.q1,3)+open('2. '+q.q2,3)+open('3. '+q.q3,3)+open('4. Welke aanwijzing vond jij het belangrijkst? Waarom?',3)+open('5. Bedenk een andere passende titel voor het verhaal.',2);
  }
  function pictureVocabularyHtml(themeId){
    const set=pictureVocabulary[themeId];if(!set)return'';
    return `<section class="vocab-task picture-vocab"><h2>3. Zet het juiste nummer in de cirkel</h2><p>Bekijk de woorden en zoek elk voorwerp in de afbeelding.</p><div class="picture-word-list">${set.items.map((x,i)=>`<span><b>${i+1}.</b> ${x[0]}</span>`).join('')}</div><div class="picture-scene" style="background-image:url('${set.image}')">${set.items.map(x=>`<span class="picture-number" style="left:${x[1]}%;top:${x[2]}%"></span>`).join('')}</div></section>`;
  }
  function vocabularyTasksHtml(ds,niveau,includeThird=true){
    const items=[];for(let round=0;items.length<3;round++)for(const d of ds){const pair=vocab[d.id][round%vocab[d.id].length];items.push({d,word:pair[0],meaning:pair[1]});if(items.length===3)break}
    const context=x=>{const stem=x.word.toLowerCase().slice(0,Math.max(4,x.word.length-3));return supportBits[x.d.id].find(s=>s.toLowerCase().includes(stem))||`In het verhaal staat het woord ${x.word}.`};
    const match=`<section class="vocab-task"><h2>1. Verbind woord en betekenis</h2><div class="vocab-match"><div>${items.map((x,i)=>`<span>${i+1}. <b>${x.word}</b></span>`).join('')}</div><div>${[...items].reverse().map((x,i)=>`<span>${String.fromCharCode(65+i)}. ${x.meaning}</span>`).join('')}</div></div></section>`;
    const use=`<section class="vocab-task"><h2>2. Kies de juiste zin</h2><p>In welke zin wordt <b>${items[0].word}</b> juist gebruikt?</p><div class="vocab-usage"><label><span class="answer-box"></span><span>${context(items[0])}</span></label><label><span class="answer-box"></span><span>Ik ${items[0].word} elke ochtend naar school.</span></label><label><span class="answer-box"></span><span>De boterham smaakt heel ${items[0].word}.</span></label></div></section>`;
    const third=niveau==='steun'?`<section class="vocab-task"><h2>3. Kies de juiste betekenis</h2><p>Wat betekent <b>${items[1].word}</b>?</p><div class="answers"><label><span class="answer-box"></span><span>${items[1].meaning}</span></label><label><span class="answer-box"></span><span>${items[2].meaning}</span></label></div></section>`:niveau==='basis'?`<section class="vocab-task"><h2>3. Vul het juiste woord in</h2><p class="word-box">Kies uit: ${items.map(x=>x.word).join(' · ')}</p><p>${context(items[1]).replace(new RegExp(items[1].word.slice(0,Math.max(4,items[1].word.length-3))+'[\\p{L}’\'-]*','iu'),'________________')}</p><div class="answer-line"></div></section>`:`<section class="vocab-task"><h2>3. Leg uit en gebruik</h2><p>Leg <b>${items[1].word}</b> uit in je eigen woorden.</p><div class="answer-line"></div><div class="answer-line"></div><p>Schrijf daarna een goede zin met <b>${items[2].word}</b>.</p><div class="answer-line"></div><div class="answer-line"></div></section>`;
    return match+use+(includeThird?third:'');
  }
  function writingTasksHtml(theme,niveau){
    const scramble=s=>{const words=s.replace(/[.!?]/g,'').split(' ');return [...words.slice(2),...words.slice(0,2)].join(' · ')};
    const line='<div class="answer-line"></div>';
    if(niveau==='steun')return `<section class="writing-sheet-task"><h2>1. Zet de woorden in de juiste volgorde</h2><p class="scrambled">${scramble(theme.base[0])}</p>${line}</section><section class="writing-sheet-task"><h2>2. Maak nog een goede zin</h2><p class="scrambled">${scramble(theme.base[1])}</p>${line}</section><section class="writing-sheet-task"><h2>3. Maak de zin af</h2><p>Noor vindt ________________________________.</p>${line}</section>`;
    if(niveau==='basis')return `<section class="writing-sheet-task"><h2>1. Vul de zin aan</h2><p>${theme.base[0].replace(/\b[\p{L}’'-]+([.!?])$/u,'________________$1')}</p>${line}</section><section class="writing-sheet-task"><h2>2. Schrijf wat daarna gebeurt</h2>${line}${line}</section><section class="writing-sheet-task"><h2>3. Schrijf één zin over de belangrijkste aanwijzing</h2>${line}${line}</section>`;
    return `<section class="writing-sheet-task"><h2>1. Beschrijf de belangrijkste gebeurtenis in één goede zin</h2>${line}${line}</section><section class="writing-sheet-task"><h2>2. Schrijf een zin waarin je jouw mening over het verhaal geeft</h2>${line}${line}</section><section class="writing-sheet-task"><h2>3. Bedenk een passende slotzin voor een vervolg</h2>${line}${line}</section>`;
  }
  function vocabHtml(ds,type){
    const items=[];
    for(let round=0;items.length<3;round++) for(const d of ds){const pair=vocab[d.id][round%vocab[d.id].length];items.push({d,word:pair[0],meaning:pair[1]});if(items.length===3)break}
    if(type==='gebruik'){
      const x=items[0],stem=x.word.toLowerCase().slice(0,Math.max(4,x.word.length-3)); const correct=supportBits[x.d.id].find(s=>s.toLowerCase().includes(stem))||sentences(x.d).find(s=>s.toLowerCase().includes(stem))||`In het verhaal krijgt ${x.word} een duidelijke betekenis.`;
      return `<h2>Woordenschat</h2><p>In welke zin wordt <b>${x.word}</b> juist gebruikt?</p><div class="vocab-usage"><label><span class="answer-box"></span><span>${correct}</span></label><label><span class="answer-box"></span><span>Ik ${x.word} elke ochtend naar school.</span></label><label><span class="answer-box"></span><span>De boterham smaakt heel ${x.word}.</span></label></div>`;
    }
    return `<h2>Woordenschat</h2><p>Verbind elk woord met de juiste verklaring.</p><div class="vocab-match"><div>${items.map((x,i)=>`<span>${i+1}. <b>${x.word}</b></span>`).join('')}</div><div>${[...items].reverse().map((x,i)=>`<span>${String.fromCharCode(65+i)}. ${x.meaning}</span>`).join('')}</div></div>`;
  }
  function paperHeader(subtitle,fields){
    return `<div class="paper-head booster-head"><img class="booster-zebra" src="afbeeldingen/zisa-leesbooster.png" alt="Zisa leest enthousiast in een boek"><div class="booster-brand"><div class="booster-title"><span>Lees</span><span>booster</span><i>★</i></div><p>${subtitle}</p></div>${fields?`<div class="student-fields">${fields}</div>`:''}</div>`;
  }
  function storyPages(b,startPage,blockIndex){
    const ds=b.doelen.map(id=>doelen.find(d=>d.id===id)).filter(Boolean);
    const theme=storyThemes[b.verhaalThema]||storyThemes.wrak;
    const title=ds.length===1?`${theme.title} – ${ds[0].label}`:`${theme.title} – mix van ${ds.map(d=>d.label).join(', ')}`;
    const lines=storySentences(ds,theme,b.niveau); const story=lines.map(s=>`<span class="story-sentence">${b.niveau==='steun'?ds.reduce((out,d)=>markeer(out,d),s):s}</span>`).join('');const wordBank=storyWordBank(ds,b.niveau);
    const remove=`<button class="remove-story" data-remove="${blockIndex}" title="Verwijder dit volledige verhaal met vragen">🗑 Verwijder verhaal + vragen</button>`;
    const page1=`<article class="paper story-page story-level-${b.niveau}">${remove}${paperHeader('Samen groeien in lezen',b.naamDatum?'Naam: ____________________<br>Datum: ____________________':'')}<h1 class="story-title">${title}</h1><p class="story-instruction">${b.niveau==='steun'?'★ Lees eerst de woorden en daarna het verhaal.':b.niveau==='basis'?'★★ Lees eerst de woorden en daarna het verhaal.':'★★★ Lees het verhaal meteen mooi door.'}</p>${wordBank}<div class="story-image" role="img" aria-label="Illustratie bij ${theme.title}" style="background-image:url('${theme.image}')"></div><div class="story-text">${story}</div><footer class="page-footer"><span>${lines.length} zinnen · ${ds.map(d=>d.label).join(' · ')}</span><span>pagina ${startPage}</span></footer></article>`;
    const page2=`<article class="paper question-page reading-page question-level-${b.niveau}">${remove}${paperHeader('Begrijpend lezen',b.naamDatum?'Naam: ____________________':'')}<p class="question-kicker">Begrijpend lezen · ${niveauNaam[b.niveau]}</p><h1 class="question-story-title">${title}</h1>${readingTasksHtml(b.verhaalThema,b.niveau,ds)}<footer class="page-footer"><span>Lees terug in de tekst als je twijfelt.</span><span>pagina ${startPage+1}</span></footer></article>`;
    const hasPicture=!!pictureVocabulary[b.verhaalThema]&&b.niveau!=='vlot';
    const page3=`<article class="paper question-page vocabulary-page question-level-${b.niveau}">${remove}${paperHeader('Woordenschat',b.naamDatum?'Naam: ____________________':'')}<p class="question-kicker">Drie woordenschatopdrachten · ${niveauNaam[b.niveau]}</p><h1 class="question-story-title">${title}</h1>${vocabularyTasksHtml(ds,b.niveau,!hasPicture)}<footer class="page-footer"><span>Zoek de woorden opnieuw in het verhaal.</span><span>pagina ${startPage+2}</span></footer></article>`;
    const picturePage=hasPicture?`<article class="paper question-page vocabulary-page picture-vocabulary-page question-level-${b.niveau}">${remove}${paperHeader('Woordenschat met een afbeelding',b.naamDatum?'Naam: ____________________':'')}<p class="question-kicker">Derde woordenschatopdracht · ${niveauNaam[b.niveau]}</p><h1 class="question-story-title">${title}</h1>${pictureVocabularyHtml(b.verhaalThema)}<footer class="page-footer"><span>Kijk goed naar elk voorwerp.</span><span>pagina ${startPage+3}</span></footer></article>`:'';
    const writingPageNo=startPage+(hasPicture?4:3);const page4=`<article class="paper question-page writing-page question-level-${b.niveau}">${remove}${paperHeader('Zinnen maken en schrijven',b.naamDatum?'Naam: ____________________':'')}<p class="question-kicker">Schrijven bij het verhaal · ${niveauNaam[b.niveau]}</p><h1 class="question-story-title">${title}</h1>${writingTasksHtml(theme,b.niveau)}<p class="writing-reminder">Controleer elke zin: hoofdletter · goede woordvolgorde · leesteken.</p><footer class="page-footer"><span>Lees je zinnen nog eens na.</span><span>pagina ${writingPageNo}</span></footer></article>`;
    return {html:page1+page2+page3+picturePage+page4,count:hasPicture?5:4};
  }
  function balancedWords(ds,aantal,salt,niveau){
    const pools=ds.map((d,i)=>{const pool=shuffle(d.words,salt+i*97);if(niveau==='steun')pool.sort((a,b)=>a.length-b.length);if(niveau==='vlot')pool.sort((a,b)=>b.length-a.length);return pool}); const result=[];
    for(let i=0;i<aantal;i++){const di=i%ds.length;result.push({word:pools[di][Math.floor(i/ds.length)%pools[di].length],d:ds[di]})}
    return shuffle(result,salt+701);
  }
  function blockHtml(b,index){
    const ds=b.doelen.map(id=>doelen.find(x=>x.id===id)).filter(Boolean); const entries=balancedWords(ds,b.aantal,index*41,b.niveau);
    const shown=e=>b.niveau==='steun'?markeer(e.word,e.d):e.word;
    const title=ds.length===1?ds[0].label:`Mix: ${ds.map(d=>d.label).join(' · ')}`;
    const normalNote=b.niveau==='steun'?'<b>★</b> Wijs het gekleurde leesstuk aan en lees elk woord één keer rustig.':b.niveau==='basis'?'<b>★★</b> Lees elk woord nauwkeurig. Onderstreep twee moeilijke woorden en lees alleen die opnieuw.':'<b>★★★ Uitdaging:</b> 1. Lees nauwkeurig. 2. Lees opnieuw mooi door, zonder te hakken.<div class="fluency-record"><span>Beurt 1: ____ sec. &nbsp; ____ fout(en)</span><span>Beurt 2: ____ sec. &nbsp; ____ fout(en)</span></div>';
    const pyramidNote=b.niveau==='steun'?'<b>★</b> Elke regel wordt langer. Lees telkens de hele regel; het gekleurde leesstuk helpt je.':'<b>★★</b> Begin bij elke nieuwe regel opnieuw links en lees de steeds langere zin helemaal.';
    const levelNote=b.vorm==='piramide'?pyramidNote:normalNote;
    let content=`<div class="level-note ${b.niveau}">${levelNote}</div>`;
    if(b.vorm==='woorden') content+=`<div class="read-grid ${b.niveau}">${entries.map(e=>`<span>${shown(e)}</span>`).join('')}</div>`;
    if(b.vorm==='zoek') content+=`<div class="zoek-grid">${entries.map((e,i)=>`<span><i class="zoek-teken">${i%3===0?'□':'○'}</i><span class="zoek-word">${shown(e)}</span></span>`).join('')}<p>Zoek de leesstukken <b>${ds.map(d=>d.label).join(', ')}</b>. Lees daarna alle woorden.</p></div>`;
    if(b.vorm==='piramide') content+=`<div class="pyramid-set">${ds.slice(0,3).map((d,i)=>{const sentence=pyramidSentence(d,b.niveau,index*7+i+state.nonce);return `<div class="pyramid"><b>Bouw de zin op</b>${pyramidLines(sentence).map((line,j)=>`<div class="pyramid-line line-${j+1}">${b.niveau==='steun'?markeer(line,d):line}</div>`).join('')}</div>`}).join('')}</div>`;
    if(b.vorm==='zinnen'){const mixed=[];for(let i=0;i<(b.niveau==='steun'?4:b.niveau==='basis'?5:6);i++){const d=ds[i%ds.length];const ordered=[...sentences(d)].sort((a,c)=>b.niveau==='vlot'?c.length-a.length:a.length-c.length);const line=ordered[Math.floor(i/ds.length)%ordered.length];mixed.push({line,d})}content+=`<div class="sentence-list">${mixed.map(x=>`<p>${b.niveau==='steun'?markeer(x.line,x.d):x.line}</p>`).join('')}</div>`}
    if(b.vorm==='tekst') content+=`<div class="mini-text"><div class="vooraf">Lees eerst: <b>${entries.slice(0,Math.max(3,ds.length)).map(shown).join(' · ')}</b></div>${ds.map(d=>`<p>${b.niveau==='steun'?markeer(window.LEESBOOSTER_TEKSTEN[d.id]?.text||'',d):window.LEESBOOSTER_TEKSTEN[d.id]?.text||''}</p>`).join('')}</div>`;
    const color=ds.length>1?'#8e5aa7':kleuren[ds[0].family];
    return `<section class="block level-${b.niveau}" style="--block-color:${color}"><div class="block-title"><span>${title}</span><span class="level-badge">${niveauNaam[b.niveau]}</span><small>${vormen.find(v=>v[0]===b.vorm)[1]}</small><button class="remove-block" data-remove="${index}" title="Verwijder deze oefening">🗑 Verwijder oefening</button></div>${content}</section>`;
  }
  function evalFace(mood){
    const mouth=mood==='rustig'?'M11 22 Q18 27 25 22':mood==='goed'?'M10 21 Q18 29 26 21':'M9 20 Q18 31 27 20';
    return `<svg class="eval-face" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"></circle><circle class="face-eye" cx="13" cy="14" r="1.4"></circle><circle class="face-eye" cx="23" cy="14" r="1.4"></circle><path d="${mouth}"></path></svg>`;
  }
  function renderPages(){
    if(!state.blocks.length){$('#pages').innerHTML='<div class="empty-state"><div>📚</div><h1>Klaar voor een leesbooster?</h1><p>Kies links een leesdoel, oefenvorm en ondersteuning. Voeg daarna je eerste oefenblok toe.</p></div>';setButtons(false);return}
    let html='',pageNo=1,regular=[];
    const flush=()=>{if(!regular.length)return;const items=regular;const evaluation=items.length>1?`<div class="self-eval"><strong>Hoe ging het lezen vandaag?</strong><small>Kleur het gezichtje bij de zin die het best bij jou past.</small><span class="eval-choice">${evalFace('rustig')}<b>★ Ik las rustig met hulp.</b></span><span class="eval-choice">${evalFace('goed')}<b>★★ Ik las de woorden zelf.</b></span><span class="eval-choice">${evalFace('vlot')}<b>★★★ Ik las alles mooi door.</b></span></div>`:'';html+=`<article class="paper">${paperHeader('Gericht oefenen op leesmoeilijkheden',items[0].b.naamDatum?'Naam: ____________________<br>Datum: ____________________':'')}${items.map(x=>blockHtml(x.b,x.i)).join('')}${evaluation}<footer class="page-footer"><span>Elke stap vooruit telt!</span><span>pagina ${pageNo++}</span></footer></article>`;regular=[]};
    state.blocks.forEach((b,i)=>{if(b.vorm==='verhaal'){flush();for(const group of chunk(b.doelen,4)){const storySet=storyPages({...b,doelen:group},pageNo,i);html+=storySet.html;pageNo+=storySet.count}}else{regular.push({b,i});if(regular.length===3)flush()}});flush();
    $('#pages').innerHTML=html;setButtons(true);
  }
  function chunk(a,size){const out=[];for(let i=0;i<a.length;i+=size)out.push(a.slice(i,i+size));return out}
  function setButtons(on){['#printPdf','#printPdf2','#downloadPdf','#downloadPdf2','#vernieuw'].forEach(s=>$(s).disabled=!on);$('#blokTeller').textContent=`${state.blocks.length} oefenblok${state.blocks.length===1?'':'ken'}`}
  function add(){
    const levels=[...document.querySelectorAll('#niveauKeuzes input:checked')].map(x=>x.value);
    if(!levels.length){$('#melding').textContent='Kies minstens één vorm van ondersteuning.';return}
    if(!state.selectedGoals.length){$('#melding').textContent='Kies minstens één leesdoel.';return}
    const gekozenAantal=+$('#aantalWoorden').value;
    const themaKeuze=$('#verhaalThema').value;const themaIds=allowedStoryThemeIds();const surpriseTheme=bestStoryThemeId(themaIds,selectedDoelen());
    levels.forEach((niveau)=>{const aantal=niveau==='steun'?Math.max(6,gekozenAantal-4):niveau==='basis'?Math.max(8,gekozenAantal-2):gekozenAantal;const verhaalThema=themaKeuze==='verrassing'?surpriseTheme:themaKeuze;state.blocks.push({doelen:[...state.selectedGoals],vorm:state.vorm,niveau,aantal,naamDatum:$('#naamDatum').checked,vraagType:$('#vraagType').value,woordenschatType:$('#woordenschatType').value,verhaalThema})});
    const mix=state.selectedGoals.length>1?` Mix van ${state.selectedGoals.length} leesdoelen.`:'';
    $('#melding').textContent=(levels.length>1?`${levels.length} versies toegevoegd voor differentiatie.`:'Oefenblok toegevoegd.')+mix;renderPages();
  }
  document.addEventListener('click',e=>{
    const tab=e.target.closest('.tab');if(tab){state.family=tab.dataset.family;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===tab));renderDoelen()}
    const ch=e.target.closest('.choice');if(ch){state.vorm=ch.dataset.vorm;renderVormen();$('#verhaalOpties').hidden=state.vorm!=='verhaal'}
    const rm=e.target.closest('[data-remove]');if(rm){state.blocks.splice(+rm.dataset.remove,1);$('#melding').textContent=rm.classList.contains('remove-story')?'Het verhaal en de vragen werden uit de preview verwijderd.':'De oefening werd uit de preview verwijderd.';renderPages()}
  });
  $('#doelKeuzes').addEventListener('change',e=>{if(!e.target.matches('input'))return;const id=e.target.value;if(e.target.checked&&!state.selectedGoals.includes(id))state.selectedGoals.push(id);if(!e.target.checked)state.selectedGoals=state.selectedGoals.filter(x=>x!==id);renderDoelen()});
  $('#wisDoelen').addEventListener('click',()=>{state.selectedGoals=[];renderDoelen()});
  $('#voegToe').addEventListener('click',add);
  $('#alleNiveaus').addEventListener('click',()=>document.querySelectorAll('#niveauKeuzes label:not([hidden]) input').forEach(x=>x.checked=true));
  $('#wisAlles').addEventListener('click',()=>{if(!state.blocks.length){$('#melding').textContent='De preview is al leeg.';return}if(confirm('Wil je de volledige preview leegmaken? Alle toegevoegde oefeningen en verhalen worden verwijderd.')){state.blocks=[];$('#melding').textContent='De preview is helemaal leeggemaakt.';renderPages()}});
  $('#vernieuw').addEventListener('click',()=>{state.nonce++;$('#melding').textContent='De woorden in de toegevoegde woordoefeningen zijn vervangen.';renderPages()});
  async function downloadPdf(){
    if(!window.html2canvas||!window.jspdf?.jsPDF){alert('De PDF-module is nog niet geladen. Controleer je internetverbinding en probeer opnieuw.');return}
    const pages=[...document.querySelectorAll('#pages .paper')];if(!pages.length)return;
    const overlay=$('#pdfProgress'),bar=$('#pdfProgressBar'),label=$('#pdfProgressText');overlay.hidden=false;bar.style.width='4%';document.body.classList.add('pdf-export');
    ['#downloadPdf','#downloadPdf2'].forEach(s=>$(s).disabled=true);
    try{
      await document.fonts?.ready;await Promise.all([...document.querySelectorAll('#pages img')].map(img=>img.complete?Promise.resolve():img.decode().catch(()=>{})));
      const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      for(let i=0;i<pages.length;i++){
        label.textContent=`Pagina ${i+1} van ${pages.length} wordt klaargemaakt`;bar.style.width=`${Math.round(8+(i/pages.length)*82)}%`;
        const canvas=await html2canvas(pages[i],{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0});
        const sourceRatio=canvas.width/canvas.height,pageRatio=210/297;let pdfWidth=210,pdfHeight=297,pdfX=0,pdfY=0;if(sourceRatio>pageRatio){pdfHeight=210/sourceRatio;pdfY=(297-pdfHeight)/2}else{pdfWidth=297*sourceRatio;pdfX=(210-pdfWidth)/2}
        if(i)pdf.addPage('a4','portrait');pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',pdfX,pdfY,pdfWidth,pdfHeight,undefined,'FAST');
        bar.style.width=`${Math.round(8+((i+1)/pages.length)*82)}%`;await new Promise(resolve=>setTimeout(resolve,30));
      }
      label.textContent='De download wordt gestart';bar.style.width='100%';pdf.save(`Leesbooster-${new Date().toISOString().slice(0,10)}.pdf`);await new Promise(resolve=>setTimeout(resolve,450));
    }catch(error){console.error(error);alert('De PDF kon niet worden gemaakt. Je kunt het werkblad nog steeds via Afdrukken bewaren als PDF.');}
    finally{overlay.hidden=true;bar.style.width='0%';document.body.classList.remove('pdf-export');['#downloadPdf','#downloadPdf2'].forEach(s=>$(s).disabled=false)}
  }
  const print=()=>window.print();$('#printPdf').addEventListener('click',print);$('#printPdf2').addEventListener('click',print);$('#downloadPdf').addEventListener('click',downloadPdf);$('#downloadPdf2').addEventListener('click',downloadPdf);
  renderDoelen();renderVormen();renderPages();
})();
