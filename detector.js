'use strict';
(function(root){
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
  const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
  function validFallback(points){
    return Array.isArray(points)&&points.length===4&&points.every(point=>Array.isArray(point)&&point.length===2&&point.every(Number.isFinite));
  }
  function defaultFallback(){return [[.04,.04],[.96,.04],[.96,.48],[.04,.48]];}
  function pixel(data,width,x,y,channel){return data[(y*width+x)*4+channel];}
  function bandMean(data,width,height,x,y0,y1,channel){
    let total=0,count=0;for(let y=Math.max(0,y0);y<=Math.min(height-1,y1);y++){total+=pixel(data,width,x,y,channel);count++;}return total/Math.max(1,count);
  }
  function columnContrast(image,x,y,radius){
    const {data,width,height}=image;let total=0;
    for(let channel=0;channel<3;channel++){
      const above=bandMean(data,width,height,x,y-radius*2,y-radius,channel),below=bandMean(data,width,height,x,y+radius,y+radius*2,channel),difference=above-below;total+=difference*difference;
    }
    return Math.sqrt(total/3);
  }
  function rowScore(image,y){
    const {width,height}=image,radius=Math.max(2,Math.round(height/90)),step=Math.max(1,Math.round(width/120)),values=[];
    for(let x=Math.round(width*.03);x<width*.97;x+=step)values.push(columnContrast(image,x,y,radius));
    if(!values.length)return {score:0,coverage:0};
    const sorted=[...values].sort((a,b)=>a-b),low=Math.floor(sorted.length*.2),high=Math.max(low+1,Math.ceil(sorted.length*.8)),trimmed=sorted.slice(low,high),middle=median(values),strong=values.filter(value=>value>=18).length/values.length;
    return {score:trimmed.reduce((sum,value)=>sum+value,0)/trimmed.length*.7+middle*.3+strong*18,coverage:strong};
  }
  function detect(image,options={}){
    if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||!image.data||image.data.length<image.width*image.height*4)throw Error('Detector requires RGBA image data.');
    const fallback=validFallback(options.fallback)?options.fallback.map(point=>point.map(value=>clamp(value,-1,2))):defaultFallback(),fallbackBottom=(fallback[2][1]+fallback[3][1])/2;
    if(image.width<24||image.height<24)return {points:fallback,confidence:0,accepted:false,source:'fallback',reason:'Image is too small for reliable line detection.',edges:[]};
    const minY=Math.max(5,Math.floor(image.height*Math.max(.1,fallbackBottom-.28))),maxY=Math.min(image.height-6,Math.ceil(image.height*Math.min(.88,fallbackBottom+.28))),rows=[];
    for(let y=minY;y<=maxY;y++)rows.push({y,...rowScore(image,y)});
    const smoothed=rows.map((row,index)=>{const neighbors=rows.slice(Math.max(0,index-2),Math.min(rows.length,index+3));return {...row,smooth:neighbors.reduce((sum,item)=>sum+item.score,0)/neighbors.length};}),best=smoothed.reduce((winner,row)=>!winner||row.smooth>winner.smooth?row:winner,null),scores=smoothed.map(row=>row.smooth),baseline=median(scores),deviations=scores.map(score=>Math.abs(score-baseline)),mad=Math.max(1,median(deviations)),prominence=(best.smooth-baseline)/mad,confidence=clamp((prominence-1.25)/6)*.72+clamp(best.coverage/.72)*.28,minConfidence=Number.isFinite(options.minConfidence)?options.minConfidence:.48;
    if(confidence<minConfidence)return {points:fallback,confidence,accepted:false,source:'fallback',reason:'No continuous ceiling boundary cleared the confidence threshold.',edges:[]};
    const detectedBottom=clamp(best.y/image.height,.08,.92),top=(fallback[0][1]+fallback[1][1])/2,left=Math.min(fallback[0][0],fallback[3][0]),right=Math.max(fallback[1][0],fallback[2][0]),points=[[left,top],[right,top],[right,detectedBottom],[left,detectedBottom]],edgeConfidence=clamp(confidence+.08);
    return {points,confidence,accepted:true,source:'detected',reason:'Continuous cross-image ceiling boundary detected.',edges:[
      {kind:'image-edge',confidence:.55},{kind:'image-edge',confidence:.55},{kind:'color-transition',confidence:edgeConfidence},{kind:'image-edge',confidence:.55}
    ]};
  }
  const api={detect};if(typeof module==='object'&&module.exports)module.exports=api;else root.CeilingDetector=api;
})(typeof globalThis!=='undefined'?globalThis:this);
