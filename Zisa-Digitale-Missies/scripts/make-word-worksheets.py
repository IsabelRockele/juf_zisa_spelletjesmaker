"""Build matching print worksheets from the same entries used by the website."""
from pathlib import Path
import json, os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/werkbladen';OUT.mkdir(exist_ok=True)
FONT=ROOT/'scripts/fonts'
pdfmetrics.registerFont(TTFont('School',str(FONT/'LiberationSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('SchoolBold',str(FONT/'LiberationSans-Bold.ttf')))
W,H=A4; M=43; URL=os.environ.get('ZISA_WOORDENBOEK_URL','').strip()
words=json.loads((ROOT/'app/opzoeken/words.json').read_text()); lookup={w['word']:w for w in words}; atlas=str(ROOT/'public/woorden/woordenbeelden.png')
INK=HexColor('#263f47');GRAY=HexColor('#66757a');LINE=HexColor('#bac6c9')
def txt(c,text,x,y,size=15,bold=False,color=INK):
 c.setFillColor(color);c.setFont('SchoolBold' if bold else 'School',size);c.drawString(x,y,text)
def para(c,text,x,y,width,size=15,bold=False,leading=None):
 st=ParagraphStyle('p',fontName='SchoolBold' if bold else 'School',fontSize=size,leading=leading or size*1.35,textColor=INK)
 p=Paragraph(text,st);w,h=p.wrap(width,1000);p.drawOn(c,x,y-h);return y-h
def qr(c,x,y,size=65):
 code=QrCodeWidget(URL,barLevel='M');a,b,d,e=code.getBounds();draw=Drawing(size,size,transform=[size/(d-a),0,0,size/(e-b),0,0]);draw.add(code);renderPDF.draw(draw,c,x,y)
def header(c,title,number,teacher=False):
 txt(c,"Zisa's digitale missies",M,H-39,11,True,GRAY)
 txt(c,title,M,H-76,25,True)
 if not teacher:
  txt(c,'Naam: __________________________',M,H-109,14)
  txt(c,'Datum: ______________',M+302,H-109,14)
  if URL:
   qr(c,W-M-65,H-89,65)
   txt(c,'Scan en zoek',W-M-69,H-102,9,color=GRAY)
 c.setStrokeColor(LINE);c.line(M,H-128,W-M,H-128)
 txt(c,'Zelf opzoeken | Woordenbibliotheek',M,31,10,color=GRAY)
 txt(c,str(number),W-M-7,31,10,color=GRAY)
 if URL:c.linkURL(URL,(M,19,W-M,42),relative=0)
def picture(c,index,x,y,size):
 # Clip original atlas at an exact grid cell; preserve original image unchanged.
 col=index%3;row=index//3;c.saveState();path=c.beginPath();path.rect(x,y,size,size);c.clipPath(path,stroke=0,fill=0)
 c.drawImage(atlas,x-col*size,y-(3-row)*size,width=3*size,height=4*size,mask='auto');c.restoreState()
def line(c,x,y,w=480):c.setStrokeColor(LINE);c.setLineWidth(.65);c.line(x,y,x+w,y)
def instructions(c,t):return para(c,t,M,H-148,W-2*M,16)
student=canvas.Canvas(str(OUT/'woordenbibliotheek-opdrachten.pdf'),pagesize=A4)
student.setTitle('Woordenbibliotheek - 4 zoekwerkbladen');student.setAuthor('Zisa')
# Sheet 1
header(student,'1. Zoek en verbind',1)
instructions(student,'Zoek elk woord op in de woordenbibliotheek.<br/>Verbind het woord met de juiste verklaring.')
left=['winterslaap','schuilplaats','voedsel','route','pauze','toestemming'];right=['route','voedsel','toestemming','winterslaap','schuilplaats','pauze']
for i,(a,b) in enumerate(zip(left,right)):
 y=H-246-i*76;txt(student,a,M+6,y,18,True)
 student.setStrokeColor(INK);student.circle(213,y+5,3,fill=0);student.circle(307,y+5,3,fill=0)
 para(student,lookup[b]['meaning'],322,y+19,228,15)
para(student,'Tip: tik op de luidspreker als je de uitleg wilt horen.',M,102,W-2*M,13)
student.showPage()
# Sheet 2
header(student,'2. Zoek de afbeelding',2)
instructions(student,'Zoek het woord op. Lees of beluister de uitleg.<br/>Omcirkel de afbeelding die erbij past.')
rows=[('winterslaap',[2,0,10]),('voedsel',[3,7,9]),('route',[5,10,7]),('pauze',[9,10,2])]
for row,(word,images) in enumerate(rows):
 top=H-217-row*141;txt(student,word,M,top-47,17,True)
 for col,img in enumerate(images):
  x=171+col*128;y=top-105;picture(student,img,x,y,101);txt(student,'ABC'[col],x+47,y-17,12,True)
 if row<3:line(student,M,top-133,W-2*M)
student.showPage()
# Sheet 3
header(student,'3. Welk woord past?',3)
instructions(student,'Zoek de woorden op. Vul elke zin aan.<br/>Gebruik elk woord één keer.')
bank='toestemming - onderzoeken - voedsel - route<br/>winterslaap - vergelijken - pauze - schuilplaats'
student.setFillColor(HexColor('#f5f7f7'));student.roundRect(M,H-267,W-2*M,59,8,fill=1,stroke=0);para(student,bank,M+15,H-216,W-2*M-30,15,True)
sentences=[
'In de winter houdt de egel een ____________________.',
'Bij regen is het afdak een ____________________.',
'De muis zoekt ____________________ om te eten.',
'Op de kaart zie ik de ____________________ naar school.',
'Na het lopen neem ik een ____________________.',
'Ik vraag ____________________ om je bal te lenen.',
'Wij ____________________ twee bladeren: wat is anders?',
'Wij ____________________ een blad met een vergrootglas.'
]
for i,s in enumerate(sentences):para(student,str(i+1)+'. '+s,M,H-296-i*59,W-2*M,16)
student.showPage()
# Sheet 4
header(student,'4. Zoek en schrijf over',4)
instructions(student,'Zoek het woord op. Schrijf de verklaring over.<br/>Schrijf alleen de uitleg, niet de voorbeeldzin.')
copywords=['voedsel','route','pauze','toestemming']
for i,word in enumerate(copywords):
 y=H-233-i*139;txt(student,str(i+1)+'. '+word,M,y,19,True)
 for j in range(3):line(student,M,y-33-j*29,W-2*M)
student.showPage();student.save()
# Teacher key
key=canvas.Canvas(str(OUT/'woordenbibliotheek-oplossingen.pdf'),pagesize=A4);key.setTitle('Woordenbibliotheek - oplossingen en lestips');key.setAuthor('Zisa')
header(key,'Oplossingen en lestips',1,True)
y=para(key,'Kies één of meer werkbladen. Elk blad staat op zichzelf. Voor leerlingen die nog moeilijk schrijven: begin met verbinden of afbeeldingen kiezen. Laat hen de luidsprekers gebruiken.',M,H-151,W-2*M,14)
y=para(key,'Open Zelf opzoeken in de spelletjesmaker. Als deze bundel met een QR-code is gemaakt, opent die de woordenbibliotheek. Laat leerlingen zelf het hele woord typen en op Zoek drukken. Bij een leeg zoekvak staan er geen woorden of verklaringen klaar. De bibliotheek bevat de twaalf woorden van deze reeks.',M,y-14,W-2*M,14)
y-=33;txt(key,'Blad 1 - Zoek en verbind',M,y,18,True);y-=17
for word in left:y=para(key,'<b>'+word+'</b>: '+lookup[word]['meaning'],M,y-9,W-2*M,14)
y-=31;txt(key,'Blad 2 - Zoek de afbeelding',M,y,18,True);y-=27
for word,letter in [('winterslaap','B'),('voedsel','A'),('route','C'),('pauze','B')]:
 txt(key,word+'  →  '+letter,M,y,15);y-=25
para(key,'De afbeeldingen ondersteunen de betekenis. Bespreek ook andere voorbeelden: een andere route, een ander dier of een andere schuilplaats.',M,y-12,W-2*M,13)
key.showPage();header(key,'Oplossingen - vervolg',2,True)
y=H-159;txt(key,'Blad 3 - Welk woord past?',M,y,18,True);y-=28
answers=['winterslaap','schuilplaats','voedsel','route','pauze','toestemming','vergelijken','onderzoeken']
for i,word in enumerate(answers):txt(key,str(i+1)+'. '+word,M,y,16);y-=26
y-=17;txt(key,'Blad 4 - Zoek en schrijf over',M,y,18,True);y-=18
for word in copywords:y=para(key,'<b>'+word+'</b>: '+lookup[word]['meaning'],M,y-12,W-2*M,15)
y-=26;txt(key,'Nog even samen bespreken',M,y,17,True)
para(key,'Laat leerlingen één woord in een eigen zin gebruiken. Vraag hoe de afbeelding helpt bij de uitleg. Bij <b>bron</b> gebruikt deze reeks de betekenis informatiebron; het woord heeft ook een andere betekenis. Beoordeel bij de zoekopdrachten eerst het begrip, en daarna eventueel spelling of schrijfverzorging.',M,y-17,W-2*M,14)
key.showPage();key.save()
print('Created 4-page student PDF and 2-page teacher PDF.')
