from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "assets" / "icons"

TARGETS = {
    "schoolreis", "toneel", "soep-school", "schoolfruit", "levensbeschouwing",
    "moederdag", "vaderdag", "dikke-truiendag", "ontbijt-school", "eetfestijn",
    "schoolfeest", "wieltjesdag", "schoolmusical", "film",
    "brooddoos-broodbak", "drinkbus-vaste-plek", "snack-fruit-bak", "agendamap-tafel",
    "brieven-afgeven", "huistaak-afgeven", "boekentas-opbergen", "stille-dagstarter",
    "leeskwartier", "dagelijkse-kost", "geschiedenis", "aardrijkskunde",
    "mens-maatschappij", "natuur", "techniek", "media", "actua", "hoekenwerk",
    "contractwerk", "sneller-klaar", "doe-doosjes", "ipad", "laptop", "toets",
    "levensbeschouwing-nieuw", "katholieke-godsdienst", "islamitische-godsdienst",
    "protestantse-godsdienst", "orthodoxe-godsdienst", "anglicaanse-godsdienst", "zedenleer",
}

def verwijder_randrestjes(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    alpha = im.getchannel("A")
    pix = alpha.load()
    w, h = im.size
    gezien = set()
    componenten = []
    for y in range(h):
        for x in range(w):
            if (x, y) in gezien or pix[x, y] < 20:
                continue
            stack = [(x, y)]
            gezien.add((x, y))
            comp = []
            rand = False
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                rand |= cx < 3 or cy < 3 or cx >= w - 3 or cy >= h - 3
                for nx, ny in ((cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in gezien and pix[nx, ny] >= 20:
                        gezien.add((nx, ny)); stack.append((nx, ny))
            componenten.append((len(comp), rand, comp))
    grootste = max((c[0] for c in componenten), default=1)
    rgba = im.load()
    for grootte, raakt_rand, comp in componenten:
        if raakt_rand and grootte < grootste * .18:
            for x, y in comp:
                rgba[x, y] = (0, 0, 0, 0)
    return im

def strak_vierkant(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    crop = im.crop(bbox)
    maxzijde = 464
    schaal = min(maxzijde / crop.width, maxzijde / crop.height)
    crop = crop.resize((max(1, round(crop.width*schaal)), max(1, round(crop.height*schaal))), Image.Resampling.LANCZOS)
    uit = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    uit.alpha_composite(crop, ((512-crop.width)//2, (512-crop.height)//2))
    return uit

for naam in TARGETS:
    pad = ICONS / f"{naam}.png"
    if pad.exists():
        strak_vierkant(verwijder_randrestjes(Image.open(pad))).save(pad)

print(f"{sum((ICONS / f'{n}.png').exists() for n in TARGETS)} iconen opgeschoond")
