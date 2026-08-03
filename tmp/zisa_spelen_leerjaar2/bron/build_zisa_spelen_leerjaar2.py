from pathlib import Path
import math, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT=Path(r"C:\GitHub\juf_zisa_spelletjesmaker\tmp\zisa_spelen_leerjaar2")
SRC=ROOT/"bron"; OUT=ROOT/"video"; OUT.mkdir(exist_ok=True)
W,H,FPS=720,1280,25
NAVY=(25,59,82); BLUE=(50,126,151); YELLOW=(250,190,36); WHITE=(255,255,255)
REG=Path(r"C:\Windows\Fonts\arial.ttf"); BOLD=Path(r"C:\Windows\Fonts\arialbd.ttf")
CACHE={}

def ft(n,b=False): return ImageFont.truetype(str(BOLD if b else REG),n)
def ease(v): v=max(0,min(1,v)); return .5-.5*math.cos(math.pi*v)
def center(d,s,y,f,c=WHITE):
    b=d.textbbox((0,0),s,font=f); d.text(((W-b[2])/2,y),s,font=f,fill=c)
def bg(im=None):
    if im is None:return Image.new('RGB',(W,H),NAVY)
    z=im.resize((W,round(im.height*W/im.width)),Image.Resampling.LANCZOS)
    if z.height<H:z=im.resize((round(im.width*H/im.height),H),Image.Resampling.LANCZOS)
    z=z.crop(((z.width-W)//2,(z.height-H)//2,(z.width+W)//2,(z.height+H)//2)).filter(ImageFilter.GaussianBlur(22)).convert('RGBA')
    return Image.alpha_composite(z,Image.new('RGBA',(W,H),(10,38,57,205))).convert('RGB')
def card(name):
    if name in CACHE:return CACHE[name][0].copy(),CACHE[name][1]
    im=Image.open(SRC/name).convert('RGB'); scale=min(680/im.width,430/im.height)
    z=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    x=(W-z.width)//2;y=345+(430-z.height)//2
    base=bg(im).convert('RGBA'); shadow=Image.new('RGBA',(W,H),(0,0,0,0)); sd=ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x-7,y-7,x+z.width+7,y+z.height+7),18,fill=(0,0,0,115));shadow=shadow.filter(ImageFilter.GaussianBlur(9));base=Image.alpha_composite(base,shadow)
    mask=Image.new('L',z.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,z.width,z.height),14,fill=255);base.paste(z,(x,y),mask)
    val=(base.convert('RGB'),(x,y,scale));CACHE[name]=val;return val[0].copy(),val[1]
def blend(a,b,u):return Image.blend(a,b,ease(u))
def head(im,i,title,action):
    d=ImageDraw.Draw(im,'RGBA');d.rounded_rectangle((28,30,692,94),30,fill=YELLOW+(245,))
    center(d,f"SPEL {i} VAN 4 • IN ZISA'S SPELGENERATOR PRO",48,ft(23,True),NAVY)
    center(d,title,122,ft(49,True));center(d,action,195,ft(28,True),YELLOW)
def cursor(im,t,target):
    if not .3<t<2.25:return
    u=ease((t-.3)/.95);x=650+(target[0]-650)*u;y=1040+(target[1]-1040)*u;d=ImageDraw.Draw(im,'RGBA')
    if 1.3<t<1.85:
        q=(t-1.3)/.55;r=25+75*q;d.ellipse((x-r,y-r,x+r,y+r),outline=(250,190,36,round(220*(1-q))),width=10)
    d.ellipse((x-25,y-25,x+25,y+25),fill=(255,255,255,245),outline=NAVY+(255,),width=5);d.ellipse((x-7,y-7,x+7,y+7),fill=YELLOW+(255,))

GAMES=[
 ("Bellen prikken","Prik het juiste tafelantwoord",["bellen_voor.png","bellen_juist.png"],(400,25),"Juist geraakt — de volgende som verschijnt"),
 ("Tafelmemory","Draai kaartjes om en zoek het paar",["memory_voor.png","memory_een.png","memory_twee.png"],(340,130),"Een tafelsom en antwoord horen samen"),
 ("Vier op een rij","Reken juist en plaats je schijf",["vieroprij_voor.png","vieroprij_juist.png","vieroprij_zet.png"],(690,430),"Juist gerekend — kies je kolom"),
 ("Zisa's Zebrawinkel","Betaal gepast met echt geldmateriaal",["winkel_spel.png","winkel_juist.png"],(945,420),"Heel goed: precies juist betaald!"),
]
def intro():
    im=bg();d=ImageDraw.Draw(im,'RGBA'); mascot=Path(r"C:\GitHub\juf_zisa_spelletjesmaker\spelen\games\start_afbeeldingen\zisa_leerjaar2.png")
    if mascot.exists():
        z=Image.open(mascot).convert('RGBA');z.thumbnail((280,270),Image.Resampling.LANCZOS);im.paste(z,((W-z.width)//2,65),z)
    center(d,"NIEUW TOEGEVOEGD AAN",370,ft(26,True),YELLOW);center(d,"Zisa's Spelgenerator",425,ft(50,True));center(d,"PRO",490,ft(48,True),YELLOW)
    d.rounded_rectangle((45,590,675,815),34,fill=(255,255,255,245));center(d,"Zisa Spelen",630,ft(62,True),NAVY);center(d,"Tweede leerjaar",725,ft(39,True),BLUE)
    center(d,"4 echte spellen",875,ft(38,True),YELLOW);center(d,"tafels én geld",925,ft(31,True));center(d,"Geen apart product — inbegrepen in PRO",1040,ft(25,True));center(d,"We spelen ze meteen!",1125,ft(30,True),YELLOW);return im
def game(i,t):
    title,action,names,target0,result=GAMES[i]; cs=[card(n) for n in names];base=cs[0][0]
    if 1.65<=t<2.05:base=blend(cs[0][0],cs[1][0],(t-1.65)/.4)
    elif t>=2.05:base=cs[1][0]
    if len(cs)==3 and 3.05<=t<3.4:base=blend(cs[1][0],cs[2][0],(t-3.05)/.35)
    elif len(cs)==3 and t>=3.4:base=cs[2][0]
    head(base,i+1,title,action);x,y,s=cs[0][1];cursor(base,t,(x+target0[0]*s,y+target0[1]*s));d=ImageDraw.Draw(base,'RGBA')
    if t>=2.05:d.rounded_rectangle((35,840,685,925),28,fill=YELLOW+(245,));center(d,result,863,ft(25,True),NAVY)
    center(d,"Echt gespeeld in de tool",1112,ft(25,True));return base
def outro():
    im=bg();d=ImageDraw.Draw(im,'RGBA');center(d,"Zisa Spelen zit nu in",110,ft(35,True),YELLOW);center(d,"Zisa's Spelgenerator PRO",170,ft(47,True));center(d,"Voor nieuwe én bestaande klanten",260,ft(27,True))
    d.rounded_rectangle((50,350,670,690),35,fill=(255,255,255,245));center(d,"1 maand",395,ft(32,True),BLUE);center(d,"€6",445,ft(65,True),NAVY);d.line((100,535,620,535),fill=(50,126,151,90),width=3);center(d,"12 maanden",565,ft(32,True),BLUE);center(d,"€40",615,ft(65,True),NAVY)
    center(d,"• geen automatische verlenging",760,ft(29,True));center(d,"• nieuwe spellen en updates inbegrepen",815,ft(27,True));d.rounded_rectangle((65,930,655,1040),35,fill=YELLOW);center(d,"Ontdek Zisa PRO",957,ft(41,True),NAVY);center(d,"Bestaande klanten kunnen meteen spelen!",1110,ft(25,True));return im
def main():
    intro_d,game_d,outro_d=3.7,5.0,5.2;dur=intro_d+4*game_d+outro_d;path=OUT/'zisa_spelen_tweede_leerjaar_echt_gespeeld.mp4'
    cmd=['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(path)]
    with subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL) as p:
        for n in range(round(dur*FPS)):
            t=n/FPS
            if t<intro_d:f=intro()
            elif t<intro_d+4*game_d:q=t-intro_d;f=game(int(q//game_d),q%game_d)
            else:f=outro()
            p.stdin.write(f.convert('RGB').tobytes())
        p.stdin.close()
        if p.wait():raise SystemExit('render mislukt')
    print(path)
if __name__=='__main__':main()
