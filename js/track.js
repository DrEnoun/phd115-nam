/* PHD115 Study Hub · Dr. NAM · sign-in and learning-activity tracker.
   One identity per student (matric number), checked against the private class list in the lecturer's Google Sheet.
   Records active time per page and progress snapshots. Nothing runs until ENDPOINT is set. */
(function(){
if(window.NAMTRACK)return;
// ===== Settings =====
const ENDPOINT='https://script.google.com/macros/s/AKfycbxlsR76lDWpbz3-ervsIYhJV19mqV8ciL5CDiV3tOxkiLFyiI-HNuFr-IUrF2v_u5cz/exec';  // paste the Apps Script web app URL (ends in /exec) between the quotes
const CLASSES=['P2PH1101A1','P2PH1101B1','P2PH1101C1','P2PH1101D1','P2PH1101E1'];
const IDLE_MS=120000;   // stop counting time after 2 minutes with no touch, scroll or key press
const FLUSH_MS=120000;  // send data every 2 minutes, and when the page is closed or hidden
// ====================
const IDK='nam:id',QK='nam:queue',FK='nam:flags';
const BASE=(document.currentScript&&document.currentScript.src||'').replace(/track\.js.*$/,'');
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const parts=location.pathname.replace(/\/index\.html$/,'/').split('/').filter(Boolean);
// page code e.g. "em/tutorial"; hub root = "hub"
let page='hub';{const i=parts.findIndex(p=>/^(ic1|ic2|em|cr1|cr2|sol|game|leaderboard)$/.test(p));if(i>=0)page=parts.slice(i).join('/')||parts[i]}
const isHub=page==='hub';
window.NAMTRACK={ENDPOINT,CLASSES,id:()=>get(IDK)};
if(!ENDPOINT)return;

// ---------- queue ----------
function enqueue(ev){const q=get(QK)||[];const i=ev.k?q.findIndex(x=>x.k===ev.k):-1;if(i>=0)q[i]=ev;else q.push(ev);while(q.length>400)q.shift();put(QK,q)}
let sending=false;
function payload(evs){const id=get(IDK);return JSON.stringify({action:'log',m:id.matric,c:id.cls,ua:navigator.userAgent.slice(0,120),ev:evs})}
async function flush(){const id=get(IDK);if(!id||!id.ok||sending)return;const q=get(QK)||[];if(!q.length)return;sending=true;
 const batch=q.slice(0,100);
 try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:payload(batch)});const j=await r.json();
  if(j&&j.ok){const now=get(QK)||[];put(QK,now.filter(x=>!batch.some(b=>b.k===x.k&&b.t===x.t)))}
  else if(j&&j.reauth){localStorage.removeItem(IDK);showSignIn('Please sign in again.')}}
 catch(e){}finally{sending=false}}
function beacon(){const id=get(IDK);if(!id||!id.ok)return;const q=get(QK)||[];if(!q.length)return;
 try{navigator.sendBeacon(ENDPOINT,new Blob([payload(q.slice(0,100))],{type:'text/plain;charset=utf-8'}))}catch(e){}}

// ---------- active time ----------
const vid=rid(),start=Date.now();let active=0,last=Date.now(),lastSent=-1;
['pointerdown','keydown','wheel','touchstart','scroll','input'].forEach(e=>addEventListener(e,()=>{last=Date.now()},{passive:true,capture:true}));
setInterval(()=>{if(document.visibilityState==='visible'&&Date.now()-last<IDLE_MS)active+=5},5000);
function timeEv(){if(active===lastSent||active===0)return;lastSent=active;enqueue({k:'time:'+vid,type:'time',page,vid,sec:active,start,t:Date.now()})}

// ---------- progress snapshots (reads what each page already saves) ----------
const PK=/^phd115:([a-z0-9]+):(slides|pre|post|tut|game)(:state)?$/;
const orig=Storage.prototype.setItem;const pend={};
Storage.prototype.setItem=function(k,v){orig.apply(this,arguments);
 try{if(this===localStorage&&PK.test(k)){clearTimeout(pend[k]);pend[k]=setTimeout(()=>snap(k,v),4000)}}catch(e){}};
function snap(k,v){const m=k.match(PK);let o=null;try{o=JSON.parse(v)}catch(e){}
 const ev={k:'prog:'+k,type:'prog',page:m[1]+'/'+m[2]+(m[3]||''),t:Date.now()};
 if(o&&!m[3]){['best','total','done','answered','max'].forEach(f=>{if(o[f]!==undefined)ev[f]=o[f]});if(m[2]==='slides'&&o.total)ev.total=o.total}
 if(m[3]||m[2]==='pre'||m[2]==='post')ev.data=String(v).slice(0,6000);
 enqueue(ev)}


// ---------- entrance / exit surveys ----------
function loadSurvey(cb){if(window.NAMSURVEY)return cb();const s=document.createElement('script');s.src=BASE+'survey.js';s.onload=cb;document.head.appendChild(s)}
function surveys(f){if(!f)return;put(FK,Object.assign({},f,{at:Date.now()}));const id=get(IDK);if(!id||!id.ok)return;
 const kind=!f.entry?'entry':(f.exitOpen&&!f.exit?'exit':null);if(!kind)return;
 try{if(sessionStorage.getItem('nam:skip:'+kind))return}catch(e){}
 loadSurvey(()=>NAMSURVEY.open(kind,{skippable:!f.required,
  submit:async A=>{try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'survey',m:id.matric,c:id.cls,kind,answers:A})});const j=await r.json();return !!(j&&j.ok)}catch(e){return false}},
  onDone:()=>{f[kind]=true;put(FK,Object.assign({},f,{at:Date.now()}))},
  onSkip:()=>{try{sessionStorage.setItem('nam:skip:'+kind,'1')}catch(e){}}}))}
async function checkFlags(){const id=get(IDK);if(!id||!id.ok)return;const f=get(FK);
 if(f&&Date.now()-f.at<6*3600e3&&f.entry&&(!f.exitOpen||f.exit))return;
 try{const j=await (await fetch(ENDPOINT+'?action=status&m='+encodeURIComponent(id.matric)+'&c='+encodeURIComponent(id.cls))).json();if(j&&j.ok)surveys(j.flags);else if(j&&j.reauth){localStorage.removeItem(IDK);showSignIn('Please sign in again.')}}
 catch(e){if(f)surveys(f)}}

// ---------- sign-in UI ----------
const CSS=`.namov{position:fixed;inset:0;z-index:99999;background:rgba(27,42,65,.72);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:calc(20px + env(safe-area-inset-top,0px)) 14px 30px;font-family:Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.namov *{box-sizing:border-box}.nambox{background:#fff;color:#1B2A41;border-radius:16px;max-width:460px;width:100%;padding:20px 20px 18px;line-height:1.5;box-shadow:0 10px 40px rgba(0,0,0,.3)}
.nambox h2{margin:0 0 4px;font-size:1.25rem}.nambox .b{margin:0 0 12px;color:#B86E00;font-weight:600;font-size:.88rem}
.nambox label{display:block;font-weight:600;font-size:.9rem;margin:10px 0 4px}
.nambox input[type=text],.nambox select{width:100%;font:inherit;font-size:1rem;border:1.5px solid #D7E0E8;border-radius:10px;padding:9px 11px;background:#fff;color:#1B2A41}
.nambox .ck{display:flex;gap:9px;align-items:flex-start;font-weight:400;font-size:.88rem;margin:12px 0 0;background:#F2F6F9;border-radius:10px;padding:9px 11px}
.nambox .ck input{margin-top:4px;flex:none;width:18px;height:18px}
.nambox .hint{font-size:.8rem;color:#56657A;margin:3px 0 0}
.nambox .err{background:#FBE7E5;color:#B3261E;border-radius:10px;padding:8px 11px;font-size:.9rem;margin-top:12px}
.nambox .namrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.nambox button{font:inherit;font-weight:600;font-size:.95rem;border:0;border-radius:10px;padding:10px 16px;background:#2F6F9F;color:#fff;cursor:pointer}
.nambox button.gh{background:transparent;color:#2F6F9F;border:1.5px solid #2F6F9F}.nambox button:disabled{opacity:.6}
.namchip{display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:.85rem;color:#C9D3DC;margin-top:12px}
.namchip b{color:#fff;font-weight:600}.namchip button{font:inherit;font-size:.8rem;background:transparent;color:#F0B24A;border:1px solid rgba(240,178,74,.6);border-radius:8px;padding:3px 9px;cursor:pointer}`;
function css(){if(document.getElementById('namcss'))return;const s=document.createElement('style');s.id='namcss';s.textContent=CSS;document.head.appendChild(s)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function showSignIn(msg,edit){css();const old=document.querySelector('.namov');if(old)old.remove();const id=get(IDK)||{};
 const d=document.createElement('div');d.className='namov';d.innerHTML=`<div class="nambox" role="dialog" aria-modal="true" aria-labelledby="namh">
 <img src="${BASE}../img/drnam.jpg" alt="Chemistry with Dr. NAM" style="display:block;width:96px;height:96px;margin:-4px auto 6px"><h2 id="namh">${edit?'Your details':'Welcome to the Study Hub'}</h2><p class="b">PHD115 · Dr. NAM · Faculty of Pharmacy, UiTM Bertam</p>
 <p style="margin:0;font-size:.9rem">Sign in once on each device. Use the same matric number every time, so your progress follows you.</p>
 <label for="namn">Full name</label><input type="text" id="namn" autocomplete="name" value="${esc(id.name||'')}" placeholder="e.g. Nur Alia Ahmad">
 <label for="namc">Class</label><select id="namc"><option value="">Choose your class…</option>${CLASSES.map(c=>`<option ${id.cls===c?'selected':''}>${c}</option>`).join('')}</select>
 <label for="namm">Matric number</label><input type="text" id="namm" inputmode="numeric" autocomplete="off" maxlength="10" value="${esc(id.matric||'')}" placeholder="10 digits, e.g. 2026123456"><p class="hint">10 digits, no spaces.</p>
 <label class="ck"><input type="checkbox" id="namk1" ${id.ok?'checked':''}><span>The hub saves your progress and study time, so Dr. NAM can see which topics need more help. <b>This is not part of your marks.</b></span></label>
 <label class="ck"><input type="checkbox" id="namk2" ${id.research?'checked':''}><span><b>Help improve the Study Hub (optional).</b> Dr. NAM may use your results, with your name removed, to see how the hub helps students learn. Saying no will not affect you in any way, and you can change your mind later.</span></label>
 <div class="err" id="name" ${msg?'':'hidden'}>${esc(msg||'')}</div>
 <div class="namrow"><button id="namgo">${edit?'Save':'Let\'s start'}</button>${edit?'<button class="gh" id="namx">Cancel</button>':''}</div></div>`;
 document.body.appendChild(d);
 const $=s=>d.querySelector(s),err=t=>{$('#name').hidden=false;$('#name').textContent=t};
 $('#namm').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,10)});
 if($('#namx'))$('#namx').onclick=()=>d.remove();
 $('#namgo').onclick=async()=>{const n=$('#namn').value.trim().replace(/\s+/g,' '),c=$('#namc').value,m=$('#namm').value.trim(),r=$('#namk2').checked;
  if(n.split(' ').length<2)return err('Please type your full name (at least two words).');if(!c)return err('Please choose your class.');
  if(!/^\d{10}$/.test(m))return err('Your matric number should have 10 digits.');if(!$('#namk1').checked)return err('Please tick the first box to continue.');
  $('#namgo').disabled=true;$('#namgo').textContent='Checking…';
  try{const u=ENDPOINT+'?action=verify&m='+encodeURIComponent(m)+'&c='+encodeURIComponent(c)+'&n='+encodeURIComponent(n)+'&r='+(r?1:0);
   const j=await (await fetch(u)).json();
   if(j.ok){const prev=get(IDK);if(prev&&prev.matric&&prev.matric!==m)put(QK,[]);put(IDK,{matric:m,cls:c,name:j.name,research:r,ok:true,v:Date.now()});d.remove();chip();flush();if(!edit)surveys(j.flags)}
   else{err(j.msg||'We could not find you yet. Please check your details and try again.');$('#namgo').disabled=false;$('#namgo').textContent=edit?'Save':'Let\'s start'}}
  catch(e){err('No internet connection right now. Please try again in a moment.');$('#namgo').disabled=false;$('#namgo').textContent=edit?'Save':'Let\'s start'}};
}
function chip(){if(!isHub)return;const id=get(IDK);const h=document.querySelector('header .in')||document.querySelector('header');if(!h||!id||!id.ok)return;css();
 let c=document.getElementById('namchip');if(!c){c=document.createElement('div');c.id='namchip';c.className='namchip';h.appendChild(c)}
 c.innerHTML=`<span>Signed in as <b>${esc(id.name)}</b> · ${esc(id.cls)}</span><button id="named">My details</button>`;
 c.querySelector('#named').onclick=()=>showSignIn('',true)}

// ---------- start ----------
function boot(){const id=get(IDK);
 if(!id||!id.ok)showSignIn('');else{chip();checkFlags()}
 enqueue({k:'view:'+vid,type:'view',page,vid,t:Date.now(),ref:document.referrer?'1':''});
 setTimeout(flush,3000);setInterval(()=>{timeEv();flush()},FLUSH_MS)}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){timeEv();beacon()}else last=Date.now()});
addEventListener('pagehide',()=>{timeEv();beacon()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
