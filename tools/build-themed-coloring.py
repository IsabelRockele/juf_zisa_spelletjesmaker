"""Analyse original illustrations into colorable areas and safe exercise boxes.

Keeps the reference PNGs unchanged. Exports worksheet-native compartments and
contours shared by the exercise sheet and its colored solution.
"""
import json
import sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image
from coloring_vector import vector_fields
from coloring_text_boxes import oriented_boxes
from coloring_practice import add_large_field_practice

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'kleurplaten'


def analyse(filename,entry):
    source = Image.open(FOLDER / filename).convert('RGB')
    image = source.convert('L')
    gray = np.asarray(image)[:image.height//2*2, :image.width//2*2]
    if entry.get('sourceColored'):
        # Trace the actual black outline separately from the flat color plan.
        rgb_source=np.asarray(source)
        gray=rgb_source.max(axis=2)[:image.height//2*2,:image.width//2*2]
        gray=np.where(gray>entry.get('sourceInkThreshold',45),255,0).astype(np.uint8)
        if entry.get('whiteOnBlackBoundary') or entry.get('whiteOnColorBoundary') or entry.get('whiteOnGrayBoundary'):
            # A black-and-white animal still needs a closed outline around its
            # white marking when the colored source omits that black stroke.
            light=rgb_source.min(axis=2)>160;dark=rgb_source.max(axis=2)<100
            if entry.get('whiteOnColorBoundary'):
                dark=(rgb_source[:,:,0]>160)&(rgb_source[:,:,1]<190)&(rgb_source[:,:,2]<100)
            if entry.get('whiteOnGrayBoundary'):
                light=rgb_source.min(axis=2)>220
                dark=(rgb_source.max(axis=2)<210)&(rgb_source.min(axis=2)>75)&((rgb_source.max(axis=2)-rgb_source.min(axis=2))<30)
            edge=light&(~np.roll(light,1,0)|~np.roll(light,-1,0)|~np.roll(light,1,1)|~np.roll(light,-1,1))
            nearby=np.zeros(light.shape,dtype=bool)
            for dy in range(-2,3):
                for dx in range(-2,3):nearby|=np.roll(np.roll(dark,dy,0),dx,1)
            x0,y0,x1,y1=entry.get('whiteOnBlackBoundary',entry.get('whiteOnColorBoundary',entry.get('whiteOnGrayBoundary')));window=np.zeros(light.shape,dtype=bool);window[y0:y1,x0:x1]=True
            gray[(edge&nearby&window)[:gray.shape[0],:gray.shape[1]]]=0
    # Close only an explicitly reviewed omitted outline in the native trace.
    for stroke in entry.get('sourceOutlineLines',[]):
        yy,xx=np.indices(gray.shape);(ax,ay),(bx,by)=stroke['points'];dx=bx-ax;dy=by-ay
        t=np.clip(((xx-ax)*dx+(yy-ay)*dy)/(dx*dx+dy*dy),0,1)
        gray[(xx-ax-t*dx)**2+(yy-ay-t*dy)**2<=(stroke.get('width',6)/2)**2]=0
    white = gray.reshape(gray.shape[0]//2,2,gray.shape[1]//2,2).min(axis=(1,3)) > 190
    safe = gray.reshape(gray.shape[0]//2, 2, gray.shape[1]//2, 2).min(axis=(1,3)) > 220
    h, w = white.shape
    labels = np.full((h,w), -1, dtype=np.int32)
    parts = []
    for y in range(h):
        for x in range(w):
            if not white[y,x] or labels[y,x] >= 0:
                continue
            idx = len(parts)
            labels[y,x] = idx
            queue = deque([(x,y)])
            pixels = []
            while queue:
                xx, yy = queue.popleft()
                pixels.append((xx,yy))
                for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                    if 0 <= nx < w and 0 <= ny < h and white[ny,nx] and labels[ny,nx] < 0:
                        labels[ny,nx] = idx
                        queue.append((nx,ny))
            parts.append(pixels)

    if entry.get('sourceColored'):
        palette={0:'#bce5f5',1:'#ffe27b',2:'#ffa44d',3:'#96ce79',7:'#ef7872',9:'#548d5b',12:'#ffffff',13:'#d7b48a',14:'#795548'}
        if entry.get('sourcePalette'):
            full={0:'#bce5f5',1:'#ffe27b',2:'#ffa44d',3:'#96ce79',4:'#f4a7bd',5:'#bb9bd8',6:'#69a8e5',7:'#ef7872',8:'#bc9073',9:'#548d5b',10:'#b9c1cb',11:'#5974a6',12:'#ffffff',13:'#d7b48a',14:'#795548',15:'#252525',17:'#e4e8ec'}
            palette={key:full[key] for key in entry['sourcePalette']}
        colors={key:np.array([int(value[i:i+2],16) for i in (1,3,5)]) for key,value in palette.items()}
        rgb=np.asarray(source)
        entry['colors']={}
        for idx,pixels in enumerate(parts):
            sample=np.array([rgb[y*2,x*2] for x,y in pixels[::max(1,len(pixels)//2000)]])
            sample=sample[sample.max(axis=1)>entry.get('sourceSampleThreshold',110)]
            if not len(sample):continue
            median=np.median(sample,axis=0)
            entry['colors'][str(idx)]=min(colors,key=lambda c:np.sum((median-colors[c])**2))

    ratios = (1.3,1.8,2.3,2.8,3.3,4,5,6)
    layouts = {}
    heights = np.zeros(w,dtype=int)
    for y in range(h):
        for x in range(w):
            heights[x] = heights[x]+1 if y and labels[y,x]>=0 and labels[y,x]==labels[y-1,x] else (1 if labels[y,x]>=0 else 0)
        x=0
        while x < w:
            idx = int(labels[y,x])
            if idx < 0:
                x+=1
                continue
            end=x+1
            while end < w and labels[y,end]==idx:
                end+=1
            stack=[]
            for col in range(x,end+1):
                height=int(heights[col]) if col < end else 0
                start=col
                while stack and stack[-1][1]>height:
                    left,hh=stack.pop()
                    ww=col-left
                    for ratio in ratios:
                        score=min(ww/ratio,hh)
                        key=(idx,ratio)
                        if score > layouts.get(key,(0,))[0]:
                            layouts[key]=(score,left,y-hh+1,ww,hh)
                    start=left
                if not stack or stack[-1][1]<height:
                    stack.append((start,height))
            x=end

    # Map reviewed color samples to the actual closed component after tracing.
    if entry.get('useProbes'):
        votes={}
        for probe in entry.get('probes',[]):
            px=min(w-1,max(0,int(probe['x']*image.width/2)))
            py=min(h-1,max(0,int(probe['y']*image.height/2)))
            idx=int(labels[py,px])
            if idx>=0:
                votes.setdefault(idx,{}).setdefault(probe['color'],0)
                votes[idx][probe['color']]+=1
        entry['colors']={str(idx):max(counts,key=counts.get) for idx,counts in votes.items()}
    entry.setdefault('colors',{}).update(entry.get('reviewedColors',{}))
    regions=[]
    detail_areas=[]
    raw_cells=[]
    tiny=[]
    for idx,pixels in enumerate(parts):
        if len(pixels)<12 or any(x in (0,w-1) or y in (0,h-1) for x,y in pixels):
            continue
        boxes=[]
        for ratio in ratios:
            _,x,y,bw,bh=layouts[(idx,ratio)]
            boxes.append(dict(x=(x+bw/2)*2,y=(y+bh/2)*2,width=bw*2,height=bh*2))
        baseline=max(max(min((b['width']-6)/(8*.58),(b['height']-4)*.9),min((b['height']-6)/(8*.58),(b['width']-4)*.9)) for b in boxes)
        if baseline<22*image.width/1102:
            boxes.extend(oriented_boxes(labels,idx,pixels))
        boxes.sort(key=lambda b:min((b['width']-6)/(4*.58),(b['height']-4)*.9),reverse=True)
        text_space=max(min((b['width']-6)/(4*.58),(b['height']-4)*.9) for b in boxes)
        # Even the longest supported split must stay readable on the A4 sheet.
        normal_space=max(min((b['width']-6)/(8*.58),(b['height']-4)*.9) for b in boxes)
        rotated_space=max(min((b['height']-6)/(8*.58),(b['width']-4)*.9) for b in boxes)
        decorative=max(normal_space,rotated_space) < 22*image.width/1102
        raw_cells.append(dict(id=idx,x=boxes[0]['x'],y=boxes[0]['y'],area=len(pixels)*4,boxes=boxes,color=entry.get('colors',{}).get(str(idx))))
        if decorative:
            tiny.append(dict(id=idx,x=boxes[0]['x'],y=boxes[0]['y'],font=round(text_space,1),area=len(pixels)*4))
        rows={}
        for px,py in pixels:
            if decorative or safe[py,px]:
                rows.setdefault(py,[]).append(px)
        runs=[]
        for py,xs in sorted(rows.items()):
            xs.sort()
            first=last=xs[0]
            for px in xs[1:]+[w+10]:
                if px==last+1:
                    last=px
                    continue
                width=(last-first+1)*2
                runs.append(f'M{first*2},{py*2}h{width}v2h-{width}Z')
                first=last=px
        if decorative:
            detail_areas.append(dict(id=idx,d=''.join(runs),x=boxes[0]['x'],y=boxes[0]['y']))
        else:
            regions.append(dict(id=idx,d=''.join(runs),boxes=boxes,x=boxes[0]['x'],y=boxes[0]['y'],width=boxes[0]['width'],height=boxes[0]['height'],area=len(pixels)*4,color=0))
    # Keep a full enclosing frame in the worksheet, including when printed.
    dark=gray<100
    row_counts=dark.sum(axis=1);col_counts=dark.sum(axis=0)
    band=max(12,min(image.width,image.height)//12)
    top=int(row_counts[:band].argmax());bottom=int(len(row_counts)-band+row_counts[-band:].argmax())
    left=int(col_counts[:band].argmax());right=int(len(col_counts)-band+col_counts[-band:].argmax())
    frame=dict(x=left,y=top,width=right-left,height=bottom-top)
    regions,line_art,audit=vector_fields(labels,white,parts,regions,entry,raw_cells)
    return dict(width=image.width,height=image.height,src='kleurplaten/'+filename,regions=regions,detailAreas=[],lineArtPath=line_art,fieldAudit=audit,rawCells=raw_cells,frame=frame),tiny


def build():
    staging='--stage' in sys.argv
    manifest=json.loads((FOLDER/('catalogus-staging.json' if staging else 'catalogus.json')).read_text(encoding='utf-8-sig'))
    only={arg for arg in sys.argv[1:] if not arg.startswith('--')}
    data={}
    existing=FOLDER/('catalogus-data-staging.js' if staging else 'catalogus-data.js')
    if only and existing.exists():
        data=json.loads(existing.read_text(encoding='utf-8').split(' = ',1)[1].rstrip(';\n'))
    report=[]
    for entry in manifest:
        if entry.get('legacy'):
            continue
        if only and entry['id'] not in only:
            continue
        if not (FOLDER/entry['file']).exists():
            continue
        art,tiny=analyse(entry['file'],entry)
        art.update(title=entry['title'],theme=entry['theme'])
        for setting in ('maxColors','paletteMerges'):
            if setting in entry:art[setting]=entry[setting]
        color_map=entry.get('colors',{})
        for region in art['regions']:
            if entry.get('allowStackedExercises'):region['allowStacked']=True
            if str(region['id']) in entry.get('stackedExercises',[]):region['stackOperands']=True
            if entry.get('manualContours'):
                region['color']=region['fixedColor']
                continue
            if str(region['id']) in color_map:
                region['color']=color_map[str(region['id'])]
            if str(region['id']) in entry.get('fixedColors',{}):
                region['fixedColor']=entry['fixedColors'][str(region['id'])]
        for detail in art['detailAreas']:
            nearest=min(art['regions'],key=lambda r:(r['x']-detail['x'])**2+(r['y']-detail['y'])**2)
            detail['color']=color_map.get(str(detail['id']),nearest['color'])
            if detail['color'] not in {r['color'] for r in art['regions']}:
                detail['color']=nearest['color']
        add_large_field_practice(art)
        data[entry['id']]=art
        summary=dict(id=entry['id'],regions=len(art['regions']),small=tiny)
        report.append(summary)
        print(json.dumps(summary),flush=True)
    (FOLDER/('catalogus-data-staging.js' if staging else 'catalogus-data.js')).write_text('window.kleurplaatCatalogus = '+json.dumps(data,separators=(',',':'),ensure_ascii=False)+';\n',encoding='utf-8')
    (FOLDER/'catalogus-controle.json').write_text(json.dumps(report,indent=2),encoding='utf-8')


if __name__=='__main__':
    build()
