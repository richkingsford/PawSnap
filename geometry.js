/* Planar projective geometry. Coordinates are image pixels or physical inches. */
(function (root) {
  const cross = (a,b,c) => (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
  function convex(q) {
    if(q.length!==4) return false;
    const s=q.map((p,i)=>cross(p,q[(i+1)%4],q[(i+2)%4]));
    return s.every(v=>v>1e-6)||s.every(v=>v< -1e-6);
  }
  function solve(a,b) {
    const m=a.map((r,i)=>[...r,b[i]]), n=b.length;
    for(let i=0;i<n;i++) {
      let k=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[k][i]))k=j;
      [m[i],m[k]]=[m[k],m[i]];
      if(Math.abs(m[i][i])<1e-10)throw Error('Reference corners are too close or nearly collinear. Spread them over a larger rectangle.');
      const d=m[i][i];for(let j=i;j<=n;j++)m[i][j]/=d;
      for(let r=0;r<n;r++)if(r!==i){const f=m[r][i];for(let j=i;j<=n;j++)m[r][j]-=f*m[i][j];}
    }return m.map(r=>r[n]);
  }
  function homography(src,dst) {
    const a=[],b=[];
    src.forEach(([x,y],i)=>{const [u,v]=dst[i];a.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);});
    return [...solve(a,b),1];
  }
  function project(h,[x,y]){const w=h[6]*x+h[7]*y+h[8];if(Math.abs(w)<1e-9)throw Error('Region reaches the perspective horizon. Use a smaller visible region.');return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];}
  function area(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
  function simple(p){for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){if(j===i+1||(i===0&&j===p.length-1))continue;const a=p[i],b=p[(i+1)%p.length],c=p[j],d=p[(j+1)%p.length];if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0)return false;}return area(p)>1e-5;}
  function calibrate(q,w,d,region){
    if(!convex(q))throw Error('Reference must be a non-crossing four-corner rectangle in perimeter order.');
    if(!Number.isFinite(w)||!Number.isFinite(d)||w<=0||d<=0||w>2400||d>2400)throw Error('Enter reference dimensions between 0 and 2400 inches.');
    const rect=[[0,0],[w,0],[w,d],[0,d]], forward=homography(rect,q),inverse=homography(q,rect);
    const signs=[...q,...region].map(([x,y])=>inverse[6]*x+inverse[7]*y+1);
    if(Math.min(...signs)*Math.max(...signs)<=0)throw Error('The selected region crosses the perspective horizon. Check reference corners and region.');
    const plane=region.map(p=>project(inverse,p));
    if(plane.some(p=>p.some(v=>!Number.isFinite(v)||Math.abs(v)>10000)))throw Error('Unstable scale near the horizon. Move the reference or reduce the region.');
    return {forward,inverse,plane};
  }
  const api={convex,homography,project,area,simple,calibrate,distance:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])};
  if(typeof module!=='undefined')module.exports=api;else root.Geometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
