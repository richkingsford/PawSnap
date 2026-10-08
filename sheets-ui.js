let sheetCacheKey='',sheetCache=null;
function sheetLabelPoint(polygons){
  const rings=polygons.reduce((best,p)=>G.area(p[0])>G.area(best[0])?p:best,polygons[0]);
  const ys=[...new Set(rings.flat().map(p=>p[1]))].sort((a,b)=>a-b);let best=null;
  for(let j=0;j<ys.length-1;j++){const y=(ys[j]+ys[j+1])/2,hits=[];
    for(const ring of rings)for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if((a[1]>y)!==(b[1]>y))hits.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2){const score=(hits[i+1]-hits[i])*(ys[j+1]-ys[j]);if(!best||score>best.score)best={score,p:[(hits[i]+hits[i+1])/2,y]};}
  }return best?best.p:rings[0][0];
}
function drawDrywall(c,view='sheets'){
  const selected=document.getElementById('sheetSize').value,summary=document.getElementById('sheetSummary'),list=document.getElementById('sheetCuts');
  summary.textContent=view!=='sheets'?'Switch to Virtual sheets to see the optimized layout.':selected==='none'?'No drywall sheet selected. Choose a sheet size to create a layout.':'Calibrate the ceiling to lay out drywall sheets.';list.replaceChildren();
  if(view!=='sheets'||selected==='none'||!c)return;
  const [width,length]=selected.split('x').map(Number),key=JSON.stringify([c.plane,width,length]);
  if(state.drag){summary.textContent='Adjusting reference… release to update sheet layout.';return;}
  try{
    if(key!==sheetCacheKey){sheetCache=SheetLayout.optimize(c.plane,width,length);sheetCacheKey=key;}
    const result=sheetCache;
    summary.textContent=`${result.sheets.length} stock sheets · ${result.sheets.length-result.cutSheets} full · ${result.cutSheets} cut · ${result.trimEdges} trim edges · ${(result.waste/144).toFixed(1)} sq ft offcut. Best of ${result.tested} layouts; ${result.w}″ × ${result.h}″ orientation.`;
    let defs=document.querySelector('#scene defs');if(!defs)defs=svg('defs');
    const pattern=svg('pattern',{id:'cutSheetPattern',width:12,height:12,patternUnits:'userSpaceOnUse',patternTransform:'rotate(35)'},defs);
    svg('rect',{width:12,height:12,fill:'#d98b2488'},pattern);svg('rect',{width:5,height:12,fill:'#ffd071aa'},pattern);
    const group=svg('g',{'data-layer':'drywall','pointer-events':'none'});
    for(const s of result.sheets){
      let d='';for(const rings of s.polygons)for(const ring of rings)d+=ring.map((p,i)=>`${i?'L':'M'}${G.project(c.forward,p).join(' ')}`).join(' ')+'Z ';
      svg('path',{d,fill:s.full?'#3caeea88':'url(#cutSheetPattern)',stroke:s.full?'#d6f3ff':'#ffae35','stroke-width':s.full?2:3,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'},group);
      const center=sheetLabelPoint(s.polygons);
      label(G.project(c.forward,center),`${s.full?'FULL':'CUT'} S${s.id}`,s.full?'#ffffff':'#fff2d6',group);
      const row=document.createElement('div');row.className='sheet-cut-row';const desc=document.createElement('span');
      desc.textContent=`S${s.id} · ${s.full?'Full sheet — no cuts':s.rectangular?`Cut to ≈ ${s.width.toFixed(1)}″ × ${s.height.toFixed(1)}″`:`Custom trim · ≈ ${s.width.toFixed(1)}″ × ${s.height.toFixed(1)}″ bounds`} ${s.polygons.length>1?`· ${s.polygons.length} separate pieces`:''}`;
      const button=document.createElement('button');button.textContent='Cut outline';button.setAttribute('aria-label',`Download cut outline for sheet S${s.id}`);button.onclick=()=>downloadSheetOutline(s);
      row.append(desc,button);list.append(row);
    }
  }catch(e){summary.textContent=`Sheet layout unavailable: ${e.message}`;}
}
function downloadSheetOutline(s){
  const ns='http://www.w3.org/2000/svg',doc=document.createElementNS(ns,'svg'),add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;doc.append(el);return el;};
  const points=[];let d='';s.polygons.forEach((rings,j)=>rings.forEach((ring,k)=>{d+=ring.map((p,i)=>`${i?'L':'M'}${p[0]-s.x+8} ${p[1]-s.y+16}`).join(' ')+'Z ';ring.slice(0,-1).forEach((p,i)=>points.push(`Piece ${j+1}${k?' hole':''}, vertex ${i+1}: ${(p[0]-s.x).toFixed(2)}, ${(p[1]-s.y).toFixed(2)} in`));}));
  doc.setAttribute('xmlns',ns);doc.setAttribute('viewBox',`0 0 ${Math.max(s.w+16,150)} ${s.h+52+points.length*5}`);doc.setAttribute('width','900');
  add('rect',{x:0,y:0,width:'100%',height:'100%',fill:'white'});
  add('text',{x:8,y:8,'font-size':5},`S${s.id} · Stock ${s.w} × ${s.h} inches · ${s.trimEdges} trim edges`);
  add('rect',{x:8,y:16,width:s.w,height:s.h,fill:'#eee',stroke:'#888','stroke-dasharray':'2 2','stroke-width':.4});
  add('path',{d,fill:'#cce8d0',stroke:'#153c24','stroke-width':.5,'fill-rule':'evenodd'});
  const note=boardMode()?'Scale assumes 2-inch boards. Verify dimensions before cutting.':'Scale uses the entered reference dimensions. Verify before cutting.';
  add('text',{x:8,y:s.h+25,'font-size':3.2},note);add('text',{x:8,y:s.h+31,'font-size':3.2},'Vertex coordinates from stock top-left. Drawing is not a full-size template.');
  points.forEach((p,i)=>add('text',{x:8,y:s.h+39+i*5,'font-size':3.5},p));
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download=`drywall-S${s.id}-cut-outline.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
