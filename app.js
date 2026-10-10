'use strict';
const $=id=>document.getElementById(id), G=Geometry, NS='http://www.w3.org/2000/svg';
const samples=[
  {name:'Open joists',url:'samples/framing-room.jpg',region:[[0,.21],[1,.21],[1,.42],[.72,.49],[0,.49]]},
  {name:'Long room',url:'samples/framing-wide.jpg',region:[[0,0],[1,0],[.85,.475],[.46,.475],[0,.39]]},
  {name:'Basement ducts',url:'samples/basement-ducts.png',region:[[0,0],[1,0],[1,.57],[0,.46]]},
  {name:'Ceiling battens',url:'samples/ceiling-battens.png',region:[[0,0],[1,0],[1,.28],[.79,.396],[0,.396]],starter:{reference:[[161,78],[251,78],[240,164],[175,164]],widths:[[165,145],[176,145],[207,160],[207,167]]}},
  {name:'Renovation',url:'samples/ceiling-renovation.png',region:[[0,0],[1,0],[1,.495],[.66,.58],[.09,.59],[0,.55]]}
];
const state={image:null,reference:[],widths:[],region:[],segment:[],mode:'edit',calibration:null,manualCalibration:null,outlineDimensions:null,sizePreset:null,layoutOrientation:null,drag:null,pointMenuIndex:null,pointLengthDirty:{previous:false,next:false},rightAngleActive:'previous',viewBox:null,version:0,starter:false};
const boardMode=()=>$('scaleSource').value==='boards';
const viewMode=()=>document.querySelector('input[name="viewMode"]:checked').value;
const selectView=value=>{const radio=document.querySelector(`input[name="viewMode"][value="${value}"]`);if(radio)radio.checked=true;};
const fullPerimeterVisible=()=>Boolean(state.outlineDimensions||state.sizePreset)||(state.image&&state.region.length>=3&&!state.region.some(([x,y])=>x<=1||y<=1||x>=state.image.width-1||y>=state.image.height-1));
function conservativeCorners(points,confidentExtraCorners=false){
  const result=points.map(p=>[...p]);if(confidentExtraCorners)return result;
  while(result.length>4){let remove=0,smallest=Infinity;for(let i=0;i<result.length;i++){const a=result[(i+result.length-1)%result.length],p=result[i],b=result[(i+1)%result.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,distance=Math.abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/length;if(distance<smallest){smallest=distance;remove=i;}}result.splice(remove,1);}return result;
}
function svg(tag,attrs={},parent=$('scene')){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.appendChild(e);return e;}
function line(a,b,color,width=1,parent=$('scene')){return svg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':width,class:'grid-line'},parent);}
function label(p,text,color='#ecffda',parent=$('scene')){const e=svg('text',{x:p[0]+7,y:p[1]-8,fill:color,'font-size':Math.max(11,state.image.width/45),'paint-order':'stroke',stroke:'#182218','stroke-width':3,'stroke-linejoin':'round','font-family':'monospace'},parent);e.textContent=text;return e;}
function pointString(p){return p.map(a=>a.join(',')).join(' ');}
function inside([x,y],polygon){let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [a,b]=polygon[i],[c,d]=polygon[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;}
function resetReadings(){state.calibration=null;$('area').textContent=$('distance').textContent=$('gridValue').textContent='—';$('gridNote').textContent='Requires calibration';$('edges').replaceChildren();$('checkResult').textContent='Use a second known distance to check calibration.';$('status').textContent='Uncalibrated · no inch scale';$('status').classList.remove('calibrated');$('error').textContent='';}
function fitStageToPoints(){
  if(!state.image)return;
  const w=state.image.width,h=state.image.height,baseX=w*.22,baseY=h*.22,extraX=w*.08,extraY=h*.08;
  const points=[...state.reference,...state.region];
  const minX=Math.min(-baseX,...points.map(p=>p[0]-extraX)),maxX=Math.max(w+baseX,...points.map(p=>p[0]+extraX));
  const minY=Math.min(-baseY,...points.map(p=>p[1]-extraY)),maxY=Math.max(h+baseY,...points.map(p=>p[1]+extraY));
  state.viewBox=[minX,minY,maxX-minX,maxY-minY];
}
function positionPointMenu(){
  const menu=$('pointMenu'),index=state.pointMenuIndex,circle=$('scene').querySelector(`[data-key="region"][data-index="${index}"]`);
  if(index===null){menu.hidden=true;return;}if(!circle){if(!$('pointEditor').hidden||!$('allPointsEditor').hidden)menu.hidden=false;else menu.hidden=true;return;}
  const dot=circle.getBoundingClientRect(),viewport=document.querySelector('.viewport').getBoundingClientRect();
  menu.hidden=false;const x=dot.left+dot.width/2-viewport.left,y=dot.top+dot.height/2-viewport.top,w=menu.offsetWidth,h=menu.offsetHeight;
  menu.style.left=`${Math.max(6,x+(x+10+w<=viewport.width?10:-w-10))}px`;
  menu.style.top=`${Math.max(6,y+(y+10+h<=viewport.height?10:-h-10))}px`;
}
function validCalibration(){
  if(state.outlineDimensions&&state.region.length===4)return G.calibrate(state.region,state.outlineDimensions.width,state.outlineDimensions.depth,state.region);
  if(state.manualCalibration&&state.region.length>=3)return {...state.manualCalibration,plane:state.region.map(p=>G.project(state.manualCalibration.inverse,p))};
  if(state.reference.length!==4)return null;
  if(boardMode()&&state.widths.length!==4)return null;
  if(!boardMode()&&(!$('confirmed').checked||!$('refWidth').value||!$('refDepth').value))return null;
  // Three or more outline points are enough to use the already established
  // reference transform. Keep calibration live while Trace outline is active
  // so point-length edits work before the user presses Finish.
  if(state.region.length<3)return null;
  if(!G.simple(state.region))throw Error('Ceiling outline crosses itself or has zero area. Adjust or retrace its points.');
  return boardMode()?G.calibrateBoards(state.reference,state.widths,2,state.region):G.calibrate(state.reference,Number($('refWidth').value),Number($('refDepth').value),state.region);
}
function pointEditCalibration(){
  if(state.outlineDimensions&&state.region.length===4)return G.calibrate(state.region,state.outlineDimensions.width,state.outlineDimensions.depth,[]);
  if(state.manualCalibration&&state.region.length>=3)return {...state.manualCalibration,plane:state.region.map(p=>G.project(state.manualCalibration.inverse,p))};
  if(state.reference.length!==4||state.widths.length!==4)throw Error('Add scale marks to calculate inch lengths.');
  try{return G.calibrateBoards(state.reference,state.widths,2,[]);}catch(e){throw Error(`Calibration marks conflict: ${e.message}`);}
}
function rectangleMetrics(c){
  const plane=state.region.map(p=>G.project(c.inverse,p)),origin=plane[0],dx=plane[1][0]-origin[0],dy=plane[1][1]-origin[1],width=Math.hypot(dx,dy),ux=dx/width,uy=dy/width,toLast=[plane[3][0]-origin[0],plane[3][1]-origin[1]],sign=(-uy*toLast[0]+ux*toLast[1])>=0?1:-1,vx=-uy*sign,vy=ux*sign,depth=Math.abs(vx*toLast[0]+vy*toLast[1]);
  return {origin,ux,uy,vx,vy,width,depth};
}
function lockHorizontalEdges(){if(state.region.length!==4)return;for(const [a,b] of [[0,1],[2,3]]){const y=(state.region[a][1]+state.region[b][1])/2;state.region[a][1]=state.region[b][1]=y;}}
function snapNearHorizontalEdges(start,y){
  const n=state.region.length;if(n<2)return;state.region[start][1]=y;const queue=[start],seen=new Set([start]);
  while(queue.length){const i=queue.shift();for(const j of [(i+n-1)%n,(i+1)%n]){const a=state.region[i],b=state.region[j];if(Math.abs(b[1]-a[1])<=Math.abs(b[0]-a[0])&&!seen.has(j)){b[1]=a[1];seen.add(j);queue.push(j);}}}
}
function guessedEdgeLengths(){
  const n=state.region.length,edges=state.region.map((p,i)=>{const q=state.region[(i+1)%n],dx=q[0]-p[0],dy=q[1]-p[1];return {axis:Math.abs(dx)>=Math.abs(dy)?'x':'y',sign:Math.sign(Math.abs(dx)>=Math.abs(dy)?dx:dy)||1,pixels:Math.hypot(dx,dy)};});
  const horizontal=edges.filter(e=>e.axis==='x'),scale=192/Math.max(1,...horizontal.map(e=>e.pixels)),lengths=edges.map(e=>Math.max(.1,e.pixels*scale));
  for(const axis of ['x','y']){const positive=edges.map((e,i)=>e.axis===axis&&e.sign>0?i:-1).filter(i=>i>=0),negative=edges.map((e,i)=>e.axis===axis&&e.sign<0?i:-1).filter(i=>i>=0);if(!positive.length||!negative.length)continue;const a=positive.reduce((s,i)=>s+lengths[i],0),b=negative.reduce((s,i)=>s+lengths[i],0),target=(a+b)/2;for(const group of [positive,negative]){const total=group.reduce((s,i)=>s+lengths[i],0)||1;group.forEach(i=>lengths[i]*=target/total);}}
  return lengths;
}
function balanceOrthogonalOutline(c,editedIndex,editedLength,doRender=true){
  const n=state.region.length,plane=state.region.map(p=>G.project(c.inverse,p)),edges=plane.map((p,i)=>{const q=plane[(i+1)%n],dx=q[0]-p[0],dy=q[1]-p[1],axis=Math.abs(dx)>=Math.abs(dy)?'x':'y',component=Math.abs(dx)>=Math.abs(dy)?dx:dy;return {axis,sign:Math.sign(component)||1,length:Math.max(.1,Math.hypot(dx,dy))};});
  edges[editedIndex].length=editedLength;
  for(const axis of ['x','y']){const groups={1:[],[-1]:[]};edges.forEach((e,i)=>{if(e.axis===axis)groups[e.sign].push(i);});if(!groups[1].length||!groups[-1].length)throw Error(`The outline needs walls in both ${axis==='x'?'horizontal':'vertical'} directions.`);const edited=edges[editedIndex].axis===axis?edges[editedIndex].sign:null,fixedSign=edited||1,resizeSign=-fixedSign,target=groups[fixedSign].reduce((sum,i)=>sum+edges[i].length,0),current=groups[resizeSign].reduce((sum,i)=>sum+edges[i].length,0)||1;groups[resizeSign].forEach(i=>edges[i].length=Math.max(.1,edges[i].length*target/current));}
  const next=[[...plane[0]]];for(let i=0;i<n-1;i++){const p=next[i],e=edges[i];next.push(e.axis==='x'?[p[0]+e.sign*e.length,p[1]]:[p[0],p[1]+e.sign*e.length]);}
  const closing=edges[n-1],last=next[n-1],origin=next[0],gap=closing.axis==='x'?Math.abs(origin[0]-last[0]):Math.abs(origin[1]-last[1]);closing.length=gap;
  state.region=next.map(p=>G.project(c.forward,p));state.manualCalibration={forward:c.forward,inverse:c.inverse};state.outlineDimensions=null;state.sizePreset=null;state.layoutOrientation=null;fitStageToPoints();if(doRender)render();
}
function setRectangleDimensions(c,width,depth,sizePreset=null){
  if(state.region.length!==4||![width,depth].every(v=>Number.isFinite(v)&&v>0))throw Error('Enter positive lengths for one side and one adjacent side.');
  const m=rectangleMetrics(c),plane=[[0,0],[width,0],[width,depth],[0,depth]].map(([x,y])=>[m.origin[0]+m.ux*x+m.vx*y,m.origin[1]+m.uy*x+m.vy*y]);
  state.region=plane.map(p=>G.project(c.forward,p));lockHorizontalEdges();state.manualCalibration=null;state.outlineDimensions={width,depth};state.sizePreset=sizePreset;fitStageToPoints();render();
}
function renderCornerLineInputs(c){
  if(state.mode!=='corners'||viewMode()==='photo'||state.region.length<3)return;const n=state.region.length,values=c?state.region.map((p,i)=>G.distance(G.project(c.inverse,p),G.project(c.inverse,state.region[(i+1)%n]))):guessedEdgeLengths();
  state.region.forEach((p,i)=>{const q=state.region[(i+1)%n],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy)||1,mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],normal=[-dy/length,dx/length],side=normal[1]>0?-1:1,center=[mid[0]+normal[0]*18*side,mid[1]+normal[1]*18*side],box=svg('foreignObject',{x:center[0]-47,y:center[1]-15,width:94,height:30,'data-line-input':i}),input=document.createElementNS('http://www.w3.org/1999/xhtml','input');input.type='number';input.min='.1';input.step='any';input.inputMode='decimal';input.placeholder=`Line ${i+1} inches`;input.setAttribute('aria-label',`Line ${i+1} length in inches`);input.title='Enter inches, then press Enter or click away';input.value=values[i]===''?'':values[i].toFixed(1);input.style.cssText='width:90px;height:27px;margin:0;padding:4px 6px;border:2px solid #c7f36a;border-radius:4px;background:white;color:#20231f;font:600 12px Manrope';
    const validate=()=>{const value=Number(input.value),valid=input.value.trim()!==''&&Number.isFinite(value)&&value>0;input.setCustomValidity(valid?'':'Enter a length greater than 0 inches.');input.toggleAttribute('aria-invalid',!valid);return valid?value:null;};
    const mirror=()=>{const value=validate();if(value===null||n!==4)return;const partner=$('scene').querySelector(`foreignObject[data-line-input="${(i+2)%4}"] input`);if(partner)partner.value=value.toFixed(1);};
    const apply=()=>{const value=validate();if(value===null){input.reportValidity();return;}mirror();if(!c){if(n!==4){input.setCustomValidity('Set the four-room dimensions before adding extra points.');input.reportValidity();return;}const fields=[...$('scene').querySelectorAll('foreignObject[data-line-input] input')].map(field=>Number(field.value));state.outlineDimensions={width:(fields[0]+fields[2])/2,depth:(fields[1]+fields[3])/2};render();return;}if(n===4){const m=rectangleMetrics(c);setRectangleDimensions(c,i%2===0?value:m.width,i%2===1?value:m.depth);return;}balanceOrthogonalOutline(c,i,value);};
    input.addEventListener('pointerdown',e=>e.stopPropagation());input.addEventListener('focus',()=>input.select());input.addEventListener('input',mirror);input.addEventListener('change',apply);input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();apply();}});box.append(input);
  });
}
function validatePointLengths(){
  const previousInput=$('previousEdgeLength'),nextInput=$('nextEdgeLength'),dirty=state.pointLengthDirty;
  previousInput.setCustomValidity('');nextInput.setCustomValidity('');previousInput.removeAttribute('aria-invalid');nextInput.removeAttribute('aria-invalid');
  const previousLength=Number(previousInput.value),nextLength=Number(nextInput.value);
  if($('rightAngleOnly').checked){
    try{
      if(state.region.length===4){const active=state.rightAngleActive==='previous'?previousInput:nextInput,length=Number(active.value);if(!Number.isFinite(length)||length<=0){const message='Enter a line length greater than 0 inches.';active.setCustomValidity(message);active.setAttribute('aria-invalid','true');$('pointEditorStatus').textContent=message;return false;}$('pointEditorStatus').textContent='The opposite side will match; all corners remain 90°.';return true;}
      const i=state.pointMenuIndex,c=pointEditCalibration(),n=state.region.length,previous=(i+n-1)%n,next=(i+1)%n;
      const p=G.project(c.inverse,state.region[previous]),q=G.project(c.inverse,state.region[next]),base=G.distance(p,q),active=state.rightAngleActive==='previous'?previousInput:nextInput,other=state.rightAngleActive==='previous'?nextInput:previousInput,length=Number(active.value),maximum=Math.max(.1,base-.1);
      active.min='.1';active.max=maximum.toFixed(1);
      if(!Number.isFinite(length)||length<=0||length>=base){const message=`For a 90° corner, the editable line must be greater than 0″ and less than the ${base.toFixed(1)}″ spacing between the fixed neighboring dots. Valid input: 0.1–${maximum.toFixed(1)}″.`;active.setCustomValidity(message);active.setAttribute('aria-invalid','true');$('pointEditorStatus').textContent=message;return false;}
      other.value=Math.sqrt(base**2-length**2).toFixed(1);$('pointEditorStatus').textContent=`90° locked. The other line is calculated as ${other.value}″ from the ${base.toFixed(1)}″ neighbor spacing.`;return true;
    }catch(e){$('pointEditorStatus').textContent=e.message;return false;}
  }
  if(!Number.isFinite(previousLength)||previousLength<=0||!Number.isFinite(nextLength)||nextLength<=0){const message='Both lengths must be positive numbers greater than 0 inches.';if(!(previousLength>0)){previousInput.setCustomValidity(message);previousInput.setAttribute('aria-invalid','true');}if(!(nextLength>0)){nextInput.setCustomValidity(message);nextInput.setAttribute('aria-invalid','true');}$('pointEditorStatus').textContent=message;return false;}
  if(!(dirty.previous&&dirty.next)){$('pointEditorStatus').textContent=dirty.previous||dirty.next?'The edited line will be applied; the other length will recalculate.':'Enter one or both full lengths, then apply.';return true;}
  try{
    const i=state.pointMenuIndex,c=pointEditCalibration(),n=state.region.length,previous=(i+n-1)%n,next=(i+1)%n;
    const p=G.project(c.inverse,state.region[previous]),q=G.project(c.inverse,state.region[next]),base=G.distance(p,q);
    const previousMin=Math.abs(base-nextLength),previousMax=base+nextLength,nextMin=Math.abs(base-previousLength),nextMax=base+previousLength;
    const previousValid=previousLength+1e-6>=previousMin&&previousLength<=previousMax+1e-6,nextValid=nextLength+1e-6>=nextMin&&nextLength<=nextMax+1e-6;
    previousInput.min=Math.max(.1,previousMin).toFixed(1);previousInput.max=previousMax.toFixed(1);nextInput.min=Math.max(.1,nextMin).toFixed(1);nextInput.max=nextMax.toFixed(1);
    if(previousValid&&nextValid){$('pointEditorStatus').textContent=`Both lengths are compatible. Neighbor spacing is ${base.toFixed(1)}″.`;return true;}
    const message=`These lengths cannot meet. With the other value entered, the first line must be ${previousMin.toFixed(1)}–${previousMax.toFixed(1)}″ and the second must be ${nextMin.toFixed(1)}–${nextMax.toFixed(1)}″.`;
    if(!previousValid){previousInput.setCustomValidity(message);previousInput.setAttribute('aria-invalid','true');}if(!nextValid){nextInput.setCustomValidity(message);nextInput.setAttribute('aria-invalid','true');}$('pointEditorStatus').textContent=message;return false;
  }catch(e){$('pointEditorStatus').textContent=e.message;return false;}
}
function activateRightAngleField(which){
  state.rightAngleActive=which;const previous=$('previousEdgeLength'),next=$('nextEdgeLength');previous.readOnly=which!=='previous';next.readOnly=which!=='next';
  state.pointLengthDirty={previous:which==='previous',next:which==='next'};validatePointLengths();
}
function chooseRightAngleField(){
  try{
    const i=state.pointMenuIndex,c=pointEditCalibration(),n=state.region.length,previous=(i+n-1)%n,next=(i+1)%n;
    const p=G.project(c.inverse,state.region[previous]),q=G.project(c.inverse,state.region[next]),base=G.distance(p,q),previousLength=Number($('previousEdgeLength').value),nextLength=Number($('nextEdgeLength').value);
    if(previousLength>0&&previousLength<base)return 'previous';
    if(nextLength>0&&nextLength<base)return 'next';
    const choice=previousLength<=nextLength?'previous':'next',input=choice==='previous'?$('previousEdgeLength'):$('nextEdgeLength');input.value=(base/Math.SQRT2).toFixed(1);return choice;
  }catch(e){$('pointEditorStatus').textContent=e.message;return 'previous';}
}
function grid(c){
  const xs=c.plane.map(p=>p[0]),ys=c.plane.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),step=Number($('spacing').value);
  if((maxX-minX+maxY-minY)/step>4000)throw Error('Too many grid lines. Select 6 or 12 inches, or reduce the traced region.');
  const defs=svg('defs'),clip=svg('clipPath',{id:'ceilingClip'},defs);svg('polygon',{points:pointString(state.region)},clip);
  const group=svg('g',{'clip-path':'url(#ceilingClip)','pointer-events':'none'});
  // Intersect in physical coordinates before projection. A bounding box can cross
  // the projective horizon even when the selected polygon itself does not.
  function segments(axis,value){
    const hits=[];const other=1-axis;
    c.plane.forEach((a,i)=>{const b=c.plane[(i+1)%c.plane.length];if((a[axis]<=value&&b[axis]>value)||(b[axis]<=value&&a[axis]>value)){const t=(value-a[axis])/(b[axis]-a[axis]);hits.push(a[other]+t*(b[other]-a[other]));}});
    hits.sort((a,b)=>a-b);const result=[];
    for(let i=0;i+1<hits.length;i+=2)result.push(axis===0?[[value,hits[i]],[value,hits[i+1]]]:[[hits[i],value],[hits[i+1],value]]);
    return result;
  }
  for(let axis=0;axis<2;axis++){
    const lo=axis===0?minX:minY,hi=axis===0?maxX:maxY;
    for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step){const major=v%12===0;
      for(const [a,b] of segments(axis,v)){const p=G.project(c.forward,a),q=G.project(c.forward,b);line(p,q,major?'#c7f36a':'#c7f36a88',major?1.3:.55,group);
        if(major&&G.distance(p,q)>24){const anchor=[p[0]*.9+q[0]*.1,p[1]*.9+q[1]*.1];label(anchor,`${axis===0?'X':'Y'} ${v}″`,'#ecffda',group);}
      }
    }
  }
  $('gridValue').textContent=`${step}″`;$('gridNote').textContent='Labels every 12 inches · origin A';
}
function render(){
  if(!state.image)return;
  const scene=$('scene');scene.replaceChildren();if(!state.viewBox)fitStageToPoints();scene.setAttribute('viewBox',state.viewBox.join(' '));scene.style.width=`${Number($('zoom').value)*100}%`;
  svg('image',{href:state.image.src,x:0,y:0,width:state.image.width,height:state.image.height});resetReadings();
  try{
    const c=validCalibration();
    if(c){if(viewMode()==='grid')grid(c);else{$('gridValue').textContent='Off';$('gridNote').textContent='Choose Grid view';}state.calibration=c;$('area').textContent=`≈ ${(G.area(c.plane)/144).toFixed(1)}`;$('status').textContent=state.outlineDimensions?'Entered dimensions · estimated':boardMode()?'2-inch scale · estimated':'Calibrated · estimated';$('status').classList.add('calibrated');
      c.plane.forEach((p,i)=>{const e=document.createElement('span');e.textContent=`Edge ${i+1}: ≈ ${G.distance(p,c.plane[(i+1)%c.plane.length]).toFixed(1)}″`;$('edges').append(e);});
      if(state.segment.length===2){const [a,b]=state.segment.map(p=>G.project(c.inverse,p)),d=G.distance(a,b);$('distance').textContent=`≈ ${d.toFixed(1)}″`;label(state.segment[1],`≈ ${d.toFixed(1)}″`,'#89e2ff');const expected=Number($('checkLength').value);if(expected>0)$('checkResult').textContent=`Check difference: ${(d-expected).toFixed(1)}″ (${(Math.abs(d-expected)/expected*100).toFixed(1)}%). This checks one segment, not overall accuracy.`;}
    }
  }catch(e){$('error').textContent=e.message;state.calibration=null;}
  drawDrywall(viewMode()==='sheets'?state.calibration:null,viewMode(),fullPerimeterVisible());
  const showGuides=viewMode()==='grid'||['reference','boards','measure'].includes(state.mode)||!state.calibration;
  if(state.region.length>=3&&viewMode()!=='photo')svg('polygon',{points:pointString(state.region),fill:'#c7f36a08',stroke:'#c7f36a','stroke-width':1.5,'vector-effect':'non-scaling-stroke'});
  if(state.calibration&&viewMode()!=='photo'&&showGuides)state.region.forEach((p,i)=>{const q=state.region[(i+1)%state.region.length],a=G.project(state.calibration.inverse,p),b=G.project(state.calibration.inverse,q),mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],tag=label(mid,`${G.distance(a,b).toFixed(1)}″`,'#c7f36a');tag.setAttribute('text-anchor','middle');tag.setAttribute('data-edge-length',String(i));});
  if(state.reference.length>1&&viewMode()!=='photo'&&showGuides)svg('polyline',{points:pointString(state.reference.length===4?[...state.reference,state.reference[0]]:state.reference),fill:'none',stroke:'#ffce66','stroke-width':2,'vector-effect':'non-scaling-stroke'});
  if(state.segment.length===2&&showGuides)line(...state.segment,'#80dcff',2);
  if(boardMode()&&viewMode()!=='photo'&&showGuides)for(let i=0;i+1<state.widths.length;i+=2){line(state.widths[i],state.widths[i+1],'#ff8fdf',3);const p=state.widths[i+1];label([p[0]+(i===0?-45:15),p[1]+(i===0?-12:25)],`W${i/2+1}: 2″`,'#ff8fdf');}
  if(viewMode()!=='photo')state.region.forEach((p,i)=>{svg('circle',{cx:p[0],cy:p[1],r:Math.max(6,state.image.width/70),fill:'#c7f36a',stroke:'#202820','stroke-width':2,class:'point','data-key':'region','data-index':i,tabindex:0,role:'button','aria-label':`region point ${i+1}. Arrow keys move; Shift moves ten pixels.`});label(p,String(i+1),'#c7f36a');});
  if(viewMode()!=='photo'&&showGuides)for(const [key,color] of [['reference','#ffce66'],['segment','#80dcff'],...(boardMode()?[['widths','#ff8fdf']]:[])])state[key].forEach((p,i)=>{
    const name=key==='reference'?'ABCD'[i]:key==='region'?String(i+1):key==='widths'?['W1a','W1b','W2a','W2b'][i]:['P','Q'][i];
    svg('circle',{cx:p[0],cy:p[1],r:key==='widths'?Math.max(3,state.image.width/140):Math.max(6,state.image.width/70),fill:color,stroke:'#202820','stroke-width':2,class:'point','data-key':key,'data-index':i,tabindex:0,role:'button','aria-label':`${key} point ${name}. Arrow keys move; Shift moves ten pixels.`});if(key!=='widths')label(p,name,color);
  });
  renderCornerLineInputs(state.calibration);
  $('referenceInfo').textContent='4 ceiling corners · drag or enter lengths';
  $('presetNoCuts').classList.toggle('active',state.sizePreset==='no-cuts');$('presetTwoCuts').classList.toggle('active',state.sizePreset==='two-cuts');
  $('boardControls').hidden=true;$('rectangleControls').hidden=true;
  const messages={edit:state.calibration?'Ready — adjust handles if needed.':'Calibrate the ceiling to place sheets.',corners:'Drag green corners or edit a line length. Opposite sides stay equal.',boards:state.widths.length===4?'Purple width dots are ready — drag them, then choose Adjust.':`Board ${state.widths.length<2?'1':'2'}: mark the ${state.widths.length%2?'other':'first'} edge.${state.widths.length>=2?' Use a different direction.':''}`,reference:state.reference.length===4?'Drag any corner, including beyond the photo. Choose Adjust when finished.':`Mark corner ${'ABCD'[state.reference.length]||'A'} · follow the rectangle perimeter.`,boundary:`${state.region.length} outline points · continue, then Finish.`,measure:`Mark ${state.segment.length?'the second':'the first'} point.`};
  $('instruction').textContent=messages[state.mode];$('modeLabel').textContent=state.mode.toUpperCase();
  requestAnimationFrame(positionPointMenu);
}
async function loadPhoto(url,name,region=[],starter=null,confidentExtraCorners=false){
  const version=++state.version;const img=new Image();img.onload=()=>{if(version!==state.version)return;state.image=img;state.reference=[];state.widths=[];state.starter=false;state.segment=[];const suggested=region.length?region:[[.08,.08],[.92,.08],[.92,.48],[.08,.48]];state.region=conservativeCorners(suggested,confidentExtraCorners).map(([x,y])=>[x*img.width,y*img.height]);state.manualCalibration=null;state.outlineDimensions=null;state.sizePreset=null;state.layoutOrientation=null;state.mode='corners';state.drag=null;state.viewBox=null;fitStageToPoints();selectView('sheets');$('refWidth').value=$('refDepth').value=$('checkLength').value='';$('confirmed').checked=false;$('zoom').value='1';$('photoTitle').textContent=name;lockHorizontalEdges();render();};img.onerror=()=>{if(version===state.version)$('error').textContent='Could not load this image. Try a JPEG, PNG, or WebP file.';};img.src=url;
}
samples.forEach(s=>{const b=document.createElement('button'),img=document.createElement('img');img.src=s.url;img.alt='';b.append(img,document.createTextNode(s.name));b.onclick=()=>loadPhoto(s.url,s.name,s.region,s.starter,s.confidentExtraCorners);$('samples').append(b);});
$('photo').onchange=()=>{const f=$('photo').files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>loadPhoto(reader.result,f.name);reader.onerror=()=>$('error').textContent='Could not read photo.';reader.readAsDataURL(f);};
for(const id of ['refWidth','refDepth','confirmed','spacing','zoom','checkLength'])$(id).addEventListener('input',()=>{if(['refWidth','refDepth'].includes(id))$('confirmed').checked=false;render();});
$('sheetSize').addEventListener('change',()=>{state.layoutOrientation=null;render();});
document.querySelectorAll('input[name="cutMeasure"]').forEach(radio=>radio.addEventListener('change',render));
function applySizePreset(id,width,depth){
  $('sheetSize').value='48x96';selectView('sheets');state.segment=[];state.mode='corners';state.pointMenuIndex=null;state.layoutOrientation='rows';$('pointMenu').hidden=true;
  let c=null;try{c=pointEditCalibration();}catch(e){try{c=validCalibration();}catch(error){}}
  if(c)setRectangleDimensions(c,width,depth,id);else{state.outlineDimensions={width,depth};state.sizePreset=id;fitStageToPoints();render();}
}
$('presetNoCuts').onclick=()=>applySizePreset('no-cuts',288,96);
$('presetTwoCuts').onclick=()=>applySizePreset('two-cuts',144,96);
document.querySelectorAll('input[name="viewMode"]').forEach(radio=>radio.addEventListener('change',render));
$('calculatePoint').onclick=()=>{
  const i=state.pointMenuIndex,n=state.region.length;if(i===null)return;let c=null,calibrationError='';try{c=pointEditCalibration();}catch(e){calibrationError=e.message;}
  const previous=(i+n-1)%n,next=(i+1)%n;
  $('previousEdgeLength').min=$('nextEdgeLength').min='.1';$('previousEdgeLength').max=$('nextEdgeLength').max='10000';$('previousEdgeLength').setCustomValidity('');$('nextEdgeLength').setCustomValidity('');
  $('rightAngleOnly').checked=true;$('previousEdgeLength').readOnly=$('nextEdgeLength').readOnly=false;state.rightAngleActive='previous';
  $('previousEdgeLabel').firstChild.textContent=`Point ${i+1} to ${previous+1} (inches)`;$('nextEdgeLabel').firstChild.textContent=`Point ${i+1} to ${next+1} (inches)`;
  $('applyPointLengths').disabled=false;
  if(c){const anchor=G.project(c.inverse,state.region[i]);$('previousEdgeLength').value=G.distance(anchor,G.project(c.inverse,state.region[previous])).toFixed(1);$('nextEdgeLength').value=G.distance(anchor,G.project(c.inverse,state.region[next])).toFixed(1);$('pointEditorStatus').textContent='Enter both full lengths, then apply.';}
  else{$('previousEdgeLength').value=$('nextEdgeLength').value='';$('pointEditorStatus').textContent=calibrationError;}
  state.pointLengthDirty={previous:false,next:false};if(c)activateRightAngleField(chooseRightAngleField());
  $('pointActions').hidden=true;$('pointEditor').hidden=false;$('previousEdgeLength').focus();$('previousEdgeLength').select();requestAnimationFrame(positionPointMenu);
};
$('rightAngleOnly').addEventListener('change',()=>{if($('rightAngleOnly').checked)activateRightAngleField(chooseRightAngleField());else{$('previousEdgeLength').readOnly=$('nextEdgeLength').readOnly=false;state.pointLengthDirty={previous:false,next:false};validatePointLengths();}});
$('previousEdgeLength').addEventListener('click',()=>{if($('rightAngleOnly').checked&&state.rightAngleActive!=='previous'){activateRightAngleField('previous');$('previousEdgeLength').select();}});$('nextEdgeLength').addEventListener('click',()=>{if($('rightAngleOnly').checked&&state.rightAngleActive!=='next'){activateRightAngleField('next');$('nextEdgeLength').select();}});
$('previousEdgeLength').addEventListener('input',()=>{state.pointLengthDirty.previous=true;if($('rightAngleOnly').checked)state.pointLengthDirty.next=false;validatePointLengths();});$('nextEdgeLength').addEventListener('input',()=>{state.pointLengthDirty.next=true;if($('rightAngleOnly').checked)state.pointLengthDirty.previous=false;validatePointLengths();});
$('cancelPointLengths').onclick=()=>{$('pointEditor').hidden=true;$('pointActions').hidden=false;requestAnimationFrame(positionPointMenu);};
$('applyPointLengths').onclick=()=>{
  try{
    const i=state.pointMenuIndex,c=pointEditCalibration(),n=state.region.length;if(i===null)throw Error('Select a ceiling point first.');
    const previous=(i+n-1)%n,next=(i+1)%n,dirty=state.pointLengthDirty;let previousLength=Number($('previousEdgeLength').value),nextLength=Number($('nextEdgeLength').value);
    if(!validatePointLengths()){($('previousEdgeLength').validationMessage?$('previousEdgeLength'):$('nextEdgeLength')).reportValidity();return;}
    if($('rightAngleOnly').checked&&n===4){const m=rectangleMetrics(c),edge=state.rightAngleActive==='previous'?previous:i,length=state.rightAngleActive==='previous'?previousLength:nextLength;setRectangleDimensions(c,edge%2===0?length:m.width,edge%2===1?length:m.depth);const fresh=pointEditCalibration(),anchor=G.project(fresh.inverse,state.region[i]);$('previousEdgeLength').value=G.distance(anchor,G.project(fresh.inverse,state.region[previous])).toFixed(1);$('nextEdgeLength').value=G.distance(anchor,G.project(fresh.inverse,state.region[next])).toFixed(1);state.pointLengthDirty={previous:false,next:false};$('pointEditorStatus').textContent='Edited side and its opposite now match; all corners remain 90°.';return;}
    if($('rightAngleOnly').checked){const p=G.project(c.inverse,state.region[previous]),q=G.project(c.inverse,state.region[next]),base=G.distance(p,q);if(state.rightAngleActive==='previous')nextLength=Math.sqrt(base**2-previousLength**2);else previousLength=Math.sqrt(base**2-nextLength**2);state.region[i]=G.solvePointFromLengths(c.inverse,c.forward,state.region[i],state.region[previous],state.region[next],previousLength,nextLength);}
    else if(dirty.previous&&!dirty.next)state.region[i]=G.extendPoint(c.inverse,c.forward,state.region[previous],state.region[i],previousLength);
    else if(dirty.next&&!dirty.previous)state.region[i]=G.extendPoint(c.inverse,c.forward,state.region[next],state.region[i],nextLength);
    else state.region[i]=G.solvePointFromLengths(c.inverse,c.forward,state.region[i],state.region[previous],state.region[next],previousLength,nextLength);
    fitStageToPoints();render();
    const anchor=G.project(c.inverse,state.region[i]);$('previousEdgeLength').value=G.distance(anchor,G.project(c.inverse,state.region[previous])).toFixed(1);$('nextEdgeLength').value=G.distance(anchor,G.project(c.inverse,state.region[next])).toFixed(1);state.pointLengthDirty={previous:false,next:false};
    $('pointEditorStatus').textContent='Selected point moved; every other point stayed fixed.';
  }catch(e){$('pointEditorStatus').textContent=e.message;}
};
$('addPoint').onclick=()=>{
  const i=state.pointMenuIndex;if(i===null)return;let existingCalibration=null;try{existingCalibration=pointEditCalibration();}catch(e){}if(!existingCalibration&&state.region.length===4){const guesses=guessedEdgeLengths();state.outlineDimensions={width:(guesses[0]+guesses[2])/2,depth:(guesses[1]+guesses[3])/2};existingCalibration=pointEditCalibration();}const [x,y]=state.region[i],step=Math.max(24,Math.min(state.image.width,state.image.height)*.08),rightRoom=state.image.width-x,belowRoom=state.image.height-y,directions=rightRoom>=step||rightRoom>=belowRoom?[[1,0],[0,1]]:[[0,1],[1,0]];let point=null,insertionIndex=i+1;
  findPoint:for(const factor of [1,.5,.25,.125])for(const [dx,dy] of directions)for(const at of [i+1,i]){const candidate=[x+step*factor*dx,y+step*factor*dy],outline=state.region.map(p=>[...p]);outline.splice(at,0,candidate);if(G.simple(outline)){point=candidate;insertionIndex=at;break findPoint;}}if(!point){$('error').textContent='There is not enough clear space to add a dot to the right or below this point.';return;}
  state.outlineDimensions=null;state.layoutOrientation=null;if(existingCalibration)state.manualCalibration={forward:existingCalibration.forward,inverse:existingCalibration.inverse};state.region.splice(insertionIndex,0,point);snapNearHorizontalEdges(insertionIndex,point[1]);state.pointMenuIndex=insertionIndex;if(existingCalibration){const n=state.region.length,a=G.project(existingCalibration.inverse,state.region[insertionIndex]),b=G.project(existingCalibration.inverse,state.region[(insertionIndex+1)%n]);balanceOrthogonalOutline(existingCalibration,insertionIndex,G.distance(a,b));}else{fitStageToPoints();render();}requestAnimationFrame(positionPointMenu);
};
function openAllPointsEditor(message='Each field is one ceiling-outline line in inches.'){
  const list=$('allPointsList');list.replaceChildren();let c=null;try{c=pointEditCalibration();}catch(e){}
  state.region.forEach((point,i)=>{const next=(i+1)%state.region.length,row=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input');row.className='all-point-row';label.textContent=`Line ${i+1}: Point ${i+1} → ${next+1} (in)`;input.type='number';input.min='.1';input.step='any';input.placeholder='Enter inches';if(c){const a=G.project(c.inverse,point),b=G.project(c.inverse,state.region[next]);input.value=G.distance(a,b).toFixed(1);}input.dataset.index=String(i);input.addEventListener('input',()=>{input.dataset.dirty='true';input.setCustomValidity('');input.removeAttribute('aria-invalid');const value=Number(input.value);if(state.region.length===4&&value>0){const opposite=list.querySelector(`input[data-index="${(i+2)%4}"]`);if(opposite){opposite.value=value.toFixed(1);opposite.dataset.calculated='true';}}const complete=[...list.querySelectorAll('input')].every(field=>Number(field.value)>0);$('allPointsStatus').textContent=complete?`Opposite line ${(i+2)%4+1} matched. Apply to reshape the green rectangle.`:value>0?`Opposite line ${(i+2)%4+1} matched. Enter one adjacent line.`:'Enter a positive length in inches.';});label.append(input);row.append(label);list.append(row);});
  $('allPointsStatus').textContent=c?message:state.region.length===4?'Enter one line and one adjacent line; opposite sides calculate automatically.':'Enter known lengths after adding scale marks.';$('pointActions').hidden=true;$('pointEditor').hidden=true;$('allPointsEditor').hidden=false;requestAnimationFrame(positionPointMenu);
}
$('changeAllPoints').onclick=openAllPointsEditor;
$('cancelAllPoints').onclick=()=>{$('allPointsEditor').hidden=true;$('pointActions').hidden=false;requestAnimationFrame(positionPointMenu);};
$('applyAllPoints').onclick=()=>{
  try{
    let c=null;try{c=pointEditCalibration();}catch(e){}const values=[...$('allPointsList').querySelectorAll('input')].map(input=>Number(input.value));if(state.region.length===4){if(values.some(value=>!Number.isFinite(value)||value<=0)){$('allPointsStatus').textContent='Enter one line and one adjacent line; opposite sides calculate automatically.';return;}const width=(values[0]+values[2])/2,depth=(values[1]+values[3])/2;if(c)setRectangleDimensions(c,width,depth);else{state.outlineDimensions={width,depth};c=pointEditCalibration();render();}openAllPointsEditor('Dimensions applied. Opposite sides match and every corner is 90°.');return;}if(!c){$('allPointsStatus').textContent='Add scale marks before applying this outline.';return;}const next=state.region.map(p=>[...p]),changed=new Set();
    for(const input of $('allPointsList').querySelectorAll('input[data-dirty="true"]')){const value=Number(input.value),i=Number(input.dataset.index),target=(i+1)%next.length,following=(i+2)%next.length,anchorPlane=G.project(c.inverse,next[i]),followingPlane=G.project(c.inverse,next[following]),base=G.distance(anchorPlane,followingPlane);if(input.value.trim()===''||!Number.isFinite(value)||value<=0||value>=base){const message=`Line ${i+1} must be greater than 0″ and less than ${base.toFixed(1)}″ to keep the next corner at 90°.`;input.setCustomValidity(message);input.setAttribute('aria-invalid','true');input.reportValidity();throw Error(message);}const other=Math.sqrt(base**2-value**2);next[target]=G.solvePointFromLengths(c.inverse,c.forward,next[target],next[i],next[following],value,other);changed.add(target);}
    if(!changed.size){$('allPointsStatus').textContent='Change at least one line first.';return;}if(!G.simple(next))throw Error('Those lengths make the ceiling outline cross itself. Change one or more lines.');
    state.region=next;fitStageToPoints();render();openAllPointsEditor(`Moved ${changed.size} ending point${changed.size===1?'':'s'}; all other points stayed fixed.`);
  }catch(e){$('allPointsStatus').textContent=e.message;}
};
$('removePoint').onclick=()=>{const i=state.pointMenuIndex;if(i===null)return;if(state.region.length<=3){$('error').textContent='A ceiling outline needs at least three points.';return;}state.outlineDimensions=null;state.region.splice(i,1);state.pointMenuIndex=null;fitStageToPoints();render();};
function eventPoint(e,clamp=true){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('scene').getScreenCTM().inverse());return clamp?[Math.max(0,Math.min(state.image.width,p.x)),Math.max(0,Math.min(state.image.height,p.y))]:[p.x,p.y];}
$('scene').addEventListener('pointerdown',e=>{
  if(!state.image)return;const p=eventPoint(e),key=e.target.getAttribute('data-key');
  if(key&&['edit','corners','reference','boundary','boards'].includes(state.mode)){const index=Number(e.target.getAttribute('data-index'));state.pointMenuIndex=key==='region'?index:null;$('pointMenu').hidden=true;$('pointEditor').hidden=true;$('allPointsEditor').hidden=true;$('pointActions').hidden=false;state.drag={key,index};$('scene').setPointerCapture(e.pointerId);return;}
  state.pointMenuIndex=null;$('pointMenu').hidden=true;
  if(state.mode==='reference'&&state.reference.length<4)state.reference.push(p);
  else if(state.mode==='boundary')state.region.push(p);
  else if(state.mode==='boards'&&state.widths.length<4)state.widths.push(p);
  else if(state.mode==='measure'&&state.calibration){if(!inside(p,state.region)){$('error').textContent='Choose a point inside the traced ceiling region.';return;}state.segment.push(p);if(state.segment.length===2)state.mode='edit';}
  render();
});
$('scene').addEventListener('pointermove',e=>{if(!state.drag)return;const mayLeave=state.drag.key==='region'||state.drag.key==='reference',p=eventPoint(e,!mayLeave);if(state.drag.key==='segment'&&!inside(p,state.region))return;state[state.drag.key][state.drag.index]=p;if(state.drag.key==='region'){snapNearHorizontalEdges(state.drag.index,p[1]);if(state.region.length>4){try{const c=pointEditCalibration(),i=state.drag.index,q=(i+1)%state.region.length,a=G.project(c.inverse,state.region[i]),b=G.project(c.inverse,state.region[q]);balanceOrthogonalOutline(c,i,G.distance(a,b),false);}catch(error){$('error').textContent=error.message;}}}render();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(type,()=>{if(state.drag){state.drag=null;fitStageToPoints();render();}});
$('scene').addEventListener('keydown',e=>{const key=e.target.getAttribute('data-key'),index=Number(e.target.getAttribute('data-index')),moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!key||!moves[e.key])return;e.preventDefault();const old=state[key][index],m=moves[e.key],step=e.shiftKey?10:1,raw=[old[0]+m[0]*step,old[1]+m[1]*step],mayLeave=key==='region'||key==='reference',p=mayLeave?raw:[Math.max(0,Math.min(state.image.width,raw[0])),Math.max(0,Math.min(state.image.height,raw[1]))];if(key==='segment'&&!inside(p,state.region))return;state[key][index]=p;if(key==='region'){snapNearHorizontalEdges(index,p[1]);if(state.region.length>4){try{const c=pointEditCalibration(),q=(index+1)%state.region.length,a=G.project(c.inverse,state.region[index]),b=G.project(c.inverse,state.region[q]);balanceOrthogonalOutline(c,index,G.distance(a,b),false);}catch(error){$('error').textContent=error.message;}}}render();const moved=$('scene').querySelector(`[data-key="${key}"][data-index="${index}"]`);if(moved)moved.focus();});
const exportButton=$('export');if(exportButton)exportButton.onclick=async()=>{
  try{const clone=$('scene').cloneNode(true),canvas=document.createElement('canvas');canvas.width=state.image.width;canvas.height=state.image.height;const ctx=canvas.getContext('2d');ctx.drawImage(state.image,0,0);clone.querySelector('image').setAttribute('href',canvas.toDataURL('image/png'));clone.setAttribute('width',canvas.width);clone.setAttribute('height',canvas.height);clone.removeAttribute('style');const text=document.createElementNS(NS,'text');text.setAttribute('x',10);text.setAttribute('y',canvas.height-16);text.setAttribute('font-size',12);text.setAttribute('fill','white');text.setAttribute('stroke','#162016');text.setAttribute('paint-order','stroke');text.setAttribute('stroke-width',3);text.textContent=state.calibration?`${boardMode()?'ASSUMED 2-INCH BOARD WIDTHS':`Reference ${$('refWidth').value} × ${$('refDepth').value} in`} | grid ${$('spacing').value} in | Estimates; accuracy not verified`:'UNCALIBRATED — NO INCH SCALE';clone.append(text);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download='ceiling-measurement.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('error').textContent=`Export failed: ${e.message}`;}
};
loadPhoto(samples[3].url,samples[3].name,samples[3].region,samples[3].starter,samples[3].confidentExtraCorners);
