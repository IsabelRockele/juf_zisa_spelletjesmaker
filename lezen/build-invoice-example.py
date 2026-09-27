"""Static review example only; no invoice number allocation, mail or billing calls."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import re

root = Path(__file__).resolve().parents[1]
out = root / 'output/pdf/zisa-lezen-voorbeeldfactuur.pdf'
out.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold', 'C:/Windows/Fonts/arialbd.ttf'))
source = (root / 'pro_backend/src/index.ts').read_text(encoding='utf-8')
def seller(key):
    return re.search(r'const '+key+r'\s*=\s*"([^"]+)"', source).group(1)
c = canvas.Canvas(str(out), pagesize=A4)
c.setTitle('Zisa Lezen - voorbeeldfactuur (geen echte factuur)')
W,H=A4
navy='#173F73'; pink='#ED1764'; gray='#536779'
def text(x,y,s,size=10,bold=False,color=navy):
    c.setFillColor(HexColor(color));c.setFont('ArialBold' if bold else 'Arial',size);c.drawString(x,H-y,s)
def right(x,y,s,size=10,bold=False,color=navy):
    c.setFillColor(HexColor(color));c.setFont('ArialBold' if bold else 'Arial',size);c.drawRightString(x,H-y,s)
def box(x,y,w,h,color,r=10):
    c.setFillColor(HexColor(color));c.roundRect(x,H-y-h,w,h,r,stroke=0,fill=1)

box(0,0,W,106,navy,0)
text(42,49,'Zisa Lezen',26,True,'#FFFFFF')
text(43,73,'Juf Zisa | leesabonnement',11,False,'#D9EAF7')
right(W-42,48,'FACTUUR',22,True,'#FFFFFF')
right(W-42,73,'VOORBEELD',11,True,'#FFFFFF')
box(42,124,W-84,35,'#FFF0C7')
text(54,146,'Fictief voorbeeld - niet betalen en niet inboeken.',10,True,'#775315')

text(42,188,'VAN',9,True,gray)
text(42,210,seller('SELLER_NAME'),11,True)
text(42,229,seller('SELLER_ADDR1'))
text(42,245,seller('SELLER_ADDR2'))
text(42,263,seller('SELLER_EMAIL'))
text(42,281,'KBO: 1026.769.348 | BTW: BE1026.769.348',8.5,False,gray)

text(342,188,'FACTUURGEGEVENS',9,True,gray)
text(342,210,'Nummer: VOORBEELD-001',10,True)
text(342,229,'Factuurdatum: 27 september 2026')
text(342,245,'Betaaldatum: 27 september 2026')
text(342,263,'Betaalreferentie: fictieve betaling',9,False,gray)

box(42,302,W-84,90,'#F0F7FC')
text(56,324,'AAN (FICTIEVE KLANT)',9,True,gray)
text(56,345,'Voorbeeldklant',11,True)
text(56,363,'Voorbeeldstraat 12, 1000 Brussel')
text(56,379,'voorbeeld@example.com',9,False,gray)

box(42,418,W-84,29,navy,4)
text(54,438,'Omschrijving',10,True,'#FFFFFF')
right(W-54,438,'Bedrag',10,True,'#FFFFFF')
text(54,472,'Zisa Lezen - maandabonnement',11,True)
right(W-54,472,'€ 3,99',12,True)
text(54,492,'Alle beschikbare leesboeken en bijbehorende opdrachten',9,False,gray)
text(54,510,'Leesrecht van 27 september tot 27 oktober 2026',9,False,gray)
c.setStrokeColor(HexColor('#DAE6EF'));c.line(42,H-528,W-42,H-528)
right(W-148,556,'Totaal',12,True);right(W-54,556,'€ 3,99',17,True,pink)
right(W-54,576,'Betaald (voorbeeld)',10,True,'#22754B')

box(42,605,W-84,64,'#F0F7FC')
text(55,626,'Automatische maandelijkse verlenging',10,True)
text(55,644,'€ 3,99 per maand tot opzegging via je leesaccount.',9)
text(55,659,'Na opzegging behoud je toegang tot het einde van je betaalde periode.',8.5)
text(42,700,seller('SELLER_VAT_EXEMPT'),8,False,gray)
text(42,724,'Dit voorbeeld neemt de bedrijfsgegevens van je bestaande Pro-factuur over.',8,False,gray)
c.setStrokeColor(HexColor('#DAE6EF'));c.line(42,56,W-42,56)
text(42,H-39,'Zisa Lezen | jufzisa.be | zebrapost@jufzisa.be',8,False,gray)
right(W-42,H-39,'Voorbeeld - 1 / 1',8,False,gray)
c.save()
print(out)
