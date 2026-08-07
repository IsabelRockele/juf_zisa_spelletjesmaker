import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIRS = [ROOT / "coderen_afbeeldingen", ROOT / "pro" / "coderen_afbeeldingen"]
W, H = 25, 20


def dense(vertices):
    """Maak van rechte hoekpunten geldige stapjes in acht richtingen."""
    points = []
    for (x1, y1), (x2, y2) in zip(vertices, vertices[1:]):
        x, y = x1, y1
        if not points:
            points.append((x, y))
        while (x, y) != (x2, y2):
            x += (x2 > x) - (x2 < x)
            y += (y2 > y) - (y2 < y)
            points.append((x, y))
    return [{"vx": x, "vy": y} for x, y in points]


SHAPES = {
    "Dieren": [
        ("Vis", "vis", [(3,10),(7,6),(15,6),(19,3),(19,8),(22,10),(19,12),(19,17),(15,14),(7,14),(3,10)],
         [{"type":"eye","gridX":8,"gridY":9,"sizeRatio":.75,"rotation":0,"color":"#263746"}]),
        ("Kat", "kat", [(5,7),(6,2),(10,5),(14,5),(18,2),(19,7),(19,14),(16,17),(8,17),(5,14),(5,7)],
         [{"type":"eye","gridX":9,"gridY":10,"sizeRatio":.7,"rotation":0,"color":"#263746"},{"type":"eye","gridX":15,"gridY":10,"sizeRatio":.7,"rotation":0,"color":"#263746"},{"type":"nose","gridX":12,"gridY":13,"sizeRatio":.65,"rotation":0,"color":"#e78b91"}]),
    ],
    "Natuur": [
        ("Bloem", "bloem", [(12,18),(12,12),(8,14),(5,12),(6,8),(9,8),(8,4),(12,2),(16,4),(15,8),(18,8),(19,12),(16,14),(12,12),(12,18)],
         [{"type":"nose","gridX":12,"gridY":9,"sizeRatio":1.25,"rotation":0,"color":"#f4bd50"}]),
        ("Blad", "blad", [(3,16),(5,8),(11,3),(20,3),(20,10),(15,15),(8,17),(3,16)], []),
    ],
    "School": [
        ("Potlood", "potlood", [(3,7),(16,7),(19,10),(16,13),(3,13),(3,7)], []),
        ("Boek", "boek", [(12,17),(10,15),(4,15),(4,4),(10,4),(12,6),(14,4),(20,4),(20,15),(14,15),(12,17)], []),
    ],
    "Feest": [
        ("Hart", "hart", [(12,18),(5,11),(5,6),(8,3),(10,3),(12,5),(14,3),(16,3),(19,6),(19,11),(12,18)], []),
        ("Kroon", "kroon", [(3,16),(3,7),(7,11),(13,5),(19,11),(23,7),(23,16),(3,16)], []),
    ],
    "Voertuigen": [
        ("Boot", "boot", [(3,10),(21,10),(18,16),(7,16),(3,10),(8,10),(8,5),(13,5),(13,10)], []),
    ],
    "Gebouwen": [
        ("Huis", "huis", [(7,17),(7,9),(5,9),(12,2),(19,9),(17,9),(17,17),(7,17)], []),
    ],
}

DETAILS = {
    "potlood": [
        {"startGridX":5,"startGridY":7,"endGridX":5,"endGridY":13,"color":"#9aa9b5"},
        {"startGridX":16,"startGridY":7,"endGridX":16,"endGridY":13,"color":"#c98b51"},
    ],
    "boek": [
        {"startGridX":12,"startGridY":6,"endGridX":12,"endGridY":17,"color":"#5f7890"},
        {"startGridX":6,"startGridY":7,"endGridX":10,"endGridY":7,"color":"#8ea2b3"},
        {"startGridX":14,"startGridY":7,"endGridX":18,"endGridY":7,"color":"#8ea2b3"},
    ],
    "huis": [
        {"startGridX":10,"startGridY":17,"endGridX":10,"endGridY":12,"color":"#8b6548"},
        {"startGridX":10,"startGridY":12,"endGridX":14,"endGridY":12,"color":"#8b6548"},
        {"startGridX":14,"startGridY":12,"endGridX":14,"endGridY":17,"color":"#8b6548"},
    ],
    "kroon": [
        {"startGridX":3,"startGridY":13,"endGridX":23,"endGridY":13,"color":"#d49a26"},
    ],
}


def render(data, path):
    cell, margin = 30, 16
    image = Image.new("RGB", (W*cell+2*margin, H*cell+2*margin), "white")
    draw = ImageDraw.Draw(image)
    for x in range(W+1): draw.line((margin+x*cell,margin,margin+x*cell,margin+H*cell),fill="#e2e8ed",width=1)
    for y in range(H+1): draw.line((margin,margin+y*cell,margin+W*cell,margin+y*cell),fill="#e2e8ed",width=1)
    pts=[(margin+p["vx"]*cell,margin+p["vy"]*cell) for p in data["codedPath"]]
    draw.line(pts,fill="#33434f",width=4,joint="curve")
    for f in data["features"]:
        x,y=margin+f["gridX"]*cell,margin+f["gridY"]*cell
        radius=cell*f.get("sizeRatio",.7)/2
        color=f.get("color","#263746")
        draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill=color)
    for detail in data.get("coloredLines",[]):
        draw.line((margin+detail["startGridX"]*cell,margin+detail["startGridY"]*cell,
                   margin+detail["endGridX"]*cell,margin+detail["endGridY"]*cell),
                  fill=detail["color"],width=4)
    x,y=pts[0]; draw.ellipse((x-9,y-9,x+9,y+9),fill="#ef4444")
    image.resize((500,400),Image.Resampling.LANCZOS).save(path,optimize=True)


def main():
    catalog=json.loads((OUT_DIRS[0]/"catalog.json").read_text(encoding="utf-8"))
    for theme, entries in SHAPES.items():
        current=catalog.setdefault(theme,[])
        known={item["json"].split("/")[-1] for item in current}
        for name,slug,vertices,features in entries:
            filename=f"{slug}.json"
            data={"gridWidth":W,"gridHeight":H,"codedPath":dense(vertices),"features":features,"freehandLines":[],"coloredLines":DETAILS.get(slug,[])}
            if filename not in known:
                current.append({"name":name,"image":f"coderen_afbeeldingen/{slug}.png","json":f"coderen_afbeeldingen/{filename}"})
            for out in OUT_DIRS:
                out.mkdir(parents=True,exist_ok=True)
                (out/filename).write_text(json.dumps(data,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
                render(data,out/f"{slug}.png")
    catalog={theme:items for theme,items in catalog.items() if items}
    for out in OUT_DIRS:
        (out/"catalog.json").write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding="utf-8")


if __name__ == "__main__": main()
