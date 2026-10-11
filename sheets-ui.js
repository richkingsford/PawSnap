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
function drywallSheetLabel(point,sheet,needsCut,parent){
  const fontSize=Math.max(22,state.image.width/18),color=needsCut?'#fff2d6':'#ffffff',text=svg('text',{x:point[0],y:point[1],fill:color,'font-size':fontSize,'font-weight':800,style:`font-size:${fontSize}px;fill:${color};font-weight:800`,'paint-order':'stroke',stroke:'#182218','stroke-width':Math.max(4.5,state.image.width/105),'stroke-linejoin':'round','font-family':'Manrope, sans-serif','text-anchor':'middle','dominant-baseline':'middle'},parent);
  if(!needsCut){text.textContent=`FULL S${sheet.id}`;return text;}
  const first=svg('tspan',{x:point[0],dy:'-.42em'},text);first.textContent=`S${sheet.id} · KEEP`;
  const secondSize=fontSize*.82,second=svg('tspan',{x:point[0],dy:'1.18em','font-size':secondSize,style:`font-size:${secondSize}px`},text);second.textContent=`${Number(sheet.width.toFixed(1))}×${Number(sheet.height.toFixed(1))}″`;
  return text;
}
function buildCutPlan(pieces,stockWidth,stockLength){
  const same=(a,b)=>Math.abs(a-b)<1e-6;
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
  return bins;
}
function installerDiagram(bin,stockWidth,stockLength,targetIndex,diagramIndex){
  const ns='http://www.w3.org/2000/svg',short=Math.min(stockWidth,stockLength),long=Math.max(stockWidth,stockLength),margin=15,fmt=value=>`${Number(value.toFixed(2))}″`;
  const wrap=document.createElement('div');wrap.className='installer-diagram';
  const drawing=document.createElementNS(ns,'svg'),vw=short+margin*2,vh=long+margin*2;drawing.setAttribute('viewBox',`0 0 ${vw} ${vh}`);drawing.setAttribute('role','img');drawing.setAttribute('aria-label',`Original ${fmt(short)} by ${fmt(long)} sheet divided into ${bin.pieces.map(piece=>`S${piece.id}`).join(' and ')}`);
  const add=(tag,attrs,parent=drawing,text)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(text)el.textContent=text;parent.append(el);return el;};
  const defs=add('defs',{}),pattern=add('pattern',{id:`installer-waste-${diagramIndex}`,width:5,height:5,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);add('rect',{width:5,height:5,fill:'#fff0ec'},pattern);add('line',{x1:0,y1:0,x2:0,y2:5,stroke:'#d55b3e','stroke-width':2},pattern);
  const edgeText=(x,y,text,attrs={})=>add('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',...attrs},drawing,text);
  edgeText(margin+short/2,6,fmt(short),{class:'pre-dim'});edgeText(margin+short/2,vh-5,fmt(short),{class:'pre-dim'});edgeText(6,margin+long/2,fmt(long),{class:'pre-dim',transform:`rotate(-90 6 ${margin+long/2})`});edgeText(vw-6,margin+long/2,fmt(long),{class:'pre-dim',transform:`rotate(90 ${vw-6} ${margin+long/2})`});
  add('rect',{x:margin,y:margin,width:short,height:long,fill:'#f6f2e9',stroke:'#29362b','stroke-width':1.1});
  const drawPostDimensions=(x,y,w,h)=>{
    if(w>=12){edgeText(x+w/2,y+3.2,fmt(w),{class:'post-dim'});edgeText(x+w/2,y+h-3.2,fmt(w),{class:'post-dim'});}
    if(h>=12){edgeText(x+3.2,y+h/2,fmt(h),{class:'post-dim',transform:`rotate(-90 ${x+3.2} ${y+h/2})`});edgeText(x+w-3.2,y+h/2,fmt(h),{class:'post-dim',transform:`rotate(90 ${x+w-3.2} ${y+h/2})`});}
  };
  let cursor=0;
  bin.pieces.forEach((piece,index)=>{
    const span=bin.spans[index],x=margin+(bin.mode==='width'?cursor:0),y=margin+(bin.mode==='length'?cursor:0),w=bin.mode==='width'?span:short,h=bin.mode==='length'?span:long;
    add('rect',{x,y,width:w,height:h,fill:index===targetIndex?'#d8efb3':'#dde8ee',stroke:index===targetIndex?'#55752f':'#6c7f89','stroke-width':.55});drawPostDimensions(x,y,w,h);
    if(w>=16&&h>=12)edgeText(x+w/2,y+h/2,index===targetIndex?`KEEP S${piece.id}`:`SAVE S${piece.id}`,{class:'piece-id'});
    cursor+=span;if(cursor<(bin.mode==='length'?long:short)-1e-6)add('line',bin.mode==='length'?{x1:margin,y1:margin+cursor,x2:margin+short,y2:margin+cursor,class:'cut-line'}:{x1:margin+cursor,y1:margin,x2:margin+cursor,y2:margin+long,class:'cut-line'});
  });
  const capacity=bin.mode==='length'?long:short,remainder=Math.max(0,capacity-cursor);
  if(remainder>1e-6){const x=margin+(bin.mode==='width'?cursor:0),y=margin+(bin.mode==='length'?cursor:0),w=bin.mode==='width'?remainder:short,h=bin.mode==='length'?remainder:long;add('rect',{x,y,width:w,height:h,fill:`url(#installer-waste-${diagramIndex})`,stroke:'#a23c29','stroke-width':.6});if(w>=12&&h>=10)edgeText(x+w/2,y+h/2,'DISCARD',{class:'waste-label'});}
  wrap.append(drawing);return wrap;
}
function singleCutDiagram(step,diagramIndex){
  const ns='http://www.w3.org/2000/svg',margin=15,fmt=value=>`${Number(value.toFixed(2))}″`,sheetWidth=step.mode==='length'?step.crossSpan:step.sourceSpan,sheetHeight=step.mode==='length'?step.sourceSpan:step.crossSpan,vw=sheetWidth+margin*2,vh=sheetHeight+margin*2;
  const wrap=document.createElement('div');wrap.className='installer-diagram';const drawing=document.createElementNS(ns,'svg');drawing.setAttribute('viewBox',`0 0 ${vw} ${vh}`);drawing.setAttribute('role','img');drawing.setAttribute('aria-label',`One cut creates S${step.piece.id} from a ${fmt(sheetWidth)} by ${fmt(sheetHeight)} piece`);
  const add=(tag,attrs,parent=drawing,text)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(text)el.textContent=text;parent.append(el);return el;},edgeText=(x,y,text,attrs={})=>add('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',...attrs},drawing,text);
  const defs=add('defs',{}),pattern=add('pattern',{id:`single-cut-waste-${diagramIndex}`,width:5,height:5,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);add('rect',{width:5,height:5,fill:'#fff0ec'},pattern);add('line',{x1:0,y1:0,x2:0,y2:5,stroke:'#d55b3e','stroke-width':2},pattern);
  edgeText(margin+sheetWidth/2,6,fmt(sheetWidth),{class:'pre-dim'});edgeText(margin+sheetWidth/2,vh-5,fmt(sheetWidth),{class:'pre-dim'});edgeText(6,margin+sheetHeight/2,fmt(sheetHeight),{class:'pre-dim',transform:`rotate(-90 6 ${margin+sheetHeight/2})`});edgeText(vw-6,margin+sheetHeight/2,fmt(sheetHeight),{class:'pre-dim',transform:`rotate(90 ${vw-6} ${margin+sheetHeight/2})`});
  const target={x:margin,y:margin,w:step.mode==='length'?step.crossSpan:step.cutSpan,h:step.mode==='length'?step.cutSpan:step.crossSpan},remainder={x:margin+(step.mode==='width'?step.cutSpan:0),y:margin+(step.mode==='length'?step.cutSpan:0),w:step.mode==='length'?step.crossSpan:step.sourceSpan-step.cutSpan,h:step.mode==='length'?step.sourceSpan-step.cutSpan:step.crossSpan};
  const dimensions=(box)=>{if(box.w>=12){edgeText(box.x+box.w/2,box.y+3.2,fmt(box.w),{class:'post-dim'});edgeText(box.x+box.w/2,box.y+box.h-3.2,fmt(box.w),{class:'post-dim'});}if(box.h>=12){edgeText(box.x+3.2,box.y+box.h/2,fmt(box.h),{class:'post-dim',transform:`rotate(-90 ${box.x+3.2} ${box.y+box.h/2})`});edgeText(box.x+box.w-3.2,box.y+box.h/2,fmt(box.h),{class:'post-dim',transform:`rotate(90 ${box.x+box.w-3.2} ${box.y+box.h/2})`});}};
  add('rect',{...target,width:target.w,height:target.h,fill:'#d8efb3',stroke:'#55752f','stroke-width':.7});dimensions(target);if(target.w>=16&&target.h>=12)edgeText(target.x+target.w/2,target.y+target.h/2,`KEEP S${step.piece.id}`,{class:'piece-id'});
  if(remainder.w>1e-6&&remainder.h>1e-6){add('rect',{...remainder,width:remainder.w,height:remainder.h,fill:step.remainderLabel?'#dde8ee':`url(#single-cut-waste-${diagramIndex})`,stroke:step.remainderLabel?'#6c7f89':'#a23c29','stroke-width':.7});dimensions(remainder);if(remainder.w>=16&&remainder.h>=12)edgeText(remainder.x+remainder.w/2,remainder.y+remainder.h/2,step.remainderLabel||'DISCARD',{class:step.remainderLabel?'piece-id':'waste-label'});}
  add('line',step.mode==='length'?{x1:margin,y1:margin+step.cutSpan,x2:margin+sheetWidth,y2:margin+step.cutSpan,class:'cut-line'}:{x1:margin+step.cutSpan,y1:margin,x2:margin+step.cutSpan,y2:margin+sheetHeight,class:'cut-line'});
  wrap.append(drawing);return wrap;
}
function savedPieceDiagram(piece){
  const ns='http://www.w3.org/2000/svg',w=piece.width,h=piece.height,margin=13,fmt=value=>`${Number(value.toFixed(2))}″`;
  const wrap=document.createElement('div');wrap.className='saved-piece-diagram';const drawing=document.createElementNS(ns,'svg');drawing.setAttribute('viewBox',`0 0 ${w+margin*2} ${h+margin*2}`);drawing.setAttribute('role','img');drawing.setAttribute('aria-label',`Saved S${piece.id}, ${fmt(w)} by ${fmt(h)}`);
  const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(text)el.textContent=text;drawing.append(el);return el;},text=(x,y,value,attrs={})=>add('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',...attrs},value);
  add('rect',{x:margin,y:margin,width:w,height:h,fill:'#d8efb3',stroke:'#29362b','stroke-width':1});text(margin+w/2,margin+h/2,`USE S${piece.id}`,{class:'piece-id'});
  if(w>=10){text(margin+w/2,margin+3,fmt(w),{class:'post-dim'});text(margin+w/2,margin+h-3,fmt(w),{class:'post-dim'});}if(h>=10){text(margin+3,margin+h/2,fmt(h),{class:'post-dim',transform:`rotate(-90 ${margin+3} ${margin+h/2})`});text(margin+w-3,margin+h/2,fmt(h),{class:'post-dim',transform:`rotate(90 ${margin+w-3} ${margin+h/2})`});}
  wrap.append(drawing);return wrap;
}
function instructionCard(title,subtitle){
  const card=document.createElement('article');card.className='cut-card installer-card';const head=document.createElement('div');head.className='cut-card-head';const name=document.createElement('strong');name.textContent=title;const detail=document.createElement('span');detail.textContent=subtitle;head.append(name,detail);card.append(head);return card;
}
function renderCutInstructions(list,bins,stockWidth,stockLength){
  const n=value=>Number(value.toFixed(1)),same=(a,b)=>Math.abs(a-b)<1e-6,short=Math.min(stockWidth,stockLength),long=Math.max(stockWidth,stockLength);
  if(!bins.length)return;
  const legend=document.createElement('div');legend.className='measure-color-key';legend.innerHTML='<span class="before">Blue = original sheet</span><span class="after">Green = new pieces</span>';list.append(legend);
  bins.forEach((bin,binIndex)=>{
    if(bin.mode==='custom'){
      const piece=bin.pieces[0],card=instructionCard(`Cut S${piece.id}`,`${n(piece.width)}″ × ${n(piece.height)}″ piece`);const note=document.createElement('p');note.className='installer-note';note.textContent=cutDescription(piece,'away');card.append(note);list.append(card);return;
    }
    const capacity=bin.mode==='length'?long:short,crossSpan=bin.mode==='length'?short:long,edge=bin.mode==='length'?'end':'edge';let sourceSpan=capacity,sourceCut=null;
    for(let index=0;index<bin.pieces.length;index++){
      const piece=bin.pieces[index],cutSpan=bin.spans[index],after=Math.max(0,sourceSpan-cutSpan),next=bin.pieces[index+1],nextSpan=bin.spans[index+1],nextIsReady=Boolean(next&&index+2===bin.pieces.length&&same(after,nextSpan));
      const sourceWidth=bin.mode==='length'?crossSpan:sourceSpan,sourceHeight=bin.mode==='length'?sourceSpan:crossSpan,subtitle=sourceCut?`${n(sourceWidth)}″ × ${n(sourceHeight)}″ saved from Cut S${sourceCut.id}`:`${n(sourceWidth)}″ × ${n(sourceHeight)}″ stock`,card=instructionCard(`Cut S${piece.id}`,subtitle),body=document.createElement('div'),actions=document.createElement('div');body.className='installer-card-body';actions.className='installer-actions';
      const remainderLabel=nextIsReady?`SAVE S${next.id}`:next?`SAVE → S${next.id}`:'';body.append(singleCutDiagram({mode:bin.mode,crossSpan,sourceSpan,cutSpan,piece,remainderLabel},`${binIndex}-${index}`));
      const steps=document.createElement('ol');steps.className='installer-steps';steps.innerHTML=sourceCut?`<li>Find the saved ${n(sourceWidth)}″ × ${n(sourceHeight)}″ piece from Cut S${sourceCut.id}.</li><li>Measure ${n(cutSpan)}″ from one ${edge}.</li><li>Saw the dotted line and label S${piece.id}.</li>`:`<li>Measure ${n(cutSpan)}″ from one ${edge}.</li><li>Saw straight across the dotted line.</li><li>Label the kept piece S${piece.id}.</li>`;actions.append(steps);
      if(next){const save=document.createElement('p');save.className='save-reminder';const remainderWidth=bin.mode==='length'?crossSpan:after,remainderHeight=bin.mode==='length'?after:crossSpan;save.innerHTML=nextIsReady?`<strong>Save the other piece</strong>Use the ${n(next.width)}″ × ${n(next.height)}″ piece on Use S${next.id}.`:`<strong>Save for the next cut</strong>Use the ${n(remainderWidth)}″ × ${n(remainderHeight)}″ piece on Cut S${next.id}.`;actions.append(save);}
      body.append(actions);card.append(body);list.append(card);
      if(nextIsReady){const use=instructionCard(`Use S${next.id}`,`saved from Cut S${piece.id}`),useBody=document.createElement('div'),useActions=document.createElement('div');useBody.className='installer-card-body';useActions.className='installer-actions';useBody.append(savedPieceDiagram(next));const useSteps=document.createElement('ol');useSteps.className='installer-steps';useSteps.innerHTML=`<li>Find the saved ${n(next.width)}″ × ${n(next.height)}″ piece.</li><li>Confirm it came from Cut S${piece.id}.</li><li>Label that piece S${next.id}.</li>`;useActions.append(useSteps);const reminder=document.createElement('p');reminder.className='save-reminder';reminder.innerHTML=`<strong>Use saved piece</strong>Use the ${n(next.width)}″ × ${n(next.height)}″ piece from Cut S${piece.id}.`;useActions.append(reminder);useBody.append(useActions);use.append(useBody);list.append(use);break;}
      sourceCut=piece;sourceSpan=after;
    }
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
    summary.textContent=state.sizePreset==='two-cuts'?'3 sheets total · 2 full sheets + 2 half-sheet pieces · 1 physical cut':complete?`${stockCount} stock sheets · ${fullCount} full pieces · ${result.cutSheets} cut pieces · ${result.trimEdges} trim edges · ${(stockWaste/144).toFixed(1)} sq ft offcut · ${result.w}″ × ${result.h}″`:`${result.sheets.length} visible sheets · ${sizeLabel} · no cuts shown — ceiling ends are outside the photo`;
    const group=svg('g',{'data-layer':'drywall','pointer-events':'none'});
    const displaySheets=result.sheets.map(s=>{const center=complete?sheetLabelPoint(s.polygons):[s.x+s.w/2,s.y+s.h/2],imagePoint=G.project(c.forward,center);return {...s,center,imagePoint};}).sort((a,b)=>{
      const score=p=>Math.hypot((state.image.width-p.imagePoint[0])/state.image.width,(state.image.height-p.imagePoint[1])/state.image.height);
      return score(a)-score(b);
    }).map((s,i)=>({...s,id:i+1}));
    const cutPlan=complete?buildCutPlan(displaySheets.filter(sheet=>!sheet.full),width,length):[];
    for(const s of displaySheets){
      let d='';for(const rings of s.polygons)for(const ring of rings)d+=ring.map((p,i)=>`${i?'L':'M'}${G.project(c.forward,p).join(' ')}`).join(' ')+'Z ';
      const needsCut=complete&&!s.full;
      svg('path',{d,fill:needsCut?'#d98b2466':'#3caeea88',stroke:needsCut?'#ffae35':'#d6f3ff','stroke-width':needsCut?3:2,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'},group);
      if(complete)drywallSheetLabel(s.imagePoint,s,needsCut,group);else{
        const sheetLabel=label(s.imagePoint,`${s.id} · ${sizeLabel}`,'#ffffff',group);sheetLabel.setAttribute('x',s.imagePoint[0]);sheetLabel.setAttribute('y',s.imagePoint[1]);sheetLabel.setAttribute('text-anchor','middle');sheetLabel.setAttribute('dominant-baseline','middle');
      }
    }
    if(complete)renderCutInstructions(list,cutPlan,width,length);
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
