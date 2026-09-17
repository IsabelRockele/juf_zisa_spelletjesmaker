/* School planning proposals, not prescribed assessment moments or new curriculum norms. */
const reportColors = [
 {id:'red',name:'Rood',meaning:'Lukt nog niet',short:'Nog oefenen'},
 {id:'yellow',name:'Geel',meaning:'Lukt met hulp',short:'Met hulp'},
 {id:'green',name:'Groen',meaning:'Lukt zelfstandig',short:'Zelfstandig'},
 {id:'blue',name:'Blauw',meaning:'Lukt zelfstandig in een andere situatie',short:'In een andere situatie'}
];
const reportGoal=(id,codes,mission,label,look,positive,practice,p3,p4,extra={})=>({id,codes,mission,label,look,positive,practice,p3,p4,...extra});
const reportGoals=[
 reportGoal('care',['IT.044'],'toetsenbord','Ik draag, gebruik en berg de iPad en koptelefoon voorzichtig op.',
  'Kijk tijdens gewoon gebruik naar dragen, neerleggen, doorgeven en opbergen. Laat het kind dit echt doen.',
  'Je gaat zorgvuldig om met de iPad en de koptelefoon.','Oefen om de iPad rustig met twee handen te dragen en het materiaal voorzichtig op te bergen.',[1,2,3],[1,2,3,4]),
 reportGoal('control',['IT.027','IT.035'],'bedienen','Ik open de juiste app, start een filmpje, pauzeer en kijk verder.',
  'Laat het kind een interessant beeld stilzetten en daarna verder kijken. Laat ook het volume aanpassen en het echte batterijpictogram aanwijzen. Kijk naar de handeling, niet naar een klik in een oefenscherm.',
  'Je opent de juiste app en bedient een filmpje op het moment dat je dat nodig hebt.','Oefen om zelf te starten, op een gekozen moment te pauzeren en daarna verder te kijken.',[1],[1]),
 reportGoal('keyboard',['IT.037','IT.042'],'toetsenbord','Ik typ een kort bericht met letters, een cijfer en de tekens . ? !',
  'Laat een boodschap voor een maatje typen. Observeer het virtuele toetsenbord. Geef bij 6–7 inhoudelijke hulp indien nodig en noteer die. Automatische tekstcorrectie is geen bewijs dat het kind zelf de toets vond.',
  'Je gebruikt letters, cijfers en leestekens om een bericht te typen.','Oefen om op het toetsenbord de cijfers, het punt, het vraagteken en het uitroepteken terug te vinden.',[1],[2]),
 reportGoal('healthy',['IT.061','IT.064'],'mediafit','Ik vertel hoe schermgebruik voelt en pas onze pauze- of samenwerkafspraak toe.',
  'Bespreek een echte ervaring. Laat het kind meebeslissen over een afspraak en observeer die tijdens het werk: rustig geluid, beurt nemen, pauze of stoppen. Een gevoel heeft geen juist of fout antwoord.',
  'Je vertelt wat schermgebruik met je doet en houdt rekening met de afgesproken pauze en je maatje.','Oefen om op het afgesproken moment te stoppen en te vertellen welke afspraak jou helpt om rustig te werken.',[1,2,3],[1,2,3,4]),
 reportGoal('digital',['IT.004'],'systemen','Ik probeer iets met en zonder iPad en vertel wanneer de iPad helpt.',
  'Laat een echt voorwerp tonen en daarna een detailfoto. Vraag wanneer rechtstreeks kijken of digitaal vergroten handig is. Bij 6–7 ook samen bekijken hoe contact op afstand internet gebruikt.',
  'Je kunt uitleggen wanneer de iPad handig is en wanneer je iets eenvoudiger zonder scherm doet.','Oefen om eerst te bedenken wat je wilt doen en daarna te kiezen of je daarvoor een iPad nodig hebt.',[1],[1]),
 reportGoal('system',['IT.003','IT.014'],'systemen','Ik maak een foto of opname en wijs aan wat ik invoer, wat de app doet en wat eruit komt.',
  'Gebruik het eigen resultaat. Bijvoorbeeld: microfoon neemt stem op, app verwerkt de opname, luidspreker laat ze horen. Laat later ook een foto onderzoeken. Alleen de woorden opzeggen volstaat niet.',
  'Je legt bij je eigen foto of opname uit wat jij aan de iPad geeft en wat je terugziet of hoort.','Oefen om bij een foto en een geluidsopname aan te wijzen wat de iPad binnenkrijgt, ermee doet en laat zien of horen.',[2],[2]),
 reportGoal('read-plan',['IT.015'],'robot','Ik bekijk een pijlenplan, herken kleine stukjes en vertel wat de robot zal doen.',
  'Vraag vóór het uitvoeren wat de pijlen betekenen, welke routeonderdelen terugkeren en welke vakjes van belang zijn. De richting is ten opzichte van het scherm; één pijl is één vakje.',
  'Je herkent de stappen en terugkerende stukjes in een robotplan.','Oefen om een pijlenplan stap voor stap te bekijken en een terugkerend stukje aan te wijzen.',[2],[2]),
 reportGoal('make-plan',['IT.019'],'robot','Ik maak een pijlenplan, test het en pas een stap aan wanneer het niet werkt.',
  'Geef een korte route en laat het kind de taak in stukjes verdelen. Ontwerpen onder begeleiding hoort bij dit doel. Noteer welke hulp nodig was; groen is geen verplichte leerplannorm.',
  'Je bouwt een stappenplan en gebruikt de test om je route te verbeteren.','Oefen om je route in kleine stukjes te verdelen en na het testen één stap tegelijk te verbeteren.',[2],[3]),
 reportGoal('search',['IT.046'],'zoeken','Ik typ de zoekwoorden die ik krijg en open een zoekresultaat om een antwoord te vinden.',
  'Geef zoekwoorden, bijvoorbeeld bijen honing, en een concrete vraag. Laat ze in een echte schoolgekozen zoektool invoeren. Voorlezen mag. Zelf zoekwoorden bedenken is hier geen voorwaarde.',
  'Je zoekt met de aangereikte woorden en opent een resultaat om informatie te vinden.','Oefen om de opgegeven woorden in het zoekvak te typen en daarna een resultaat te openen.',[3],[3]),
 reportGoal('sources',['IT.055','IT.058'],'zoeken','Ik bekijk twee bronnen en toon welke mijn vraag beantwoordt.',
  'Laat het kind de inhoud bekijken of beluisteren. Vraag welk stukje helpt bij de vraag en waarom het andere resultaat minder bruikbaar is. Een passend plaatje of juist feit alleen volstaat niet.',
  'Je vergelijkt bronnen en toont welke informatie helpt om je vraag te beantwoorden.','Oefen om een bron echt te bekijken en aan te wijzen waar het antwoord op jouw vraag staat.',[3],[3]),
 reportGoal('tool',['IT.092','IT.093'],'creatie','Ik kies een passende app voor een kaart, tekening of luisterbericht en vertel waarom.',
  'Bied verschillende echte schoolapps aan. Laat het kind er werkelijk mee werken en uitleggen wat de gekozen app kan. Er kunnen meerdere geschikte keuzes zijn.',
  'Je kiest een app die bij jouw bedoeling past en vertelt wat je ermee kunt maken.','Oefen om vóór je begint te vertellen wat je wilt maken en welke app je daarbij helpt.',[3],[4]),
 reportGoal('create',['IT.093','IT.042'],'creatie','Ik maak een boodschap, bekijk of beluister mijn werk en verbeter wat nog niet duidelijk is.',
  'Laat een uitnodiging maken en door een maatje bekijken of beluisteren. Observeer begrijpelijkheid, terugkijken en een zinvolle aanpassing. Een willekeurige tekening of bewaarklik is geen inhoudsbewijs.',
  'Je maakt een begrijpelijke boodschap en controleert zelf of je werk duidelijk is.','Oefen om je werk eerst zelf terug te bekijken of te beluisteren en daarna iets duidelijker te maken.',[3],[4]),
 reportGoal('filetype',['IT.028','IT.029'],'bestanden','Ik open een bestand en herken tekst, beeld, geluid, video of een programma.',
  'Laat de inhoud openen; geluid en video worden afgespeeld en een programma wordt gebruikt. De bestandsnaam raden is onvoldoende. Gebruik meerdere soorten bestanden.',
  'Je opent een bestand en herkent aan de inhoud welk soort bestand het is.','Oefen om een bestand te openen en te onderzoeken wat je ziet, hoort of kunt doen.',[1],[2],{ages:['7-8']}),
 reportGoal('save-file',['IT.030','IT.035'],'bestanden','Ik geef mijn werk een herkenbare naam, bewaar het, sluit het en open het terug.',
  'Laat een eigen bericht bewaren in een afgesproken oefenmap in een schoolapp. Verlaat het werk en laat het aan de naam terugvinden. Voor 7–8 ook op de echte iPad, niet alleen in de oefenmap van de website.',
  'Je bewaart je werk met een herkenbare naam en vindt het daarna terug.','Oefen om je werk een duidelijke naam te geven en na het sluiten opnieuw te openen.',[2],[3],{ages:['7-8']}),
 reportGoal('delete-file',['IT.030'],'bestanden','Ik verwijder alleen het afgesproken oefenbestand en controleer wat bewaard bleef.',
  'Zet een aparte oefenmap met kopieën klaar. Spreek precies af welke kopie weg mag. Controleer dat het andere werk er nog staat; gebruik geen persoonlijke bestanden.',
  'Je ruimt het afgesproken oefenbestand op en laat het andere werk bewaard.','Oefen om vóór het verwijderen de bestandsnaam te controleren en daarna te kijken wat overblijft.',[3],[4],{ages:['7-8']})
];
function goalsForReport(age){return reportGoals.filter(g=>!g.ages||g.ages.includes(age)).map(g=>{
 const copy={...g,codes:[...g.codes]};
 if(age==='6-7'&&g.id==='digital'){copy.codes.push('IT.002');copy.label='Ik toon wanneer een iPad helpt en vertel dat contact op afstand internet gebruikt.';copy.positive='Je toont wanneer de iPad helpt en herkent dat contact op afstand via internet gaat.';copy.practice='Oefen om te vergelijken: iets tonen naast je of samen via internet contact maken met iemand verder weg.';}
 if(age==='6-7'&&g.id==='search'){copy.codes.push('IT.045');copy.look+=' Laat ook vertellen dat de zoektool helpt om informatie te vinden.';}
 if(age==='7-8'&&g.id==='keyboard')copy.label='Ik typ een eigen bericht met letters, cijfers en . ? ! en verbeter een fout in mijn tekst.';
 if(age==='7-8'&&g.id==='make-plan')copy.label='Ik onderzoek een fout pijlenplan, verander een stap en test opnieuw.';
 if(age==='7-8'&&g.id==='create')copy.label='Ik maak een boodschap voor een maatje, vraag een reactie en verbeter mijn werk.';
 return copy;
});}
function proposedReportGoals(age,count,period){return goalsForReport(age).filter(g=>g['p'+count].includes(Number(period)));}
const reportThemes={3:['Bedienen en zorg dragen','Onderzoeken en stappen plannen','Zoeken, kiezen en maken'],4:['Starten en samen werken','Typen en onderzoeken','Plannen, zoeken en terugvinden','Maken en toepassen']};
