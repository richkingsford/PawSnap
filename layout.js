/* Deterministic cut-first search over axis-aligned sheet layouts, in inches. */
(function(root){
  const PC=typeof module!=='undefined'?require('./vendor/polygon-clipping.js'):root.polygonClipping;
  const G=typeof module!=='undefined'?require('./geometry.js'):root.Geometry;
  const EPS=1e-6;
  function bounds(p){const x=p.map(v=>v[0]),y=p.map(v=>v[1]);return {x:Math.min(...x),y:Math.min(...y),right:Math.max(...x),bottom:Math.max(...y)};}
  function area(polys){return polys.reduce((s,rings)=>s+G.area(rings[0])-rings.slice(1).reduce((a,r)=>a+G.area(r),0),0);}
  function cuts(polys,x,y,w,h){const lines=new Set();
    for(const rings of polys)for(const ring of rings)for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1];
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<EPS)continue;
      if([x,x+w].some(v=>Math.abs(a[0]-v)<EPS&&Math.abs(b[0]-v)<EPS)||[y,y+h].some(v=>Math.abs(a[1]-v)<EPS&&Math.abs(b[1]-v)<EPS))continue;
      let nx=b[1]-a[1],ny=a[0]-b[0],length=Math.hypot(nx,ny);nx/=length;ny/=length;
      if(nx< -EPS||(Math.abs(nx)<EPS&&ny<0)){nx=-nx;ny=-ny;}
      lines.add([nx,ny,nx*a[0]+ny*a[1]].map(v=>v.toFixed(6)).join(','));
    }return lines.size;
  }
  function candidate(region,w,h,ox,oy){const b=bounds(region),sheets=[];
    const startX=ox+Math.floor((b.x-ox)/w)*w,startY=oy+Math.floor((b.y-oy)/h)*h;
    for(let y=startY;y<b.bottom-EPS;y+=h)for(let x=startX;x<b.right-EPS;x+=w){
      const polygons=PC.intersection([region],[[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]]);
      const used=area(polygons);if(used<EPS)continue;
      const full=Math.abs(used-w*h)<EPS*w*h;
      const bb=bounds(polygons.flat(2));
      sheets.push({id:sheets.length+1,x,y,w,h,polygons,used,full,trimEdges:full?0:cuts(polygons,x,y,w,h),width:bb.right-bb.x,height:bb.bottom-bb.y,bounds:bb,rectangular:polygons.length===1&&polygons[0].length===1&&Math.abs(used-(bb.right-bb.x)*(bb.bottom-bb.y))<EPS*w*h});
    }
    const cutSheets=sheets.filter(s=>!s.full).length,trimEdges=sheets.reduce((s,p)=>s+p.trimEdges,0),used=sheets.reduce((s,p)=>s+p.used,0),waste=sheets.length*w*h-used;
    return {sheets,w,h,cutSheets,trimEdges,waste,used,score:[trimEdges,cutSheets,sheets.length,waste],offset:[ox,oy]};
  }
  function offsets(values,span){const out=[];for(const v of values){let p=((v%span)+span)%span;if(Math.abs(p-span)<EPS)p=0;if(!out.some(x=>Math.abs(x-p)<EPS))out.push(p);}return out;}
  function better(a,b){if(!b)return true;for(let i=0;i<a.score.length;i++){if(Math.abs(a.score[i]-b.score[i])>EPS)return a.score[i]<b.score[i];}return false;}
  function optimize(region,width,length){
    if(![width,length].every(v=>Number.isFinite(v)&&v>0)||region.length<3||region.length>40||region.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('A valid ceiling outline of 3–40 points and positive sheet dimensions are required.');
    const b=bounds(region);
    if((b.right-b.x)*(b.bottom-b.y)/(width*length)>160)throw Error('Selected region is too large for the sheet layout search. Trace a smaller ceiling section.');
    let best=null,tested=0;
    // Align seams with polygon vertices, both edges of its bounds, and a coarse
    // phase sweep. This is a bounded search, not a global packing proof.
    for(const [w,h] of [[width,length],[length,width]]){
      const xx=offsets([b.x,b.right,...region.map(p=>p[0]),...Array.from({length:8},(_,i)=>b.x+i*w/8)],w);
      const yy=offsets([b.y,b.bottom,...region.map(p=>p[1]),...Array.from({length:8},(_,i)=>b.y+i*h/8)],h);
      for(const x of xx)for(const y of yy){const result=candidate(region,w,h,x,y);tested++;if(better(result,best))best=result;}
    }
    return {...best,tested};
  }
  function visible(region,width,length,anchor=[0,0]){
    const b=bounds(region);let best=null,tested=0;
    for(const [w,h] of [[width,length],[length,width]]){
      const xx=offsets([anchor[0],b.x,b.right,...region.map(p=>p[0]),...Array.from({length:12},(_,i)=>b.x+i*w/12)],w);
      const yy=offsets([anchor[1],b.y,b.bottom,...region.map(p=>p[1]),...Array.from({length:12},(_,i)=>b.y+i*h/12)],h);
      for(const ox of xx)for(const oy of yy){
        const result=candidate(region,w,h,ox,oy);tested++;
        // An open outline is only the photographed portion of a larger ceiling.
        // Never present a clipped fragment as a usable sheet.
        result.sheets=result.sheets.filter(s=>s.full).map(s=>({
          ...s,
          polygons:[[[[s.x,s.y],[s.x+s.w,s.y],[s.x+s.w,s.y+s.h],[s.x,s.y+s.h],[s.x,s.y]]]],
          used:s.w*s.h,width:s.w,height:s.h,
          bounds:{x:s.x,y:s.y,right:s.x+s.w,bottom:s.y+s.h}
        }));
        result.used=result.sheets.length*w*h;result.waste=0;result.cutSheets=0;result.trimEdges=0;
        const nearest=result.sheets.length?Math.min(...result.sheets.map(s=>Math.hypot((s.x+s.w/2-anchor[0])/w,(s.y+s.h/2-anchor[1])/h))):Infinity;
        // First maximize complete sheets, then bring the nearest one toward the
        // user's prominent bottom-right ceiling corner.
        result.score=[-result.sheets.length,nearest];
        if(better(result,best))best=result;
      }
    }
    return {...best,tested,open:true,anchor};
  }
  const api={optimize,visible,candidate,area};if(typeof module!=='undefined')module.exports=api;else root.SheetLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this);
