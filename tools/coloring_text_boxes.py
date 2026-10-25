"""Find safe writing rectangles along a slanted illustration compartment."""
import math
import numpy as np


def oriented_boxes(labels,idx,pixels):
    if len(pixels)<300:
        return []
    points=np.asarray(pixels,dtype=float)
    center=points.mean(axis=0)
    cov=np.cov((points-center).T)
    theta=.5*math.atan2(2*cov[0,1],cov[0,0]-cov[1,1])
    output=[]
    for angle in (theta,theta-.22,theta+.22):
        u=np.array([math.cos(angle),math.sin(angle)])
        v=np.array([-math.sin(angle),math.cos(angle)])
        along=points@u;across=points@v
        for fraction in (.2,.35,.5,.65,.8):
            cu=float(np.quantile(along,fraction))
            near=np.abs(along-cu)<20
            cv=float(np.median(across[near])) if near.any() else float(np.median(across))
            origin=cu*u+cv*v
            for length in (20,16,12,10,8,6,5,4,3):
                for font in (30,26,22,18):
                    width=(font*length*.58+8)/2
                    height=(font*.85+8)/2
                    xx,yy=np.meshgrid(np.arange(-width/2,width/2+1),np.arange(-height/2,height/2+1))
                    tx=np.rint(origin[0]+xx*u[0]+yy*v[0]).astype(int)
                    ty=np.rint(origin[1]+xx*u[1]+yy*v[1]).astype(int)
                    if tx.min()<0 or ty.min()<0 or tx.max()>=labels.shape[1] or ty.max()>=labels.shape[0]:continue
                    if np.all(labels[ty,tx]==idx):
                        output.append(dict(x=float(origin[0]*2),y=float(origin[1]*2),width=width*2,height=height*2,angle=math.degrees(angle)))
                        break
    return output
