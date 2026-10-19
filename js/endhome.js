/* PHD115 · Chemistry with Dr. NAM · a "Back to the Study Hub" button at the end of each activity. */
(function(){
if(/[?&]print\b/.test(location.search))return;
const topic=(location.pathname.match(/\/(ic1|ic2|em|cr1|cr2|sol)\//)||[])[1]||'';
const href='../../'+(topic?'#'+topic:'');
const css=`.endhome{margin:28px 0 8px;padding:22px 18px;border-radius:16px;background:var(--cold-soft,#E1EEF7);text-align:center}
.endhome p{margin:0 0 12px;font-weight:600;color:var(--ink,#1B2A41)}
.endhome a{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 22px;border-radius:14px;background:var(--cold,#2F6F9F);color:#fff;font:inherit;font-weight:700;font-size:1.05rem;text-decoration:none;box-shadow:0 4px 14px rgba(47,111,159,.28)}
.endhome a:hover{filter:brightness(1.08)}.endhome a:focus-visible{outline:3px solid var(--heat,#B86E00);outline-offset:3px}
@media print{.endhome{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
function make(){const d=document.createElement('div');d.className='endhome';
 d.innerHTML=`<p>All done here? Great work! 🎉</p><a href="${href}">⌂ Back to the Study Hub</a>`;return d}
function place(){if(document.querySelector('.endhome'))return;
 const f=document.querySelector('main footer')||document.querySelector('footer');
 if(f&&f.parentNode)f.parentNode.insertBefore(make(),f);
 else{const app=document.getElementById('app');(app||document.body).appendChild(make())}}
const go=()=>{place();const app=document.getElementById('app');if(app)new MutationObserver(place).observe(app,{childList:true,subtree:true})};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
