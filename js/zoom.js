/* PHD115 · Chemistry with Dr. NAM · tap any figure to open it large; zoom with the buttons, wheel, pinch or double-tap; drag to move. */
(function(){
if(window.ZOOM)return;
if(/[?&]print\b/.test(location.search)){window.ZOOM={can:()=>false};return}
const SKIP='.logos,.disc,.plate,button,a,label,.opt,.chip,[draggable],#ink-bar,.zm-ov,header,.brand,.nambrand';
const can=im=>!!(im&&im.tagName==='IMG'&&!im.closest(SKIP)&&(im.naturalWidth||im.width)>=60&&!/drnam\.jpg/.test(im.src));
const css=`
img.zm{cursor:zoom-in}
.zm-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(6,14,26,.92);display:grid;place-items:center;touch-action:none;-webkit-user-select:none;user-select:none}
.zm-ov[hidden]{display:none}
.zm-wrap{position:absolute;inset:56px 16px 72px;overflow:hidden;display:grid;place-items:center}
.zm-pic{position:relative;background:#fff;border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.45);transform-origin:center center;will-change:transform;cursor:grab;max-width:none}
.zm-pic.drag{cursor:grabbing}
.zm-pic img{display:block;width:100%;height:auto;pointer-events:none}
.zm-cap{position:absolute;left:16px;right:16px;bottom:16px;text-align:center;color:#E6F7F5;font:500 15px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.zm-bar{position:absolute;top:10px;right:12px;display:flex;gap:8px}
.zm-bar button{font:700 18px/1 system-ui,sans-serif;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(20,36,58,.9);color:#fff;cursor:pointer}
.zm-bar .zm-draw{width:auto;padding:0 14px;font-size:15px;border-radius:999px}.zm-bar .zm-draw[aria-pressed=true]{background:#F0B24A;color:#1B2A41;border-color:#F0B24A}
.zm-bar button:focus-visible{outline:3px solid #D4FF3A;outline-offset:2px}
.zm-hint{position:absolute;top:18px;left:16px;color:#9FB6C8;font:14px system-ui,sans-serif}
@media (max-width:600px){.zm-hint{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let ov,pic,cap,s=1,x=0,y=0,base=1,last=null,pf=null,mq=0;
function build(){
 ov=document.createElement('div');ov.className='zm-ov';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Enlarged figure');
 ov.innerHTML='<div class="zm-hint">Scroll or pinch to zoom · drag to move · Esc to close</div><div class="zm-bar"><button class="zm-draw" data-z="draw" aria-pressed="false" aria-label="Draw on the picture">✎ Draw</button><button data-z="out" aria-label="Zoom out">−</button><button data-z="fit" aria-label="Reset zoom">⤢</button><button data-z="in" aria-label="Zoom in">+</button><button data-z="x" aria-label="Close">✕</button></div><div class="zm-wrap"><div class="zm-pic"><img alt=""></div></div><div class="zm-cap"></div>';
 document.body.appendChild(ov);pic=ov.querySelector('.zm-pic');cap=ov.querySelector('.zm-cap');
 ov.querySelector('.zm-bar').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();const z=b.dataset.z;
  if(z==='draw'){window.INK&&INK.toggle()}else if(z==='x')close();else if(z==='fit'){s=1;x=y=0;paint()}else zoomBy(z==='in'?1.4:1/1.4)});
 ov.addEventListener('click',e=>{if(e.target===ov||e.target.classList.contains('zm-wrap'))close()});
 ov.addEventListener('wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?1.15:1/1.15)},{passive:false});
 const pts=new Map();let pd=0,ps=1,moved=false,tapT=0;
 pic.addEventListener('pointerdown',e=>{pic.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);moved=false;
  if(pts.size===2){const [a,b]=[...pts.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1]);ps=s}last=[e.clientX,e.clientY];pic.classList.add('drag')});
 pic.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd)set(ps*d/pd);moved=true;return}
  const dx=e.clientX-last[0],dy=e.clientY-last[1];if(Math.abs(dx)+Math.abs(dy)>2)moved=true;x+=dx;y+=dy;last=[e.clientX,e.clientY];paint()});
 const up=e=>{pts.delete(e.pointerId);if(pts.size===1)last=[...pts.values()][0];if(!pts.size){pic.classList.remove('drag');
  if(!moved){const t=Date.now();if(t-tapT<320){s>1.05?(s=1,x=y=0,paint()):set(2.2);tapT=0}else tapT=t}}};
 pic.addEventListener('pointerup',up);pic.addEventListener('pointercancel',up);
 pic.addEventListener('click',e=>e.stopPropagation());
}
function set(v){s=Math.min(8,Math.max(.5,v));if(s<=1.001){x=y=0}paint()}
function zoomBy(f){set(s*f)}
function paint(){pic.style.transform=`translate(${x}px,${y}px) scale(${s})`}
function open(im){if(!ov)build();const img=pic.querySelector('img');img.src=im.currentSrc||im.src;img.alt=im.alt||'';
 const fc=im.closest('figure');const c=fc&&fc.querySelector('figcaption');cap.innerHTML=c?c.innerHTML:(im.alt||'');
 const W=innerWidth-32-28,H=innerHeight-128-28,nw=im.naturalWidth||im.width||400,nh=im.naturalHeight||im.height||300;
 base=Math.min(W/nw,H/nh,4);pic.style.width=Math.round(nw*base+28)+'px';s=1;x=y=0;paint();
 ov.querySelector('.zm-draw').hidden=!window.INK;ov.hidden=false;pf=document.activeElement;ov.querySelector('[data-z="x"]').focus();
 const go=()=>dispatchEvent(new CustomEvent('zm:open',{detail:{pic,img:im}}));img.decode?img.decode().then(go,go):go()}
function close(){if(!ov||ov.hidden)return;ov.hidden=true;dispatchEvent(new CustomEvent('zm:close'));try{pf&&pf.focus&&pf.focus()}catch(_){}}
addEventListener('keydown',e=>{if(!ov||ov.hidden)return;
 if(/^[dDmM]$/.test(e.key)||((e.ctrlKey||e.metaKey)&&/^[zZ]$/.test(e.key)))return; // drawing keys still work on a zoomed picture
 e.stopImmediatePropagation();
 if(e.key==='Escape')close();else if(e.key==='+'||e.key==='=')zoomBy(1.4);else if(e.key==='-')zoomBy(1/1.4);else if(e.key==='0'){s=1;x=y=0;paint()}
 if(e.key!=='Tab')e.preventDefault()},true);
document.addEventListener('click',e=>{const im=e.target.closest&&e.target.closest('img');if(can(im)){e.preventDefault();e.stopPropagation();open(im)}},true);
const mark=()=>document.querySelectorAll('img:not(.zm)').forEach(im=>{const f=()=>{if(can(im))im.classList.add('zm')};im.complete?f():im.addEventListener('load',f,{once:true})});
new MutationObserver(()=>{if(!mq)mq=requestAnimationFrame(()=>{mq=0;mark()})}).observe(document.documentElement,{childList:true,subtree:true});mark();
window.ZOOM={can,open,close,isOpen:()=>!!(ov&&!ov.hidden),panBy(dx,dy){x+=dx;y+=dy;paint()},scaleBy(f){set(s*f)}};
})();
