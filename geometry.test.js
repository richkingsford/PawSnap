const assert=require('node:assert/strict');
const G=require('./geometry.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
// Independent synthetic camera transform gives ground truth at interior and
// extrapolated ceiling points, not just the four fitted reference corners.
const camera=[3,.3,120,.2,2,45,.004,.006,1];
const rectangle=[[0,0],[48,0],[48,96],[0,96]];
const ceiling=[[-12,-6],[120,-6],[120,150],[-12,150]];
const reference=rectangle.map(p=>G.project(camera,p));
const c=G.calibrate(reference,48,96,ceiling.map(p=>G.project(camera,p)));
for(const p of [[12,24],[80,125],[-10,-5],[0,96]]){const actual=G.project(c.inverse,G.project(camera,p));close(actual[0],p[0]);close(actual[1],p[1]);}
close(G.area(c.plane),132*156);
const a=G.project(c.inverse,G.project(camera,[12,20])),b=G.project(c.inverse,G.project(camera,[15,24]));close(G.distance(a,b),5);
assert.throws(()=>G.calibrate([reference[0],reference[2],reference[1],reference[3]],48,96,[]));
assert.throws(()=>G.calibrate(reference,0,96,[]));
assert.throws(()=>G.calibrate(reference,NaN,96,[]));
assert.equal(G.simple([[0,0],[4,4],[0,4],[4,0]]),false);
assert.equal(G.simple([[0,0],[4,0],[4,2],[2,2],[2,4],[0,4]]),true);
assert.throws(()=>G.calibrate([[0,0],[1,0],[2,0],[3,0]],10,10,[]));
console.log('PASS: perspective ground truth, extrapolation, area, distance, invalid references and crossed polygons.');
