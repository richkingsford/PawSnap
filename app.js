'use strict';
const $=id=>document.getElementById(id), G=Geometry, NS='http://www.w3.org/2000/svg';
const samples=[
  {name:'Open joists',url:'samples/framing-room.jpg',region:[[0,.21],[1,.21],[1,.42],[.72,.49],[0,.49]]},
  {name:'Long room',url:'samples/framing-wide.jpg',region:[[0,0],[1,0],[.85,.475],[.46,.475],[0,.39]]},
  {name:'Basement ducts',url:'samples/basement-ducts.png',region:[[0,0],[1,0],[1,.57],[0,.46]]},
  {name:'Ceiling battens',url:'samples/ceiling-battens.png',region:[[0,0],[1,0],[1,.28],[.79,.396],[0,.396]],starter:{reference:[[161,78],[251,78],[240,164],[175,164]],widths:[[165,145],[176,145],[207,160],[207,167]]}},
  {name:'Renovation',url:'samples/ceiling-renovation.png',region:[[0,0],[1,0],[1,.495],[.66,.58],[.09,.59],[0,.55]]}
];
const state={image:null,reference:[],widths:[],region:[],segment:[],mode:'edit',calibration:null,drag:null,pointMenuIndex:null,pointLengthDirty:{previous:false,next:false},viewBox:null,version:0,starter:false};
const boardMode=()=>$('scaleSource').value==='boards';
const viewMode=()=>document.querySelector('input[name="viewMode"]:checked').value;
const selectView=value=>{const radio=document.querySelector(`input[name="viewMode"][value="${value}"]`);if(radio)radio.checked=true;};
const fullPerimeterVisible=()=>state.image&&state.region.length>=3&&!state.region.some(([x,y])=>x<=1||y<=1||x>=state.image.width-1||y>=state.image.height-1);
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
  if(index===null||!circle){menu.hidden=true;return;}
  const dot=circle.getBoundingClientRect(),viewport=document.querySelector('.viewport').getBoundingClientRect();
  menu.hidden=false;const x=dot.left+dot.width/2-viewport.left,y=dot.top+dot.height/2-viewport.top,w=menu.offsetWidth,h=menu.offsetHeight;
  menu.style.left=`${Math.max(6,x+(x+10+w<=viewport.width?10:-w-10))}px`;
  menu.style.top=`${Math.max(6,y+(y+10+h<=viewport.height?10:-h-10))}px`;
}
function validCalibration(){
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
    if(c){if(viewMode()==='grid')grid(c);else{$('gridValue').textContent='Off';$('gridNote').textContent='Choose Grid view';}state.calibration=c;$('area').textContent=`≈ ${(G.area(c.plane)/144).toFixed(1)}`;$('status').textContent=boardMode()?'2-inch scale · estimated':'Calibrated · estimated';$('status').classList.add('calibrated');
      c.plane.forEach((p,i)=>{const e=document.createElement('span');e.textContent=`Edge ${i+1}: ≈ ${G.distance(p,c.plane[(i+1)%c.plane.length]).toFixed(1)}″`;$('edges').append(e);});
      if(state.segment.length===2){const [a,b]=state.segment.map(p=>G.project(c.inverse,p)),d=G.distance(a,b);$('distance').textContent=`≈ ${d.toFixed(1)}″`;label(state.segment[1],`≈ ${d.toFixed(1)}″`,'#89e2ff');const expected=Number($('checkLength').value);if(expected>0)$('checkResult').textContent=`Check difference: ${(d-expected).toFixed(1)}″ (${(Math.abs(d-expected)/expected*100).toFixed(1)}%). This checks one segment, not overall accuracy.`;}
    }
  }catch(e){$('error').textContent=e.message;state.calibration=null;}
  drawDrywall(viewMode()==='sheets'?state.calibration:null,viewMode(),fullPerimeterVisible());
  const showGuides=viewMode()==='grid'||state.mode!=='edit'||!state.calibration;
  if(state.region.length>=3&&viewMode()!=='photo'&&showGuides)svg('polygon',{points:pointString(state.region),fill:'#c7f36a12',stroke:'#c7f36a','stroke-width':1.5,'vector-effect':'non-scaling-stroke'});
  if(state.calibration&&viewMode()!=='photo'&&showGuides)state.region.forEach((p,i)=>{const q=state.region[(i+1)%state.region.length],a=G.project(state.calibration.inverse,p),b=G.project(state.calibration.inverse,q),mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],tag=label(mid,`${G.distance(a,b).toFixed(1)}″`,'#c7f36a');tag.setAttribute('text-anchor','middle');tag.setAttribute('data-edge-length',String(i));});
  if(state.reference.length>1&&viewMode()!=='photo'&&showGuides)svg('polyline',{points:pointString(state.reference.length===4?[...state.reference,state.reference[0]]:state.reference),fill:'none',stroke:'#ffce66','stroke-width':2,'vector-effect':'non-scaling-stroke'});
  if(state.segment.length===2&&showGuides)line(...state.segment,'#80dcff',2);
  if(boardMode()&&viewMode()!=='photo'&&showGuides)for(let i=0;i+1<state.widths.length;i+=2){line(state.widths[i],state.widths[i+1],'#ff8fdf',3);const p=state.widths[i+1];label([p[0]+(i===0?-45:15),p[1]+(i===0?-12:25)],`W${i/2+1}: 2″`,'#ff8fdf');}
  if(viewMode()!=='photo'&&showGuides)for(const [key,color] of [['region','#c7f36a'],['reference','#ffce66'],['segment','#80dcff'],...(boardMode()?[['widths','#ff8fdf']]:[])])state[key].forEach((p,i)=>{
    const name=key==='reference'?'ABCD'[i]:key==='region'?String(i+1):key==='widths'?['W1a','W1b','W2a','W2b'][i]:['P','Q'][i];
    svg('circle',{cx:p[0],cy:p[1],r:key==='widths'?Math.max(3,state.image.width/140):Math.max(6,state.image.width/70),fill:color,stroke:'#202820','stroke-width':2,class:'point','data-key':key,'data-index':i,tabindex:0,role:'button','aria-label':`${key} point ${name}. Arrow keys move; Shift moves ten pixels.`});if(key!=='widths')label(p,name,color);
  });
  $('referenceInfo').textContent=state.reference.length===4?'4/4 corners · drag to adjust':`${state.reference.length}/4 corners`;
  $('boardControls').hidden=!boardMode();$('boards').hidden=!boardMode();$('rectangleControls').hidden=boardMode();
  $('boardInfo').textContent=`${state.widths.length}/4 width points${state.starter?' · starter marks — adjust as needed':''}`;
  const messages={edit:state.calibration?'Ready — adjust handles if needed.':'Calibrate the ceiling to place sheets.',boards:state.widths.length===4?'Purple width dots are ready — drag them, then choose Adjust.':`Board ${state.widths.length<2?'1':'2'}: mark the ${state.widths.length%2?'other':'first'} edge.${state.widths.length>=2?' Use a different direction.':''}`,reference:state.reference.length===4?'Drag any corner, including beyond the photo. Choose Adjust when finished.':`Mark corner ${'ABCD'[state.reference.length]||'A'} · follow the rectangle perimeter.`,boundary:`${state.region.length} outline points · continue, then Finish.`,measure:`Mark ${state.segment.length?'the second':'the first'} point.`};
  $('instruction').textContent=messages[state.mode];$('modeLabel').textContent=state.mode.toUpperCase();
  $('measure').disabled=!state.calibration;$('finish').disabled=state.mode!=='boundary'||state.region.length<3;$('undo').disabled=!['boundary','reference','measure','boards'].includes(state.mode);
  ['reference','boundary','measure','edit','boards'].forEach(id=>$(id).classList.toggle('active',state.mode===id));
  requestAnimationFrame(positionPointMenu);
}
async function loadPhoto(url,name,region=[],starter=null){
  const version=++state.version;const img=new Image();img.onload=()=>{if(version!==state.version)return;state.image=img;state.reference=starter?starter.reference.map(p=>[...p]):[];state.widths=starter?starter.widths.map(p=>[...p]):[];state.starter=Boolean(starter);state.segment=[];state.region=region.map(([x,y])=>[x*img.width,y*img.height]);state.mode='edit';state.drag=null;state.viewBox=null;fitStageToPoints();selectView('sheets');$('refWidth').value=$('refDepth').value=$('checkLength').value='';$('confirmed').checked=false;$('zoom').value='1';$('photoTitle').textContent=name;render();};img.onerror=()=>{if(version===state.version)$('error').textContent='Could not load this image. Try a JPEG, PNG, or WebP file.';};img.src=url;
}
samples.forEach(s=>{const b=document.createElement('button'),img=document.createElement('img');img.src=s.url;img.alt='';b.append(img,document.createTextNode(s.name));b.onclick=()=>loadPhoto(s.url,s.name,s.region,s.starter);$('samples').append(b);});
$('photo').onchange=()=>{const f=$('photo').files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>loadPhoto(reader.result,f.name);reader.onerror=()=>$('error').textContent='Could not read photo.';reader.readAsDataURL(f);};
for(const id of ['refWidth','refDepth','confirmed','spacing','zoom','checkLength'])$(id).addEventListener('input',()=>{if(['refWidth','refDepth'].includes(id))$('confirmed').checked=false;render();});
$('sheetSize').addEventListener('change',render);
document.querySelectorAll('input[name="viewMode"]').forEach(radio=>radio.addEventListener('change',render));
$('scaleSource').onchange=()=>{state.mode='edit';state.segment=[];render();};
$('boards').onclick=()=>{state.segment=[];state.mode='boards';state.pointMenuIndex=null;render();};
$('reference').onclick=()=>{state.reference=[];state.segment=[];state.mode='reference';$('confirmed').checked=false;render();};
$('boundary').onclick=()=>{state.region=[];state.segment=[];state.mode='boundary';render();};
$('finish').onclick=()=>{if(state.region.length>=3){state.mode='edit';render();}};
$('measure').onclick=()=>{state.segment=[];state.mode='measure';render();};$('edit').onclick=()=>{state.mode='edit';render();};
$('undo').onclick=()=>{const key={boundary:'region',reference:'reference',measure:'segment',boards:'widths'}[state.mode];if(key){state[key].pop();render();}};
$('calculatePoint').onclick=()=>{
  const i=state.pointMenuIndex,c=state.calibration,n=state.region.length;if(i===null)return;
  const previous=(i+n-1)%n,next=(i+1)%n;
  $('previousEdgeLabel').firstChild.textContent=`Point ${i+1} to ${previous+1} (inches)`;$('nextEdgeLabel').firstChild.textContent=`Point ${i+1} to ${next+1} (inches)`;
  $('applyPointLengths').disabled=false;
  if(c){const anchor=G.project(c.inverse,state.region[i]);$('previousEdgeLength').value=G.distance(anchor,G.project(c.inverse,state.region[previous])).toFixed(1);$('nextEdgeLength').value=G.distance(anchor,G.project(c.inverse,state.region[next])).toFixed(1);$('pointEditorStatus').textContent='Enter both full lengths, then apply.';}
  else{$('previousEdgeLength').value=$('nextEdgeLength').value='';$('pointEditorStatus').textContent='You can enter lengths now. Apply will identify any missing calibration step.';}
  state.pointLengthDirty={previous:false,next:false};
  $('pointActions').hidden=true;$('pointEditor').hidden=false;$('previousEdgeLength').focus();$('previousEdgeLength').select();requestAnimationFrame(positionPointMenu);
};
$('previousEdgeLength').addEventListener('input',()=>state.pointLengthDirty.previous=true);$('nextEdgeLength').addEventListener('input',()=>state.pointLengthDirty.next=true);
$('cancelPointLengths').onclick=()=>{$('pointEditor').hidden=true;$('pointActions').hidden=false;requestAnimationFrame(positionPointMenu);};
$('applyPointLengths').onclick=()=>{
  try{
    const i=state.pointMenuIndex,c=state.calibration,n=state.region.length;if(i===null||!c)throw Error('Finish Mark corners and Mark board widths first.');
    const previous=(i+n-1)%n,next=(i+1)%n,previousLength=Number($('previousEdgeLength').value),nextLength=Number($('nextEdgeLength').value),dirty=state.pointLengthDirty;
    if(dirty.previous&&!dirty.next)state.region[i]=G.extendPoint(c.inverse,c.forward,state.region[previous],state.region[i],previousLength);
    else if(dirty.next&&!dirty.previous)state.region[i]=G.extendPoint(c.inverse,c.forward,state.region[next],state.region[i],nextLength);
    else state.region[i]=G.solvePointFromLengths(c.inverse,c.forward,state.region[i],state.region[previous],state.region[next],previousLength,nextLength);
    fitStageToPoints();render();
    const updated=state.calibration,anchor=G.project(updated.inverse,state.region[i]);$('previousEdgeLength').value=G.distance(anchor,G.project(updated.inverse,state.region[previous])).toFixed(1);$('nextEdgeLength').value=G.distance(anchor,G.project(updated.inverse,state.region[next])).toFixed(1);state.pointLengthDirty={previous:false,next:false};
    $('pointEditorStatus').textContent='Selected point moved; every other point stayed fixed.';
  }catch(e){$('pointEditorStatus').textContent=e.message;}
};
$('removePoint').onclick=()=>{const i=state.pointMenuIndex;if(i===null)return;if(state.region.length<=3){$('error').textContent='A ceiling outline needs at least three points.';return;}state.region.splice(i,1);state.pointMenuIndex=null;fitStageToPoints();render();};
function eventPoint(e,clamp=true){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('scene').getScreenCTM().inverse());return clamp?[Math.max(0,Math.min(state.image.width,p.x)),Math.max(0,Math.min(state.image.height,p.y))]:[p.x,p.y];}
$('scene').addEventListener('pointerdown',e=>{
  if(!state.image)return;const p=eventPoint(e),key=e.target.getAttribute('data-key');
  if(key&&['edit','reference','boundary','boards'].includes(state.mode)){const index=Number(e.target.getAttribute('data-index'));state.pointMenuIndex=key==='region'?index:null;$('pointMenu').hidden=true;$('pointEditor').hidden=true;$('pointActions').hidden=false;state.drag={key,index};$('scene').setPointerCapture(e.pointerId);return;}
  state.pointMenuIndex=null;$('pointMenu').hidden=true;
  if(state.mode==='reference'&&state.reference.length<4)state.reference.push(p);
  else if(state.mode==='boundary')state.region.push(p);
  else if(state.mode==='boards'&&state.widths.length<4)state.widths.push(p);
  else if(state.mode==='measure'&&state.calibration){if(!inside(p,state.region)){$('error').textContent='Choose a point inside the traced ceiling region.';return;}state.segment.push(p);if(state.segment.length===2)state.mode='edit';}
  render();
});
$('scene').addEventListener('pointermove',e=>{if(!state.drag)return;const mayLeave=state.drag.key==='region'||state.drag.key==='reference',p=eventPoint(e,!mayLeave);if(state.drag.key==='segment'&&!inside(p,state.region))return;state[state.drag.key][state.drag.index]=p;render();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(type,()=>{if(state.drag){state.drag=null;fitStageToPoints();render();}});
$('scene').addEventListener('keydown',e=>{const key=e.target.getAttribute('data-key'),index=Number(e.target.getAttribute('data-index')),moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!key||!moves[e.key])return;e.preventDefault();const old=state[key][index],m=moves[e.key],step=e.shiftKey?10:1,raw=[old[0]+m[0]*step,old[1]+m[1]*step],mayLeave=key==='region'||key==='reference',p=mayLeave?raw:[Math.max(0,Math.min(state.image.width,raw[0])),Math.max(0,Math.min(state.image.height,raw[1]))];if(key==='segment'&&!inside(p,state.region))return;state[key][index]=p;render();const moved=$('scene').querySelector(`[data-key="${key}"][data-index="${index}"]`);if(moved)moved.focus();});
$('export').onclick=async()=>{
  try{const clone=$('scene').cloneNode(true),canvas=document.createElement('canvas');canvas.width=state.image.width;canvas.height=state.image.height;const ctx=canvas.getContext('2d');ctx.drawImage(state.image,0,0);clone.querySelector('image').setAttribute('href',canvas.toDataURL('image/png'));clone.setAttribute('width',canvas.width);clone.setAttribute('height',canvas.height);clone.removeAttribute('style');const text=document.createElementNS(NS,'text');text.setAttribute('x',10);text.setAttribute('y',canvas.height-16);text.setAttribute('font-size',12);text.setAttribute('fill','white');text.setAttribute('stroke','#162016');text.setAttribute('paint-order','stroke');text.setAttribute('stroke-width',3);text.textContent=state.calibration?`${boardMode()?'ASSUMED 2-INCH BOARD WIDTHS':`Reference ${$('refWidth').value} × ${$('refDepth').value} in`} | grid ${$('spacing').value} in | Estimates; accuracy not verified`:'UNCALIBRATED — NO INCH SCALE';clone.append(text);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download='ceiling-measurement.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('error').textContent=`Export failed: ${e.message}`;}
};
loadPhoto(samples[3].url,samples[3].name,samples[3].region,samples[3].starter);
