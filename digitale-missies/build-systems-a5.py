from pathlib import Path
import shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A5, A4, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'output/pdf'
OUT.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Card','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('CardBold','C:/Windows/Fonts/arialbd.ttf'))
INK=HexColor('#173f54');ACC=HexColor('#167d89');PALE=HexColor('#ecf6f8')
W,H=A5
DATA={
'6-7':[
 ('Het geheime detail','Camera en Foto’s','Een schelp, blad of klein voorwerp.', [('camera','Maak een foto van je voorwerp.'),('zoom','Open je foto. Maak een stukje groter met twee vingers.'),('eye','Laat je maatje raden. Wissel de rollen.')], 'Wijs aan: wat gaat de iPad in? Wat doet de app? Wat zie je op het scherm?', 'IT.003 / IT.014'),
 ('Welk dier hoor je?','Opname-app','Een rustige plek.', [('mic','Neem een dierengeluid op.'),('play','Stop. Luister je opname terug.'),('eye','Laat je maatje raden. Nu mag je maatje opnemen.')], 'Waar gaat je stem naar binnen? Wat bewaart de app? Waar komt het geluid uit?', 'IT.003 / IT.014'),
 ('In je hand of op het scherm?','Camera en Foto’s','Een blad of schelp.', [('hand','Bekijk en voel het echte voorwerp.'),('camera','Maak een foto. Vergroot een klein stukje.'),('eye','Toon allebei. Wanneer helpt de iPad?')], 'Iemand is ver weg. Bekijk samen met je juf of meester hoe je die via internet kunt bereiken.', 'IT.002 / IT.004 / IT.014'),
 ('Van vinger naar lijn','Tekenapp','Een lege tekening.', [('draw','Teken met je vinger een huis.'),('erase','Verander de kleur. Teken er iets bij.'),('eye','Toon je tekening. Laat je maatje ook proberen.')], 'Beweeg je vinger. Wat doet de app? Wijs de lijn aan die op het scherm verschijnt.', 'IT.003 / IT.014')
],
'7-8':[
 ('Een foto als raadsel','Camera en Foto’s','Een voorwerp voor je maatje.', [('camera','Kies een voorwerp. Maak een duidelijke foto.'),('zoom','Open de foto en vergroot een herkenbaar detail.'),('eye','Laat je maatje raden. Verbeter je foto als dat nodig is.'),('camera','Wissel. Maak een nieuw raadsel.')], 'Leg bij je eigen foto uit: invoer, verwerking en uitvoer. Wat veranderde door het vergroten?', 'IT.003 / IT.014'),
 ('Een hoorbaar raadsel','Opname-app','Een rustige plek.', [('mic','Spreek twee hints in zonder het voorwerp te noemen.'),('play','Stop en luister terug. Is alles goed te horen?'),('mic','Verbeter je opname als dat nodig is.'),('eye','Laat je maatje raden. Wissel de rollen.')], 'Wijs de microfoon en luidspreker aan. Vertel wat de opname-app met jouw stem doet.', 'IT.003 / IT.014'),
 ('Kies wat echt helpt','Camera en Foto’s','Een blad, schelp of bouwwerk.', [('hand','Onderzoek je voorwerp zonder de iPad.'),('camera','Maak een foto en vergroot een detail.'),('eye','Vergelijk wat je ontdekt. Wanneer helpt elke manier?'),('hand','Kies hoe je het aan je maatje toont. Vertel waarom.')], 'Kan je aan een foto voelen? Wanneer helpt vergroten? Kies de manier die bij jouw bedoeling past.', 'IT.004 / IT.014'),
 ('Maak, verander, leg uit','Tekenapp','Een lege tekening.', [('draw','Teken een speelplek met je vinger.'),('erase','Gum een stukje uit en verander het.'),('eye','Toon je maatje hoe jouw beweging het beeld verandert.'),('draw','Wissel. Je maatje voegt iets toe.')], 'Vergelijk met de foto of opname. Wat geef je aan de iPad? Wat verwerkt de app? Wat komt eruit?', 'IT.003 / IT.014')
]}

def para(c,text,x,top,width,size=14,bold=False,color=INK):
 p=Paragraph(text,ParagraphStyle('card',fontName='CardBold' if bold else 'Card',fontSize=size,leading=size*1.28,textColor=color))
 _,height=p.wrap(width,900);p.drawOn(c,x,top-height);return height

def icon(c,kind,x,y):
 c.saveState();c.translate(x,y);c.setFillColor(PALE);c.roundRect(0,0,56,56,10,fill=1,stroke=0);c.setStrokeColor(ACC);c.setFillColor(ACC);c.setLineWidth(2.4)
 if kind=='camera':
  c.roundRect(8,15,40,27,5,stroke=1,fill=0);c.circle(28,28,9,stroke=1,fill=0);c.rect(15,42,12,5,stroke=1,fill=0)
 elif kind=='zoom':
  c.circle(24,32,13,stroke=1,fill=0);c.line(34,21,47,8);c.line(17,32,31,32);c.line(24,25,24,39)
 elif kind=='mic':
  c.roundRect(21,24,14,25,7,stroke=1,fill=0);c.arc(15,18,41,43,180,180);c.line(28,18,28,9);c.line(19,9,37,9)
 elif kind=='play':
  c.rect(7,23,11,11,stroke=0,fill=1);p=c.beginPath();p.moveTo(30,17);p.lineTo(47,28);p.lineTo(30,39);p.close();c.drawPath(p,fill=1,stroke=0)
 elif kind=='eye':
  c.ellipse(6,17,50,39,stroke=1,fill=0);c.circle(28,28,7,stroke=1,fill=0)
 elif kind=='hand':
  c.roundRect(15,10,27,27,7,stroke=1,fill=0);c.roundRect(22,29,7,21,3,stroke=1,fill=0);c.line(11,23,16,12);c.line(7,27,11,23)
 elif kind=='draw':
  c.line(13,15,40,42);c.line(17,11,44,38);c.line(13,15,11,9);c.line(11,9,17,11);c.line(40,42,44,38);c.line(9,6,46,6)
 else:
  p=c.beginPath();p.moveTo(10,22);p.lineTo(29,43);p.lineTo(47,27);p.lineTo(28,8);p.lineTo(22,8);p.close();c.drawPath(p,stroke=1,fill=0);c.line(18,15,34,32);c.line(9,6,47,6)
 c.restoreState()

def card(c,age,n,data,x=0,y=0):
 c.saveState();c.translate(x,y);title,app,materials,steps,talk,codes=data
 c.setFillColor(white);c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(ACC);c.roundRect(18,H-50,35,30,6,stroke=0,fill=1)
 para(c,str(n),28,H-26,24,16,True,white)
 para(c,'SLIMME SYSTEMEN  |  '+age+' JAAR',65,H-24,W-88,9,True,ACC)
 para(c,title,22,H-64,W-44,21,True)
 para(c,app,22,H-99,W-44,13,True,ACC)
 para(c,'Leg klaar: '+materials,22,H-120,W-44,11)
 top=H-158;spacing=85 if len(steps)==3 else 70
 for i,(kind,text) in enumerate(steps,1):
  icon(c,kind,22,top-55)
  para(c,str(i)+'. '+text,90,top-3,W-113,15 if age=='6-7' else 13.5)
  top-=spacing
 c.setFillColor(PALE);c.roundRect(20,52,W-40,94,10,stroke=0,fill=1)
 para(c,'VERTEL EN WIJS AAN',32,132,W-64,10,True,ACC)
 used=para(c,talk,32,115,W-64,12)
 assert used<58,(age,n,'talk overflows')
 para(c,'Iedereen probeert. Wissel van rol.',22,39,W-44,10,True)
 para(c,'Juf Zisa  |  '+codes,22,22,W-44,8)
 c.restoreState()

for age,cards in DATA.items():
 for format in ['A5','A4-knip']:
  dest=OUT/f'slimme-systemen-{age}-{format}.pdf'
  c=canvas.Canvas(str(dest),pagesize=A5 if format=='A5' else landscape(A4));c.setTitle(f'Slimme systemen - {age} jaar - {format}');c.setAuthor('Juf Zisa')
  for n,data in enumerate(cards,1):
   if format=='A5':card(c,age,n,data);c.showPage()
   else:
    half=landscape(A4)[0]/2;card(c,age,n,data,(n-1)%2*half+(half-W)/2,0)
    if n%2==0:
     c.setStrokeColor(HexColor('#a5b7c0'));c.setDash(3,4);c.line(half,10,half,H-10);c.setDash();c.showPage()
  c.save();shutil.copy2(dest,ROOT/'assets'/dest.name);print(dest)
