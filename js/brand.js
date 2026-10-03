/* PHD115 Study Hub · branding: UiTM and Chemistry with Dr. NAM logos, browser icons. */
(function(){
if(window.NAMBRAND)return;window.NAMBRAND=1;
const IMG=(document.currentScript&&document.currentScript.src||'').replace(/js\/brand\.js.*$/,'img/');
const head=document.head;
[['icon','drnam-48.png','image/png'],['apple-touch-icon','drnam-180.png','']].forEach(([rel,f,t])=>{
 if(document.querySelector(`link[rel="${rel}"]`))return;const l=document.createElement('link');l.rel=rel;l.href=IMG+f;if(t)l.type=t;head.appendChild(l)});
const isSlides=/\/slides\/?(index\.html)?$/.test(location.pathname);
const isHub=!/\/(ic1|ic2|em|cr1|cr2|sol|game|leaderboard)\//.test(location.pathname);
if(isSlides)return;
const css=`.nambrand{background:#fff;border-bottom:1px solid #D7E0E8;padding-top:env(safe-area-inset-top,0px)}
.nambrand .bi{max-width:860px;margin:0 auto;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.nambrand img{display:block;height:auto}.nambrand .u{width:${isHub?150:112}px;max-width:42vw}.nambrand .d{width:${isHub?92:58}px}
@media print{.nambrand{border-bottom:2px solid #1B2A41}}`;
const s=document.createElement('style');s.textContent=css;head.appendChild(s);
function put(){if(document.querySelector('.nambrand'))return;const b=document.createElement('div');b.className='nambrand';
 b.innerHTML=`<div class="bi"><img class="u" src="${IMG}uitm.png" alt="Universiti Teknologi MARA"><img class="d" src="${IMG}drnam.jpg" alt="Chemistry with Dr. NAM"></div>`;
 document.body.insertBefore(b,document.body.firstChild)}
if(document.body)put();else document.addEventListener('DOMContentLoaded',put);
})();
