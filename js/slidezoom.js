/* PHD115 · Chemistry with Dr. NAM · zoom the whole slide in and out.
   Buttons (− 100% +), keys (+ − 0, also with Ctrl/Cmd), Ctrl+scroll or trackpad pinch, two-finger pinch on phones/tablets.
   When zoomed in: drag or scroll to move around. A tap still works as before (next step, answers, buttons).
   It only moves the slide frame (#box), so drawing, picture zoom, 3D models and quizzes keep working. */
(function(){
if(window.SZOOM)return;
if(/[?&]print\b/.test(location.search))return;
const wrap=document.getElementById('wrap'),box=document.getElementById('box'),ctl=document.getElementById('ctl');
if(!wrap||!box)return;
const MIN=0.5,MAX=4,STEP=1.25;
const NOPAN='.s3 .t,input,select,textarea,[draggable="true"],[contenteditable],#ink-bar';
let z=1,tx=0,ty=0,lbl=null,quiet=0,inkT=0;

const st=document.createElement('style');
st.textContent=`#box.sz-anim{transition:transform .22s ease-out}
#wrap.sz-in{cursor:grab}#wrap.sz-in.sz-drag{cursor:grabbing}
#ctl .sz-pct{min-width:62px;font-variant-numeric:tabular-nums}`;
document.head.appendChild(st);
box.style.transformOrigin='0 0';

// ---- keep the slide on screen
function clamp(){
 const W=wrap.clientWidth,H=wrap.clientHeight,bw=box.offsetWidth,bh=box.offsetHeight,L=box.offsetLeft,T=box.offsetTop;
 const sw=bw*z,sh=bh*z;
 if(sw<=W)tx=(W-sw)/2-L;else tx=Math.min(-L,Math.max(W-L-sw,tx));
 if(sh<=H)ty=(H-sh)/2-T;else ty=Math.min(-T,Math.max(H-T-sh,ty));
}
function paint(anim){
 clamp();
 box.classList.toggle('sz-anim',!!anim);
 box.style.transform=(Math.abs(z-1)<.001&&!tx&&!ty)?'':`translate(${tx}px,${ty}px) scale(${z})`;
 wrap.classList.toggle('sz-in',z>1.01);
 if(lbl)lbl.textContent=Math.round(z*100)+'%';
 clearTimeout(inkT);inkT=setTimeout(()=>{try{window.INK&&INK.resize&&INK.resize()}catch(_){}},anim?260:160);
}
// zoom so that screen point (cx,cy) stays in the same place
function zoomTo(nz,cx,cy,anim){
 nz=Math.min(MAX,Math.max(MIN,nz));
 if(cx==null){const r=wrap.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2}
 const b=box.getBoundingClientRect();
 tx+= (cx-b.left)*(1-nz/z);ty+=(cy-b.top)*(1-nz/z);z=nz;
 if(Math.abs(z-1)<.02){z=1}
 paint(anim);
}
function reset(){z=1;tx=ty=0;paint(true)}
function panBy(dx,dy){tx+=dx;ty+=dy;paint(false)}

// ---- buttons: −  100%  +
if(ctl){
 const g=document.createElement('span');g.style.display='contents';
 g.innerHTML='<button type="button" data-sz="out" aria-label="Zoom out" title="Zoom out (−)">−</button>'+
  '<button type="button" data-sz="fit" class="sz-pct" aria-label="Back to normal size" title="Back to normal size (0)">100%</button>'+
  '<button type="button" data-sz="in" aria-label="Zoom in" title="Zoom in (+)">+</button>';
 const ref=document.getElementById('bNotes');
 ref&&ref.parentNode===ctl?ctl.insertBefore(g,ref):ctl.appendChild(g);
 lbl=g.querySelector('.sz-pct');
 g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  const a=b.dataset.sz;if(a==='in')zoomTo(z*STEP,null,null,true);else if(a==='out')zoomTo(z/STEP,null,null,true);else reset()});
}

// ---- keyboard
const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
addEventListener('keydown',e=>{
 if(e.altKey||typing(e.target))return;
 if(window.ZOOM&&ZOOM.isOpen&&ZOOM.isOpen())return; // a picture is open: its own zoom keys win
 const k=e.key;
 if(k==='+'||k==='='){e.preventDefault();zoomTo(z*STEP,null,null,true)}
 else if(k==='-'||k==='_'){e.preventDefault();zoomTo(z/STEP,null,null,true)}
 else if(k==='0'){e.preventDefault();reset()}
},true);

// ---- mouse wheel: Ctrl/Cmd + scroll (and trackpad pinch) zooms; plain scroll moves a zoomed slide
wrap.addEventListener('wheel',e=>{
 const onModel=e.target.closest&&e.target.closest('.s3 .t');
 if(e.ctrlKey||e.metaKey){e.preventDefault();e.stopPropagation();zoomTo(z*Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0025)),e.clientX,e.clientY,false);return}
 if(z>1.01&&!onModel&&!document.documentElement.classList.contains('ink-on')){
  e.preventDefault();e.stopPropagation();const m=e.deltaMode?30:1;panBy(-e.deltaX*m,-e.deltaY*m)}
},{capture:true,passive:false});

// ---- pointer: two-finger pinch zooms; one-finger/mouse drag moves a zoomed slide
const P=new Map();let mode=null,last=null,pinch=null;
const inkOn=()=>document.documentElement.classList.contains('ink-on');
const mid=()=>{const v=[...P.values()];return{x:(v[0].x+v[1].x)/2,y:(v[0].y+v[1].y)/2,d:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y)}};
wrap.addEventListener('pointerdown',e=>{
 if(inkOn())return;                                   // drawing mode keeps its own finger gestures
 if(e.target.closest&&e.target.closest(NOPAN))return; // 3D models, inputs, drag-and-drop keep theirs
 if(e.pointerType==='mouse'&&e.button!==0)return;
 P.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY});
 if(P.size===2&&e.pointerType==='touch'){mode='pinch';pinch=mid();e.stopPropagation();e.preventDefault()}
 else if(P.size===1){mode=null;last={x:e.clientX,y:e.clientY}}
},true);
wrap.addEventListener('pointermove',e=>{
 const p=P.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;
 if(mode==='pinch'&&P.size>=2){const m=mid();e.stopPropagation();e.preventDefault();
  if(pinch&&pinch.d)zoomTo(z*m.d/pinch.d,m.x,m.y,false);panBy(m.x-pinch.x,m.y-pinch.y);pinch=m;return}
 if(P.size!==1||z<=1.01)return;
 if(mode!=='pan'&&Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>6){mode='pan';wrap.classList.add('sz-drag')}
 if(mode==='pan'){e.stopPropagation();e.preventDefault();panBy(e.clientX-last.x,e.clientY-last.y)}
 last={x:e.clientX,y:e.clientY};
},true);
const up=e=>{
 if(!P.has(e.pointerId))return;P.delete(e.pointerId);
 if(mode==='pinch'||mode==='pan'){e.stopPropagation();quiet=Date.now()+350} // no slide change, no tap after a zoom/move
 if(P.size===1&&mode==='pinch'){const v=[...P.values()][0];last={x:v.x,y:v.y};v.x0=v.x;v.y0=v.y}
 if(!P.size){mode=null;pinch=null;wrap.classList.remove('sz-drag')}
};
wrap.addEventListener('pointerup',up,true);wrap.addEventListener('pointercancel',up,true);
// the click after a drag or pinch must not open a picture or answer a question
addEventListener('click',e=>{if(Date.now()<quiet&&wrap.contains(e.target)){e.stopImmediatePropagation();e.preventDefault()}},true);

// ---- new slide: keep the zoom, start reading from the top-left
const cnt=document.getElementById('count');let seen=cnt&&cnt.textContent;
if(cnt)new MutationObserver(()=>{if(cnt.textContent===seen)return;seen=cnt.textContent;
 if(z>1.01){tx=-box.offsetLeft;ty=-box.offsetTop;paint(false)}}).observe(cnt,{childList:true,characterData:true,subtree:true});

// ---- window size or full screen changed
const refit=()=>requestAnimationFrame(()=>paint(false));
addEventListener('resize',refit);document.addEventListener('fullscreenchange',refit);document.addEventListener('webkitfullscreenchange',refit);
if(window.ResizeObserver)new ResizeObserver(refit).observe(box);

window.SZOOM={in:()=>zoomTo(z*STEP,null,null,true),out:()=>zoomTo(z/STEP,null,null,true),reset,level:()=>z};
})();
