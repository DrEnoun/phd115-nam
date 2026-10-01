/* PHD115 · Chemistry with Dr. NAM · draw and highlight on interactive slides (Apple Pencil, stylus, finger or mouse). */
(function(){
if(window.INK)return;
const stage=document.getElementById('stage');if(!stage)return;
const W=1280,H=720,KEY='phd115-ink:'+location.pathname;
const COLS=['#E0463C','#2F6F9F','#2E7D4F','#1B2A41','#B86E00','#FFFFFF'],HCOLS=['#FFE14D','#7CF29A','#7FD3FF','#FF9AD5'];
const SIZES={pen:[2.5,4.5,8],hl:[16,26,40],er:[14,26,44]};
let on=false,tool='pen',col=COLS[0],hcol=HCOLS[0],size=1,hidden=false,penSeen=false,fingerDraw=true;
let ink={};try{ink=JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch(_){}
const G=(0,eval);const cur=()=>{try{const v=G('typeof cur!=="undefined"?cur:0');return typeof v==='number'?v:0}catch(_){return 0}};
const css=`
#ink-base,#ink-live{position:absolute;left:0;top:0;width:${W}px;height:${H}px;z-index:6;pointer-events:none}
#ink-live{z-index:7}
#ink-live.on{pointer-events:auto;touch-action:none;cursor:crosshair}
#ink-live.on.er{cursor:cell}
.ink-btn{font:inherit;font-weight:600;cursor:pointer}
#ink-bar{position:fixed;left:calc(8px + env(safe-area-inset-left,0px));top:50%;transform:translateY(-50%);z-index:20;display:grid;grid-template-columns:repeat(2,40px);gap:6px;justify-items:center;
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
#ink-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:21;background:rgba(27,42,65,.92);color:#fff;font:600 13px Lexend,system-ui,sans-serif;padding:8px 14px;border-radius:10px;pointer-events:none;opacity:0;transition:opacity .25s}
@media (max-height:620px){#ink-bar{grid-template-columns:repeat(3,36px)}#ink-bar button{width:36px;height:36px}#ink-bar [data-a=done]{width:120px}}
@media print{#ink-bar,#ink-toast{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const base=document.createElement('canvas');base.id='ink-base';const live=document.createElement('canvas');live.id='ink-live';
stage.appendChild(base);stage.appendChild(live);
const bc=base.getContext('2d'),lc=live.getContext('2d');
let K=1;
function resize(){const r=stage.getBoundingClientRect();K=Math.min(4,Math.max(1,(r.width/W)*(window.devicePixelRatio||1)));
 for(const c of [base,live]){c.width=Math.round(W*K);c.height=Math.round(H*K)}redraw()}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(ink))}catch(_){}}
function strokesNow(){const k=cur();return ink[k]||(ink[k]=[])}
function drawStroke(ctx,s){const p=s.p;if(!p.length)return;ctx.save();ctx.scale(K,K);ctx.lineCap='round';ctx.lineJoin='round';
 if(s.t==='hl'){ctx.globalAlpha=.38;ctx.strokeStyle=s.c;ctx.lineWidth=s.w;ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
  for(let i=1;i<p.length;i++){const m=[(p[i-1][0]+p[i][0])/2,(p[i-1][1]+p[i][1])/2];ctx.quadraticCurveTo(p[i-1][0],p[i-1][1],m[0],m[1])}
  ctx.lineTo(p[p.length-1][0],p[p.length-1][1]);if(p.length===1)ctx.lineTo(p[0][0]+.1,p[0][1]);ctx.stroke()}
 else{ctx.strokeStyle=s.c;ctx.fillStyle=s.c;if(p.length===1){ctx.beginPath();ctx.arc(p[0][0],p[0][1],s.w*(.4+.9*p[0][2])/2,0,7);ctx.fill()}
  for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],pa=i>1?p[i-2]:a;ctx.lineWidth=s.w*(.4+.9*(a[2]+b[2])/2);ctx.beginPath();
   ctx.moveTo((pa[0]+a[0])/2,(pa[1]+a[1])/2);ctx.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);ctx.stroke()}
  const a=p[p.length-1];ctx.beginPath();ctx.moveTo(p.length>1?(p[p.length-2][0]+a[0])/2:a[0],p.length>1?(p[p.length-2][1]+a[1])/2:a[1]);ctx.lineTo(a[0],a[1]);ctx.lineWidth=s.w*(.4+.9*a[2]);ctx.stroke()}
 ctx.restore()}
let shown=-1;
function redraw(){bc.clearRect(0,0,base.width,base.height);shown=cur();if(hidden)return;(ink[shown]||[]).forEach(s=>drawStroke(bc,s))}
setInterval(()=>{if(cur()!==shown)redraw()},150);
// ---- pointer input
let drawing=null,laser=[],laserRAF=0,active=null;
function pt(e){const r=live.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H,e.pointerType==='pen'?(e.pressure||.5):.5]}
function allowed(e){if(e.pointerType==='pen'){if(!penSeen){penSeen=true;fingerDraw=false;bar&&paint();toast('Pencil detected: only the pencil draws now. Tap the hand button to let fingers draw too.')}return true}
 if(e.pointerType==='touch')return fingerDraw;return e.button===0}
function eraseAt(q){const S=strokesNow();const r=SIZES.er[size];let hit=false;for(let i=S.length-1;i>=0;i--){if(S[i].p.some(p=>Math.hypot(p[0]-q[0],p[1]-q[1])<r+S[i].w/2)){S.splice(i,1);hit=true}}if(hit){save();redraw()}}
['pointerdown','pointermove','pointerup','pointercancel','click','touchstart','touchmove','touchend','mousedown','mouseup','wheel'].forEach(t=>live.addEventListener(t,e=>{if(on)e.stopPropagation()},{passive:false}));
live.addEventListener('pointerdown',e=>{if(!on||!allowed(e))return;e.preventDefault();if(active!==null)return;active=e.pointerId;try{live.setPointerCapture(e.pointerId)}catch(_){}
 const q=pt(e);if(tool==='er'){eraseAt(q);return}if(tool==='laser'){laser.push([q[0],q[1],performance.now()]);runLaser();return}
 drawing={t:tool,c:tool==='hl'?hcol:col,w:SIZES[tool==='hl'?'hl':'pen'][size],p:[q]};liveDraw()});
live.addEventListener('pointermove',e=>{if(!on||e.pointerId!==active)return;e.preventDefault();const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
 for(const ev of (evs.length?evs:[e])){const q=pt(ev);if(tool==='er')eraseAt(q);else if(tool==='laser')laser.push([q[0],q[1],performance.now()]);else if(drawing){const l=drawing.p[drawing.p.length-1];if(Math.hypot(q[0]-l[0],q[1]-l[1])>.6)drawing.p.push(q)}}
 if(drawing)liveDraw()});
function end(e){if(e.pointerId!==active)return;active=null;if(drawing){strokesNow().push(drawing);drawing=null;lc.clearRect(0,0,live.width,live.height);save();if(hidden){hidden=false;paint()}redraw()}}
live.addEventListener('pointerup',end);live.addEventListener('pointercancel',end);
function liveDraw(){lc.clearRect(0,0,live.width,live.height);if(drawing)drawStroke(lc,drawing)}
function runLaser(){if(laserRAF)return;const step=()=>{const now=performance.now();laser=laser.filter(p=>now-p[2]<700);if(drawing)return;lc.clearRect(0,0,live.width,live.height);
 lc.save();lc.scale(K,K);for(let i=1;i<laser.length;i++){const a=laser[i-1],b=laser[i],f=1-(now-b[2])/700;lc.strokeStyle=`rgba(255,40,40,${.85*f})`;lc.lineWidth=6*f+2;lc.lineCap='round';lc.beginPath();lc.moveTo(a[0],a[1]);lc.lineTo(b[0],b[1]);lc.stroke()}
 const l=laser[laser.length-1];if(l){lc.fillStyle='rgba(255,30,30,.95)';lc.shadowColor='rgba(255,0,0,.9)';lc.shadowBlur=14;lc.beginPath();lc.arc(l[0],l[1],7,0,7);lc.fill()}lc.restore();
 laserRAF=laser.length?requestAnimationFrame(step):0;if(!laserRAF)lc.clearRect(0,0,live.width,live.height)};laserRAF=requestAnimationFrame(step)}
// ---- toolbar
const I={pen:'<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/></svg>',hl:'<svg viewBox="0 0 24 24"><path d="M9 14l-3 6h6l1-3"/><path d="M8 13l7-9 4 3-7 9z"/></svg>',
laser:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',er:'<svg viewBox="0 0 24 24"><path d="M7 20h10"/><path d="M5 15l8-9 6 6-6 7H9z"/></svg>',
undo:'<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12"/></svg>',clr:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',hand:'<svg viewBox="0 0 24 24"><path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V6a1.5 1.5 0 013 0v8a7 7 0 01-7 7 6 6 0 01-5-3l-3-5a1.5 1.5 0 012.5-1.5L8 15"/></svg>'};
let bar=null;
function paint(){if(!bar)return;bar.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));
 bar.querySelectorAll('[data-c]').forEach(b=>{b.hidden=tool==='hl'?!HCOLS.includes(b.dataset.c):!COLS.includes(b.dataset.c);b.setAttribute('aria-pressed',b.dataset.c===(tool==='hl'?hcol:col))});
 bar.querySelectorAll('[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===size));
 const h=bar.querySelector('[data-a=hide]');h.setAttribute('aria-pressed',hidden);const f=bar.querySelector('[data-a=finger]');f.hidden=!penSeen;f.setAttribute('aria-pressed',fingerDraw);
 live.classList.toggle('er',tool==='er')}
function build(){bar=document.createElement('div');bar.id='ink-bar';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Drawing tools');
 bar.innerHTML=`<button data-tool="pen" aria-label="Pen" title="Pen">${I.pen}<span class="lbl">Pen</span></button><button data-tool="hl" aria-label="Highlighter" title="Highlighter">${I.hl}<span class="lbl">Highlight</span></button><button data-tool="laser" aria-label="Laser pointer" title="Laser pointer">${I.laser}<span class="lbl">Laser</span></button><button data-tool="er" aria-label="Eraser" title="Eraser">${I.er}<span class="lbl">Erase</span></button><span class="sep"></span>
 ${COLS.concat(HCOLS).map(c=>`<button class="sw" data-c="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<span class="sep"></span>
 ${[0,1,2].map(s=>`<button data-s="${s}" aria-label="${['Thin','Medium','Thick'][s]}"><span style="display:inline-block;width:${[5,9,14][s]}px;height:${[5,9,14][s]}px;border-radius:50%;background:currentColor"></span></button>`).join('')}<span class="sep"></span>
 <button data-a="undo" aria-label="Undo">${I.undo}</button><button data-a="clear" aria-label="Clear this slide">${I.clr}</button><button data-a="hide" aria-label="Hide or show ink">${I.eye}</button><button data-a="finger" aria-label="Allow finger drawing" hidden>${I.hand}</button><span class="sep"></span>
 <button data-a="prev" aria-label="Previous slide">←</button><button data-a="next" aria-label="Next slide">→</button><button data-a="side" aria-label="Move toolbar to the other side">⇄</button><button data-a="done" aria-label="Stop drawing">Done</button>`;
 document.body.appendChild(bar);
 ['pointerdown','pointerup','click','touchstart','touchend'].forEach(t=>bar.addEventListener(t,e=>e.stopPropagation()));
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tool){tool=b.dataset.tool}else if(b.dataset.c){if(tool==='hl')hcol=b.dataset.c;else{col=b.dataset.c;if(tool!=='pen')tool='pen'}}else if(b.dataset.s)size=+b.dataset.s;
  else{const a=b.dataset.a;if(a==='undo'){strokesNow().pop();save();redraw()}else if(a==='clear'){if(strokesNow().length&&confirm('Clear all drawing on this slide?')){ink[cur()]=[];save();redraw()}}
   else if(a==='hide'){hidden=!hidden;redraw()}else if(a==='finger'){fingerDraw=!fingerDraw;toast(fingerDraw?'Finger drawing on':'Finger drawing off (pencil only)')}
   else if(a==='prev'||a==='next'){const n=document.getElementById(a==='prev'?'bPrev':'bNext');n&&n.click();setTimeout(redraw,60)}else if(a==='side'){bar.classList.toggle('right')}else if(a==='done')toggle(false)}
  paint()});paint()}
let tt=0;function toast(m){let t=document.getElementById('ink-toast');if(!t){t=document.createElement('div');t.id='ink-toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>t.style.opacity=0,2600)}
function toggle(v){on=v===undefined?!on:v;if(!bar)build();bar.hidden=!on;live.classList.toggle('on',on);document.querySelectorAll('.ink-toggle').forEach(b=>b.setAttribute('aria-pressed',on));
 if(on){if(hidden){hidden=false;redraw()}toast('Drawing on. Slides do not change when you tap. Press D or Done to stop.')}else{lc.clearRect(0,0,live.width,live.height)}paint()}
// ---- launcher button and keys
function mount(){if(document.querySelector('.ink-toggle'))return;const slot=document.querySelector('[data-ink-slot]')||document.getElementById('ctl');const b=document.createElement('button');b.type='button';b.className='ink-btn ink-toggle';
 b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Draw on slide');b.innerHTML='✎ Draw';b.addEventListener('click',e=>{e.stopPropagation();toggle()});
 if(slot){slot.insertBefore(b,slot.firstChild)}else{b.style.cssText='position:fixed;left:12px;bottom:12px;z-index:9';document.body.appendChild(b)}}
document.addEventListener('keydown',e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
 if((e.key==='d'||e.key==='D')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();toggle();return}
 if(on&&e.key==='Escape'){e.stopImmediatePropagation();toggle(false);return}
 if(on&&(e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z')){e.preventDefault();strokesNow().pop();save();redraw()}
 if(on&&(e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key===' '||e.key==='PageDown'||e.key==='PageUp'))setTimeout(redraw,60)},true);
addEventListener('resize',()=>setTimeout(resize,60));document.addEventListener('fullscreenchange',()=>setTimeout(resize,120));document.addEventListener('webkitfullscreenchange',()=>setTimeout(resize,120));
window.INK={toggle,clearAll(){ink={};save();redraw()},resize};
const init=()=>{mount();resize()};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
