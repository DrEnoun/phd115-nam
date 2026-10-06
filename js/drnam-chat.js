/* PHD115 Study Hub · Virtual Dr. NAM Calculation Tutor.
   Students pick an exercise and work it out one step at a time; the tutor checks each step against verified answers.
   Loaded on every page by the last lines of track.js. Talks to its own Apps Script web app (ENDPOINT below),
   which holds the Gemini key, the course notes and the exercise answers. */
(function(){
if(window.NAMCHAT)return;window.NAMCHAT=1;
// ===== Settings =====
const ENDPOINT='https://script.google.com/macros/s/AKfycby7knwoTTr3Aw8mCZDkeQu4Q-AejrhsneDh9_DS1ChnYJ1MirZxfDHZeYu3Rfr6dvRV/exec';   // paste the Virtual Dr. NAM web app URL (ends in /exec) between the quotes
const HIDE_ON=['game','leaderboard','pre','post'];   // pages where the button is hidden (games and quizzes)
const MAX_CHARS=800;
// ====================
if(!ENDPOINT)return;
const BASE=(document.currentScript&&document.currentScript.src||'').replace(/js\/drnam-chat\.js.*$/,'');
const parts=location.pathname.split('/').filter(Boolean);
if(parts.some(p=>HIDE_ON.includes(p)))return;
const ti=parts.findIndex(p=>/^(ic1|ic2|em|cr1|cr2|sol)$/.test(p));
const TOPIC=ti>=0?parts[ti]:'hub';
const ON_SLIDES=ti>=0&&/^slides/.test(parts[ti+1]||'');
const TITLES={ic1:'Ionic & Covalent Compounds I',ic2:'Ionic & Covalent Compounds II',em:'Energy & Matters',cr1:'Chemical Reactions I',cr2:'Chemical Reactions II',sol:'Solution'};
const START='I\'m ready to start this exercise.';

// ---------- storage ----------
const ss={get(k){try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let SID;try{SID=localStorage.getItem('nam:vdn:sid');if(!SID){SID=Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('nam:vdn:sid',SID)}}catch(e){SID='x'+Date.now().toString(36)}
const SK='nam:vdn:'+TOPIC;
const S=Object.assign({open:false,ex:null,msgs:[],step:null},ss.get(SK)||{});
const save=()=>ss.set(SK,S);
const who=()=>{try{const id=window.NAMTRACK&&NAMTRACK.id&&NAMTRACK.id();if(id&&id.ok&&!id.guest)return{m:id.matric,c:id.cls}}catch(e){}return{}};
const mid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let busy=false;
// ---------- sound (made in the browser, no files) ----------
let SOUND=true;try{SOUND=localStorage.getItem('nam:vdn:sound')!=='0'}catch(e){}
let AC=null;
function tone(f,t,d,type,g,f2){const o=AC.createOscillator(),v=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,AC.currentTime+t);
 if(f2)o.frequency.exponentialRampToValueAtTime(f2,AC.currentTime+t+d);
 v.gain.setValueAtTime(0.0001,AC.currentTime+t);v.gain.exponentialRampToValueAtTime(g,AC.currentTime+t+0.02);v.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+t+d);
 o.connect(v).connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+d+0.05)}
let UNLOCKED=false;
function unlock(){if(!SOUND)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();if(!UNLOCKED){UNLOCKED=true;tone(440,0,.03,'sine',.0002)}}catch(e){}}
function play(kind){if(!SOUND)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
 if(kind==='correct'){tone(659,0,.14,'sine',.25);tone(988,.11,.22,'sine',.22)}
 else if(kind==='wrong'){tone(196,0,.28,'triangle',.22,140)}
 else if(kind==='done'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.1,.25,'sine',.2))}}catch(e){}}

// ---------- network ----------
async function post(body,ms){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms||45000);
 try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({sid:SID,page:location.pathname},who(),body)),signal:ctl.signal});return await r.json()}
 finally{clearTimeout(t)}}
let EXS=ss.get('nam:vdn:exs');
async function loadExercises(){if(EXS)return EXS;const j=await post({action:'exercises'},20000);if(j&&j.ok){EXS=j.exercises;ss.set('nam:vdn:exs',EXS)}return EXS||[]}

// ---------- text rendering (escape first, then a little markdown) ----------
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function md(src){const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>');
 const out=[];let list=null;
 for(const raw of String(src).replace(/\r/g,'').split('\n')){const l=raw.trim();
  const ul=l.match(/^[-*•]\s+(.*)/),ol=l.match(/^(\d+)[.)]\s+(.*)/);
  if(ul||ol){const tag=ul?'ul':'ol';if(!list||list.tag!==tag){if(list)out.push(`</${list.tag}>`);list={tag};out.push(`<${tag}>`)}out.push(`<li>${inl(ul?ul[1]:ol[2])}</li>`);continue}
  if(list){out.push(`</${list.tag}>`);list=null}
  if(l)out.push(`<p>${inl(l)}</p>`)}
 if(list)out.push(`</${list.tag}>`);return out.join('')}

const CSS=`
:host{all:initial}
*{box-sizing:border-box}
.w{--ink:#1B2A41;--muted:#56657A;--paper:#F2F6F9;--line:#D7E0E8;--cold:#2F6F9F;--cold-soft:#E1EEF7;--heat:#B86E00;--heat-soft:#FBEFD9;--ok:#2E7D4F;--ok-soft:#E3F3E9;
 font-family:Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);font-size:15px;line-height:1.5}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--heat);outline-offset:2px}
.fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;align-items:center;gap:10px;
 border:0;border-radius:999px;padding:5px 18px 5px 5px;background:var(--ink);color:#fff;font-weight:600;box-shadow:0 6px 20px rgba(27,42,65,.28)}
.fab img{width:42px;height:42px;border-radius:50%;background:#fff;display:block;border:2px solid #F0B24A}
.fab.slim{top:calc(10px + env(safe-area-inset-top,0px));bottom:auto;right:12px;padding:3px}
.fab.slim span{display:none}.fab.slim img{width:38px;height:38px}
.panel{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483001;width:min(410px,calc(100vw - 32px));height:min(640px,calc(100vh - 32px));height:min(640px,calc(100dvh - 32px));
 display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(27,42,65,.3)}
@media (max-width:560px){.panel{inset:0;width:auto;height:auto;border-radius:0;border:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
.hd{background:var(--ink);color:#fff;padding:12px 12px 10px 14px}
.hr{display:flex;align-items:center;gap:10px}
.hr img{width:40px;height:40px;border-radius:50%;background:#fff;border:2px solid #F0B24A;flex:none}
.hr .tt{flex:1;min-width:0}.hr b{display:block;font-size:1.02rem}.hr small{display:block;color:#C9D3DC;font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ib{border:0;background:transparent;color:#fff;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none}
.ib:hover{background:rgba(255,255,255,.12)}.ib svg{width:20px;height:20px}
.body{flex:1;overflow-y:auto;background:var(--paper);padding:14px 12px 6px;overscroll-behavior:contain}
.msg{max-width:88%;margin:0 0 10px;padding:9px 12px;border-radius:14px;word-wrap:break-word}
.msg p{margin:0 0 6px}.msg p:last-child{margin:0}.msg ul,.msg ol{margin:4px 0 6px;padding-left:20px}.msg li{margin:2px 0}
.msg code{background:var(--cold-soft);padding:0 4px;border-radius:4px;font-size:.92em}
.bot{background:#fff;border:1px solid var(--line);border-top-left-radius:4px}
.me{margin-left:auto;background:var(--cold);color:#fff;border-top-right-radius:4px}
.sys{max-width:100%;background:transparent;color:var(--muted);font-size:.85rem;text-align:center;padding:2px 8px}
.err{background:#FBE7E5;color:#8C1D18;border:1px solid #F2C4BF}
.typing{display:inline-flex;gap:4px;padding:12px 14px}
.typing i{width:7px;height:7px;border-radius:50%;background:var(--cold);opacity:.35;animation:b 1.1s infinite}
.typing i:nth-child(2){animation-delay:.18s}.typing i:nth-child(3){animation-delay:.36s}
@keyframes b{40%{opacity:1;transform:translateY(-3px)}}
.chips{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px 0;background:#fff}
.chip{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:5px 11px;font-size:.84rem;text-align:left}
.chip:hover{border-color:var(--cold)}
.ft{background:#fff;border-top:1px solid var(--line);padding:0 0 8px}
.in{display:flex;gap:8px;align-items:flex-end;padding:8px 12px 0}
textarea{flex:1;resize:none;border:1.5px solid var(--line);border-radius:12px;padding:9px 11px;font:inherit;color:var(--ink);max-height:120px;min-height:42px;background:#fff}
textarea:focus{border-color:var(--cold);outline:none}
.send{border:0;background:var(--cold);color:#fff;border-radius:12px;width:44px;height:42px;display:grid;place-items:center;flex:none}
.send[disabled]{background:var(--line);cursor:default}.send svg{width:20px;height:20px}
.note{margin:6px 12px 0;color:var(--muted);font-size:.74rem;line-height:1.35}
/* tutor */
.pick h3{margin:2px 2px 8px;font-size:.95rem}
.pick p.lead{margin:0 2px 12px;color:var(--muted);font-size:.88rem}
.ex{display:block;width:100%;text-align:left;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:9px 12px;margin:0 0 7px}
.ex:hover{border-color:var(--heat)}.ex b{display:block;font-size:.92rem}.ex small{color:var(--muted);font-size:.78rem}
details{margin:12px 0 6px}summary{font-weight:600;font-size:.9rem;padding:6px 2px;cursor:pointer}
.grp{margin:10px 2px 6px;font-size:.8rem;color:var(--muted);font-weight:600}
.prob{background:#fff;border-bottom:1px solid var(--line);padding:10px 12px}
.prob .top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.prob .back{border:0;background:transparent;color:var(--cold);font-weight:600;font-size:.82rem;padding:2px 0}
.prob .q{margin:6px 0 8px;font-size:.9rem}
.track{display:flex;gap:4px}
.track i{flex:1;height:8px;border-radius:999px;background:var(--line);transition:background .4s}
.track i.on{background:var(--heat)}
.track.done i{background:var(--ok)}
.tl{font-size:.78rem;color:var(--muted);margin-top:4px}
.tl b{color:var(--heat)}.track.done+.tl b{color:var(--ok)}
.msg.ok{border-left:4px solid var(--ok)}.msg.no{border-left:4px solid #C2410C}
.badge{display:inline-block;font-size:.76rem;font-weight:700;border-radius:999px;padding:1px 9px;margin-bottom:5px}
.ok .badge{background:var(--ok-soft);color:var(--ok)}.no .badge{background:#FDE7DC;color:#9A3412}
.anim.ok{animation:pop .35s ease-out}.anim.no{animation:shake .4s ease-in-out}
@keyframes pop{0%{transform:scale(.96)}60%{transform:scale(1.02)}100%{transform:none}}
@keyframes shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.prob .top .reset{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:3px 11px;font-size:.8rem;font-weight:600;color:var(--ink)}
.prob .top .reset:hover{border-color:var(--heat)}
.ib[aria-pressed="false"]{opacity:.6}
@media (prefers-reduced-motion:reduce){.anim.ok,.anim.no{animation:none}.typing i{animation:none;opacity:.7}.track i{transition:none}}
[hidden]{display:none!important}`;
// ---------- build ----------
const host=document.createElement('div');host.id='drnam-chat';
const root=host.attachShadow({mode:'open'});
root.innerHTML=`<style>${CSS}</style><div class="w">
<button class="fab${ON_SLIDES?' slim':''}" aria-label="Open the calculation tutor"><img src="${BASE}img/drnam-48.png" alt=""><span>Calculation tutor</span></button>
<div class="panel" role="dialog" aria-label="Virtual Dr. NAM calculation tutor" hidden>
 <div class="hd"><div class="hr"><img src="${BASE}img/drnam-48.png" alt=""><div class="tt"><b>Virtual Dr. NAM</b><small>Calculation tutor</small></div>
  <button class="ib" data-a="sound" title="Sound on/off" aria-label="Sound effects"></button>
  <button class="ib" data-a="close" title="Close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>
 <div class="prob" hidden></div>
 <div class="body" aria-live="polite"></div>
 <div class="ft"><div class="chips"></div>
  <div class="in"><textarea rows="1" maxlength="${MAX_CHARS}" aria-label="Your step or answer" placeholder="Type your step or answer"></textarea>
  <button class="send" aria-label="Send" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
  <p class="note">AI tutor: it can make mistakes, so check with your notes. Your messages are processed by Google Gemini, so don't type personal details.</p></div>
</div></div>`;
const $=s=>root.querySelector(s);
const fab=$('.fab'),panel=$('.panel'),body=$('.body'),ta=$('textarea'),send=$('.send'),chips=$('.chips'),prob=$('.prob'),sndBtn=$('[data-a="sound"]');
const SND_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SND_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
function paintSound(){sndBtn.innerHTML=SOUND?SND_ON:SND_OFF;sndBtn.setAttribute('aria-pressed',String(SOUND));sndBtn.title=SOUND?'Sound on (tap to mute)':'Sound off (tap to turn on)'}
paintSound();
sndBtn.onclick=()=>{SOUND=!SOUND;try{localStorage.setItem('nam:vdn:sound',SOUND?'1':'0')}catch(e){}paintSound();if(SOUND)play('correct')};
// keep typing and clicks inside the tutor from reaching the page (e.g. slide navigation keys)
['keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','click','touchstart','touchend','wheel'].forEach(t=>host.addEventListener(t,e=>e.stopPropagation()));

// ---------- open / close ----------
function open(focus=true){S.open=true;save();panel.hidden=false;fab.hidden=true;render();if(focus)setTimeout(()=>(S.ex?ta:panel.querySelector('.ex')||ta).focus(),80)}
function close(){S.open=false;save();panel.hidden=true;fab.hidden=false;fab.focus()}
fab.onclick=()=>open();
$('[data-a="close"]').onclick=close;
panel.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
function start(ex){S.ex=ex;S.msgs=[];S.step={done:0,total:ex.steps};save();render();submit(START,true)}
function pickAnother(){S.ex=null;S.msgs=[];S.step=null;save();render()}
function startOver(){if(!S.ex||busy)return;const k=S.step?S.step.done:0;if(k>0&&!confirm('Start this exercise again? Your progress will reset.'))return;start(S.ex)}

// ---------- input ----------
const fit=()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,120)+'px';send.disabled=!ta.value.trim()||busy};
ta.addEventListener('input',fit);
ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit()}});
send.onclick=()=>submit();

// ---------- render ----------
function render(){
 const picking=!S.ex;
 prob.hidden=picking;$('.in').hidden=picking;
 if(picking){chips.innerHTML='';renderPicker();return}
 renderProblem();
 body.innerHTML='';
 S.msgs.forEach(m=>{if(!m.hidden)body.insertAdjacentHTML('beforeend',bubble(m));m.fresh=false});
 if(busy)body.insertAdjacentHTML('beforeend','<div class="msg bot typing" aria-label="Dr. NAM is typing"><i></i><i></i><i></i></div>');
 renderChips();body.scrollTop=body.scrollHeight;fit()}
function bubble(m){
 if(m.role==='user')return `<div class="msg me">${md(m.text)}</div>`;
 if(m.role==='error')return `<div class="msg bot err">${esc(m.text)}</div>`;
 const cls=m.result==='correct'?' ok':m.result==='wrong'?' no':'';
 const badge=m.result==='correct'?'<span class="badge">✓ Correct</span>':m.result==='wrong'?'<span class="badge">✗ Not quite</span>':'';
 return `<div class="msg bot${cls}${m.fresh?' anim':''}">${badge}${md(m.text)}</div>`}
function renderChips(){
 const last=S.msgs[S.msgs.length-1];let list=[];
 if(busy)list=[];
 else if(last&&last.role==='error'&&last.retry)list=['Try again'];
 else if(S.step&&S.step.done>=S.step.total)list=['Try it again','Give me a similar question','Choose another exercise'];
 else if(last&&last.role==='model'&&last.result==='wrong')list=['Edit my answer','Give me a hint','Start over'];
 else if(S.msgs.length)list=['Give me a hint','I\'m stuck on this step','Which formula should I use?'];
 chips.innerHTML=list.map(t=>`<button class="chip">${esc(t)}</button>`).join('');
 chips.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const t=c.textContent;
  if(t==='Choose another exercise')return pickAnother();
  if(t==='Start over')return startOver();
  if(t==='Try it again')return start(S.ex);
  if(t==='Edit my answer'){const u=[...S.msgs].reverse().find(m=>m.role==='user'&&!m.hidden);ta.value=u?u.text:'';fit();ta.focus();ta.select();return}
  if(t==='Try again'){ta.value='';return submit(last.retry.text,last.retry.hidden)}
  submit(t)})}
function renderProblem(){
 const ex=S.ex,st=S.step||{done:0,total:ex.steps};
 const n=st.total,k=Math.min(st.done,n),done=n&&k>=n;
 prob.innerHTML=`<div class="top"><button class="back">‹ Choose another exercise</button>${k>0?'<button class="reset">↺ Start over</button>':''}</div>
  <div class="q"><b>${esc(ex.title)}.</b> ${esc(ex.question)}</div>
  <div class="track${done?' done':''}" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i class="${i<k?'on':''}"></i>`).join('')}</div>
  <div class="tl">${done?'<b>All steps done.</b> Well done!':`<b>Step ${k} of ${n}</b> done`}</div>`;
 prob.querySelector('.back').onclick=pickAnother;const rs=prob.querySelector('.reset');if(rs)rs.onclick=startOver}
async function renderPicker(){
 body.innerHTML='<div class="msg sys">Loading exercises…</div>';
 let exs=[];try{exs=await loadExercises()}catch(e){}
 if(S.ex)return;
 const card=x=>`<button class="ex" data-id="${x.id}"><b>${esc(x.title)}</b><small>${x.steps} steps</small></button>`;
 const group=list=>Object.keys(TITLES).filter(t=>list.some(x=>x.topic===t)).map(t=>`<div class="grp">${esc(TITLES[t])}</div>${list.filter(x=>x.topic===t).map(card).join('')}`).join('');
 const here=exs.filter(x=>x.topic===TOPIC),other=exs.filter(x=>x.topic!==TOPIC);
 body.innerHTML=`<div class="pick"><h3>Pick an exercise</h3><p class="lead">You work it out one step at a time, and I check each step. I won't just give you the answer.</p>
  ${here.length?here.map(card).join('')+(other.length?`<details><summary>Exercises from other topics</summary>${group(other)}</details>`:''):group(exs)}
  ${exs.length?'':'<div class="msg sys">Couldn\'t load the exercises. Check your internet, then close and reopen the tutor.</div>'}</div>`;
 body.querySelectorAll('.ex').forEach(b=>b.onclick=()=>start(exs.find(x=>x.id===b.dataset.id)))}

// ---------- send ----------
async function submit(text,hidden){
 const msg=(text||ta.value).trim().slice(0,MAX_CHARS);if(!msg||busy||!S.ex)return;
 unlock();
 const th=S.msgs;
 while(th.length&&th[th.length-1].role==='error')th.pop();
 const history=th.filter(m=>m.role==='user'||m.role==='model').map(m=>({role:m.role,text:m.text}));
 th.push({role:'user',text:msg,hidden:!!hidden});if(!text)ta.value='';busy=true;save();render();
 const rid=mid();let err=null;
 try{const j=await post({action:'chat',mode:'tutor',topic:TOPIC,exerciseId:S.ex.id,message:msg,history,mid:rid});
  if(j&&j.ok){const before=S.step?S.step.done:0;let res=j.result||'none';
   if(res==='none'&&j.step&&j.step.done>before)res='correct';
   th.push({role:'model',text:j.reply,mid:rid,result:res,fresh:true});if(j.step)S.step=j.step;
   const fin=S.step&&S.step.total&&S.step.done>=S.step.total&&before<S.step.total;
   play(fin?'done':res)}
  else err=(j&&j.message)||'Something went wrong. Please try again.'}
 catch(e){err='No connection to the tutor. Check your internet and try again.'}
 if(err){th.pop();th.push({role:'error',text:err,retry:{text:msg,hidden:!!hidden}});if(!text)ta.value=msg}
 busy=false;save();if(th===S.msgs)render()}

function mount(){document.body.appendChild(host);if(!document.querySelector('link[href*="family=Lexend"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap';document.head.appendChild(l)}if(S.open)open(false)}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
