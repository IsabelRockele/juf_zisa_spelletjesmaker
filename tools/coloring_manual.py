"""Preserve illustration contours; join only explicitly reviewed components."""
from collections import defaultdict, deque
import numpy as np
from coloring_vector import runs, writing_boxes

def reviewed_ink_cleanup(ink, patches):
    """Remove only isolated ink islands inside an explicitly reviewed area."""
    removed=np.zeros(ink.shape,dtype=bool)
    for patch in patches:
        x0,y0,x1,y1=patch['rect'];seen=set()
        if patch.get('clearReviewedRect'):
            removed[y0//2:(y1+1)//2,x0//2:(x1+1)//2]=ink[y0//2:(y1+1)//2,x0//2:(x1+1)//2]
            continue
        for y in range(y0//2,min(ink.shape[0],y1//2+1)):
            for x in range(x0//2,min(ink.shape[1],x1//2+1)):
                if not ink[y,x] or (x,y) in seen:continue
                todo=[(x,y)];seen.add((x,y));pixels=[]
                while todo:
                    xx,yy=todo.pop();pixels.append((xx,yy))
                    for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                        if 0<=nx<ink.shape[1] and 0<=ny<ink.shape[0] and ink[ny,nx] and (nx,ny) not in seen:
                            seen.add((nx,ny));todo.append((nx,ny))
                if len(pixels)<=patch.get('maxPixels',100) and all(x0<=xx*2<=x1 and y0<=yy*2<=y1 for xx,yy in pixels):
                    for xx,yy in pixels:removed[yy,xx]=True
    return removed

def manual_fields(labels,white,parts,entry,raw_cells,contacts,interior):
    raw={r['id']:r for r in raw_cells}
    merges={int(k):int(v) for k,v in entry.get('manualMerges',{}).items()}
    colors={int(k):int(v) for k,v in entry.get('colors',{}).items()}
    colors.update({int(k):int(v) for k,v in entry.get('manualColors',{}).items()})
    def root(idx):
        seen=set()
        while idx in merges:
            if idx in seen:raise ValueError('Cyclic component map')
            seen.add(idx);idx=merges[idx]
        return idx
    owners={idx:root(idx) for idx in interior}
    # Tiny eye highlights and teeth are illustration details, not arithmetic fields.
    for idx in entry.get('manualWhiteDetails',[]):owners.pop(int(idx),None)
    openings={int(v) for v in entry.get('manualOpen',[])}
    internal=[]
    if entry.get('manualInternalDetails',True):
        for _ in range(3):
            sizes=defaultdict(int)
            for idx,parent in owners.items():sizes[parent]+=len(parts[idx])*4
            neighbors=defaultdict(set)
            for x,y,ids in contacts:
                roots={owners[idx] for idx in ids if idx in owners}
                for parent in roots:neighbors[parent].update(roots-{parent})
            changed=False
            for parent,area in list(sizes.items()):
                if area>=1500 or len(neighbors[parent])!=1:continue
                target=next(iter(neighbors[parent]))
                if sizes.get(target,0)<=area:continue
                for idx in list(owners):
                    if owners[idx]==parent:owners[idx]=target;openings.add(idx);internal.append(idx)
                changed=True
            if not changed:break
    lookup=np.full(len(parts),-1,dtype=np.int32)
    for idx,parent in owners.items():lookup[idx]=parent
    owner_grid=np.full(labels.shape,-1,dtype=np.int32);valid=labels>=0;owner_grid[valid]=lookup[labels[valid]]
    erased=np.zeros(labels.shape,dtype=bool)
    opening_points={}
    for x,y,ids in contacts:
        if all(idx in owners for idx in ids) and len({owners[idx] for idx in ids})==1:
            for idx in ids:
                if idx in openings and (idx not in opening_points or y>opening_points[idx][1]):opening_points[idx]=(x,y)
    for x,y,ids in contacts:
        if not all(idx in owners for idx in ids):continue
        roots={owners[idx] for idx in ids}
        if len(roots)!=1:continue
        restricted=[idx for idx in ids if idx in openings]
        if restricted and not any((x-opening_points[idx][0])**2+(y-opening_points[idx][1])**2<=9 for idx in restricted if idx in opening_points):continue
        erased[y,x]=True;owner_grid[y,x]=next(iter(roots))
    # Preserve an internal crease but make an actual opening across its full
    # thickness. Each reviewed neighboring pair receives its own connection.
    # A circular nick near a corner is not enough to connect two compartments.
    pair_contacts=defaultdict(list)
    reviewed_ids=set(merges)|openings
    linked=set()
    def link(p,q,parent):
        length=int(max(abs(q-p)))+1;points=np.rint(np.linspace(p,q,length)).astype(int)
        if any(labels[yy,xx]>=0 and owners.get(int(labels[yy,xx]))!=parent for yy,xx in points):return False
        for yy,xx in points:
            for dy,dx in ((0,0),(1,0),(-1,0),(0,1),(0,-1)):
                ny=yy+dy;nx=xx+dx
                if not(0<=ny<labels.shape[0] and 0<=nx<labels.shape[1]):continue
                original=int(labels[ny,nx])
                if original>=0 and owners.get(original)!=parent:continue
                erased[ny,nx]=True;owner_grid[ny,nx]=parent
        return True
    for x,y,ids in contacts:
        for idx in ids:
            if idx not in reviewed_ids or idx not in owners:continue
            for other in ids:
                if other==idx or other not in owners or owners[other]!=owners[idx]:continue
                pair_contacts[tuple(sorted((idx,other)))].append((x,y))
    for (a,b),centers in pair_contacts.items():
        child=a if a in reviewed_ids else b
        cx=sum(x for x,y in parts[child])/len(parts[child]);cy=sum(y for x,y in parts[child])/len(parts[child])
        reviewed_point=entry.get('manualConnectionPoints',{}).get(str(child))
        if reviewed_point:cx,cy=reviewed_point[0]/2,reviewed_point[1]/2
        centers.sort(key=lambda p:(p[0]-cx)**2+(p[1]-cy)**2)
        connected=False
        for x,y in centers[:20]:
            y0=max(0,y-8);y1=min(labels.shape[0],y+9);x0=max(0,x-8);x1=min(labels.shape[1],x+9)
            aa=np.argwhere(labels[y0:y1,x0:x1]==a);bb=np.argwhere(labels[y0:y1,x0:x1]==b)
            if not len(aa) or not len(bb):continue
            distances=((aa[:,None,:]-bb[None,:,:])**2).sum(axis=2);ia,ib=np.unravel_index(distances.argmin(),distances.shape)
            p=aa[ia]+[y0,x0];q=bb[ib]+[y0,x0]
            if link(p,q,owners[a]):linked.update([a,b]);break
    for idx in reviewed_ids-linked:
        if idx not in owners or idx>=len(parts):continue
        parent=owners[idx];aa=np.array([(y,x) for x,y in parts[idx]])
        y0=max(0,int(aa[:,0].min())-12);y1=min(labels.shape[0],int(aa[:,0].max())+13)
        x0=max(0,int(aa[:,1].min())-12);x1=min(labels.shape[1],int(aa[:,1].max())+13)
        section=labels[y0:y1,x0:x1]
        valid_other=(section>=0)&(section!=idx)
        other_owner=np.full(section.shape,-1,dtype=np.int32)
        for other in np.unique(section[valid_other]):other_owner[section==other]=owners.get(int(other),-1)
        bb=np.argwhere(valid_other&(other_owner==parent))+[y0,x0]
        if not len(bb):continue
        best=None
        for start in range(0,len(aa),128):
            batch=aa[start:start+128];distance=((batch[:,None,:]-bb[None,:,:])**2).sum(axis=2)
            i,j=np.unravel_index(distance.argmin(),distance.shape)
            if best is None or distance[i,j]<best[0]:best=(distance[i,j],batch[i],bb[j])
        if best[0]<=144:link(best[1],best[2],parent)
    # Remove the full shared stroke inside explicitly reviewed merged fields.
    # Closing fills an internal seam without leaving scattered ink fragments.
    for parent in entry.get('smoothMergedFields',[]):
        mask=owner_grid==int(parent)
        def neighborhood(grid,reduce):
            padded=np.pad(grid,3,constant_values=False)
            views=[padded[dy:dy+grid.shape[0],dx:dx+grid.shape[1]] for dy in range(7) for dx in range(7)]
            return reduce(views)
        closed=neighborhood(neighborhood(mask,np.logical_or.reduce),np.logical_and.reduce)
        fill=closed&(owner_grid<0)&(labels<0)
        erased[fill]=True;owner_grid[fill]=int(parent)
    added_ink=np.zeros(labels.shape,dtype=bool)
    for patch in entry.get('manualEllipses',[]):
        target=int(patch['owner']);body=int(patch['body'])
        allowed_ids={int(v) for v in patch['within']}
        allowed=np.isin(labels,list(allowed_ids))
        for x,y,ids in contacts:
            if all(idx in allowed_ids for idx in ids):
                allowed[y,x]=True;erased[y,x]=True;owner_grid[y,x]=body
        owner_grid[owner_grid==target]=body
        yy,xx=np.indices(labels.shape)
        ellipse=((xx*2-patch['cx'])/patch['rx'])**2+((yy*2-patch['cy'])/patch['ry'])**2<=1
        shape=ellipse&allowed;owner_grid[shape]=target
        edge=shape&(~np.roll(shape,1,0)|~np.roll(shape,-1,0)|~np.roll(shape,1,1)|~np.roll(shape,-1,1))
        border=edge|np.roll(edge,1,0)|np.roll(edge,-1,0)|np.roll(edge,1,1)|np.roll(edge,-1,1)
        added_ink|=border&allowed
        owner_grid[added_ink]=-1
    # Worksheet-native replacement for a beak too small to hold an exercise.
    for patch in entry.get('manualBeaks',[]):
        idx=int(patch['id']);yy,xx=np.indices(labels.shape);px=xx*2;py=yy*2
        vertices=patch['points'];shape=np.zeros(labels.shape,dtype=bool)
        for k,(ax,ay) in enumerate(vertices):
            bx,by=vertices[(k+1)%len(vertices)]
            if ay==by:continue
            shape^=((ay>py)!=(by>py))&(px<(bx-ax)*(py-ay)/(by-ay)+ax)
        edge=shape&(~np.roll(shape,1,0)|~np.roll(shape,-1,0)|~np.roll(shape,1,1)|~np.roll(shape,-1,1))
        erased[shape]=True;added_ink[shape]=False;owner_grid[shape]=idx
        edge=edge|np.roll(edge,1,0)|np.roll(edge,-1,0)|np.roll(edge,1,1)|np.roll(edge,-1,1)
        added_ink|=edge;owner_grid[edge]=-1
        raw[idx]={'id':idx};colors[idx]=2;owners[idx]=idx
    for patch in entry.get('manualDoors',[]):
        idx=int(patch['id']);yy,xx=np.indices(labels.shape)
        shape=((xx*2-patch['cx'])/patch['rx'])**2+((yy*2-patch['cy'])/patch['ry'])**2<=1
        edge=shape&(~np.roll(shape,1,0)|~np.roll(shape,-1,0)|~np.roll(shape,1,1)|~np.roll(shape,-1,1))
        added_ink|=edge;erased[shape]=True;owner_grid[shape]=idx;owner_grid[edge]=-1
        raw[idx]={'id':idx};colors[idx]=patch['color'];owners[idx]=idx
    for patch in entry.get('manualLeaves',[]):
        idx=int(patch['owner']);yy,xx=np.indices(labels.shape);angle=np.deg2rad(patch['angle'])
        dx=xx*2-patch['cx'];dy=yy*2-patch['cy'];u=dx*np.cos(angle)+dy*np.sin(angle);v=-dx*np.sin(angle)+dy*np.cos(angle)
        rx=patch['length']/np.sqrt(3);ry=patch['width'];shift=ry/2
        shape=((u/rx)**2+((v-shift)/ry)**2<=1)&((u/rx)**2+((v+shift)/ry)**2<=1)
        union=(owner_grid==idx)|shape
        edge=union&(~np.roll(union,1,0)|~np.roll(union,-1,0)|~np.roll(union,1,1)|~np.roll(union,-1,1))
        erased[shape]=True;owner_grid[shape]=idx;added_ink[shape]=False;added_ink|=edge;owner_grid[edge]=-1
    for idx in entry.get('manualInk',[]):
        detail=labels==int(idx);added_ink|=detail;owner_grid[detail]=-1
    for patch in entry.get('manualCleanInk',[]):
        removed=reviewed_ink_cleanup(((~white)&(~erased))|added_ink,[patch])
        erased[removed]=True;added_ink[removed]=False;owner_grid[removed]=patch['owner']
    # Widen a reviewed narrow writing space by smoothly moving its surrounding
    # contours together with the fills. This preserves closed fields and colors.
    if entry.get('writingSpaceWarps'):
        ink=((~white)&(~erased))|added_ink
        hh,ww=labels.shape
        for patch in entry['writingSpaceWarps']:
            source=np.array(patch['source'],dtype=float)/2
            target=np.array(patch['target'],dtype=float)/2
            center=patch['center']/2;radius=patch['radius']/2
            if patch['axis']=='x':
                positions=np.arange(ww)
                for row in range(hh):
                    weight=max(0,1-abs(row-center)/radius)
                    if not weight:continue
                    indices=np.rint(np.interp(positions,source+(target-source)*weight,source)).astype(int).clip(0,ww-1)
                    indices[(positions<source[0])|(positions>source[-1])]=positions[(positions<source[0])|(positions>source[-1])]
                    owner_grid[row]=owner_grid[row,indices];ink[row]=ink[row,indices]
            else:
                positions=np.arange(hh)
                for col in range(ww):
                    weight=max(0,1-abs(col-center)/radius)
                    if not weight:continue
                    indices=np.rint(np.interp(positions,source+(target-source)*weight,source)).astype(int).clip(0,hh-1)
                    indices[(positions<source[0])|(positions>source[-1])]=positions[(positions<source[0])|(positions>source[-1])]
                    owner_grid[:,col]=owner_grid[indices,col];ink[:,col]=ink[indices,col]
        erased[:]=True;added_ink=ink
    # Open a reviewed trapped ground pocket between feet into the meadow.
    for patch in entry.get('manualGroundChannels',[]):
        parent=int(patch['owner']);yy,xx=np.indices(labels.shape);px=xx*2;py=yy*2
        channel=np.zeros(labels.shape,dtype=bool)
        for (ax,ay),(bx,by) in zip(patch['points'],patch['points'][1:]):
            dx=bx-ax;dy=by-ay;t=np.clip(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy),0,1)
            channel|=(px-ax-t*dx)**2+(py-ay-t*dy)**2<=patch['radius']**2
        allowed=np.isin(owner_grid,patch['allowed'])|(owner_grid<0)
        channel&=allowed;erased[channel]=True;added_ink[channel]=False;owner_grid[channel]=parent
        nearby=channel.copy()
        for dy in range(-3,4):
            for dx in range(-3,4):nearby|=np.roll(np.roll(channel,dy,0),dx,1)
        for idx in patch['feet']:
            foot=owner_grid==idx
            edge=foot&(~np.roll(foot,1,0)|~np.roll(foot,-1,0)|~np.roll(foot,1,1)|~np.roll(foot,-1,1))&nearby
            border=(edge|np.roll(edge,1,0)|np.roll(edge,-1,0)|np.roll(edge,1,1)|np.roll(edge,-1,1))&foot
            added_ink|=border;owner_grid[border]=-1
    for x0,y0,x1,y1 in entry.get('manualRestoreInkRects',[]):
        window=np.zeros(labels.shape,dtype=bool);window[y0//2:(y1+1)//2,x0//2:(x1+1)//2]=True
        restored=window&(~white);erased[restored]=False;owner_grid[restored]=-1
    visible_parts=defaultdict(list);seen=np.zeros(labels.shape,dtype=bool);h,w=labels.shape
    for y,x in zip(*np.where(owner_grid>=0)):
        if seen[y,x]:continue
        parent=int(owner_grid[y,x]);todo=deque([(int(x),int(y))]);seen[y,x]=True;pixels=[]
        while todo:
            xx,yy=todo.popleft();pixels.append((xx,yy))
            for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                if 0<=nx<w and 0<=ny<h and not seen[ny,nx] and owner_grid[ny,nx]==parent:
                    seen[ny,nx]=True;todo.append((nx,ny))
        if len(pixels)>=100:visible_parts[parent].append(pixels)
    disconnected=[dict(id=idx,parts=[dict(area=len(p)*4,x=round(sum(x for x,y in p)/len(p)*2),y=round(sum(y for x,y in p)/len(p)*2)) for p in pieces]) for idx,pieces in visible_parts.items() if len(pieces)>1]
    regions=[]
    for idx in sorted(set(owners.values())):
        if idx not in raw:continue
        mask=owner_grid==idx
        if mask.sum()<12:continue
        pieces=sorted(visible_parts.get(idx,[]),key=len,reverse=True)
        if not pieces:pieces=[list(zip(*np.where(mask)[::-1]))]
        for n,pixels in enumerate(pieces):
            if n and len(pixels)*4<entry.get('smallPartLabelMinimum',{}).get(str(idx),0):continue
            piece=np.zeros(labels.shape,dtype=bool)
            for x,y in pixels:piece[y,x]=True
            boxes=writing_boxes(piece,idx,np.where(piece,idx,-1))
            regions.append({**raw[idx],**boxes[0], 'id':idx if n==0 else f'{idx}-{n}','sourceId':idx,'noPaint':n>0,
                            'boxes':boxes,'d':runs(mask) if n==0 else '', 'area':len(pixels)*4,
                            'color':colors.get(idx,entry.get('defaultColor',0)),
                            'fixedColor':colors.get(idx,entry.get('defaultColor',0)),
                            'mergedIds':[i for i,p in owners.items() if p==idx and i!=idx]})
    for extra in entry.get('extraExerciseWindows',[]):
        idx=extra['owner'];x0,y0,x1,y1=extra['rect']
        mask=owner_grid==idx
        window=np.zeros(mask.shape,dtype=bool);window[y0//2:y1//2,x0//2:x1//2]=True
        mask&=window
        if not mask.any():raise ValueError(f'Empty exercise window {extra}')
        boxes=writing_boxes(mask,idx,np.where(mask,idx,-1))
        from coloring_text_boxes import oriented_boxes
        py,px=np.where(mask);boxes+=oriented_boxes(np.where(mask,idx,-1),idx,list(zip(px,py)))
        parent=next(r for r in regions if r['id']==idx)
        regions.append({**parent,**boxes[0],'boxes':boxes,'d':'','id':extra['id'],'noPaint':True})
    for region in regions:
        window=entry.get('exerciseWindows',{}).get(str(region['id']))
        if window:
            x0,y0,x1,y1=window;mask=owner_grid==region['sourceId'];crop=np.zeros(mask.shape,dtype=bool)
            crop[y0//2:y1//2,x0//2:x1//2]=True;mask&=crop
            if not mask.any():raise ValueError(f'Empty main exercise window {region["id"]}')
            boxes=writing_boxes(mask,region['sourceId'],np.where(mask,region['sourceId'],-1))
            region.update(**boxes[0],boxes=boxes)
    return regions,runs(((~white)&(~erased))|added_ink),dict(fields=len(regions),merged=len(owners)-len(regions),unassigned=0,unlabelledPieces=0,mode='reviewed-components',internalDetails=internal,disconnected=disconnected)
