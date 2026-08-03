from pathlib import Path
import math, subprocess
from PIL import Image,ImageDraw,ImageFont,ImageFilter

ROOT=Path(r"C:\GitHub\juf_zisa_spelletjesmaker\tmp\algemene_reel_nieuw");SRC=ROOT/'bron';OUT=ROOT/'video';OUT.mkdir(exist_ok=True)
W,H,FPS=720,1280,25; NAVY=(24,58,82);BLUE=(46,124,151);YELLOW=(251,190,35);WHITE=(255,255,255);GREEN=(42,155,112)
REG=Path(r'C:\Windows\Fonts\arial.ttf');BOLD=Path(r'C:\Windows\Fonts\arialbd.ttf')
def ft(n,b=False):return ImageFont.truetype(str(BOLD if b else REG),n)
def center(d,s,y,f,c=WHITE):b=d.textbbox((0,0),s,font=f);d.text(((W-b[2])/2,y),s,font=f,fill=c)
def ease(v):v=max(0,min(1,v));return .5-.5*math.cos(math.pi*v)
def bg():
    im=Image.new('RGB',(W,H),NAVY);d=ImageDraw.Draw(im,'RGBA');d.ellipse((-150,-100,430,480),fill=(54,143,166,50));d.ellipse((410,850,930,1370),fill=(251,190,35,25));return im
def rounded_paste(frame,im,box,r=24):
    x,y,w,h=box;s=min(w/im.width,h/im.height);z=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);px=x+(w-z.width)//2;py=y+(h-z.height)//2
    shadow=Image.new('RGBA',(W,H),(0,0,0,0));sd=ImageDraw.Draw(shadow);sd.rounded_rectangle((px-8,py-8,px+z.width+8,py+z.height+8),r,fill=(0,0,0,110));frame.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10)))
    m=Image.new('L',z.size);ImageDraw.Draw(m).rounded_rectangle((0,0,z.width,z.height),r,fill=255);frame.paste(z,(px,py),m)
def image(name,crop):
    im=Image.open(SRC/name).convert('RGB');return im.crop(crop)

SCENES=[
 ('spelling.png',(310,90,890,900),'NIEUWE TOOL','Spellingbundels op maat','Kies je doel','Maak 3 niveaus','Download mét oplossingen'),
 ('leesbooster.png',(180,70,1110,705),'NIEUWE TOOL','Leesbooster','Werkbladen én smartboard','Technisch lezen','Lezen met beweging'),
 ('meetkunde.png',(245,70,760,505),'NIEUWE TOOL','Meetkundebundels','Kies oefeningen','Bekijk de leerlingpreview','Bewaar alles als pdf'),
 ('spelen1.png',(360,0,1100,690),'NIEUW IN DE SPELGENERATOR','Zisa Spelen','Kinderen spelen zelf','Per leerjaar opgebouwd','Computer • tablet • smartboard'),
 ('breuken.png',(260,100,1010,650),'OOK NIEUW BIJ ZISA SPELEN','Breukenstudio','Eerst een duidelijke demo','Daarna zelf oefenen','Leren door te doen'),
]
IMAGES=[image(a,b) for a,b,*_ in SCENES]

def intro(t):
    f=bg().convert('RGBA');d=ImageDraw.Draw(f,'RGBA');center(d,'ZISA’S SPELGENERATOR PRO',65,ft(25,True),YELLOW);center(d,'Er is zóveel',135,ft(61,True));center(d,'nieuw!',205,ft(73,True),YELLOW);center(d,'Voor jou én voor je leerlingen',305,ft(28,True))
    # Vier grote, herkenbare previews in plaats van één klein dashboard.
    thumbs=[IMAGES[0],IMAGES[1],IMAGES[2],IMAGES[3]];boxes=[(35,390,310,260),(375,390,310,260),(35,685,310,260),(375,685,310,260)]
    for im,box in zip(thumbs,boxes):rounded_paste(f,im,box,18)
    d.rounded_rectangle((60,1015,660,1110),30,fill=YELLOW+(255,));center(d,'Ontdek de vernieuwingen',1042,ft(35,True),NAVY);center(d,'In aparte reels volgt straks elke echte demo',1165,ft(23,True));return f.convert('RGB')
def scene(i,t):
    name,crop,kicker,title,a,b,c=SCENES[i];f=bg().convert('RGBA');d=ImageDraw.Draw(f,'RGBA');d.rounded_rectangle((28,28,692,92),29,fill=YELLOW+(245,));center(d,kicker,47,ft(23,True),NAVY);center(d,title,125,ft(50,True));
    # Scherm vult het midden en blijft volledig binnen een vast kader.
    rounded_paste(f,IMAGES[i],(28,220,664,590),24)
    d.rounded_rectangle((35,845,685,1135),32,fill=(255,255,255,245));items=[a,b,c];ys=[890,965,1040]
    for n,(txt,y) in enumerate(zip(items,ys)):
        d.ellipse((70,y-2,112,y+40),fill=(GREEN if n<2 else YELLOW)+(255,));d.ellipse((86,y+14,96,y+24),fill=(WHITE if n<2 else NAVY)+(255,));d.text((135,y),txt,font=ft(29,True),fill=NAVY)
    center(d,f'{i+1} van {len(SCENES)} vernieuwingen in deze reel',1190,ft(22,True),(210,230,239));return f.convert('RGB')
def bridge():
    f=bg();d=ImageDraw.Draw(f,'RGBA');center(d,'En dit is nog maar',185,ft(43,True));center(d,'het begin…',250,ft(65,True),YELLOW);d.rounded_rectangle((55,410,665,760),35,fill=(255,255,255,245));center(d,'Volgende reels:',455,ft(34,True),BLUE);center(d,'• echte bediening',535,ft(35,True),NAVY);center(d,'• duidelijke voorbeelden',605,ft(35,True),NAVY);center(d,'• elke tool apart',675,ft(35,True),NAVY);center(d,'Zo zie je precies wat mogelijk is',855,ft(31,True));center(d,'én hoe het werkt.',905,ft(31,True));center(d,'Volg mee en ontdek Zisa PRO',1060,ft(31,True),YELLOW);return f
def outro():
    f=bg();d=ImageDraw.Draw(f,'RGBA');center(d,"Alles zit in Zisa's",75,ft(35,True),YELLOW);center(d,'Spelgenerator PRO',130,ft(49,True));center(d,'Ook voor bestaande klanten inbegrepen',215,ft(25,True));d.rounded_rectangle((50,310,670,675),35,fill=(255,255,255,245));center(d,'1 maand',350,ft(32,True),BLUE);center(d,'€6',400,ft(65,True),NAVY);d.line((100,500,620,500),fill=(50,126,151,90),width=3);center(d,'12 maanden',535,ft(32,True),BLUE);center(d,'€40',585,ft(65,True),NAVY);center(d,'• geen automatische verlenging',745,ft(29,True));center(d,'• alle nieuwe tools, spellen en updates',805,ft(26,True));center(d,'  inbegrepen',845,ft(26,True));d.rounded_rectangle((65,945,655,1055),35,fill=YELLOW);center(d,'Ontdek Zisa PRO',972,ft(41,True),NAVY);center(d,'Bestaande klant?',1120,ft(27,True),YELLOW);center(d,'Ga meteen op ontdekking!',1163,ft(29,True));return f

def main():
    intro_d,scene_d,bridge_d,outro_d=4.0,4.15,3.8,5.4;dur=intro_d+len(SCENES)*scene_d+bridge_d+outro_d;dest=OUT/'zisa_algemene_vernieuwingen_helemaal_nieuw.mp4'
    cmd=['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)]
    with subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL) as p:
        for n in range(round(dur*FPS)):
            t=n/FPS
            if t<intro_d:fr=intro(t)
            elif t<intro_d+len(SCENES)*scene_d:q=t-intro_d;fr=scene(int(q//scene_d),q%scene_d)
            elif t<intro_d+len(SCENES)*scene_d+bridge_d:fr=bridge()
            else:fr=outro()
            p.stdin.write(fr.convert('RGB').tobytes())
        p.stdin.close()
        if p.wait():raise SystemExit('render mislukt')
    print(dest)
if __name__=='__main__':main()
