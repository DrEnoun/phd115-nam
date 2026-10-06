/* PHD115 Study Hub · Dr. NAM · sign-in and learning-activity tracker.
   One identity per student (matric number), checked against the private class list in the lecturer's Google Sheet.
   Sign in with the form once, or with a personal link (?key=...). Outsiders use ?guest (nothing is sent).
   Records active time per page and progress snapshots. Nothing runs until ENDPOINT is set. */
(function(){
if(window.NAMTRACK)return;
// ===== Settings =====
const ENDPOINT='https://script.google.com/macros/s/AKfycbzj_J_NgKHASDzapBRXRfWITgwIz3uCaGJOeLtbW2sweSB4Prrx1HXA6xUv-B9VRnYf/exec';  // paste the Apps Script web app URL (ends in /exec) between the quotes
const CLASSES=['P2PH1101A1','P2PH1101B1','P2PH1101C1','P2PH1101D1','P2PH1101E1'];
const IDLE_MS=120000;   // stop counting time after 2 minutes with no touch, scroll or key press
const FLUSH_MS=120000;  // send data every 2 minutes, and when the page is closed or hidden
// Shown on the sign-in box, the game and the leaderboard. Edit the words here, or set to '' to hide it everywhere.
const REWARD='The top scorer for each topic will be rewarded by Dr. NAM. Sign in and finish the game to qualify.';
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
const PUB=document.documentElement.hasAttribute('data-public');
const HOME=BASE.replace(/js\/$/,'');
const QS=new URLSearchParams(location.search);
const LKEY=(QS.get('key')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16),GUEST=QS.has('guest');
window.NAMTRACK={ENDPOINT,CLASSES,REWARD,id:()=>get(IDK)};
if(!ENDPOINT)return;

// ---------- queue ----------
function enqueue(ev){const me=get(IDK);if(me&&me.guest)return;const q=get(QK)||[];const i=ev.k?q.findIndex(x=>x.k===ev.k):-1;if(i>=0)q[i]=ev;else q.push(ev);while(q.length>400)q.shift();put(QK,q)}
let sending=false;
// GET via JSONP (a <script> tag): avoids browser cross-site blocking of the reply.
function jsonp(q){return new Promise((ok,no)=>{const cb='namcb'+rid();const s=document.createElement('script');let done=false;
 const end=()=>{done=true;try{delete window[cb]}catch(e){window[cb]=undefined}s.remove()};
 window[cb]=j=>{end();ok(j)};s.onerror=()=>{if(!done){end();no(new Error('load'))}};
 setTimeout(()=>{if(!done){end();no(new Error('timeout'))}},20000);
 s.src=ENDPOINT+'?'+q+'&callback='+cb+'&hub_t='+Date.now();document.head.appendChild(s)})}
// POST without reading the reply (the data still reaches the Sheet).
function send(body){return fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body})}
function payload(evs){const id=get(IDK);return JSON.stringify({action:'log',m:id.matric,c:id.cls,ua:navigator.userAgent.slice(0,120),ev:evs})}
async function flush(){const id=get(IDK);if(!id||!id.ok||sending)return;const q=get(QK)||[];if(!q.length)return;sending=true;
 const batch=q.slice(0,100);
 try{await send(payload(batch));const now=get(QK)||[];put(QK,now.filter(x=>!batch.some(b=>b.k===x.k&&b.t===x.t)))}
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
// Send pending progress now (used by the game so a new best reaches the leaderboard quickly).
window.NAMTRACK.sync=async function(){Object.keys(pend).forEach(k=>{clearTimeout(pend[k]);delete pend[k];try{snap(k,localStorage.getItem(k))}catch(e){}});timeEv();await flush()};
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
  submit:async A=>{try{await send(JSON.stringify({action:'survey',m:id.matric,c:id.cls,kind,answers:A}));
   for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,1500*(i+1)));const j=await jsonp('hub_op=status&hub_matric='+encodeURIComponent(id.matric)+'&hub_class='+encodeURIComponent(id.cls));if(j&&j.ok&&j.flags&&j.flags[kind])return true}
   return false}catch(e){return false}},
  onDone:()=>{f[kind]=true;put(FK,Object.assign({},f,{at:Date.now()}))},
  onSkip:()=>{try{sessionStorage.setItem('nam:skip:'+kind,'1')}catch(e){}}}))}
async function checkFlags(){const id=get(IDK);if(!id||!id.ok)return;const f=get(FK);
 if(f&&Date.now()-f.at<6*3600e3&&f.entry&&(!f.exitOpen||f.exit))return;
 try{const j=await jsonp('hub_op=status&hub_matric='+encodeURIComponent(id.matric)+'&hub_class='+encodeURIComponent(id.cls));if(j&&j.ok){if(j.key&&j.key!==id.key){id.key=j.key;put(IDK,id);urlKey()}surveys(j.flags)}else if(j&&j.reauth){localStorage.removeItem(IDK);showSignIn('Please sign in again.')}}
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
.namchip b{color:#fff;font-weight:600}.namlink{display:flex;gap:6px;margin:8px 0 4px}.namlink input{flex:1;min-width:0;font:inherit;font-size:.85rem;border:1.5px solid #D7E0E8;border-radius:10px;padding:8px 10px;background:#F2F6F9;color:#1B2A41}
.nambox .tip{background:#FBEFD9;border-radius:10px;padding:9px 11px;font-size:.88rem;margin-top:12px}.nambox .tip b{display:block}
.namchip button{font:inherit;font-size:.8rem;background:transparent;color:#F0B24A;border:1px solid rgba(240,178,74,.6);border-radius:8px;padding:3px 9px;cursor:pointer}`;
function css(){if(document.getElementById('namcss'))return;const s=document.createElement('style');s.id='namcss';s.textContent=CSS;document.head.appendChild(s)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function showSignIn(msg,edit){css();const old=document.querySelector('.namov');if(old)old.remove();const id=get(IDK)||{};
 const d=document.createElement('div');d.className='namov';d.innerHTML=`<div class="nambox" role="dialog" aria-modal="true" aria-labelledby="namh">
 <img src="${BASE}../img/drnam.jpg" alt="Chemistry with Dr. NAM" style="display:block;width:96px;height:96px;margin:-4px auto 6px"><h2 id="namh">${edit?'Your details':'Welcome to the Study Hub'}</h2><p class="b">PHD115 · Dr. NAM · Faculty of Pharmacy, UiTM Bertam</p>
 <p style="margin:0;font-size:.9rem">Sign in once on each device. Use the same matric number every time, so your progress follows you.</p>
 ${edit?'':(REWARD?`<p class="tip" style="margin:10px 0 0;background:#E3F3E9"><b>🏆 Topic prizes</b>${esc(REWARD)}</p>`:'')+'<p class="tip" style="margin:8px 0 0"><b>Saved your personal sign-in link?</b>Open it instead. No typing needed.</p>'}
 <label for="namn">Full name</label><input type="text" id="namn" autocomplete="name" value="${esc(id.name||'')}" placeholder="e.g. Nur Alia Ahmad">
 <label for="namc">Class</label><select id="namc"><option value="">Choose your class…</option>${((get('nam:classes')||{}).list||CLASSES).map(c=>`<option ${id.cls===c?'selected':''}>${c}</option>`).join('')}</select>
 <label for="namm">Matric number</label><input type="text" id="namm" inputmode="numeric" autocomplete="off" maxlength="10" value="${esc(id.matric||'')}" placeholder="10 digits, e.g. 2026123456"><p class="hint">10 digits, no spaces.</p>
 <label class="ck"><input type="checkbox" id="namk1" ${id.ok?'checked':''}><span>The hub saves your progress and study time, so Dr. NAM can see which topics need more help. <b>This is not part of your marks.</b></span></label>
 <label class="ck"><input type="checkbox" id="namk2" ${id.research?'checked':''}><span><b>Help improve the Study Hub (optional).</b> Dr. NAM may use your results, with your name removed, to see how the hub helps students learn. Saying no will not affect you in any way, and you can change your mind later.</span></label>
 <div class="err" id="name" ${msg?'':'hidden'}>${esc(msg||'')}</div>
 <div class="namrow"><button id="namgo">${edit?'Save':'Let\'s start'}</button>${edit||(get(IDK)||{}).guest?'<button class="gh" id="namx">Cancel</button>':''}</div>
 ${edit||(get(IDK)||{}).guest?'':'<p class="hint" style="margin:14px 0 0;text-align:center">Not in Dr. NAM\'s PHD115 class? <a href="#" id="namgu" style="color:#2F6F9F">Look around as a guest</a></p>'}</div>`;
 document.body.appendChild(d);
 const $=s=>d.querySelector(s),err=t=>{$('#name').hidden=false;$('#name').textContent=t};
 classList().then(L=>{const sel=$('#namc');if(!sel||!L.length)return;const v=sel.value;sel.innerHTML='<option value="">Choose your class…</option>'+L.map(c=>`<option ${v===c||id.cls===c?'selected':''}>${esc(c)}</option>`).join('')});
 $('#namm').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,10)});
 if($('#namx'))$('#namx').onclick=()=>d.remove();
 if($('#namgu'))$('#namgu').onclick=e=>{e.preventDefault();put(IDK,{guest:true});put(QK,[]);d.remove();chip()};
 $('#namgo').onclick=async()=>{const n=$('#namn').value.trim().replace(/\s+/g,' '),c=$('#namc').value,m=$('#namm').value.trim(),r=$('#namk2').checked;
  if(n.split(' ').length<2)return err('Please type your full name (at least two words).');if(!c)return err('Please choose your class.');
  if(!/^\d{10}$/.test(m))return err('Your matric number should have 10 digits.');if(!$('#namk1').checked)return err('Please tick the first box to continue.');
  $('#namgo').disabled=true;$('#namgo').textContent='Checking…';
  try{const j=await jsonp('hub_op=verify&hub_matric='+encodeURIComponent(m)+'&hub_class='+encodeURIComponent(c)+'&hub_name='+encodeURIComponent(n)+'&hub_research='+(r?1:0));
   if(j.ok){saveId(j,m,c,r);d.remove();if(j.key&&!edit)showSave(false,j.flags);else if(!edit)surveys(j.flags)}
   else{err((j.msg||'We could not find you yet. Please check your details and try again.')+($('#namgu')?' Not a PHD115 student? Use the guest option below.':''));$('#namgo').disabled=false;$('#namgo').textContent=edit?'Save':'Let\'s start'}}
  catch(e){err('Cannot reach the Study Hub server. If your internet is working, please tell Dr. NAM. (code: '+(e&&e.message||'?')+')');$('#namgo').disabled=false;$('#namgo').textContent=edit?'Save':'Let\'s start'}};
}
function chip(){if(!isHub)return;const id=get(IDK);const h=document.querySelector('header .in')||document.querySelector('header');if(!h||!id||!(id.ok||id.guest))return;css();
 let c=document.getElementById('namchip');if(!c){c=document.createElement('div');c.id='namchip';c.className='namchip';h.appendChild(c)}
 if(id.guest){c.innerHTML=`<span>Browsing as a <b>guest</b>. Your progress stays on this device${REWARD?' and does not count for the topic prizes':''}.</span><button id="namsi">PHD115 student? Sign in</button>`;c.querySelector('#namsi').onclick=()=>showSignIn('');return}
 c.innerHTML=`<span>Signed in as <b>${esc(id.name)}</b> · ${esc(id.cls)}</span>${id.key?'<button id="namlk">My sign-in link</button>':''}<button id="named">My details</button>`;
 c.querySelector('#named').onclick=()=>showSignIn('',true);if(id.key)c.querySelector('#namlk').onclick=()=>showSave(false)}

// ---------- personal sign-in links ----------
function classList(){const c=get('nam:classes');if(c&&c.at&&Date.now()-c.at<864e5)return Promise.resolve(c.list);
 return jsonp('hub_op=classes').then(j=>{if(j&&j.ok&&j.classes&&j.classes.length){put('nam:classes',{list:j.classes,at:Date.now()});return j.classes}return []}).catch(()=>[])}
function saveId(j,m,c,r){const prev=get(IDK);if(prev&&prev.matric&&prev.matric!==(j.matric||m))put(QK,[]);
 put(IDK,{matric:j.matric||m,cls:j.cls||c,name:j.name,research:j.research!==undefined?!!j.research:!!r,key:j.key||'',ok:true,v:Date.now()});
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
 urlKey();chip();flush()}
const linkOf=k=>HOME+'?key='+k;
// Keep the key in the hub's address so "Add to Home Screen" saves a link that signs the student in.
function urlKey(){const id=get(IDK);if(!isHub||!id||!id.key)return;try{const u=new URL(location.href);if(u.searchParams.get('key')!==id.key){u.searchParams.set('key',id.key);u.searchParams.delete('guest');history.replaceState(null,'',u)}}catch(e){}}
async function linkSignIn(k){css();
 try{const w=await jsonp('hub_op=whois&hub_key='+k);
  if(!w||!w.ok){showSignIn(w&&w.msg||'This sign-in link did not work. Please sign in with your details.');return}
  if(w.known){const j=await jsonp('hub_op=verify&hub_key='+k);if(j&&j.ok){saveId(j);surveys(j.flags)}else showSignIn(j&&j.msg||'')}
  else showWelcome(w,k)}
 catch(e){const id=get(IDK);if(!id||!id.ok)showSignIn('Cannot reach the Study Hub server. Check your internet connection, then reload the page.')}}
// Signed in already, but the address has a different key (e.g. a classmate's link, or an older copy of their own).
async function otherLink(k,id){chip();checkFlags();
 try{const w=await jsonp('hub_op=whois&hub_key='+k);
  if(!w||!w.ok){urlKey();return}
  if(w.name===id.name&&w.cls===id.cls){const j=await jsonp('hub_op=verify&hub_key='+k);if(j&&j.ok)saveId(j);return}
  css();const d=document.createElement('div');d.className='namov';
  d.innerHTML=`<div class="nambox" role="dialog" aria-modal="true" aria-labelledby="namh"><h2 id="namh">This is someone else's link</h2>
  <p style="margin:0;font-size:.92rem">This device is signed in as <b>${esc(id.name)}</b> (${esc(id.cls)}). The link you opened belongs to <b>${esc(w.name)}</b> (${esc(w.cls)}).</p>
  <div class="namrow"><button id="namst">Stay as ${esc(String(id.name).split(' ')[0])}</button><button class="gh" id="namsw">Switch to ${esc(String(w.name).split(' ')[0])}</button></div></div>`;
  document.body.appendChild(d);
  d.querySelector('#namst').onclick=()=>{d.remove();try{const u=new URL(location.href);u.searchParams.delete('key');history.replaceState(null,'',u)}catch(e){}urlKey()};
  d.querySelector('#namsw').onclick=()=>{d.remove();timeEv();flush().then(()=>{put(QK,[]);linkSignIn(k)})}}
 catch(e){}}
function showWelcome(w,k){const old=document.querySelector('.namov');if(old)old.remove();const d=document.createElement('div');d.className='namov';
 d.innerHTML=`<div class="nambox" role="dialog" aria-modal="true" aria-labelledby="namh"><img src="${BASE}../img/drnam.jpg" alt="Chemistry with Dr. NAM" style="display:block;width:96px;height:96px;margin:-4px auto 6px">
 <h2 id="namh">Welcome, ${esc(w.name)}</h2><p class="b">${esc(w.cls)} · PHD115 · Dr. NAM</p><p style="margin:0;font-size:.9rem">This is your personal sign-in link. Not you? <a href="${HOME}" style="color:#2F6F9F">Sign in with your own details</a>.</p>
 <label class="ck"><input type="checkbox" id="namk1"><span>The hub saves your progress and study time, so Dr. NAM can see which topics need more help. <b>This is not part of your marks.</b></span></label>
 <label class="ck"><input type="checkbox" id="namk2"><span><b>Help improve the Study Hub (optional).</b> Dr. NAM may use your results, with your name removed, to see how the hub helps students learn. Saying no will not affect you in any way, and you can change your mind later.</span></label>
 <div class="err" id="name" hidden></div><div class="namrow"><button id="namgo">Let's start</button></div></div>`;
 document.body.appendChild(d);const $=s=>d.querySelector(s);
 $('#namgo').onclick=async()=>{if(!$('#namk1').checked){$('#name').hidden=false;$('#name').textContent='Please tick the first box to continue.';return}
  $('#namgo').disabled=true;$('#namgo').textContent='Checking…';
  try{const r=$('#namk2').checked,j=await jsonp('hub_op=verify&hub_key='+k+'&hub_research='+(r?1:0));
   if(j&&j.ok){saveId(j,null,null,r);d.remove();showSave(true,j.flags)}else{$('#name').hidden=false;$('#name').textContent=j&&j.msg||'Please try again.';$('#namgo').disabled=false;$('#namgo').textContent="Let's start"}}
  catch(e){$('#name').hidden=false;$('#name').textContent='Cannot reach the Study Hub server. Please try again.';$('#namgo').disabled=false;$('#namgo').textContent="Let's start"}}}
function showSave(viaLink,flags){const id=get(IDK);if(!id||!id.key)return;css();const old=document.querySelector('.namov');if(old)old.remove();
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent),url=linkOf(id.key),d=document.createElement('div');d.className='namov';
 d.innerHTML=`<div class="nambox" role="dialog" aria-modal="true" aria-labelledby="namh"><h2 id="namh">${viaLink?'You are signed in':'Your personal sign-in link'}</h2>
 <p style="margin:0;font-size:.9rem">${viaLink?'Save this link so you never have to type your details again.':'Open this link on any phone or laptop to sign in with no typing. Keep it to yourself, like a password.'}</p>
 <div class="namlink"><input readonly value="${esc(url)}" aria-label="Your sign-in link"><button id="namcp">Copy</button></div>
 ${navigator.share?'<button class="gh" id="namsh" style="margin-top:4px">Send it to myself</button>':''}
 <div class="tip"><b>Best: put the Study Hub on your home screen</b>${ios?'In Safari, tap Share, then Add to Home Screen.':'In Chrome, tap ⋮, then Add to Home screen (or Install app).'} Open it from the icon and you stay signed in. If you opened this from WhatsApp, open it in ${ios?'Safari':'Chrome'} first.</div>
 <div class="namrow"><button id="namok">Done</button></div></div>`;
 document.body.appendChild(d);const $=s=>d.querySelector(s);
 $('#namcp').onclick=()=>{const i=$('.namlink input');i.select();try{navigator.clipboard.writeText(url).then(()=>{$('#namcp').textContent='Copied'})}catch(e){document.execCommand('copy');$('#namcp').textContent='Copied'}};
 if($('#namsh'))$('#namsh').onclick=()=>{navigator.share({title:'My PHD115 Study Hub link',url}).catch(()=>{})};
 $('#namok').onclick=()=>{d.remove();surveys(flags||get(FK))}}

// One scrollbar only: freeze the page behind while a sign-in or survey box is open.
function lockScroll(){const on=!!document.querySelector('.namov');document.documentElement.style.overflow=on?'hidden':'';document.body.style.overflow=on?'hidden':''}
function watchOverlay(){try{new MutationObserver(lockScroll).observe(document.body,{childList:true})}catch(e){}lockScroll()}
// ---------- start ----------
function boot(){watchOverlay();let id=get(IDK);
 if(GUEST&&!(id&&id.ok)){id={guest:true};put(IDK,id);put(QK,[])}
 if(LKEY&&!PUB&&id&&id.ok&&id.key!==LKEY)otherLink(LKEY,id);
 else if(LKEY&&!PUB&&!(id&&id.ok))linkSignIn(LKEY);
 else if(id&&id.ok){urlKey();chip();checkFlags()}
 else if(id&&id.guest)chip();
 else if(!PUB)showSignIn('');
 enqueue({k:'view:'+vid,type:'view',page,vid,t:Date.now(),ref:document.referrer?'1':''});
 setTimeout(flush,3000);setInterval(()=>{timeEv();flush()},FLUSH_MS)}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){timeEv();beacon()}else last=Date.now()});
addEventListener('pagehide',()=>{timeEv();beacon()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
/* Virtual Dr. NAM chat: loads js/drnam-chat.js on every page (it hides itself where set in that file). */
(function(){var b=(document.currentScript&&document.currentScript.src||'').replace(/track\.js.*$/,'');if(!b||window.NAMCHAT)return;var s=document.createElement('script');s.src=b+'drnam-chat.js';s.defer=true;document.head.appendChild(s)})();
