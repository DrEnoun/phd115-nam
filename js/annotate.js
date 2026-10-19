/* PHD115 · Chemistry with Dr. NAM · draw and highlight on interactive slides (Apple Pencil, stylus, finger or mouse).
   Pen, highlighter, laser, eraser, and shapes (box, circle, arrow). Also draws on a zoomed picture (js/zoom.js). */
(function(){
if(window.INK)return;
const stage=document.getElementById('stage');if(!stage)return;
const KEY='phd115-ink:'+location.pathname;
const COLS=['#E0463C','#2F6F9F','#2E7D4F','#1B2A41','#B86E00','#FFFFFF'],HCOLS=['#FFE14D','#7CF29A','#7FD3FF','#FF9AD5'];
const SIZES={pen:[2.5,4.5,8],hl:[16,26,40],er:[14,26,44]};
const SHAPES=['rect','ell','arrow'];
let on=false,tool='pen',col=COLS[0],hcol=HCOLS[0],size=1,hidden=false,penSeen=false,fingerDraw=true,pickZoom=false;
let ink={};try{ink=JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch(_){}
const G=(0,eval);const cur=()=>{try{const v=G('typeof cur!=="undefined"?cur:0');return typeof v==='number'?v:0}catch(_){return 0}};
const css=`
.ink-base,.ink-live{position:absolute;left:0;top:0;z-index:6;pointer-events:none}
.ink-live{z-index:7}
.ink-live.on{pointer-events:auto;touch-action:none;cursor:crosshair}
.ink-live.on.er{cursor:cell}
.ink-live.on.pick{cursor:zoom-in}
.ink-btn{font:inherit;font-weight:600;cursor:pointer}
#ink-bar{position:fixed;left:calc(8px + env(safe-area-inset-left,0px));top:50%;transform:translateY(-50%);z-index:2147483100;display:grid;grid-template-columns:repeat(2,40px);gap:6px;justify-items:center;
 background:rgba(27,42,65,.94);color:#fff;border-radius:16px;padding:8px;box-shadow:0 6px 24px rgba(0,0,0,.3);font-family:Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-user-select:none;user-select:none;touch-action:manipulation;max-height:calc(100dvh - 20px);overflow:auto}
#ink-bar.right{left:auto;right:calc(8px + env(safe-area-inset-right,0px))}
#ink-bar[hidden]{display:none}
#ink-bar button{font:inherit;font-size:12px;font-weight:600;width:40px;height:40px;border-radius:11px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;gap:5px}
#ink-bar button[aria-pressed=true]{background:#F0B24A;color:#1B2A41;border-color:#F0B24A}
#ink-bar .sw{width:32px;min-width:32px;height:32px;margin:4px;border-radius:50%;padding:0;border:2.5px solid rgba(255,255,255,.35)}
#ink-bar .sw[aria-pressed=true]{border-color:#F0B24A;box-shadow:0 0 0 2px #F0B24A}
#ink-bar .sep{grid-column:1/-1;width:100%;height:1px;background:rgba(255,255,255,.2);margin:1px 0}
#ink-bar .lbl{display:none}
#ink-bar [data-a=done]{grid-column:1/-1;width:86px}
#ink-bar svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#ink-bar .hd{grid-column:1/-1;width:100%;display:flex;align-items:center;justify-content:space-between;gap:6px}
#ink-bar .grip{flex:1;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;color:rgba(255,255,255,.7);font-size:18px;letter-spacing:2px;background:rgba(255,255,255,.06)}
#ink-bar.dragging .grip{cursor:grabbing;background:rgba(240,178,74,.35)}
#ink-bar .hd button{width:30px;height:30px}
#ink-bar.moved{transform:none}
#ink-bar.mini{display:flex;align-items:center;gap:5px;padding:6px;border-radius:14px;overflow:visible}
#ink-bar.mini>*:not(.hd):not(.keep){display:none!important}
#ink-bar.mini .hd{width:auto;grid-column:auto}
#ink-bar.mini .grip{flex:none;width:30px}
#ink-bar.mini button{width:36px;height:36px}
#ink-bar.mini [data-a=done]{width:auto;padding:0 10px}
#ink-bar .now{display:none}
#ink-bar.mini .now{display:inline-flex;width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.5);flex:none}
#ink-bar[hidden]{display:none!important}
#ink-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:2147483101;background:rgba(27,42,65,.92);color:#fff;font:600 13px Lexend,system-ui,sans-serif;padding:8px 14px;border-radius:10px;pointer-events:none;opacity:0;transition:opacity .25s}
@media (max-height:620px){#ink-bar{grid-template-columns:repeat(3,36px)}#ink-bar button{width:36px;height:36px}#ink-bar [data-a=done]{width:120px}}
@media print{#ink-bar,#ink-toast{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

// ---- drawing surfaces: the slide, and (when open) a zoomed picture. Only one is active at a time.
function mkSurface(host,ids){const b=document.createElement('canvas'),l=document.createElement('canvas');b.className='ink-base';l.className='ink-live';
 if(ids){b.id='ink-base';l.id='ink-live'}host.appendChild(b);host.appendChild(l);bind(l);
 return {base:b,live:l,bc:b.getContext('2d'),lc:l.getContext('2d'),W:1280,H:720,K:1,key:()=>cur(),zoom:false}}
const S0=mkSurface(stage,true);S0.base.style.width=S0.live.style.width='1280px';S0.base.style.height=S0.live.style.height='720px';
let SZ=null,SF=S0;
const live=()=>SF.live;
function resize(){if(SF===S0){const r=stage.getBoundingClientRect();S0.K=Math.min(4,Math.max(1,(r.width/1280)*(window.devicePixelRatio||1)))}
 const s=SF;for(const c of [s.base,s.live]){c.width=Math.round(s.W*s.K);c.height=Math.round(s.H*s.K)}redraw()}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(ink))}catch(_){}}
function strokesNow(){const k=SF.key();return ink[k]||(ink[k]=[])}
function shapePts(s){const [a,b]=s.p,out=[];if(!b)return s.p;
 if(s.t==='rect'){const c=[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]],[a[0],a[1]]];for(let i=0;i<4;i++)for(let k=0;k<=10;k++)out.push([c[i][0]+(c[i+1][0]-c[i][0])*k/10,c[i][1]+(c[i+1][1]-c[i][1])*k/10])}
 else if(s.t==='ell'){const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,rx=Math.abs(b[0]-a[0])/2,ry=Math.abs(b[1]-a[1])/2;for(let k=0;k<48;k++){const t=k/48*Math.PI*2;out.push([cx+rx*Math.cos(t),cy+ry*Math.sin(t)])}}
 else for(let k=0;k<=20;k++)out.push([a[0]+(b[0]-a[0])*k/20,a[1]+(b[1]-a[1])*k/20]);
 return out}
function drawShape(ctx,s){const [a,b]=s.p;if(!b)return;ctx.strokeStyle=s.c;ctx.lineWidth=s.w;ctx.beginPath();
 if(s.t==='rect'){const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),w=Math.abs(b[0]-a[0]),h=Math.abs(b[1]-a[1]),r=Math.min(10,w/4,h/4);
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.stroke()}
 else if(s.t==='ell'){ctx.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2||.1,Math.abs(b[1]-a[1])/2||.1,0,0,Math.PI*2);ctx.stroke()}
 else{const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),L=Math.hypot(b[0]-a[0],b[1]-a[1]),hd=Math.min(L*.45,Math.max(16,s.w*4));
  const e=[b[0]-Math.cos(ang)*hd*.6,b[1]-Math.sin(ang)*hd*.6];ctx.moveTo(a[0],a[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();
  ctx.fillStyle=s.c;ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(b[0]-hd*Math.cos(ang-.45),b[1]-hd*Math.sin(ang-.45));ctx.lineTo(b[0]-hd*Math.cos(ang+.45),b[1]-hd*Math.sin(ang+.45));ctx.closePath();ctx.fill()}}
function drawStroke(ctx,s){const p=s.p;if(!p.length)return;ctx.save();ctx.scale(SF.K,SF.K);ctx.lineCap='round';ctx.lineJoin='round';
 if(SHAPES.includes(s.t)){drawShape(ctx,s)}
 else if(s.t==='hl'){ctx.globalAlpha=.38;ctx.strokeStyle=s.c;ctx.lineWidth=s.w;ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
  for(let i=1;i<p.length;i++){const m=[(p[i-1][0]+p[i][0])/2,(p[i-1][1]+p[i][1])/2];ctx.quadraticCurveTo(p[i-1][0],p[i-1][1],m[0],m[1])}
  ctx.lineTo(p[p.length-1][0],p[p.length-1][1]);if(p.length===1)ctx.lineTo(p[0][0]+.1,p[0][1]);ctx.stroke()}
 else{ctx.strokeStyle=s.c;ctx.fillStyle=s.c;if(p.length===1){ctx.beginPath();ctx.arc(p[0][0],p[0][1],s.w*(.4+.9*p[0][2])/2,0,7);ctx.fill()}
  for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],pa=i>1?p[i-2]:a;ctx.lineWidth=s.w*(.4+.9*(a[2]+b[2])/2);ctx.beginPath();
   ctx.moveTo((pa[0]+a[0])/2,(pa[1]+a[1])/2);ctx.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);ctx.stroke()}
  const a=p[p.length-1];ctx.beginPath();ctx.moveTo(p.length>1?(p[p.length-2][0]+a[0])/2:a[0],p.length>1?(p[p.length-2][1]+a[1])/2:a[1]);ctx.lineTo(a[0],a[1]);ctx.lineWidth=s.w*(.4+.9*a[2]);ctx.stroke()}
 ctx.restore()}
let shown=-1;
function redraw(){const s=SF;s.bc.clearRect(0,0,s.base.width,s.base.height);if(s===S0)shown=cur();if(hidden)return;(ink[s.key()]||[]).forEach(k=>drawStroke(s.bc,k))}
setInterval(()=>{if(SF===S0&&cur()!==shown)redraw()},150);

// ---- zoomed picture: draw on it, the ink moves and scales with the picture
addEventListener('zm:open',e=>{const pic=e.detail.pic,img=e.detail.img;
 if(!SZ){SZ=mkSurface(pic,false);SZ.zoom=true;for(const c of [SZ.base,SZ.live]){c.style.zIndex=c===SZ.live?3:2}}
 const k='z'+cur()+':'+[...document.images].indexOf(img);SZ.key=()=>k;
 SZ.W=pic.offsetWidth||400;SZ.H=pic.offsetHeight||300;for(const c of [SZ.base,SZ.live]){c.style.width=SZ.W+'px';c.style.height=SZ.H+'px'}
 const d=window.devicePixelRatio||1;SZ.K=Math.max(1,Math.min(3,d*1.5,Math.sqrt(9e6/(SZ.W*SZ.H))));
 SF=SZ;SZ.live.classList.toggle('on',on);resize();paintZoomBtn()});
addEventListener('zm:close',()=>{if(SF!==S0){endAll();SF=S0;redraw()}});
function paintZoomBtn(){const b=document.querySelector('.zm-draw');if(b)b.setAttribute('aria-pressed',on)}

// ---- pointer input
let drawing=null,laser=[],laserRAF=0,active=null;
function pt(e){const r=live().getBoundingClientRect();return [(e.clientX-r.left)/r.width*SF.W,(e.clientY-r.top)/r.height*SF.H,e.pointerType==='pen'?(e.pressure||.5):.5]}
function allowed(e){if(e.pointerType==='pen'){if(!penSeen){penSeen=true;fingerDraw=false;bar&&paint();toast('Pencil found! Only the pencil draws now. Swipe with a finger to change slides.')}return true}
 if(e.pointerType==='touch')return fingerDraw;return e.button===0}
function eraseAt(q){const S=strokesNow();const r=SIZES.er[size];let hit=false;for(let i=S.length-1;i>=0;i--){const pts=SHAPES.includes(S[i].t)?shapePts(S[i]):S[i].p;if(pts.some(p=>Math.hypot(p[0]-q[0],p[1]-q[1])<r+S[i].w/2)){S.splice(i,1);hit=true}}if(hit){save();redraw()}}
function picAt(x,y){if(!window.ZOOM)return null;for(const el of document.elementsFromPoint(x,y)){if(el.tagName==='IMG'&&ZOOM.can(el))return el}return null}
function endAll(){tp.clear();gest=0;gVoid=false;active=null;drawing=null;const s=SF;s.lc.clearRect(0,0,s.live.width,s.live.height)}
// swipe to change slide while drawing: two fingers, or one finger when only the pencil draws.
// On a zoomed picture the same gestures move (one finger) and pinch-zoom (two fingers) the picture instead.
const tp=new Map();let gest=0,gVoid=false,wAcc=0,wT=0,wLock=0,gPrev=null;
function nav(d){const n=document.getElementById(d<0?'bNext':'bPrev');if(n){n.click();setTimeout(redraw,60)}}
function gInfo(){const v=[...tp.values()];const cx=v.reduce((a,q)=>a+q.x,0)/v.length,cy=v.reduce((a,q)=>a+q.y,0)/v.length;const d=v.length>1?Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y):0;return {cx,cy,d,n:v.length}}
function gestDown(e){if(e.pointerType!=='touch')return false;tp.set(e.pointerId,{x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,t:performance.now()});try{live().setPointerCapture(e.pointerId)}catch(_){}
 const penBusy=active!==null&&!tp.has(active);
 if(tp.size>=2||!fingerDraw||penBusy){if(!gest){gest=1;gVoid=penBusy}
  if(active!==null&&!penBusy&&tp.has(active)){active=null;drawing=null;SF.lc.clearRect(0,0,SF.live.width,SF.live.height)}
  if(tp.size>=2)for(const v of tp.values()){v.x0=v.x;v.y0=v.y}
  gPrev=gInfo();e.preventDefault();return true}return false}
function gestMove(e){const v=tp.get(e.pointerId);if(!v)return false;v.x=e.clientX;v.y=e.clientY;if(!gest)return false;e.preventDefault();
 if(SF.zoom&&!gVoid&&window.ZOOM){const g=gInfo();if(gPrev&&gPrev.n===g.n){ZOOM.panBy(g.cx-gPrev.cx,g.cy-gPrev.cy);if(g.n>1&&gPrev.d)ZOOM.scaleBy(g.d/gPrev.d)}gPrev=g}
 return true}
function gestUp(e){const v=tp.get(e.pointerId);if(!v)return false;const was=gest;
 if(gest&&!gest.done&&!SF.zoom&&tp.size>=1){let dx=0,dy=0;for(const q of tp.values()){dx+=q.x-q.x0;dy+=q.y-q.y0}dx/=tp.size;dy/=tp.size;
  if(!gVoid&&Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.2){nav(dx);gest={done:1}}
  else if(!gVoid&&tp.size===1&&Math.hypot(dx,dy)<8&&performance.now()-v.t<400){const im=picAt(e.clientX,e.clientY);if(im){ZOOM.open(im);gest={done:1}}}}
 tp.delete(e.pointerId);if(tp.size)gPrev=gInfo();else{gest=0;gVoid=false;gPrev=null}return !!was}
function bind(c){
 ['pointerdown','pointermove','pointerup','pointercancel','click','dblclick','touchstart','touchmove','touchend','mousedown','mouseup','wheel'].forEach(t=>c.addEventListener(t,e=>{if(on)e.stopPropagation()},{passive:false}));
 c.addEventListener('wheel',e=>{if(!on)return;e.preventDefault();
  if(SF.zoom){if(window.ZOOM&&e.deltaY)ZOOM.scaleBy(e.deltaY<0?1.15:1/1.15);return}
  if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;const now=performance.now();if(now-wT>300)wAcc=0;wT=now;wAcc+=e.deltaX;
  if(now>wLock&&Math.abs(wAcc)>90){nav(-wAcc);wAcc=0;wLock=now+700}},{passive:false});
 c.addEventListener('pointerdown',e=>{if(!on)return;
  if(pickZoom){e.preventDefault();const im=picAt(e.clientX,e.clientY);pickZoom=false;paint();if(im)ZOOM.open(im);else toast('Tap on a picture to zoom it.');return}
  if(gestDown(e))return;if(!allowed(e))return;if(gest)gVoid=true;e.preventDefault();if(active!==null)return;active=e.pointerId;try{c.setPointerCapture(e.pointerId)}catch(_){}
  const q=pt(e);if(tool==='er'){eraseAt(q);return}if(tool==='laser'){laser.push([q[0],q[1],performance.now()]);runLaser();return}
  if(SHAPES.includes(tool)){drawing={t:tool,c:col,w:SIZES.pen[size]*1.15,p:[q,q]};liveDraw();return}
  drawing={t:tool,c:tool==='hl'?hcol:col,w:SIZES[tool==='hl'?'hl':'pen'][size],p:[q]};liveDraw()});
 c.addEventListener('pointermove',e=>{if(!on)return;if(gestMove(e))return;if(e.pointerId!==active)return;e.preventDefault();
  if(drawing&&SHAPES.includes(drawing.t)){drawing.p[1]=pt(e);liveDraw();return}
  const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
  for(const ev of (evs.length?evs:[e])){const q=pt(ev);if(tool==='er')eraseAt(q);else if(tool==='laser')laser.push([q[0],q[1],performance.now()]);else if(drawing){const l=drawing.p[drawing.p.length-1];if(Math.hypot(q[0]-l[0],q[1]-l[1])>.6)drawing.p.push(q)}}
  if(drawing)liveDraw()});
 c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end)}
function end(e){if(gestUp(e)&&e.pointerId!==active)return;if(e.pointerId!==active)return;active=null;
 if(drawing){const d=drawing;drawing=null;SF.lc.clearRect(0,0,SF.live.width,SF.live.height);
  const tiny=SHAPES.includes(d.t)&&Math.hypot(d.p[1][0]-d.p[0][0],d.p[1][1]-d.p[0][1])<6;
  if(!tiny){strokesNow().push(d);save();if(hidden){hidden=false;paint()}}redraw()}}
function liveDraw(){SF.lc.clearRect(0,0,SF.live.width,SF.live.height);if(drawing)drawStroke(SF.lc,drawing)}
function runLaser(){if(laserRAF)return;const step=()=>{const now=performance.now(),s=SF,lc=s.lc;laser=laser.filter(p=>now-p[2]<700);if(drawing)return;lc.clearRect(0,0,s.live.width,s.live.height);
 lc.save();lc.scale(s.K,s.K);for(let i=1;i<laser.length;i++){const a=laser[i-1],b=laser[i],f=1-(now-b[2])/700;lc.strokeStyle=`rgba(255,40,40,${.85*f})`;lc.lineWidth=6*f+2;lc.lineCap='round';lc.beginPath();lc.moveTo(a[0],a[1]);lc.lineTo(b[0],b[1]);lc.stroke()}
 const l=laser[laser.length-1];if(l){lc.fillStyle='rgba(255,30,30,.95)';lc.shadowColor='rgba(255,0,0,.9)';lc.shadowBlur=14;lc.beginPath();lc.arc(l[0],l[1],7,0,7);lc.fill()}lc.restore();
 laserRAF=laser.length?requestAnimationFrame(step):0;if(!laserRAF)lc.clearRect(0,0,s.live.width,s.live.height)};laserRAF=requestAnimationFrame(step)}

// ---- toolbar
const I={pen:'<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/></svg>',hl:'<svg viewBox="0 0 24 24"><path d="M9 14l-3 6h6l1-3"/><path d="M8 13l7-9 4 3-7 9z"/></svg>',
laser:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',er:'<svg viewBox="0 0 24 24"><path d="M7 20h10"/><path d="M5 15l8-9 6 6-6 7H9z"/></svg>',
rect:'<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="2.5"/></svg>',ell:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6.5"/></svg>',
arrow:'<svg viewBox="0 0 24 24"><path d="M4 19L18 6"/><path d="M10 5.5h8.5V14"/></svg>',zoom:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M10.5 8v5M8 10.5h5"/></svg>',
undo:'<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12"/></svg>',clr:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',hand:'<svg viewBox="0 0 24 24"><path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V6a1.5 1.5 0 013 0v8a7 7 0 01-7 7 6 6 0 01-5-3l-3-5a1.5 1.5 0 012.5-1.5L8 15"/></svg>',
start:'<svg viewBox="0 0 24 24"><path d="M6 5v14"/><path d="M18 5l-9 7 9 7z"/></svg>'};
const NAMES={pen:'Pen',hl:'Highlighter',laser:'Laser pointer',er:'Eraser',rect:'Box',ell:'Circle',arrow:'Arrow'};
let bar=null;
function paint(){if(!bar)return;bar.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool&&!pickZoom));
 bar.querySelectorAll('[data-c]').forEach(b=>{b.hidden=tool==='hl'?!HCOLS.includes(b.dataset.c):!COLS.includes(b.dataset.c);b.setAttribute('aria-pressed',b.dataset.c===(tool==='hl'?hcol:col))});
 bar.querySelectorAll('[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===size));
 const h=bar.querySelector('[data-a=hide]');h.setAttribute('aria-pressed',hidden);const f=bar.querySelector('[data-a=finger]');f.hidden=!penSeen;f.setAttribute('aria-pressed',fingerDraw);
 const z=bar.querySelector('[data-a=zoom]');z.hidden=!window.ZOOM;z.setAttribute('aria-pressed',pickZoom);
 bar.querySelector('[data-a=start]').hidden=typeof window.go!=='function';
 for(const s of [S0,SZ])if(s){s.live.classList.toggle('er',tool==='er');s.live.classList.toggle('pick',pickZoom)}
 const nw=bar.querySelector('.now');if(nw){nw.style.background=tool==='er'?'transparent':tool==='laser'?'#FF2828':(tool==='hl'?hcol:col)}
 const mb=bar.querySelector('[data-a=min]');if(mb){const m=bar.classList.contains('mini');mb.textContent=m?'⤢':'–';mb.setAttribute('aria-label',m?'Show all drawing tools':'Minimise toolbar');mb.title=m?'Show all tools':'Minimise (keep drawing)'}}
function build(){bar=document.createElement('div');bar.id='ink-bar';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Drawing tools');
 const tb=t=>`<button data-tool="${t}" aria-label="${NAMES[t]}" title="${NAMES[t]}">${I[t]}<span class="lbl">${NAMES[t]}</span></button>`;
 bar.innerHTML=`<div class="hd"><span class="grip" title="Drag to move the toolbar" aria-label="Drag to move the toolbar">⠿</span><span class="now" aria-hidden="true"></span><button data-a="min" aria-label="Minimise toolbar" title="Minimise (keep drawing)">–</button></div>${['pen','hl','laser','er'].map(tb).join('')}<span class="sep"></span>
 ${SHAPES.map(tb).join('')}<button data-a="zoom" aria-label="Zoom a picture" title="Zoom a picture: tap this, then tap a picture">${I.zoom}</button><span class="sep"></span>
 ${COLS.concat(HCOLS).map(c=>`<button class="sw" data-c="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<span class="sep"></span>
 ${[0,1,2].map(s=>`<button data-s="${s}" aria-label="${['Thin','Medium','Thick'][s]}"><span style="display:inline-block;width:${[5,9,14][s]}px;height:${[5,9,14][s]}px;border-radius:50%;background:currentColor"></span></button>`).join('')}<span class="sep"></span>
 <button data-a="undo" class="keep" aria-label="Undo">${I.undo}</button><button data-a="clear" aria-label="Clear this slide">${I.clr}</button><button data-a="hide" aria-label="Hide or show ink">${I.eye}</button><button data-a="finger" aria-label="Allow finger drawing" hidden>${I.hand}</button><span class="sep"></span>
 <button data-a="prev" class="keep" aria-label="Previous slide">←</button><button data-a="next" class="keep" aria-label="Next slide">→</button><button data-a="start" aria-label="Back to the title slide" title="Back to the title slide">${I.start}</button><button data-a="side" aria-label="Move toolbar to the other side">⇄</button><button data-a="done" class="keep" aria-label="Stop drawing">Done</button>`;
 document.body.appendChild(bar);
 ['pointerdown','pointerup','click','touchstart','touchend'].forEach(t=>bar.addEventListener(t,e=>e.stopPropagation()));
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tool){tool=b.dataset.tool;pickZoom=false;if(SHAPES.includes(tool))toast('Drag on the slide to draw a '+NAMES[tool].toLowerCase()+'.')}
  else if(b.dataset.c){if(tool==='hl')hcol=b.dataset.c;else{col=b.dataset.c;if(!['pen',...SHAPES].includes(tool))tool='pen'}}else if(b.dataset.s)size=+b.dataset.s;
  else{const a=b.dataset.a;if(a==='undo'){strokesNow().pop();save();redraw()}else if(a==='clear'){if(strokesNow().length&&confirm('Clear all drawing here?')){ink[SF.key()]=[];save();redraw()}}
   else if(a==='hide'){hidden=!hidden;redraw()}else if(a==='finger'){fingerDraw=!fingerDraw;toast(fingerDraw?'Finger drawing on. Swipe with two fingers to change slides.':'Pencil only. Swipe with a finger to change slides.')}
   else if(a==='zoom'){if(window.ZOOM&&ZOOM.isOpen()){toast('This picture is already zoomed.')}else{pickZoom=!pickZoom;if(pickZoom)toast('Now tap a picture to zoom it.')}}
   else if(a==='prev'||a==='next'){if(window.ZOOM&&ZOOM.isOpen())ZOOM.close();const n=document.getElementById(a==='prev'?'bPrev':'bNext');n&&n.click();setTimeout(redraw,60)}
   else if(a==='start'){if(window.ZOOM&&ZOOM.isOpen())ZOOM.close();if(typeof window.go==='function'){window.go(0);setTimeout(redraw,60)}}
   else if(a==='side'){bar.classList.remove('moved');bar.style.left=bar.style.top='';bar.classList.toggle('right');savePos()}else if(a==='min'){setMini(!bar.classList.contains('mini'))}else if(a==='done')toggle(false)}
  paint()});initDrag();restorePos();paint()}
const PKEY='phd115-inkbar';
function savePos(){try{const mv=bar.classList.contains('moved');localStorage.setItem(PKEY,JSON.stringify({x:mv?parseFloat(bar.style.left):null,y:mv?parseFloat(bar.style.top):null,right:bar.classList.contains('right'),mini:bar.classList.contains('mini')}))}catch(_){}}
function clampBar(){if(!bar||!bar.classList.contains('moved')||bar.hidden)return;const r=bar.getBoundingClientRect();let x=parseFloat(bar.style.left)||0,y=parseFloat(bar.style.top)||0;
 x=Math.max(4,Math.min(innerWidth-r.width-4,x));y=Math.max(4,Math.min(innerHeight-r.height-4,y));bar.style.left=x+'px';bar.style.top=y+'px'}
function setMini(m){bar.classList.toggle('mini',m);paint();requestAnimationFrame(clampBar);savePos()}
function restorePos(){let o=null;try{o=JSON.parse(localStorage.getItem(PKEY)||'null')}catch(_){}if(!o)return;
 if(o.right)bar.classList.add('right');if(o.mini)bar.classList.add('mini');if(o.x!=null&&o.y!=null){bar.classList.add('moved');bar.style.left=o.x+'px';bar.style.top=o.y+'px'}}
function initDrag(){const g=bar.querySelector('.grip');let d=null;
 g.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const r=bar.getBoundingClientRect();d={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
  bar.classList.add('moved','dragging');bar.classList.remove('right');bar.style.left=r.left+'px';bar.style.top=r.top+'px';try{g.setPointerCapture(e.pointerId)}catch(_){}});
 g.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;e.preventDefault();bar.style.left=(e.clientX-d.dx)+'px';bar.style.top=(e.clientY-d.dy)+'px';clampBar()});
 const up=e=>{if(!d||e.pointerId!==d.id)return;d=null;bar.classList.remove('dragging');clampBar();savePos()};g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);
 g.addEventListener('dblclick',e=>{e.stopPropagation();setMini(!bar.classList.contains('mini'))})}
let tt=0;function toast(m){let t=document.getElementById('ink-toast');if(!t){t=document.createElement('div');t.id='ink-toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>t.style.opacity=0,2600)}
function toggle(v){on=v===undefined?!on:v;endAll();pickZoom=false;if(!bar)build();bar.hidden=!on;for(const s of [S0,SZ])if(s)s.live.classList.toggle('on',on);
 document.querySelectorAll('.ink-toggle').forEach(b=>b.setAttribute('aria-pressed',on));paintZoomBtn();
 if(on){requestAnimationFrame(clampBar);if(hidden){hidden=false;redraw()}toast(SF.zoom?'Draw on the picture. Pinch or use + and − to zoom.':'Drawing on. Swipe with two fingers to change slides. Press D or Done to stop.')}else{laser=[]}paint()}
// ---- launcher button and keys
function mount(){if(document.querySelector('.ink-toggle'))return;const slot=document.querySelector('[data-ink-slot]')||document.getElementById('ctl');const b=document.createElement('button');b.type='button';b.className='ink-btn ink-toggle';
 b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Draw on slide');b.innerHTML='✎ Draw';b.addEventListener('click',e=>{e.stopPropagation();toggle()});
 if(slot){slot.insertBefore(b,slot.firstChild)}else{b.style.cssText='position:fixed;left:12px;bottom:12px;z-index:9';document.body.appendChild(b)}}
document.addEventListener('keydown',e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
 if((e.key==='d'||e.key==='D')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();toggle();return}
 if(on&&bar&&(e.key==='m'||e.key==='M')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();setMini(!bar.classList.contains('mini'));return}
 if(on&&e.key==='Escape'){e.stopImmediatePropagation();toggle(false);return}
 if(on&&(e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z')){e.preventDefault();strokesNow().pop();save();redraw()}
 if(on&&(e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key===' '||e.key==='PageDown'||e.key==='PageUp'||e.key==='Home'))setTimeout(redraw,60)},true);
addEventListener('resize',()=>setTimeout(()=>{if(SF===S0)resize();clampBar()},60));document.addEventListener('fullscreenchange',()=>setTimeout(()=>SF===S0&&resize(),120));document.addEventListener('webkitfullscreenchange',()=>setTimeout(()=>SF===S0&&resize(),120));
window.INK={toggle,clearAll(){ink={};save();redraw()},resize};
const init=()=>{mount();resize()};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
