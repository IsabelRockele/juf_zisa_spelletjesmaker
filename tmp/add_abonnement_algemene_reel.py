from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

W,H,FPS=720,1280,25
TMP=Path(r"C:\GitHub\juf_zisa_spelletjesmaker\tmp")
SOURCE=Path(r"C:\Users\isabe\OneDrive\Webshop\Reels Zisa_spelletjesmaker\01 Algemene vernieuwingen\Videos\zisa_updates_algemene_reel_groot.mp4")
OUTRO=TMP/"algemene_reel_abonnement_outro.mp4"
FINAL=TMP/"zisa_updates_algemene_reel_met_abonnement.mp4"
REG=Path(r"C:\Windows\Fonts\arial.ttf");BOLD=Path(r"C:\Windows\Fonts\arialbd.ttf")

def ft(n,b=False):return ImageFont.truetype(str(BOLD if b else REG),n)
def center(d,s,y,f,c):
    b=d.textbbox((0,0),s,font=f);d.text(((W-b[2])/2,y),s,font=f,fill=c)

def frame():
    im=Image.new('RGB',(W,H),(25,59,82));d=ImageDraw.Draw(im,'RGBA')
    d.ellipse((225,55,495,325),fill=(250,190,36,28));center(d,"Zisa's Spelgenerator PRO",105,ft(45,True),(255,255,255));center(d,"Alles in één abonnement",180,ft(34,True),(250,190,36))
    center(d,"Voor nieuwe én bestaande klanten",265,ft(27,True),(255,255,255))
    d.rounded_rectangle((50,350,670,690),35,fill=(255,255,255,245));center(d,"1 maand",395,ft(32,True),(50,126,151));center(d,"€6",445,ft(65,True),(25,59,82));d.line((100,535,620,535),fill=(50,126,151,90),width=3);center(d,"12 maanden",565,ft(32,True),(50,126,151));center(d,"€40",615,ft(65,True),(25,59,82))
    center(d,"• geen automatische verlenging",760,ft(29,True),(255,255,255));center(d,"• alle nieuwe tools en spellen inbegrepen",815,ft(26,True),(255,255,255));center(d,"• updates inbegrepen",865,ft(27,True),(255,255,255))
    d.rounded_rectangle((65,955,655,1065),35,fill=(250,190,36,255));center(d,"Ontdek Zisa PRO",982,ft(41,True),(25,59,82));center(d,"Gebruik je Zisa al?",1130,ft(27,True),(250,190,36));center(d,"Dan staan de updates meteen voor je klaar!",1175,ft(23,True),(255,255,255));return im

cmd=['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(OUTRO)]
with subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL) as p:
    raw=frame().tobytes()
    for _ in range(round(5.4*FPS)):p.stdin.write(raw)
    p.stdin.close()
    if p.wait():raise SystemExit('outro mislukt')

fc='[0:v]fps=25,scale=720:1280,setsar=1[a];[1:v]fps=25,scale=720:1280,setsar=1[b];[a][b]concat=n=2:v=1:a=0[v]'
subprocess.run(['ffmpeg','-y','-i',str(SOURCE),'-i',str(OUTRO),'-filter_complex',fc,'-map','[v]','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(FINAL)],check=True)
print(FINAL)
