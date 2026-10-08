const assert=require('node:assert/strict'),L=require('./layout.js'),G=require('./geometry.js');
const rect=(w,h,x=0,y=0)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function coverage(plan,p){assert.ok(Math.abs(plan.used-G.area(p))<1e-5);for(const s of plan.sheets){assert.ok(s.used<=s.w*s.h+1e-5);assert.ok(s.used>0);}}
let p=rect(96,96),r=L.optimize(p,48,96);assert.equal(r.sheets.length,2);assert.equal(r.trimEdges,0);coverage(r,p);
p=rect(100,48);r=L.optimize(p,48,96);assert.equal(r.sheets.length,2);assert.equal(r.cutSheets,1);assert.equal(r.trimEdges,1);coverage(r,p);
p=rect(96,48,-23,-41);r=L.optimize(p,48,96);assert.equal(r.sheets.length,1);assert.equal(r.cutSheets,0);coverage(r,p);
p=[[0,0],[96,0],[96,48],[48,48],[48,96],[0,96]];r=L.optimize(p,48,96);coverage(r,p);assert.equal(r.cutSheets,1);
p=[[0,0],[100,10],[85,100],[0,80]];r=L.optimize(p,48,96);coverage(r,p);assert.ok(r.trimEdges>0);const baseline=L.candidate(p,48,96,0,0);assert.ok(r.trimEdges<=baseline.trimEdges);
// A concave U intersects one stock rectangle in two disconnected pieces.
p=[[0,0],[120,0],[120,100],[80,100],[80,20],[40,20],[40,100],[0,100]];
r=L.candidate(p,120,40,0,20);coverage(r,p);assert.ok(r.sheets.some(s=>s.polygons.length===2));
assert.throws(()=>L.optimize(rect(100000,100000),48,96),/too large/);
const openRegion=rect(120,80,-10,-5),open=L.visible(openRegion,48,96,[110,75]);coverage(open,openRegion);assert.equal(open.tested,2);assert.ok(open.sheets.length>0);assert.deepEqual(open.anchor,[110,75]);
console.log('PASS: exact fits, rotation, negative origin, minimal cuts, concave coverage, separated pieces, search limits.');
