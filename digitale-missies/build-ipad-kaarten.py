from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'output/pdf/zisas-ipad-opdrachtkaarten.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Body','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Bold','C:/Windows/Fonts/arialbd.ttf'))
W,H=A4
INK=HexColor('#153d53')
cards=[
('01','Het geheime detail','Camera + Foto’s','slimme-systemen.png','#167c8b',
 ['Leg een voorwerp op tafel.','Maak er een foto van.','Open de foto. Vergroot met twee vingers.','Laat je maatje raden wat het is.'],
 'Een detailfoto als raadsel.','Maak het beeld weer klein. Klopte de gok?', 'IT.003 / IT.014 / IT.042'),
('02','Welk dier hoor je?','Dictafoon','toetsenbordtuin.png','#8b4d9c',
 ['Bedenk samen een dier.','Tik op opnemen. Doe het geluid na.','Stop de opname. Speel ze af.','Laat een ander groepje raden.'],
 'Een zelf opgenomen dierenraadsel.','Neem twee gesproken hints op, zonder de naam.', 'IT.003 / IT.014 / IT.042'),
('03','Ontwerp een speelplek','Notities - tekenen','creatiestudio.png','#286f9c',
 ['Open een nieuwe notitie. Kies de pen.','Teken een speelplek met twee kleuren.','Gum één stukje uit. Teken het anders.','Wissel. Je maatje tekent iets erbij.'],
 'Een eigen ontwerp van jullie groep.','Gebruik ook een andere lijndikte. Leg je keuze uit.', 'IT.035 / IT.042 / IT.092 / IT.093'),
('04','Ons bouwwerk groeit','Camera + Foto’s','robotroute.png','#168469',
 ['Bouw iets met blokken. Maak een foto.','Wissel. Bouw een stukje verder.','Maak nog een foto vanuit dezelfde plek.','Open beide foto’s. Zoek het verschil.'],
 'Twee foto’s van jullie veranderde bouwwerk.','Maak drie foto’s: begin, midden en einde.', 'IT.003 / IT.014 / IT.035'),
('05','Zo doe je dat!','Camera - Video','toesteltraining.png','#c06a1d',
 ['Zet de camera op Video.','Film handen die drie blokken stapelen.','Stop. Open jullie filmpje in Foto’s.','Speel het af. Is alles goed te zien?'],
 'Een kort instructiefilmpje zonder gezichten.','Spreek tijdens het filmen de stappen uit.', 'IT.035 / IT.042 / IT.093'),
('06','Kijk, pauzeer, bouw','Foto’s - jullie filmpje','toesteltraining.png','#c06a1d',
 ['Speel het blokkenfilmpje van kaart 05 af.','Pauzeer. Bouw na wat je ziet.','Speel verder. Pauzeer om bij te bouwen.','Luister: zet zachter en weer luider.'],
 'Een nagebouwde toren met hulp van pauze.','Probeer een filmpje met meer bouwstappen.', 'IT.027 / IT.035'),
('07','Een bordje voor de klas','Notities - tekst en tekening','creatiestudio.png','#286f9c',
 ['Kies een plek: boeken, blokken of jassen.','Open een notitie. Typ het woord erbij.','Teken iets waaraan je de plek herkent.','Typ jullie voornamen. Toon het bordje.'],
 'Een eigen bordje dat de leerkracht kan afdrukken.','Voeg een korte afspraak toe, zoals: Zet terug.', 'IT.037 / IT.042 / IT.092 / IT.093'),
('08','In je hand of op het scherm?','Voorwerp + Camera + Foto’s','slimme-systemen.png','#167c8b',
 ['Bekijk samen een blad of een schelp.','Voel voorzichtig. Wat merk je?','Maak een foto. Vergroot een klein detail.','Vertel: wat lukt echt, wat lukt op het scherm?'],
 'Een vergelijking die jullie kunnen uitleggen.','Wanneer is een foto handig voor iemand ver weg?', 'IT.003 / IT.004 / IT.014'),
]
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('Zisa’s iPad-missies - opdrachtkaarten voor groepjes')
c.setAuthor('Juf Zisa')
def text(x,y,s,size=12,font='Body',color=INK):
 c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,s)
def para(s,x,top,width,size=12,color=INK,bold=False):
 style=ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,leading=size*1.25,textColor=color)
 p=Paragraph(s,style);pw,ph=p.wrap(width,1000);p.drawOn(c,x,top-ph);return ph
def footer(page):
 text(28,17,'JUF ZISA  |  Echte iPad-tools, samen doen',9)
 c.drawRightString(W-28,17,str(page))
def card(data,y):
 num,title,apps,art,col,steps,result,extra,goals=data
 x=28;w=W-56;h=374;accent=HexColor(col)
 c.setFillColor(white);c.setStrokeColor(HexColor('#cad8df'));c.setLineWidth(1)
 c.roundRect(x,y,w,h,16,fill=1,stroke=1)
 c.setFillColor(accent);c.roundRect(x+14,y+h-49,39,32,8,fill=1,stroke=0)
 text(x+21,y+h-39,num,17,'Bold',white)
 text(x+65,y+h-27,'ZISA’S IPAD-MISSIE  •  6-8 JAAR',9,'Bold',accent)
 text(x+65,y+h-53,title,20,'Bold')
 text(x+20,y+h-78,apps,12,'Bold',accent)
 c.drawImage(str(ROOT/'assets'/art),x+w-93,y+h-91,76,76,mask='auto',preserveAspectRatio=True)
 c.setStrokeColor(HexColor('#e0e8ec'));c.line(x+20,y+h-96,x+w-20,y+h-96)
 top=y+h-114
 for i,step in enumerate(steps):
  c.setFillColor(accent);c.circle(x+31,top-9,10,fill=1,stroke=0)
  text(x+28,top-13,str(i+1),11,'Bold',white)
  ph=para(step,x+51,top,w-75,14)
  top-=max(35,ph+10)
 c.setFillColor(HexColor('#f1f6f8'));c.roundRect(x+16,y+54,w-32,48,9,fill=1,stroke=0)
 para('JULLIE RESULTAAT<br/>'+result,x+28,y+94,w-56,11)
 para('<b>Extra voor 7-8:</b> '+extra,x+20,y+43,w-40,10)
 text(x+20,y+13,'Wissel de rollen. Iedereen bedient de iPad.',9,'Bold',accent)

for page in range(4):
 text(28,H-22,'KNIPKAARTEN  |  1 iPad per groepje van 2 of 3',9,'Bold')
 card(cards[page*2],H-409);card(cards[page*2+1],40)
 c.setDash(3,4);c.setStrokeColor(HexColor('#a9bbc3'));c.line(28,425,W-28,425);c.setDash()
 footer(page+1);c.showPage()

def header(title,sub):
 text(34,H-47,title,25,'Bold');para(sub,34,H-66,W-68,12)
def block(title,body,y):
 text(34,y,title,14,'Bold',HexColor('#167c8b'))
 ph=para(body,34,y-12,W-68,11);return y-12-ph-23
header('Voor de leerkracht','Geen oefenwebsite nodig. De kinderen werken in de echte apps op jullie school-iPads.')
y=H-117
y=block('Vooraf klaarzetten',
 'Controleer Camera, Foto’s, Notities en Dictafoon op elke iPad. Zet ze bij elkaar op het beginscherm. Test een foto, een opname en tekenen met de vinger. Een Apple Pencil is niet nodig. Bij Notities kan de tekenfunctie afhangen van het gebruikte account. Laat zo nodig de ICT-verantwoordelijke een geschikte schoolinstelling klaarzetten.',y)
y=block('Zo gebruiken jonge kinderen de kaarten',
 'Print pagina 1-4 op A4 op ware grootte, enkelzijdig. Knip op de stippellijn. Geef maar één kaart tegelijk. Lees ze kort voor en doe de benodigde knoppen eerst voor op jullie eigen iPad. De illustratie helpt de opdracht herkennen; ze vervangt die introductie niet. De kaart is geen zelfstandige leestest.',y)
y=block('Groepjes en rollen',
 'Werk met 2 of 3 kinderen en 1 iPad. Rol 1 bedient, rol 2 maakt het geluid of bouwt, rol 3 kijkt of het resultaat klopt. Wissel na elke poging; bij twee kinderen combineren ze rollen 2 en 3. Laat ieder kind de digitale handeling ook zelf uitvoeren. Reken op ongeveer 8-12 minuten per kaart.',y)
y=block('Wat leg je klaar?',
 'Kaart 01: één klein voorwerp. Kaart 02: rustige opnameplek. Kaart 03: lege notitie. Kaart 04-06: enkele blokken en een vaste plek voor de iPad. Kaart 06 volgt op kaart 05: film met geluid en spreek bouwstappen in, zodat luider/zachter werkelijk iets verandert. Kaart 07: afgesproken klasplek en woordvoorbeeld. Kaart 08: blad of schelp zonder scherpe randen.',y)
y=block('Veilig werken en werk bewaren',
 'Fotografeer en film alleen voorwerpen of handen, geen gezichten of persoonsgegevens. Gebruik schoolapparaten en schoolaccounts. Foto’s, notities en opnamen kunnen via iCloud synchroniseren: controleer het schoolbeleid. Zet opnamen niet op internet. Laat kinderen alleen hun eigen oefenwerk aanpassen. Controleer vóór opruimen welk werk bewaard moet blijven.',y)
y=block('Afdrukken of verzamelen',
 'Laat kinderen bij kaart 07 hun voornamen typen. De leerkracht bekijkt het resultaat op de iPad en drukt via de schoolroute af, bijvoorbeeld met een beschikbare AirPrint-printer. Anders verzamelt de leerkracht een afbeelding of pdf via de reeds afgesproken klasomgeving. Deze kaartenset verstuurt zelf niets en maakt geen online inzamelmap aan.',y)
footer(5);c.showPage()
header('Kijken naar het leren','Een mooi eindproduct is niet genoeg: observeer de handeling én laat het kind vertellen wat er gebeurde.')
y=H-117
for group,title,goals,look in [
 ('01, 04, 08','Foto en informatieverwerking','IT.003 / IT.014','Laat bij de eigen foto aanwijzen: de camera vangt beeld op, de app verwerkt of vergroot het en het scherm toont het resultaat. Bij kaart 08: wanneer helpt digitaal kijken en wat kan alleen met het echte voorwerp? (IT.004)'),
 ('02','Eigen geluid opnemen','IT.003 / IT.014 / IT.042','Kan het kind opnemen, stoppen en terugluisteren? Laat microfoon en luidspreker aanwijzen. Begrijpt het dat de opname later opnieuw afgespeeld kan worden?'),
 ('03, 07','Iets maken met een tool','IT.035 / IT.042 / IT.092 / IT.093','Observeer kiezen en werkelijk gebruiken van teken- en tekstgereedschap. Bij kaart 07 oefent het kind ook typen, spaties en voornaam (IT.037). Laat uitleggen waarom tekst en beeld nuttig zijn voor dit bordje.'),
 ('05, 06','Bewegend beeld bedienen','IT.027 / IT.035 / IT.042','Observeer zelf opnemen, afspelen en pauzeren wanneer nodig. Volume gaat via de beschikbare bediening of fysieke volumeknoppen. Foto’s heeft niet noodzakelijk een aparte stopknop: leer geen vierkant aan dat daar niet bestaat.'),
 ]:
  y=block('Kaart '+group+'  |  '+title,'<b>'+goals+'</b><br/>'+look,y)
y=block('Observeren zonder te snel af te vinken','Noteer per kind: met voordoen / met een aanwijzing / zelfstandig. Laat later dezelfde handeling in een andere situatie terugkomen. Deze set biedt oefenkansen bij de doelcodes uit jullie ICT-overzicht; niet elke kaart bewijst beheersing van elk doel. IT.002 (werking en contact op afstand) wordt hiermee niet volledig behandeld.',y)
y=block('Verschillen tussen iPads','Knoppen en menu’s kunnen per iPadOS-versie verschillen. Toon daarom de echte pictogrammen op het klasapparaat vóór de start. Camera: sluiter of rode opnameknop. Dictafoon: opnemen, stoppen en afspelen. Foto’s: afspelen/pauzeren en met twee vingers vergroten. Notities: nieuwe notitie en schrijfgerei.',y)
sources=[('Camera','https://support.apple.com/nl-nl/guide/ipad/ipad99b53a71/ipados'),('Dictafoon','https://support.apple.com/nl-nl/guide/ipad/ipadf455678zz/ipados'),('Tekenen in Notities','https://support.apple.com/nl-nl/guide/ipad/ipada87a6078/ipados'),('Foto’s en afdrukken','https://support.apple.com/nl-nl/guide/ipad/ipad99b53b6d/ipados')]
text(34,y,'Officiële uitleg voor de leerkracht (Apple)',11,'Bold');y-=20
for label,url in sources:
 text(34,y,label,10,'Body',HexColor('#167c8b'));c.linkURL(url,(34,y-3,260,y+12),relative=0);y-=18
footer(6);c.save()
print(OUT)
