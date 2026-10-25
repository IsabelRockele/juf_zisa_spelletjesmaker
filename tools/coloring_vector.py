"""Build worksheet-native vector fields from analysed illustration contours.

Small enclosed pieces are physically joined to an adjacent large field, with
the shared contour removed. Every resulting colored field has one exercise.
The source PNG is a reference and remains unchanged.
"""
from collections import Counter, defaultdict, deque
from itertools import combinations
import numpy as np
from coloring_text_boxes import oriented_boxes


def writing_boxes(mask,root,grid):
    ys,xs=np.where(mask)
    if not len(xs):
        return []
    x0,x1=int(xs.min()),int(xs.max())+1;y0,y1=int(ys.min()),int(ys.max())+1
    crop=mask[y0:y1,x0:x1]
    ratios=(.22,.3,.4,.6,.85,1.3,1.8,2.5,3.3,4.5,6,8)
    best={};heights=np.zeros(crop.shape[1],dtype=int)
    for y in range(crop.shape[0]):
        heights=np.where(crop[y],heights+1,0)
        stack=[]
        for x in range(crop.shape[1]+1):
            hh=int(heights[x]) if x<crop.shape[1] else 0;start=x
            while stack and stack[-1][1]>hh:
                left,height=stack.pop();width=x-left
                for ratio in ratios:
                    score=min(width/ratio,height)
                    if score>best.get(ratio,(0,))[0]:best[ratio]=(score,left,y-height+1,width,height)
                start=left
            if not stack or stack[-1][1]<hh:stack.append((start,hh))
    boxes=[dict(x=(x0+x+w/2)*2,y=(y0+y+h/2)*2,width=w*2,height=h*2) for _,x,y,w,h in best.values()]
    boxes.extend(oriented_boxes(grid,root,list(zip(xs,ys))))
    return boxes


def runs(mask):
    paths=[]
    for y in range(mask.shape[0]):
        xs=np.flatnonzero(mask[y])
        if not len(xs):
            continue
        breaks=np.flatnonzero(np.diff(xs)>1)
        starts=np.r_[xs[0],xs[breaks+1]]
        ends=np.r_[xs[breaks],xs[-1]]
        for start,end in zip(starts,ends):
            width=int(end-start+1)*2
            paths.append(f'M{int(start)*2},{y*2}h{width}v2h-{width}Z')
    return ''.join(paths)


def vector_fields(labels,white,parts,regions,entry,raw_cells):
    h,w=labels.shape
    main={r['id']:r for r in regions}
    colors={int(k):v for k,v in entry.get('colors',{}).items()}
    main_colors={idx:colors.get(idx,entry.get('defaultColor',0)) for idx in main}
    raw={r['id']:r for r in raw_cells}
    interior=set()
    for idx,pixels in enumerate(parts):
        if any(x in (0,w-1) or y in (0,h-1) for x,y in pixels):
            continue
        interior.add(idx)
    # Exact contour adjacency across the black line, not nearest centroids.
    adjacency=defaultdict(Counter)
    contacts=[]
    for y,x in zip(*np.where(~white)):
        found=[]
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            for distance in range(1,7):
                nx=int(x)+dx*distance;ny=int(y)+dy*distance
                if nx<0 or nx>=w or ny<0 or ny>=h:
                    break
                idx=int(labels[ny,nx])
                if idx>=0:
                    if idx in interior:
                        found.append(idx)
                    break
        ids=tuple(set(found))
        if len(ids)>1:
            contacts.append((int(x),int(y),ids))
            for a,b in combinations(ids,2):
                adjacency[a][b]+=1
                adjacency[b][a]+=1
    # A complete colored object may consist only of small subdivisions (knit
    # panels, a face, a fish stripe). Keep such an object as its own field; never
    # absorb it into unrelated background simply because its original pieces
    # were small. Adjacent pieces of its same reviewed color join physically.
    if entry.get('manualContours'):
        from coloring_manual import manual_fields
        return manual_fields(labels,white,parts,entry,raw_cells,contacts,interior)
    desired={idx:colors[idx] for idx in interior if idx in colors}
    unknown=interior-set(desired)
    while unknown:
        progress=False
        for idx in list(unknown):
            choices=Counter()
            for neighbor,weight in adjacency[idx].items():
                if neighbor in desired:
                    choices[desired[neighbor]]+=weight
            if choices:
                desired[idx]=choices.most_common(1)[0][0];unknown.remove(idx);progress=True
        if not progress:
            break
    for idx in main:
        main_colors[idx]=desired.get(idx,main_colors[idx])
    clusters=[];unseen=set(desired)
    while unseen:
        start=unseen.pop();cluster={start};stack=[start]
        while stack:
            idx=stack.pop()
            for other in adjacency[idx]:
                if other in unseen and desired[other]==desired[start]:
                    unseen.remove(other);cluster.add(other);stack.append(other)
        clusters.append(cluster)
    owners={idx:idx for idx in main}
    promoted=set()
    for cluster in clusters:
        if cluster & set(main):
            continue
        total=sum(len(parts[idx]) for idx in cluster)*4
        if total<1200:
            continue
        root=max(cluster,key=lambda idx:len(parts[idx]))
        if root not in raw:
            continue
        cluster_mask=np.isin(labels,list(cluster))
        for x,y,ids in contacts:
            if all(idx in cluster for idx in ids):cluster_mask[y,x]=True
        cluster_grid=np.where(cluster_mask,root,-1)
        boxes=writing_boxes(cluster_mask,root,cluster_grid)
        # A compartment must accommodate a full calculation, including the
        # longest split over two lines. Tiny decorations join a larger field.
        readable=max(max(min((b['width']-6)/(8*.58),(b['height']-4)*.9),min((b['height']-6)/(8*.58),(b['width']-4)*.9),min((b['width']-6)/(4*.58),(b['height']-6)/2.3),min((b['height']-6)/(4*.58),(b['width']-6)/2.3)) for b in boxes)
        if readable<18:
            continue
        main[root]={**raw[root],'color':desired[root]}
        main_colors[root]=desired[root];owners[root]=root;promoted.add(root)
    seeded={idx:bool(cluster & set(main)) for cluster in clusters for idx in cluster}
    forced={int(k):int(v) for k,v in entry.get('mergeInto',{}).items()}
    pending=interior-set(owners)
    for idx,parent in forced.items():
        if idx in pending and parent in owners:
            owners[idx]=owners[parent];pending.remove(idx)
    while pending:
        progress=False
        for idx in list(pending):
            candidates=[(other,weight) for other,weight in adjacency[idx].items() if other in owners]
            if not candidates:
                continue
            wanted=desired.get(idx)
            matching=[item for item in candidates if main_colors[owners[item[0]]]==wanted]
            if matching:candidates=matching
            elif seeded.get(idx):continue
            def score(item):
                other,weight=item
                root=owners[other]
                same=wanted is not None and main_colors[root]==wanted
                return (same,weight,main[root]['area'])
            other,_=max(candidates,key=score)
            owners[idx]=owners[other]
            pending.remove(idx);progress=True
        if not progress:
            # An unreadably small ornament becomes part of the adjoining large
            # compartment; its separating contour is opened below as well.
            candidates=[(weight,idx,other) for idx in pending for other,weight in adjacency[idx].items() if other in owners]
            if not candidates:break
            _,idx,other=max(candidates)
            owners[idx]=owners[other];pending.remove(idx)
    owner_grid=np.full(labels.shape,-1,dtype=np.int32)
    lookup=np.full(len(parts),-1,dtype=np.int32)
    for idx,root in owners.items():
        lookup[idx]=root
    valid=labels>=0
    owner_grid[valid]=lookup[labels[valid]]
    erased=np.zeros(labels.shape,dtype=bool)
    # Closed facial micro-details become open strokes in the adjoining field.
    # One opening is sufficient, retaining the expression instead of erasing it.
    open_ids={int(v) for v in entry.get('openMerges',[])}
    for idx in owners:
        if idx in main:
            continue
        neighbors={owners[n] for n in adjacency[idx] if n in owners and n!=idx}
        if len(neighbors)==1 and len(parts[idx])<150:
            open_ids.add(idx)
    opening_points={}
    for x,y,ids in contacts:
        roots={owners[idx] for idx in ids if idx in owners}
        if len(roots)!=1 or any(idx not in owners for idx in ids):
            continue
        for idx in ids:
            if idx in open_ids and (idx not in opening_points or y>opening_points[idx][1]):
                opening_points[idx]=(x,y)
    for x,y,ids in contacts:
        roots={owners[idx] for idx in ids if idx in owners}
        if len(roots)!=1 or any(idx not in owners for idx in ids):
            continue
        restricted=[idx for idx in ids if idx in open_ids]
        if restricted and not any((x-opening_points[idx][0])**2+(y-opening_points[idx][1])**2<=36 for idx in restricted if idx in opening_points):
            continue
        root=next(iter(roots));erased[y,x]=True;owner_grid[y,x]=root
    # A single drawing-native black path retains the illustration's open details.
    ink=(~white)&(~erased)
    seen=np.zeros(ink.shape,dtype=bool)
    for y,x in zip(*np.where(ink)):
        if seen[y,x]:continue
        todo=deque([(int(x),int(y))]);seen[y,x]=True;component=[]
        while todo:
            xx,yy=todo.popleft();component.append((xx,yy))
            for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                if 0<=nx<w and 0<=ny<h and ink[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True;todo.append((nx,ny))
        if len(component)<20:
            surrounding=Counter()
            for xx,yy in component:
                for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                    if 0<=nx<w and 0<=ny<h and owner_grid[ny,nx]>=0:
                        surrounding[int(owner_grid[ny,nx])]+=1
            root=surrounding.most_common(1)[0][0] if surrounding else -1
            for xx,yy in component:
                ink[yy,xx]=False
                if root>=0:owner_grid[yy,xx]=root
    output=[]
    for idx,region in main.items():
        mask=owner_grid==idx
        if idx in promoted:
            region={**region,'boxes':writing_boxes(mask,idx,owner_grid)}
            box=region['boxes'][0]
            region.update(x=box['x'],y=box['y'],width=box['width'],height=box['height'])
        region={**region,'d':runs(mask),'area':int(mask.sum())*4,'color':main_colors[idx],
                'mergedIds':[i for i,r in owners.items() if r==idx and i!=idx]}
        output.append(region)
    line_art=runs(ink)
    return output,line_art,dict(merged=len(owners)-len(main),unassigned=len(pending),fields=len(main))
