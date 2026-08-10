from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BRON = Path(__file__).resolve().parents[1] / "assets" / "icons"
UIT = Path(__file__).resolve().parents[1] / "controle-iconen"
UIT.mkdir(exist_ok=True)

bestanden = sorted(BRON.glob("*.png"))
kolommen, rijen = 5, 4
vak_b, vak_h = 240, 220
letter = ImageFont.load_default(size=15)

for blad, begin in enumerate(range(0, len(bestanden), kolommen * rijen), 1):
    vel = Image.new("RGB", (kolommen * vak_b, rijen * vak_h), "#f4f1fb")
    teken = ImageDraw.Draw(vel)
    for plaats, bestand in enumerate(bestanden[begin:begin + kolommen * rijen]):
        x = (plaats % kolommen) * vak_b
        y = (plaats // kolommen) * vak_h
        icoon = Image.open(bestand).convert("RGBA")
        icoon.thumbnail((180, 165), Image.Resampling.LANCZOS)
        ix = x + (vak_b - icoon.width) // 2
        iy = y + 8 + (165 - icoon.height) // 2
        vel.paste(icoon, (ix, iy), icoon)
        naam = bestand.stem
        if len(naam) > 27:
            naam = naam[:26] + "…"
        teken.text((x + vak_b / 2, y + 187), naam, fill="#3e3656", font=letter, anchor="mm")
    doel = UIT / f"iconen-{blad:02d}.png"
    vel.save(doel)
    print(doel)
