"""Place a few separated extra exercises inside genuinely large color fields."""
import re
import numpy as np


def add_large_field_practice(art):
    regions=[r for r in art['regions'] if not r.get('practiceExtra')]
    for region in regions:
        original=region.pop('practiceOriginalLabel',None)
        if original:region.update(original)
    h,w=art['height']//2,art['width']//2
    threshold=art['width']*art['height']*.045
    additions=[]
    def main_box(region):
        boxes=[b for b in region.get('boxes',[region]) if not b.get('angle')]
        if not boxes:return None
        return max(boxes,key=lambda b:min(30,(b['width']-6)/5.6,(b['height']-4)/.76))
    for region in regions:
        if region.get('noPaint') or region.get('area',0)<threshold or len(additions)>=6:continue
        mask=np.zeros((h,w),dtype=bool)
        for x,y,width in re.findall(r'M(\d+),(\d+)h(\d+)v2h-\d+Z',region.get('d','')):
            mask[int(y)//2,int(x)//2:(int(x)+int(width))//2]=True
        primary=main_box(region)
        if primary is None or not mask.any():continue
        # A full rectangle, including padding, must lie inside this exact field.
        bw,bh=70,34
        integral=np.pad(mask.astype(np.int32),((1,0),(1,0))).cumsum(0).cumsum(1)
        sums=integral[bh:,bw:]-integral[:-bh,bw:]-integral[bh:,:-bw]+integral[:-bh,:-bw]
        yy,xx=np.where(sums[::12,::12]==bw*bh)
        candidates=[(float(x*24+bw),float(y*24+bh)) for x,y in zip(xx,yy)]
        anchors=[]
        for existing in regions:
            if existing.get('sourceId',existing['id'])==region.get('sourceId',region['id']):
                box=main_box(existing)
                if box:anchors.append((box['x'],box['y']))
        wanted=2 if region['area']>=art['width']*art['height']*.14 else 1
        chosen=[];distance=art['width']*.23
        for _ in range(min(wanted,6-len(additions))):
            if not candidates:break
            point=max(candidates,key=lambda p:min((p[0]-x)**2+(p[1]-y)**2 for x,y in anchors))
            if min((point[0]-x)**2+(point[1]-y)**2 for x,y in anchors)<distance**2:break
            chosen.append(point);anchors.append(point);candidates.remove(point)
        if not chosen:continue
        region['practiceOriginalLabel']={key:region[key] for key in ('boxes','x','y','width','height') if key in region}
        primary={**primary,'width':min(primary['width'],180),'height':min(primary['height'],100)}
        region.update(primary,boxes=[primary])
        for number,(x,y) in enumerate(chosen,1):
            box=dict(x=x,y=y,width=bw*2,height=bh*2)
            extra={key:value for key,value in region.items() if key!='practiceOriginalLabel'}
            extra.update(box,boxes=[box],id=f'{region["id"]}-extra-{number}',d='',noPaint=True,practiceExtra=True,practiceFor=region['id'])
            additions.append(extra)
    art['regions']=regions+additions
    if 'fieldAudit' in art:art['fieldAudit']['extraPractice']=len(additions)
    return art
