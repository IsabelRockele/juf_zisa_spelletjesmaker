export type Choice={text:string;icon:string};
export type Task={id:string;title:string;prompt:string;kind?:'type'|'do'|'order'|'robot'|'files'|'filetypes'|'feel'|'input';choices?:Choice[];correct?:number[];feedback:string;target?:string;initial?:string;steps?:string[]};
export type Mission={id:string;title:string;icon:string;color:string;goals:string;older?:boolean;tasks:Task[]};
const c=(text:string,icon:string):Choice=>({text,icon});
export const missions:Mission[]=[
 {id:'toestel',title:'Mijn toestel',icon:'tablet',color:'blue',goals:'IT.002 (6–7), IT.003, IT.014, IT.027, IT.035, IT.042',tasks:[
  {id:'batterij',title:'De batterij van je iPad',prompt:'Bekijk de batterij bovenaan elk oefenscherm.',choices:[c('Vol','battery-full'),c('Bijna leeg','battery-low'),c('Halfvol','battery-medium')],correct:[1],feedback:'Een bijna lege batterij moet binnenkort opgeladen worden. Vraag hulp en volg de klasafspraak.'},
  {id:'geluid',title:'Ik hoor niets',prompt:'Een luidspreker met een streep erdoor. Wat betekent dat?',choices:[c('Het geluid staat uit','muted'),c('De batterij is leeg','battery-low'),c('Het filmpje is klaar','stop')],correct:[0],feedback:'Het geluid staat uit. Met de geluidsknoppen kun je het zachter of harder zetten.'},
  {id:'volume',title:'Zachter en harder',kind:'do',prompt:'Zet het geluid van je iPad zacht. Druk op het luidsprekertje. Zet het een beetje harder en luister opnieuw.',feedback:'Kies een prettig volume. Het hoeft niet luid te zijn. Vraag je leerkracht even mee te luisteren.'},
  {id:'invoer',title:'Van toets naar scherm',kind:'input',prompt:'Typ een letter. Ontdek wat het toestel ermee doet.',feedback:'Jij geeft een letter in. Het toestel verwerkt je toets. Op het scherm verschijnt de letter: dat is de uitvoer.'},
  {id:'volgorde',title:'Wat gebeurt eerst?',kind:'order',prompt:'Tik de stappen in de juiste volgorde.',steps:['Ik tik op een letter.','Het toestel verwerkt mijn tik.','Ik zie de letter op het scherm.'],feedback:'Invoer → verwerking → uitvoer. Je geeft iets in en het toestel geeft iets terug.'},
  {id:'internet',title:'Een bericht op reis',kind:'order',prompt:'Je stuurt een bericht naar papa of mama. Wat gebeurt eerst?',steps:['Ik maak een bericht.','Het bericht gaat via internet.','Papa of mama ontvangt het op een ander toestel.'],feedback:'Internet verbindt toestellen. Zo kan een bericht naar een ander toestel gaan.'},
  {id:'open-app',title:'Even weg en terug',kind:'do',prompt:'Ga met je leerkracht naar het beginscherm van de iPad. Open een afgesproken app. Ga terug naar het beginscherm en open deze missie opnieuw.',feedback:'Een app verlaten is niet hetzelfde als ze helemaal afsluiten. Laat je leerkracht ook voordoen hoe je een app sluit.'}
 ]},
 {id:'zorg',title:'Zorg voor je tablet',icon:'care',color:'green',goals:'IT.044',tasks:[
  {id:'start',title:'Klaar om te starten',prompt:'Wat doe je voor je begint? Kies alles wat past.',choices:[c('Ik droog mijn handen','hand'),c('Ik zet mijn drinkbeker verder weg','cup'),c('Ik leg de tablet aan de rand','edge')],correct:[0,1],feedback:'Droge handen en drinken op afstand helpen je tablet veilig te houden. Leg hem stevig op tafel, weg van de rand.'},
  {id:'dragen',title:'Veilig dragen',prompt:'Hoe draag je de tablet naar een andere tafel?',choices:[c('Rustig, met twee handen','care'),c('Rennend, met één hand','run'),c('Aan de kabel','plug')],correct:[0],feedback:'Draag de tablet rustig met twee handen. Laat nu eens zien hoe jij dat doet.'},
  {id:'kabel',title:'De kabel zit vast',prompt:'Je krijgt de stekker niet los. Wat doe je?',choices:[c('Hard aan de draad trekken','plug'),c('Hulp vragen','help'),c('De tablet laten vallen','edge')],correct:[1],feedback:'Vraag hulp. Trek niet aan de draad. Volg de klasafspraak voor opladen.'},
  {id:'werkplek',title:'Mijn veilige werkplek',kind:'do',prompt:'Kijk naar je tafel. Zet drinken weg. Leg je tablet stevig neer. Maak plaats voor je armen. Laat je werkplek zien.',feedback:'Je leerkracht kijkt mee of je werkplek veilig is.'},
  {id:'voordoen',title:'Ik draag zorg',kind:'do',prompt:'Toon hoe je de tablet draagt, neerlegt en na het werken opbergt.',feedback:'Rustig dragen, veilig neerleggen en opbergen op de afgesproken plaats.'}
 ]},
 {id:'typen',title:'Toetsentovenaar',icon:'keyboard',color:'purple',goals:'IT.037, IT.042',tasks:[
  {id:'naam',title:'Mijn voornaam',kind:'type',prompt:'Typ je voornaam. Laat je leerkracht even kijken.',target:'name',feedback:'Goed geoefend! Je leerkracht kijkt of je voornaam juist geschreven is.'},
  {id:'getal',title:'Vijf stippen',kind:'type',prompt:'De dobbelsteen toont vijf stippen. Typ het cijfer.',target:'5',feedback:'Dat is 5. Je vond het cijfer op het toetsenbord.'},
  {id:'leeftijd',title:'Hoe oud ben jij?',kind:'type',prompt:'Typ de zin met jouw leeftijd: Ik ben … jaar.',target:'age',feedback:'Je gebruikte letters, spaties, een cijfer en een punt.'},
  {id:'punt',title:'De punt',kind:'type',prompt:'Typ: De kat slaapt.',target:'De kat slaapt.',feedback:'Een punt sluit deze zin af.'},
  {id:'vraag',title:'Een vraag',kind:'type',prompt:'Typ: Waar is de bal?',target:'Waar is de bal?',feedback:'Het vraagteken hoort bij een vraag.'},
  {id:'roep',title:'Stop!',kind:'type',prompt:'Typ: Stop!',target:'Stop!',feedback:'Je vond het uitroepteken!'},
  {id:'herstel',title:'Herstel het woord',kind:'type',prompt:'Verander maan in maas. Wis de laatste letter en typ een s.',initial:'maan',target:'maas',feedback:'Je hebt een letter gewist en vervangen.'}
 ]},
 {id:'bestanden',title:'Mijn bestanden',icon:'folder',color:'yellow',older:true,goals:'IT.028, IT.029, IT.030',tasks:[
  {id:'map',title:'Mijn naamkaartje bewaren',kind:'files',prompt:'Maak een naamkaartje en bewaar het in Bestanden. Kun je het daarna zelf terugvinden?',feedback:'Je oefende met bestanden.'},
  {id:'soorten',title:'Bestanden ontdekken',kind:'filetypes',prompt:'Open de bestanden. Onderzoek wat erin zit: tekst, beeld, geluid, video of een programma.',feedback:'Je hebt de bestanden onderzocht.'}
 ]},
 {id:'kiezen',title:'Wat gebruik ik?',icon:'tools',color:'orange',goals:'IT.004, IT.055, IT.058, IT.092, IT.093',tasks:[
  {id:'kaart',title:'Een kaart voor oma',prompt:'Je wilt een kaart tekenen. Wat kun je gebruiken? Kies alles wat past.',choices:[c('Papier en potloden','pencil'),c('Een tekenprogramma','palette'),c('Een geluidsopname','audio')],correct:[0,1],feedback:'Met papier én met een tekenprogramma kun je tekenen. Vertel welke jij zou kiezen en waarom.'},
  {id:'uil',title:'Hoe klinkt een uil?',prompt:'Waar kun je het geluid van een uil horen? Kies alles wat past.',choices:[c('Een geluidsfragment','audio'),c('Een dierenfilmpje met geluid','video'),c('Een foto op papier','image')],correct:[0,1],feedback:'Een geluidsfragment en een filmpje met geluid kun je beluisteren. Een foto maakt geen geluid.'},
  {id:'woord',title:'Wat is winterslaap?',prompt:'Wat kan je helpen om dit woord te begrijpen? Kies alles wat past.',choices:[c('Een kinderwoordenboek','book'),c('Iemand die het kan uitleggen','help'),c('Een tekenprogramma','palette')],correct:[0,1],feedback:'Een woordenboek geeft uitleg. Je kunt ook hulp vragen. Probeer het woord daarna op te zoeken bij Zelf opzoeken.'},
  {id:'veters',title:'Veters strikken',prompt:'Je wilt zien hoe je veters strikt. Wat helpt? Kies alles wat past.',choices:[c('Een stappenfilmpje','video'),c('Iemand doet het voor','help'),c('Alleen het woord veter typen','keyboard')],correct:[0,1],feedback:'Je kunt de stappen bekijken en nadoen. Een filmpje kun je pauzeren; aan iemand kun je vragen om te wachten.'},
  {id:'voetbal',title:'Buiten spelen',prompt:'Je wilt buiten voetballen. Wat heb je nu nodig?',choices:[c('Een bal en een veilige plek','ball'),c('Een tablet','tablet'),c('Een toetsenbord','keyboard')],correct:[0],feedback:'Voor buiten voetballen heb je geen scherm nodig.'},
  {id:'uitleg',title:'Vertel je keuze',kind:'do',prompt:'Kies een taak: tekenen, iets beluisteren of een woord opzoeken. Vertel welk hulpmiddel je gebruikt en waarom. Doe de taak daarna.',feedback:'Er kunnen verschillende goede keuzes zijn. Leg uit hoe jouw hulpmiddel helpt.'}
 ]},
 {id:'robot',title:'Robotdenkers',icon:'robot',color:'purple',goals:'IT.015, IT.019',tasks:[
  {id:'delen',title:'In kleine stukjes',kind:'robot',prompt:'Plan eerst tot de bloem. Plan dan verder naar de ster. Laat je robot stappen.',feedback:'Je deelde één grote route op in twee kleine delen.'},
  {id:'belangrijk',title:'Wat bepaalt je route?',prompt:'De robot staat op een veld. Wat moet je weten om een route te maken? Kies alles wat past.',choices:[c('Waar de robot start','robot'),c('Waar de ster en blokken staan','star'),c('De kleur van de rand','palette')],correct:[0,1],feedback:'De start, het doel en hindernissen zijn belangrijk voor je route. De kleur van de rand verandert de route niet.'},
  {id:'patroon',title:'Ontdek het patroon',prompt:'Rechts, omlaag, rechts, omlaag… Welke twee stappen volgen?',choices:[c('Rechts, omlaag','rd'),c('Omlaag, omlaag','dd'),c('Links, omhoog','lu')],correct:[0],feedback:'Rechts, omlaag is het stukje dat steeds terugkomt.'},
  {id:'fout',title:'Zoek het foutje',kind:'robot',prompt:'Test dit plan. Het gaat nog niet goed. Tik op een stap en vervang de verkeerde pijl.',feedback:'Je ontdekte de fout door te testen en verbeterde je plan.'},
  {id:'voorspel',title:'Voorspel eerst',kind:'robot',prompt:'Waar komt de robot uit met dit plan? Tik eerst op dat vakje. Test daarna.',feedback:'Je dacht vooruit en controleerde je voorspelling.'}
 ]},
 {id:'gezond',title:'Fijn met een scherm',icon:'heart',color:'green',goals:'IT.061, IT.064',tasks:[
  {id:'gevoel',title:'Hoe voel jij je?',kind:'feel',prompt:'Denk aan een filmpje of spelletje dat je net zag. Hoe voelde jij je? Er is geen fout antwoord.',choices:[c('Blij','happy'),c('Rustig','calm'),c('Druk','run'),c('Bang of verdrietig','sad')],feedback:'Vertel wat je zag of deed en waarom je je zo voelde. Luister ook naar de anderen.'},
  {id:'pauze',title:'Even bewegen',kind:'do',prompt:'Leg je tablet veilig neer. Sta recht. Rek je uit. Beweeg even en kijk in de verte. Kom daarna terug.',feedback:'Een pauze helpt je om bewegen en schermtijd af te wisselen.'},
  {id:'ogen',title:'Mijn ogen zijn moe',prompt:'Wat kan helpen? Kies alles wat past.',choices:[c('Even stoppen en wegkijken','eye'),c('Vertellen dat mijn ogen moe zijn','help'),c('Het scherm dichterbij houden','tablet')],correct:[0,1],feedback:'Neem een pauze en vertel hoe je je voelt. Kijk samen of je prettig zit en het scherm goed staat.'},
  {id:'afspraak',title:'Onze schermafspraak',kind:'do',prompt:'Spreek met papa of mama, of je leerkracht af wanneer je stopt. Oefen het stoppen op dat moment.',feedback:'De afspraak past bij wat je doet en bij je dag. Vertel daarna wat hielp om te stoppen.'}
 ]}
];
