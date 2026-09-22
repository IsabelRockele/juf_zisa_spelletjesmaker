"""Read-only check of frame boundaries; requires Pillow. Does not alter images."""
from pathlib import Path
import re
from PIL import Image

root = Path(__file__).resolve().parent
source = (root / 'game.js').read_text(encoding='utf-8')
cuts = {key: [int(a), int(b)] for key, a, b in re.findall(
    r"'([a-z]+-(?:jump|knees|squat))':\[(\d+),(\d+)\]", source)}
checked = 0
for character in ['astronaut', 'diver', 'ranger', 'baker', 'sport']:
    for motion in ['jump', 'knees', 'squat']:
        key = f'{character}-{motion}'
        with Image.open(root / 'werelden' / f'bewegen-{key}.png') as image:
            assert image.mode == 'RGBA' and image.size == (1536, 1024), key
            alpha = image.getchannel('A')
            assert alpha.getpixel((0, 0)) == 0, key
            for x in cuts.get(key, [512, 1024]):
                # Allow only invisible 1/255 antialias residue at the seam.
                assert alpha.crop((x, 0, x + 1, 1024)).getextrema()[1] <= 2, (key, x)
            checked += 1
print(f'{checked} bewegingsbladen gecontroleerd: transparant, juiste afmetingen, schone kadergrenzen.')
