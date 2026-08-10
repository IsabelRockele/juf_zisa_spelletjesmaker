from collections import deque
from pathlib import Path
from PIL import Image

MAP = Path(__file__).resolve().parents[1] / "assets" / "icons"

# Per bestand: losse componenten die aan deze regel voldoen zijn resten van
# een aangrenzende afbeelding op het oorspronkelijke generatievel.
REGELS = {
    "beetje-wind": lambda b, n: b[0] < 120,
    "bewolkt": lambda b, n: b[0] > 225,
    "handschrift": lambda b, n: b[1] > 220,
    "jongen-fris": lambda b, n: b[0] < 185,
    "meisje-fris": lambda b, n: b[0] < 175,
    "meisje-koud": lambda b, n: b[0] > 340,
    "meisje-warm": lambda b, n: b[0] < 175,
    "pasen": lambda b, n: b[0] > 190,
    "snack-fruit-bak": lambda b, n: b[0] > 450,
    "speeltijd": lambda b, n: b[0] > 220 or b[1] > 200,
    "spelling": lambda b, n: b[1] > 220,
}


def componenten(alpha, grens=24):
    breedte, hoogte = alpha.size
    px = alpha.load()
    gezien = set()
    for y in range(hoogte):
        for x in range(breedte):
            if px[x, y] < grens or (x, y) in gezien:
                continue
            stapel = [(x, y)]
            gezien.add((x, y))
            punten = []
            while stapel:
                punt = stapel.pop()
                punten.append(punt)
                px0, py0 = punt
                for nx, ny in ((px0 - 1, py0), (px0 + 1, py0), (px0, py0 - 1), (px0, py0 + 1)):
                    if 0 <= nx < breedte and 0 <= ny < hoogte and px[nx, ny] >= grens and (nx, ny) not in gezien:
                        gezien.add((nx, ny))
                        stapel.append((nx, ny))
            xs = [p[0] for p in punten]
            ys = [p[1] for p in punten]
            yield punten, (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


for naam, is_rest in REGELS.items():
    pad = MAP / f"{naam}.png"
    afbeelding = Image.open(pad).convert("RGBA")
    alpha = afbeelding.getchannel("A")
    verwijderd = 0
    for punten, vak in list(componenten(alpha)):
        if is_rest(vak, len(punten)):
            verwijderd += len(punten)
            # Ook halftransparante antialias-pixels rondom het restje wissen.
            marge = 3
            links, boven, rechts, onder = vak
            for y in range(max(0, boven - marge), min(afbeelding.height, onder + marge)):
                for x in range(max(0, links - marge), min(afbeelding.width, rechts + marge)):
                    afbeelding.putpixel((x, y), (0, 0, 0, 0))
    afbeelding.save(pad)
    print(f"{naam}: {verwijderd} restpixels verwijderd")
