'use strict';
const assert=require('assert'),Detector=require('./detector.js');
function image(width,height,painter){
  const data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const [r,g,b]=painter(x,y),offset=(y*width+x)*4;data[offset]=r;data[offset+1]=g;data[offset+2]=b;data[offset+3]=255;}return {width,height,data};
}
const fallback=[[-.08,-.05],[1.08,-.05],[.92,.58],[.08,.58]];
const split=image(160,100,(x,y)=>y<52?[170+(x%7),145,115]:[65,72,78]);
const first=Detector.detect(split,{fallback}),second=Detector.detect(split,{fallback});
assert.equal(first.accepted,true,'strong continuous boundary should be accepted');
assert.equal(first.points.length,4,'normal detection should return four points');
assert.ok(Math.abs(first.points[2][1]-.52)<.06,`boundary should be near 52%, got ${first.points[2][1]}`);
assert.ok(first.points[0][0]<0&&first.points[1][0]>1,'cropped near corners should remain extrapolated beyond the image');
assert.ok(first.points[0][0]!==first.points[3][0]&&first.points[1][0]!==first.points[2][0],'perspective side edges must lean instead of rendering vertically');
assert.deepEqual(first,second,'detection must be deterministic');
const clutter=image(180,120,(x,y)=>{if(y>=66)return [55,62,67];const stripe=Math.floor(x/9)%2?24:0;return [145+stripe,125+stripe,105+stripe];});
const cluttered=Detector.detect(clutter,{fallback:[[-.06,-.04],[1.06,-.04],[.94,.55],[.06,.55]]});
assert.equal(cluttered.accepted,true,'repeating ceiling clutter must not hide a continuous room boundary');
assert.ok(Math.abs(cluttered.points[2][1]-.55)<.07,'cluttered boundary should remain near the room transition');
const uniform=image(120,80,()=>[120,120,120]),safe=Detector.detect(uniform,{fallback});
assert.equal(safe.accepted,false,'ambiguous image should decline detection');
assert.deepEqual(safe.points,fallback,'ambiguous image should preserve the supplied fallback');
const tiny=image(12,12,()=>[0,0,0]),tinyResult=Detector.detect(tiny,{fallback});
assert.equal(tinyResult.accepted,false,'tiny image should use fallback');
assert.ok(tinyResult.points.every(point=>point.every(Number.isFinite)),'fallback points must remain finite');
console.log('PASS: deterministic ceiling-boundary detection, clutter resistance, confidence fallback, and four-point output.');
