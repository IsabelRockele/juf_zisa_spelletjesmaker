from pathlib import Path
import subprocess
from PIL import Image,ImageDraw,ImageFont,ImageFilter

ROOT=Path(r'C:\GitHub\juf_zisa_spelletjesmaker\tmp\algemene_reel_nieuw');SRC=ROOT/'bron';OUT=ROOT/'video';OUT.mkdir(exist_ok=True)
W,H,FPS=720,1280,25;NAVY=(24,58,82);BLUE=(48,124,151);YELLOW=(251,190,35);WHITE=(255,255,255);GREEN=(42,155,112)
REG=Path(r'C:\Windows\Fonts\arial.ttf');BOLD=Path(r'C:\Windows\Fonts\arialbd.ttf')
def ft(n,b=False):return ImageFont.truetype(str(BOLD if b else REG),n)
def center(d,s,y,f,c=WHITE):b=d.textbbox((0,0),s,font=f);d.text(((W-b[2])/2,y),s,font=f,fill=c)
def base():
    im=Image.new('RGB',(W,H),NAVY);d=ImageDraw.Draw(im,'RGBA');d.ellipse((-180,-150,390,420),fill=(66,157,178,45));d.ellipse((440,930,900,1390),fill=(251,190,35,24));return im
def paste_full(frame,im):
    # Eén vaste kijkruimte. Altijd contain: geen pixel van de tool wordt afgesneden.
    x,y,w,h=20,295,680,520;s=min(w/im.width,h/im.height);z=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);px=x+(w-z.width)//2;py=y+(h-z.height)//2
    d=ImageDraw.Draw(frame,'RGBA');d.rounded_rectangle((x,y,x+w,y+h),25,fill=(241,246,248,255));shadow=Image.new('RGBA',(W,H),(0,0,0,0));ImageDraw.Draw(shadow).rounded_rectangle((px-7,py-7,px+z.width+7,py+z.height+7),18,fill=(0,0,0,100));frame.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(9)))
    mask=Image.new('L',z.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,z.width,z.height),14,fill=255);frame.paste(z,(px,py),mask)

DATA=[
 ('spelling_volledig.png','1 • SPELLINGBUNDELS','Maak materiaal op maat','Doel kiezen • 3 niveaus • oplossingen'),
 ('leesbooster_volledig.png','2 • LEESBOOSTER','Werkblad én smartboardspel','Technisch lezen met speelse beweegmomenten'),
 ('meetkunde_volledig.png','3 • MEETKUNDEBUNDELS','Zelf oefeningen combineren','Volledige leerlingpreview • bewaren als pdf'),
 ('spelen_volledig.png','4 • ZISA SPELEN','Kinderen oefenen nu zelf','Spellen per leerjaar • ook op het smartboard'),
]
IMS=[Image.open(SRC/a).convert('RGB') for a,*_ in DATA]
def intro():
    f=base();d=ImageDraw.Draw(f,'RGBA');center(d,"ZISA'S SPELGENERATOR PRO",95,ft(27,True),YELLOW);center(d,'Wat is er',200,ft(60,True));center(d,'allemaal nieuw?',275,ft(62,True),YELLOW);d.rounded_rectangle((55,430,665,860),35,fill=(255,255,255,245));
    rows=[('1','Spellingbundels'),('2','Leesbooster'),('3','Meetkundebundels'),('4','Zisa Spelen')]
    for n,(num,label) in enumerate(rows):
        y=475+n*88;d.ellipse((95,y,145,y+50),fill=(GREEN if n<3 else YELLOW)+(255,));center_num=ft(25,True);b=d.textbbox((0,0),num,font=center_num);d.text((120-(b[2]/2),y+10),num,font=center_num,fill=WHITE if n<3 else NAVY);d.text((175,y+6),label,font=ft(32,True),fill=NAVY)
    center(d,'Rustig en duidelijk in beeld',955,ft(32,True));center(d,'Daarna volgen aparte demo-reels',1010,ft(28,True),YELLOW);center(d,'waarin elke tool echt wordt bediend.',1055,ft(25,True));return f
def scene(i):
    f=base().convert('RGBA');d=ImageDraw.Draw(f,'RGBA');tag,title,sub=DATA[i][1:];center(d,tag,42,ft(23,True),YELLOW);center(d,title,92,ft(48,True));center(d,'HET VOLLEDIGE SCHERM',205,ft(22,True),(195,225,235));paste_full(f,IMS[i]);d.rounded_rectangle((35,875,685,1085),30,fill=(255,255,255,245));center(d,sub,915,ft(27,True),BLUE)
    benefits=[['Kies een spellingdoel','Werk op verschillende niveaus'],['Wissel tussen werkblad en spel','Laat lezen en bewegen afwisselen'],['Kies en combineer oefeningen','Bekijk meteen wat de leerling krijgt'],['Oefen interactief per leerjaar','Computer • tablet • smartboard']][i]
    center(d,benefits[0],975,ft(28,True),NAVY);center(d,benefits[1],1025,ft(26,True),NAVY);center(d,f'{i+1} van 4',1168,ft(24,True),YELLOW);return f.convert('RGB')
def follow():
    f=base();d=ImageDraw.Draw(f,'RGBA');center(d,'Dit was het overzicht',170,ft(49,True));center(d,'De echte demo’s volgen',250,ft(47,True),YELLOW);d.rounded_rectangle((55,390,665,780),35,fill=(255,255,255,245));center(d,'Per tool één reel',445,ft(38,True),NAVY);center(d,'• echt bedienen',535,ft(34,True),NAVY);center(d,'• volledige voorbeelden',610,ft(34,True),NAVY);center(d,'• rustig meekijken',685,ft(34,True),NAVY);center(d,'Zo zie je precies hoe alles werkt',885,ft(31,True));center(d,'en wat je ermee kunt maken.',935,ft(31,True));return f
def outro():
    f=base();d=ImageDraw.Draw(f,'RGBA');center(d,"Alles in Zisa's",70,ft(37,True),YELLOW);center(d,'Spelgenerator PRO',128,ft(50,True));center(d,'Nieuwe tools en updates inbegrepen',215,ft(27,True));d.rounded_rectangle((50,310,670,675),35,fill=(255,255,255,245));center(d,'1 maand',350,ft(32,True),BLUE);center(d,'€6',400,ft(65,True),NAVY);d.line((100,500,620,500),fill=(50,126,151,90),width=3);center(d,'12 maanden',535,ft(32,True),BLUE);center(d,'€40',585,ft(65,True),NAVY);center(d,'• geen automatische verlenging',750,ft(29,True));center(d,'• alle nieuwe tools, spellen en updates',810,ft(26,True));center(d,'  inbegrepen',850,ft(26,True));d.rounded_rectangle((65,945,655,1055),35,fill=YELLOW);center(d,'Ontdek Zisa PRO',972,ft(41,True),NAVY);center(d,'Gebruik je Zisa al?',1120,ft(27,True),YELLOW);center(d,'Dan staat alles meteen voor je klaar.',1163,ft(25,True));return f
def main():
    intro_d,scene_d,follow_d,outro_d=4.2,4.5,3.8,5.4;dur=intro_d+4*scene_d+follow_d+outro_d;dest=OUT/'zisa_algemene_vernieuwingen_rustig_volledig.mp4';cmd=['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)]
    with subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL) as p:
        for n in range(round(dur*FPS)):
            t=n/FPS
            if t<intro_d:fr=intro()
            elif t<intro_d+4*scene_d:fr=scene(int((t-intro_d)//scene_d))
            elif t<intro_d+4*scene_d+follow_d:fr=follow()
            else:fr=outro()
            p.stdin.write(fr.convert('RGB').tobytes())
        p.stdin.close()
        if p.wait():raise SystemExit('render mislukt')
    print(dest)
if __name__=='__main__':main()
