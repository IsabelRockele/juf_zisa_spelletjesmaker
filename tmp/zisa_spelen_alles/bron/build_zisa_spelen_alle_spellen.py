from pathlib import Path
import math, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(r"C:\GitHub\juf_zisa_spelletjesmaker\tmp\zisa_spelen_alles")
ASSETS = ROOT / "bron"
OUT = ROOT / "video"
OUT.mkdir(parents=True, exist_ok=True)
W, H, FPS = 720, 1280, 25
NAVY, BLUE, YELLOW, WHITE = (25, 59, 82), (50, 126, 151), (250, 190, 36), (255, 255, 255)
FONT = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_B = Path(r"C:\Windows\Fonts\arialbd.ttf")
CARD_CACHE = {}

def font(size, bold=False):
    return ImageFont.truetype(str(FONT_B if bold else FONT), size)

def ease(v):
    v = max(0, min(1, v))
    return .5 - .5 * math.cos(math.pi * v)

def centered(draw, text, y, f, fill=WHITE):
    box = draw.textbbox((0, 0), text, font=f)
    draw.text(((W - box[2]) / 2, y), text, font=f, fill=fill)

def background(im=None):
    if im is None:
        base = Image.new("RGB", (W, H), NAVY)
    else:
        crop = im.resize((W, round(im.height * W / im.width)), Image.Resampling.LANCZOS)
        if crop.height < H:
            crop = im.resize((round(im.width * H / im.height), H), Image.Resampling.LANCZOS)
        left = (crop.width - W) // 2
        top = (crop.height - H) // 2
        base = crop.crop((left, top, left + W, top + H)).filter(ImageFilter.GaussianBlur(22))
        veil = Image.new("RGBA", (W, H), (12, 43, 61, 205))
        base = Image.alpha_composite(base.convert("RGBA"), veil).convert("RGB")
    return base

def screenshot_card(filename):
    if filename in CARD_CACHE:
        cached, placement = CARD_CACHE[filename]
        return cached.copy(), placement
    im = Image.open(ASSETS / filename).convert("RGB")
    scale = min(680 / im.width, 410 / im.height)
    shown = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    card = Image.new("RGB", (W, H), NAVY)
    x = (W - shown.width) // 2
    y = 350 + (410 - shown.height) // 2
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x - 8, y - 8, x + shown.width + 8, y + shown.height + 8), 20, fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    card = background(im).convert("RGBA")
    card = Image.alpha_composite(card, shadow)
    mask = Image.new("L", shown.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, shown.width, shown.height), 14, fill=255)
    card.paste(shown, (x, y), mask)
    result = card.convert("RGB"), (x, y, shown.width / im.width, shown.height / im.height)
    CARD_CACHE[filename] = result
    return result[0].copy(), result[1]

def fade(a, b, u):
    return Image.blend(a, b, ease(u))

def heading(frame, kicker, title, step):
    d = ImageDraw.Draw(frame, "RGBA")
    d.rounded_rectangle((34, 34, 686, 96), 28, fill=(250, 190, 36, 245))
    centered(d, kicker, 50, font(24, True), NAVY)
    centered(d, title, 125, font(51, True), WHITE)
    centered(d, step, 205, font(29, True), YELLOW)

def pointer(frame, start, target, t, tap_at=1.35):
    if t < .35 or t > 2.15:
        return
    u = ease((t - .35) / .9)
    x = start[0] + (target[0] - start[0]) * u
    y = start[1] + (target[1] - start[1]) * u
    d = ImageDraw.Draw(frame, "RGBA")
    if tap_at <= t <= tap_at + .5:
        q = (t - tap_at) / .5
        r = 24 + 70 * q
        d.ellipse((x-r, y-r, x+r, y+r), outline=(250, 190, 36, round(220*(1-q))), width=10)
    d.ellipse((x-25, y-25, x+25, y+25), fill=(255,255,255,245), outline=(25,59,82,255), width=5)
    d.ellipse((x-7, y-7, x+7, y+7), fill=(250,190,36,255))

GAMES = [
    ("De bijenkorf", "Kies het juiste antwoord", "bijenkorf_antwoorden.png", "bijenkorf_na_juist.png", "bijenkorf_volgende.png", (835,485), "Juist! Meteen een nieuwe oefening"),
    ("Splitsbingo", "Draai, denk en vul in", "bingo_voor.png", "bingo_resultaat.png", "bingo_juist.png", (640,350), "3 ingevuld — goed zo!"),
    ("De honingpot", "Beweeg Bibi en vang de honing", "honingpot_voor.png", "honingpot_valt.png", "honingpot_beweegt.png", (730,665), "Bibi beweegt echt mee"),
    ("De bloemenweide", "Tik de juiste bloem aan", "bloemen_voor.png", "bloemen_na_juist.png", "bloemen_volgende.png", (450,430), "Goed gekozen! Volgende som"),
    ("Honingpot vullen", "Reken en vul de honingpot", "vullen_voor.png", "vullen_juist.png", None, (60,335), "Juist antwoord: de pot vult verder"),
    ("De bijenrace", "Los op en vlieg vooruit", "race_voor.png", "race_juist.png", None, (640,580), "Proficiat: 1 plaats vooruit!"),
]

def intro(t):
    f = background()
    d = ImageDraw.Draw(f, "RGBA")
    d.ellipse((220, 70, 500, 350), fill=(250,190,36,30))
    bee = Path(r"C:\GitHub\juf_zisa_spelletjesmaker\spelen\games\start_afbeeldingen\bibi_leerjaar1.png")
    if bee.exists():
        im = Image.open(bee).convert("RGBA")
        im.thumbnail((250,250), Image.Resampling.LANCZOS)
        f.paste(im, ((W-im.width)//2, 90), im)
    centered(d, "NIEUW TOEGEVOEGD AAN", 390, font(26, True), YELLOW)
    centered(d, "Zisa's Spelgenerator", 445, font(51, True), WHITE)
    centered(d, "PRO", 510, font(50, True), YELLOW)
    d.rounded_rectangle((55, 610, 665, 820), 32, fill=(255,255,255,245))
    centered(d, "Zisa Spelen", 650, font(64, True), NAVY)
    centered(d, "6 spellen voor", 745, font(35, True), BLUE)
    centered(d, "het eerste leerjaar", 790, font(35, True), BLUE)
    centered(d, "Geen apart product — gewoon inbegrepen", 925, font(25, True), WHITE)
    centered(d, "in hetzelfde PRO-abonnement", 965, font(25, True), WHITE)
    centered(d, "Kijk mee: we spelen ze alle 6!", 1090, font(30, True), YELLOW)
    return f

def game_frame(index, local_t):
    title, action, before, middle, after, original_target, result = GAMES[index]
    cards = [screenshot_card(p) for p in (before, middle, after) if p]
    base = cards[0][0]
    if 1.65 <= local_t < 2.05:
        base = fade(cards[0][0], cards[1][0], (local_t-1.65)/.4)
    elif local_t >= 2.05:
        base = cards[1][0]
    if len(cards) == 3 and 3.0 <= local_t < 3.35:
        base = fade(cards[1][0], cards[2][0], (local_t-3.0)/.35)
    elif len(cards) == 3 and local_t >= 3.35:
        base = cards[2][0]
    heading(base, f"SPEL {index+1} VAN 6 • IN ZISA'S SPELGENERATOR PRO", title, action)
    x, y, sx, sy = cards[0][1]
    target = (x + original_target[0]*sx, y + original_target[1]*sy)
    pointer(base, (650, 1015), target, local_t)
    d = ImageDraw.Draw(base, "RGBA")
    if local_t >= 2.05:
        d.rounded_rectangle((38, 835, 682, 917), 28, fill=(250,190,36,245))
        centered(d, result, 856, font(27, True), NAVY)
    centered(d, "Echt gespeeld in de tool", 1110, font(25, True), WHITE)
    return base

def outro(t):
    f = background()
    d = ImageDraw.Draw(f, "RGBA")
    centered(d, "Zisa Spelen zit nu in", 115, font(34, True), YELLOW)
    centered(d, "Zisa's Spelgenerator PRO", 170, font(47, True), WHITE)
    centered(d, "Voor nieuwe én bestaande klanten", 260, font(27, True), WHITE)
    d.rounded_rectangle((50, 350, 670, 690), 35, fill=(255,255,255,245))
    centered(d, "1 maand", 395, font(32, True), BLUE)
    centered(d, "€6", 445, font(65, True), NAVY)
    d.line((100,535,620,535), fill=(50,126,151,90), width=3)
    centered(d, "12 maanden", 565, font(32, True), BLUE)
    centered(d, "€40", 615, font(65, True), NAVY)
    centered(d, "• geen automatische verlenging", 760, font(29, True), WHITE)
    centered(d, "• nieuwe spellen en updates inbegrepen", 815, font(27, True), WHITE)
    d.rounded_rectangle((65, 930, 655, 1040), 35, fill=(250,190,36,255))
    centered(d, "Ontdek Zisa PRO", 957, font(41, True), NAVY)
    centered(d, "Ook bestaande klanten kunnen meteen spelen!", 1110, font(24, True), WHITE)
    return f

def main():
    duration = 3.6 + 6*4.25 + 5.2
    output = OUT / "zisa_spelen_eerste_leerjaar_alle_6_echt_gespeeld.mp4"
    cmd = ["ffmpeg","-y","-f","rawvideo","-vcodec","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-an","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",str(output)]
    with subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) as p:
        for n in range(round(duration*FPS)):
            t = n/FPS
            if t < 3.6:
                frame = intro(t)
            elif t < 3.6 + 6*4.25:
                q = t-3.6
                frame = game_frame(int(q//4.25), q%4.25)
            else:
                frame = outro(t-(3.6+6*4.25))
            p.stdin.write(frame.convert("RGB").tobytes())
        p.stdin.close()
        if p.wait() != 0:
            raise SystemExit("ffmpeg render failed")
    print(output)

if __name__ == "__main__":
    main()
