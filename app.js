'use strict';
const $=id=>document.getElementById(id), G=Geometry, NS='http://www.w3.org/2000/svg';
const samples=[
  {name:'Open joists',url:'samples/framing-room.jpg',region:[[0,.21],[1,.21],[1,.42],[.72,.49],[0,.49]]},
  {name:'Long room',url:'samples/framing-wide.jpg',region:[[0,0],[1,0],[.85,.475],[.46,.475],[0,.39]]},
  {name:'Basement ducts',url:'samples/basement-ducts.png',region:[[0,0],[1,0],[1,.57],[0,.46]]},
  {name:'Ceiling battens',url:'samples/ceiling-battens.png',region:[[0,0],[1,0],[1,.28],[.79,.396],[0,.396]]},
  {name:'Renovation',url:'samples/ceiling-renovation.png',region:[[0,0],[1,0],[1,.495],[.66,.58],[.09,.59],[0,.55]]}
];
const state={image:null,reference:[],region:[],segment:[],mode:'edit',calibration:null,drag:null,version:0};
function svg(tag,attrs={},parent=$('scene')){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.appendChild(e);return e;}
function line(a,b,color,width=1,parent=$('scene')){return svg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':width,class:'grid-line'},parent);}
function label(p,text,color='#ecffda',parent=$('scene')){const e=svg('text',{x:p[0]+7,y:p[1]-8,fill:color,'font-size':Math.max(11,state.image.width/45),'paint-order':'stroke',stroke:'#182218','stroke-width':3,'stroke-linejoin':'round','font-family':'monospace'},parent);e.textContent=text;return e;}
function pointString(p){return p.map(a=>a.join(',')).join(' ');}
function inside([x,y],polygon){let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [a,b]=polygon[i],[c,d]=polygon[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;}
function resetReadings(){state.calibration=null;$('area').textContent=$('distance').textContent=$('gridValue').textContent='—';$('gridNote').textContent='Requires calibration';$('edges').replaceChildren();$('checkResult').textContent='Use a second known distance to check calibration.';$('status').textContent='Uncalibrated · no inch scale';$('status').classList.remove('calibrated');$('error').textContent='';}
function validCalibration(){
  if(state.reference.length!==4||!$('confirmed').checked||!$('refWidth').value||!$('refDepth').value)return null;
  if(state.mode==='boundary'||state.region.length<3)return null;
  if(!G.simple(state.region))throw Error('Ceiling outline crosses itself or has zero area. Adjust or retrace its points.');
  return G.calibrate(state.reference,Number($('refWidth').value),Number($('refDepth').value),state.region);
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
  const scene=$('scene');scene.replaceChildren();scene.setAttribute('viewBox',`0 0 ${state.image.width} ${state.image.height}`);scene.style.width=`${Number($('zoom').value)*100}%`;
  svg('image',{href:state.image.src,x:0,y:0,width:state.image.width,height:state.image.height});resetReadings();
  if(state.region.length>=3)svg('polygon',{points:pointString(state.region),fill:'#c7f36a12',stroke:'#c7f36a','stroke-width':1.5,'vector-effect':'non-scaling-stroke'});
  try{
    const c=validCalibration();
    if(c){grid(c);state.calibration=c;$('area').textContent=`≈ ${(G.area(c.plane)/144).toFixed(1)}`;$('status').textContent='Reference calibrated · verify with check distance';$('status').classList.add('calibrated');
      c.plane.forEach((p,i)=>{const e=document.createElement('span');e.textContent=`Edge ${i+1}: ≈ ${G.distance(p,c.plane[(i+1)%c.plane.length]).toFixed(1)}″`;$('edges').append(e);});
      if(state.segment.length===2){const [a,b]=state.segment.map(p=>G.project(c.inverse,p)),d=G.distance(a,b);$('distance').textContent=`≈ ${d.toFixed(1)}″`;label(state.segment[1],`≈ ${d.toFixed(1)}″`,'#89e2ff');const expected=Number($('checkLength').value);if(expected>0)$('checkResult').textContent=`Check difference: ${(d-expected).toFixed(1)}″ (${(Math.abs(d-expected)/expected*100).toFixed(1)}%). This checks one segment, not overall accuracy.`;}
    }
  }catch(e){$('error').textContent=e.message;state.calibration=null;}
  if(state.reference.length>1)svg('polyline',{points:pointString(state.reference.length===4?[...state.reference,state.reference[0]]:state.reference),fill:'none',stroke:'#ffce66','stroke-width':2,'vector-effect':'non-scaling-stroke'});
  if(state.segment.length===2)line(...state.segment,'#80dcff',2);
  for(const [key,color] of [['region','#c7f36a'],['reference','#ffce66'],['segment','#80dcff']])state[key].forEach((p,i)=>{
    const name=key==='reference'?'ABCD'[i]:key==='region'?String(i+1):['P','Q'][i];
    svg('circle',{cx:p[0],cy:p[1],r:Math.max(6,state.image.width/70),fill:color,stroke:'#202820','stroke-width':2,class:'point','data-key':key,'data-index':i,tabindex:0,role:'button','aria-label':`${key} point ${name}. Arrow keys move; Shift moves ten pixels.`});label(p,name,color);
  });
  $('referenceInfo').textContent=state.reference.length===4?'A–B = width; B–C = depth. Drag corners or focus a handle and use arrow keys.':`${state.reference.length}/4 reference corners marked.`;
  const messages={edit:'Drag the yellow reference corners and green boundary handles. Zoom in for precise placement. Start by marking a measured reference rectangle.',reference:`Click reference corner ${'ABCD'[state.reference.length]||'A'} on the ceiling. Follow the rectangle perimeter A → B → C → D.`,boundary:`${state.region.length} outline points. Continue around the visible ceiling, then select Finish outline.`,measure:`Click ${state.segment.length?'the second':'the first'} point inside the traced ceiling to measure a distance on its plane.`};
  $('instruction').textContent=messages[state.mode];$('modeLabel').textContent=state.mode.toUpperCase();
  $('measure').disabled=!state.calibration;$('finish').disabled=state.mode!=='boundary'||state.region.length<3;$('undo').disabled=!['boundary','reference','measure'].includes(state.mode);
  ['reference','boundary','measure','edit'].forEach(id=>$(id).classList.toggle('active',state.mode===id));
}
async function loadPhoto(url,name,region=[]){
  const version=++state.version;const img=new Image();img.onload=()=>{if(version!==state.version)return;state.image=img;state.reference=[];state.segment=[];state.region=region.map(([x,y])=>[x*img.width,y*img.height]);state.mode='edit';state.drag=null;$('refWidth').value=$('refDepth').value=$('checkLength').value='';$('confirmed').checked=false;$('zoom').value='1';$('photoTitle').textContent=name;render();};img.onerror=()=>{if(version===state.version)$('error').textContent='Could not load this image. Try a JPEG, PNG, or WebP file.';};img.src=url;
}
samples.forEach(s=>{const b=document.createElement('button'),img=document.createElement('img');img.src=s.url;img.alt='';b.append(img,document.createTextNode(s.name));b.onclick=()=>loadPhoto(s.url,s.name,s.region);$('samples').append(b);});
$('photo').onchange=()=>{const f=$('photo').files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>loadPhoto(reader.result,f.name);reader.onerror=()=>$('error').textContent='Could not read photo.';reader.readAsDataURL(f);};
for(const id of ['refWidth','refDepth','confirmed','spacing','zoom','checkLength'])$(id).addEventListener('input',()=>{if(['refWidth','refDepth'].includes(id))$('confirmed').checked=false;render();});
$('reference').onclick=()=>{state.reference=[];state.segment=[];state.mode='reference';$('confirmed').checked=false;render();};
$('boundary').onclick=()=>{state.region=[];state.segment=[];state.mode='boundary';render();};
$('finish').onclick=()=>{if(state.region.length>=3){state.mode='edit';render();}};
$('measure').onclick=()=>{state.segment=[];state.mode='measure';render();};$('edit').onclick=()=>{state.mode='edit';render();};
$('undo').onclick=()=>{const key={boundary:'region',reference:'reference',measure:'segment'}[state.mode];if(key){state[key].pop();render();}};
function eventPoint(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('scene').getScreenCTM().inverse());return [Math.max(0,Math.min(state.image.width,p.x)),Math.max(0,Math.min(state.image.height,p.y))];}
$('scene').addEventListener('pointerdown',e=>{
  if(!state.image)return;const p=eventPoint(e),key=e.target.getAttribute('data-key');
  if(key&&state.mode==='edit'){state.drag={key,index:Number(e.target.getAttribute('data-index'))};$('scene').setPointerCapture(e.pointerId);return;}
  if(state.mode==='reference'){state.reference.push(p);if(state.reference.length===4)state.mode='edit';}
  else if(state.mode==='boundary')state.region.push(p);
  else if(state.mode==='measure'&&state.calibration){if(!inside(p,state.region)){$('error').textContent='Choose a point inside the traced ceiling region.';return;}state.segment.push(p);if(state.segment.length===2)state.mode='edit';}
  render();
});
$('scene').addEventListener('pointermove',e=>{if(!state.drag)return;const p=eventPoint(e);if(state.drag.key==='segment'&&!inside(p,state.region))return;state[state.drag.key][state.drag.index]=p;render();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(type,()=>{state.drag=null;});
$('scene').addEventListener('keydown',e=>{const key=e.target.getAttribute('data-key'),index=Number(e.target.getAttribute('data-index')),moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!key||!moves[e.key])return;e.preventDefault();const old=state[key][index],m=moves[e.key],step=e.shiftKey?10:1,p=[Math.max(0,Math.min(state.image.width,old[0]+m[0]*step)),Math.max(0,Math.min(state.image.height,old[1]+m[1]*step))];if(key==='segment'&&!inside(p,state.region))return;state[key][index]=p;render();$('scene').querySelector(`[data-key="${key}"][data-index="${index}"]`).focus();});
$('export').onclick=async()=>{
  try{const clone=$('scene').cloneNode(true),canvas=document.createElement('canvas');canvas.width=state.image.width;canvas.height=state.image.height;const ctx=canvas.getContext('2d');ctx.drawImage(state.image,0,0);clone.querySelector('image').setAttribute('href',canvas.toDataURL('image/png'));clone.setAttribute('width',canvas.width);clone.setAttribute('height',canvas.height);clone.removeAttribute('style');const text=document.createElementNS(NS,'text');text.setAttribute('x',10);text.setAttribute('y',canvas.height-16);text.setAttribute('font-size',12);text.setAttribute('fill','white');text.setAttribute('stroke','#162016');text.setAttribute('paint-order','stroke');text.setAttribute('stroke-width',3);text.textContent=state.calibration?`Reference ${$('refWidth').value} × ${$('refDepth').value} in | grid ${$('spacing').value} in | Estimates; accuracy not verified`:'UNCALIBRATED — NO INCH SCALE';clone.append(text);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download='ceiling-measurement.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('error').textContent=`Export failed: ${e.message}`;}
};
loadPhoto(samples[2].url,samples[2].name,samples[2].region);
