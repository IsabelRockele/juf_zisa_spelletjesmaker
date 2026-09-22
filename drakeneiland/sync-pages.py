"""Keep edition entry pages aligned while sharing all game code and assets."""
from pathlib import Path
root=Path(__file__).resolve().parent
source=(root/'index.html').read_text(encoding='utf-8')
for edition in ('pro','ontdek'):
    target=root.parent/edition/'drakeneiland'
    target.mkdir(exist_ok=True)
    (target/'index.html').write_text(source.replace('<head>','<head><base href="../../drakeneiland/">',1).replace('href="../index.html"',f'href="../{edition}/app.html"'),encoding='utf-8')
