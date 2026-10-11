let sheetCacheKey='',sheetCache=null;
function cutDescription(s,mode='keep',compact=false){
  const n=value=>Number(value.toFixed(1)),keep=`${n(s.width)}×${n(s.height)}″`;
  if(mode==='keep')return compact?`KEEP ${keep}`:`Keep ${n(s.width)}″ × ${n(s.height)}″`;
  const dx=Math.max(0,s.w-s.width),dy=Math.max(0,s.h-s.height);
  if(s.rectangular&&dx>1e-6&&dy<=1e-6)return compact?`AWAY ${n(dx)}×${n(s.h)}″`:`Cut away ${n(dx)}″ × ${n(s.h)}″`;
  if(s.rectangular&&dy>1e-6&&dx<=1e-6)return compact?`AWAY ${n(s.w)}×${n(dy)}″`:`Cut away ${n(s.w)}″ × ${n(dy)}″`;
  if(s.rectangular&&dx>1e-6&&dy>1e-6)return compact?`AWAY ${n(dx)}″ H + ${n(dy)}″ V`:`Cut away ${n(dx)}″ horizontally and ${n(dy)}″ vertically`;
  return compact?`AWAY CUSTOM · KEEP ${keep}`:`Cut away the custom trim outside the ${n(s.width)}″ × ${n(s.height)}″ kept bounds`;
}
function sheetLabelPoint(polygons){
  const rings=polygons.reduce((best,p)=>G.area(p[0])>G.area(best[0])?p:best,polygons[0]);
  const ys=[...new Set(rings.flat().map(p=>p[1]))].sort((a,b)=>a-b);let best=null;
  for(let j=0;j<ys.length-1;j++){const y=(ys[j]+ys[j+1])/2,hits=[];
    for(const ring of rings)for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if((a[1]>y)!==(b[1]>y))hits.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2){const score=(hits[i+1]-hits[i])*(ys[j+1]-ys[j]);if(!best||score>best.score)best={score,p:[(hits[i]+hits[i+1])/2,y]};}
  }return best?best.p:rings[0][0];
}
function renderCutInstructions(list,pieces,stockWidth,stockLength,firstStockNumber){
  const n=value=>Number(value.toFixed(1)),same=(a,b)=>Math.abs(a-b)<1e-6;
  const short=Math.min(stockWidth,stockLength),long=Math.max(stockWidth,stockLength),bins=[],custom=[];
  const normalized=pieces.map(sheet=>{
    if(!sheet.rectangular)return {sheet};
    const a=sheet.width,b=sheet.height;
    if(same(a,short)&&b<=long+1e-6)return {sheet,mode:'length',span:b};
    if(same(b,short)&&a<=long+1e-6)return {sheet,mode:'length',span:a};
    if(same(a,long)&&b<=short+1e-6)return {sheet,mode:'width',span:b};
    if(same(b,long)&&a<=short+1e-6)return {sheet,mode:'width',span:a};
    return {sheet};
  }).sort((a,b)=>(b.span||0)-(a.span||0));
  for(const item of normalized){
    if(!item.mode){custom.push(item.sheet);continue;}
    const capacity=item.mode==='length'?long:short;
    let bin=bins.find(candidate=>candidate.mode===item.mode&&candidate.used+item.span<=capacity+1e-6);
    if(!bin){bin={mode:item.mode,used:0,pieces:[],spans:[]};bins.push(bin);}
    bin.used+=item.span;bin.pieces.push(item.sheet);bin.spans.push(item.span);
  }
  custom.forEach(sheet=>bins.push({mode:'custom',used:sheet.used,pieces:[sheet],spans:[]}));
  bins.forEach((bin,index)=>{
    const card=document.createElement('article');card.className='cut-card';
    const head=document.createElement('div');head.className='cut-card-head';
    const title=document.createElement('strong');title.textContent=`Stock sheet ${firstStockNumber+index}`;head.append(title);card.append(head);
    const ids=bin.pieces.map(piece=>`S${piece.id}`).join(' + '),groups=new Map();
    bin.pieces.forEach(piece=>{const key=`${n(piece.width)}″ × ${n(piece.height)}″`;groups.set(key,(groups.get(key)||0)+1);});
    const kept=[...groups].map(([size,count])=>count>1?`${count} pieces · ${size} each`:size).join('; ');
    const keep=document.createElement('div');keep.className='cut-measure keep';
    const keepName=document.createElement('b');keepName.textContent='KEEP';const keepValue=document.createElement('span');keepValue.textContent=`${ids} · ${kept}`;keep.append(keepName,keepValue);card.append(keep);
    const away=document.createElement('div');away.className='cut-measure away';
    const awayName=document.createElement('b');awayName.textContent='CUT AWAY';const awayValue=document.createElement('span');
    if(bin.mode==='length')awayValue.textContent=same(bin.used,long)?'None — keep both sides of the cut':`${n(short)}″ × ${n(long-bin.used)}″ remaining`;
    else if(bin.mode==='width')awayValue.textContent=same(bin.used,short)?'None — keep both sides of the cut':`${n(short-bin.used)}″ × ${n(long)}″ remaining`;
    else awayValue.textContent=cutDescription(bin.pieces[0],'away').replace(/^Cut away /,'');
    away.append(awayName,awayValue);card.append(away);
    if(bin.mode!=='custom'){
      const capacity=bin.mode==='length'?long:short,positions=[];let position=0;
      bin.spans.forEach(span=>{position+=span;if(position<capacity-1e-6||!same(bin.used,capacity))positions.push(n(position));});
      const cut=document.createElement('div');cut.className='cut-measure cut-at';const cutName=document.createElement('b');cutName.textContent='CUT';const cutValue=document.createElement('span');
      const places=positions.map(value=>`${value}″`).join(positions.length>1?', ':''),verb=bin.mode==='length'?'Crosscut':'Rip';
      cutValue.textContent=`${verb} at ${places} from one ${bin.mode==='length'?'end':'edge'}${same(bin.used,capacity)?'; use all pieces':''}`;
      cut.append(cutName,cutValue);card.append(cut);
    }
    list.append(card);
  });
}
function drawDrywall(c,view='sheets',complete=true){
  const selected=document.getElementById('sheetSize').value,summary=document.getElementById('sheetSummary'),list=document.getElementById('cutInstructions');
  summary.textContent=view!=='sheets'?'Switch to Virtual sheets to see the optimized layout.':selected==='none'?'No drywall sheet selected. Choose a sheet size to create a layout.':'Calibrate the ceiling to lay out drywall sheets.';list.replaceChildren();
  if(view!=='sheets'||selected==='none'||!c)return;
  const [width,length]=selected.split('x').map(Number),key=JSON.stringify([c.plane,width,length]);
  if(state.drag){summary.textContent='Adjusting reference… release to update sheet layout.';return;}
  try{
    const anchorIndex=complete?-1:state.region.reduce((best,p,i)=>{
      const score=q=>Math.hypot((state.image.width-q[0])/state.image.width,(state.image.height-q[1])/state.image.height);
      return score(p)<score(state.region[best])?i:best;
    },0);
    const anchor=complete?null:c.plane[anchorIndex];
    const layoutKey=`${complete?'closed':'open'}:${state.sizePreset||'custom'}:${state.layoutOrientation||'auto'}:${key}:${anchor?anchor.join(','):''}`;
    if(layoutKey!==sheetCacheKey){sheetCache=complete?(state.layoutOrientation==='rows'?SheetLayout.candidate(c.plane,length,width,0,0):SheetLayout.optimize(c.plane,width,length)):SheetLayout.visible(c.plane,width,length,anchor);sheetCacheKey=layoutKey;}
    const result=sheetCache;
    const sizeLabel=`${width/12}×${length/12}′`;
    const fullCount=result.sheets.length-result.cutSheets,stockCount=fullCount+Math.ceil(result.sheets.filter(s=>!s.full).reduce((sum,s)=>sum+s.used,0)/(width*length)),stockWaste=Math.max(0,stockCount*width*length-result.used);
    summary.textContent=state.sizePreset==='two-cuts'?'3 sheets total · 2 full sheets + 2 half-sheet pieces · 2 cuts':complete?`${stockCount} stock sheets · ${fullCount} full pieces · ${result.cutSheets} cut pieces · ${result.trimEdges} trim edges · ${(stockWaste/144).toFixed(1)} sq ft offcut · ${result.w}″ × ${result.h}″`:`${result.sheets.length} visible sheets · ${sizeLabel} · no cuts shown — ceiling ends are outside the photo`;
    const group=svg('g',{'data-layer':'drywall','pointer-events':'none'});
    const displaySheets=result.sheets.map(s=>{const center=complete?sheetLabelPoint(s.polygons):[s.x+s.w/2,s.y+s.h/2],imagePoint=G.project(c.forward,center);return {...s,center,imagePoint};}).sort((a,b)=>{
      const score=p=>Math.hypot((state.image.width-p.imagePoint[0])/state.image.width,(state.image.height-p.imagePoint[1])/state.image.height);
      return score(a)-score(b);
    }).map((s,i)=>({...s,id:i+1}));
    for(const s of displaySheets){
      let d='';for(const rings of s.polygons)for(const ring of rings)d+=ring.map((p,i)=>`${i?'L':'M'}${G.project(c.forward,p).join(' ')}`).join(' ')+'Z ';
      const needsCut=complete&&!s.full;
      svg('path',{d,fill:needsCut?'#d98b2466':'#3caeea88',stroke:needsCut?'#ffae35':'#d6f3ff','stroke-width':needsCut?3:2,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'},group);
      const sheetLabel=label(s.imagePoint,complete?`${s.full?'FULL':`CUT`} S${s.id}${needsCut?` · ${cutDescription(s,'keep',true)}`:''}`:`${s.id} · ${sizeLabel}`,needsCut?'#fff2d6':'#ffffff',group);
      sheetLabel.setAttribute('x',s.imagePoint[0]);sheetLabel.setAttribute('y',s.imagePoint[1]);sheetLabel.setAttribute('text-anchor','middle');sheetLabel.setAttribute('dominant-baseline','middle');
    }
    if(complete)renderCutInstructions(list,displaySheets.filter(sheet=>!sheet.full),width,length,fullCount+1);
    if(!list.children.length){const note=document.createElement('p');note.className='no-cuts-note';note.textContent='No cuts required.';list.append(note);}
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
