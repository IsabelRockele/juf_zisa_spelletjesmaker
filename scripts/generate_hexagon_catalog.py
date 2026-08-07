import json
import math
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIRS = [ROOT / "hexagon_afbeeldingen", ROOT / "pro" / "hexagon_afbeeldingen"]
W, H = 20, 18
COLORS = {
    "Achtergrond": "#FFFFFF", "Wit": "#F8F8F8", "Zwart": "#333333",
    "Geel": "#FFD700", "Rood": "#FF4500", "Oranje": "#FF8C00",
    "Blauw": "#1E90FF", "Groen": "#32CD32", "Paars": "#9932CC",
    "Bruin": "#A0522D", "Roze": "#FFB6C1", "Lichtgroen": "#90EE90",
    "Lichtblauw": "#87CEEB", "Lichtbruin": "#CD853F", "Lichtgrijs": "#D3D3D3",
}

def blank():
    return [[{"color": "Achtergrond", "special": None} for _ in range(W)] for _ in range(H)]

def paint(m, c, r, color, eye=False):
    if 0 <= r < H and 0 <= c < W:
        m[r][c] = {"color": color, "special": "eye" if eye else None}

def ellipse(m, cx, cy, rx, ry, color):
    for r in range(H):
        for c in range(W):
            x = c + (0.5 if r % 2 else 0)
            if ((x-cx)/rx)**2 + ((r-cy)/ry)**2 <= 1:
                paint(m,c,r,color)

def rect(m,x1,y1,x2,y2,color):
    for r in range(y1,y2+1):
        for c in range(x1,x2+1): paint(m,c,r,color)

def line(m,x1,y1,x2,y2,color,width=0):
    steps=max(abs(x2-x1),abs(y2-y1),1)*3
    for i in range(steps+1):
        t=i/steps; x=round(x1+(x2-x1)*t); y=round(y1+(y2-y1)*t)
        for dy in range(-width,width+1):
            for dx in range(-width,width+1): paint(m,x+dx,y+dy,color)

def fish():
    m=blank(); ellipse(m,9,9,6,4,"Blauw")
    for r,w in [(6,1),(7,2),(8,3),(9,4),(10,3),(11,2),(12,1)]:
        for c in range(15,15+w): paint(m,c,r,"Lichtblauw")
    paint(m,5,8,"Wit",True); paint(m,3,10,"Lichtblauw"); return m

def cat():
    m=blank(); ellipse(m,10,9,5,5,"Oranje")
    for r in range(3,7):
        for c in range(5,5+r-2): paint(m,c,r,"Oranje")
        for c in range(15-(r-3),16): paint(m,c,r,"Oranje")
    paint(m,8,8,"Wit",True); paint(m,12,8,"Wit",True); paint(m,10,10,"Roze")
    line(m,5,11,1,10,"Zwart"); line(m,5,12,1,13,"Zwart"); line(m,15,11,18,10,"Zwart"); line(m,15,12,18,13,"Zwart")
    return m

def butterfly():
    m=blank()
    ellipse(m,6.5,7,3.8,4.3,"Roze"); ellipse(m,13.5,7,3.8,4.3,"Roze")
    ellipse(m,7,12,3,2.8,"Paars"); ellipse(m,13,12,3,2.8,"Paars")
    ellipse(m,7,7,1.3,1.7,"Geel"); ellipse(m,13,7,1.3,1.7,"Geel")
    line(m,10,5,10,14,"Zwart"); paint(m,10,4,"Zwart")
    line(m,10,4,8,2,"Zwart"); line(m,10,4,12,2,"Zwart")
    return m

def ladybug():
    m=blank(); ellipse(m,10,10,5,6,"Rood"); ellipse(m,10,4,3,2,"Zwart"); line(m,10,5,10,15,"Zwart")
    for c,r in [(7,8),(13,8),(7,12),(13,12)]: paint(m,c,r,"Zwart")
    paint(m,9,4,"Wit",True); paint(m,11,4,"Wit",True); return m

def flower():
    m=blank(); line(m,10,10,10,17,"Groen"); line(m,10,14,6,12,"Lichtgroen"); line(m,10,15,14,13,"Lichtgroen")
    for cx,cy in [(10,5),(6,7),(14,7),(7,11),(13,11)]: ellipse(m,cx,cy,3,3,"Roze")
    ellipse(m,10,8,3,3,"Geel"); return m

def sun():
    m=blank(); ellipse(m,10,9,4.5,4.5,"Geel")
    for x1,y1,x2,y2 in [(10,1,10,3),(10,15,10,17),(1,9,3,9),(17,9,19,9),
                         (4,3,6,5),(14,5,16,3),(4,15,6,13),(14,13,16,15)]:
        line(m,x1,y1,x2,y2,"Oranje")
    return m

def mushroom():
    m=blank()
    ellipse(m,10,7,7,4.5,"Rood")
    for r in range(7,10):
        for c in range(4+(r-7),17-(r-7)): paint(m,c,r,"Rood")
    rect(m,8,9,12,15,"Lichtbruin"); ellipse(m,10,15,3,1.5,"Lichtbruin")
    for c,r in [(6,6),(10,4),(14,6),(9,7)]: paint(m,c,r,"Wit")
    return m

def apple():
    m=blank(); ellipse(m,8,10,5,6,"Rood"); ellipse(m,12,10,5,6,"Rood"); line(m,10,5,11,1,"Bruin"); ellipse(m,14,3,3,2,"Groen")
    paint(m,7,9,"Wit",True); paint(m,12,9,"Wit",True); return m

def pencil():
    m=blank()
    # Horizontaal is op een zeshoekraster het duidelijkst herkenbaar.
    rect(m,5,7,14,10,"Geel")
    line(m,5,7,14,7,"Oranje"); line(m,5,10,14,10,"Oranje")
    rect(m,2,7,3,10,"Roze"); rect(m,4,7,4,10,"Lichtgrijs")
    for r, start in [(7,15),(8,15),(9,15),(10,15)]:
        for c in range(start,18-(abs(8.5-r)>1)): paint(m,c,r,"Lichtbruin")
    paint(m,17,8,"Zwart"); paint(m,17,9,"Zwart")
    return m

def book():
    m=blank()
    for r in range(4,15):
        for c in range(2,10): paint(m,c,r,"Lichtblauw")
        for c in range(11,19): paint(m,c,r,"Lichtgroen")
    line(m,10,4,10,15,"Bruin"); line(m,2,4,10,6,"Blauw"); line(m,18,4,10,6,"Groen"); return m

def gift():
    m=blank(); rect(m,4,7,16,16,"Roze"); rect(m,3,5,17,8,"Rood"); rect(m,9,5,11,16,"Geel")
    ellipse(m,7,3,3,2,"Geel"); ellipse(m,13,3,3,2,"Geel"); return m

def balloon():
    m=blank(); ellipse(m,10,7,5,6,"Paars"); paint(m,10,13,"Paars"); line(m,10,14,8,17,"Bruin")
    paint(m,8,6,"Wit"); paint(m,8,7,"Wit"); return m

def rocket():
    m=blank()
    for r in range(2,14):
        half=max(1,min(4,(r-1)//2, (15-r)//2+1))
        for c in range(10-half,11+half): paint(m,c,r,"Lichtgrijs")
    for r in range(2,6):
        for c in range(8+(r-2),13-(r-2)): paint(m,c,r,"Rood")
    ellipse(m,10,8,2,2,"Lichtblauw"); line(m,7,12,5,15,"Blauw"); line(m,13,12,15,15,"Blauw")
    line(m,9,14,9,17,"Oranje"); line(m,11,14,11,17,"Geel"); return m

def house():
    m=blank(); rect(m,4,8,16,16,"Geel")
    for r in range(2,9):
        for c in range(10-(r-2),11+(r-2)): paint(m,c,r,"Rood")
    rect(m,9,12,12,16,"Bruin"); rect(m,5,10,7,12,"Lichtblauw"); rect(m,14,10,16,12,"Lichtblauw"); return m

ITEMS = {
    "Dieren": [("Vis", "vis", fish), ("Kat", "kat", cat), ("Vlinder", "vlinder", butterfly), ("Lieveheersbeestje", "lieveheersbeestje", ladybug)],
    "Natuur": [("Bloem", "bloem", flower), ("Zon", "zon", sun), ("Paddenstoel", "paddenstoel", mushroom)],
    "School": [("Appel", "appel", apple), ("Potlood", "potlood", pencil), ("Boek", "boek", book)],
    "Feest": [("Cadeau", "cadeau", gift), ("Ballon", "ballon", balloon)],
    "Voertuigen": [("Raket", "raket", rocket)],
    "Gebouwen": [("Huis", "huis", house)],
}

def preview(matrix, path):
    radius=18; hex_w=math.sqrt(3)*radius; v=1.5*radius
    width=int((W+.5)*hex_w+28); height=int((H-.25)*v+2*radius+28)
    scale=2; image=Image.new("RGB",(width*scale,height*scale),"#f4f8fb"); draw=ImageDraw.Draw(image)
    for r,row in enumerate(matrix):
        for c,cell in enumerate(row):
            cx=(14+(c+.5*(r%2))*hex_w)*scale; cy=(14+radius+r*v)*scale
            pts=[]
            for i in range(6):
                a=math.radians(60*i+30); pts.append((cx+radius*scale*math.cos(a),cy+radius*scale*math.sin(a)))
            draw.polygon(pts,fill=COLORS[cell["color"]],outline="#6f7f8c",width=2)
            if cell.get("special")=="eye":
                er=radius*scale*.32; draw.ellipse((cx-er,cy-er,cx+er,cy+er),fill="white",outline="#333",width=2); pr=er*.45; draw.ellipse((cx-pr,cy-pr,cx+pr,cy+pr),fill="#333")
    image.resize((width,height),Image.Resampling.LANCZOS).save(path,optimize=True)

def main():
    base_catalog=json.loads((OUT_DIRS[0]/"catalog.json").read_text(encoding="utf-8"))
    for theme, entries in ITEMS.items():
        current=base_catalog.setdefault(theme,[])
        known={item["bestandsnaam"] for item in current}
        for name,slug,factory in entries:
            matrix=factory(); filename=f"{slug}.json"
            if filename not in known: current.append({"naam":name,"afbeelding":f"{slug}.png","bestandsnaam":filename})
            payload={"gridWidth":W,"gridHeight":H,"drawingMatrix":matrix}
            for out in OUT_DIRS:
                out.mkdir(parents=True,exist_ok=True)
                (out/filename).write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
                preview(matrix,out/f"{slug}.png")
    for out in OUT_DIRS:
        (out/"catalog.json").write_text(json.dumps(base_catalog,ensure_ascii=False,indent=2),encoding="utf-8")

if __name__ == "__main__": main()
