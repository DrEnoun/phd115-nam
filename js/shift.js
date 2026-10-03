/* PHD115 Study Hub · Dr. NAM · "Pharmacy Shift" game engine.
   One engine for every topic. A topic page calls NAMSHIFT.start(config) with its own question bank,
   stations (levels) and an optional hands-on round. Saves { best, total, done } to phd115:<topic>:game,
   which track.js sends to the Sheet; the leaderboard is read back from the Apps Script web app. */
(function(){
if(window.NAMSHIFT)return;
const CSS=`
.sh{--ink:#1B2A41;--muted:#56657A;--paper:#F2F6F9;--card:#fff;--line:#D7E0E8;--cold:#2F6F9F;--cold-soft:#E1EEF7;--heat:#B86E00;--heat-soft:#FBEFD9;--ok:#2E7D4F;--ok-soft:#E3F3E9;--bad:#B3261E;--bad-soft:#FBE7E5}
.sh *{box-sizing:border-box}
.sh-hud{position:sticky;top:0;z-index:5;background:var(--ink);color:#fff;padding:calc(8px + env(safe-area-inset-top,0px)) 0 8px}
.sh-hud .in{display:flex;align-items:center;gap:10px;justify-content:space-between}
.sh-hud a{color:#fff;text-decoration:none;font-size:.85rem;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:6px 10px;white-space:nowrap}
.sh-hud .st{font-size:.85rem;color:#C9D3DC;text-align:center;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sh-hud .st b{color:#fff;font-weight:600}
.sh-hud .pts{font-weight:600;font-size:1.05rem;color:#F0B24A;white-space:nowrap;font-variant-numeric:tabular-nums}
.sh-main{padding:16px 0 40px}
.sh h1{font-size:clamp(1.8rem,7vw,2.6rem);line-height:1.1;margin:4px 0 8px;font-weight:600}
.sh h2{font-size:1.2rem;margin:0 0 6px;font-weight:600}
.sh p{margin:0 0 10px}
.sh .mut{color:var(--muted)}
.sh .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:12px 0}
.sh .tag{display:inline-block;font-size:.74rem;font-weight:600;color:var(--cold);background:var(--cold-soft);border-radius:999px;padding:2px 10px}
.sh .btn{font:inherit;font-weight:600;border:0;border-radius:12px;padding:12px 18px;min-height:46px;background:var(--cold);color:#fff;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.sh .btn.big{font-size:1.05rem;padding:14px 22px;background:var(--heat)}
.sh .btn.ghost{background:transparent;color:var(--cold);border:1.5px solid var(--cold)}
.sh .btn[disabled]{opacity:.45;cursor:default}
.sh .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.sh a:focus-visible,.sh button:focus-visible{outline:3px solid var(--heat);outline-offset:2px}
/* intro */
.sh-hero{background:var(--ink);color:#fff;border-radius:20px;padding:22px 20px;position:relative;overflow:hidden}
.sh-hero .k{color:#A3B1C2;font-size:.88rem;margin:0}
.sh-hero p.s{color:#C9D3DC;max-width:520px}
.sh-hero .who{color:#F0B24A;font-size:.9rem;margin:0 0 14px}
.sh-stations{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.sh-stations li{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)}
.sh-stations li:last-child{border:0}
.sh-stations .n{flex:none;display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;font-weight:600;font-size:.9rem}
.sh-stations b{display:block;font-weight:600}
.sh-stations small{color:var(--muted);font-size:.85rem}
/* queue */
.sh-queue{display:flex;gap:6px;align-items:center;margin:2px 0 10px;flex-wrap:wrap}
.sh-queue i{width:26px;height:26px;border-radius:50%;display:inline-grid;place-items:center;font-style:normal;font-size:.75rem;font-weight:600;background:var(--card);border:1.5px solid var(--line);color:var(--muted)}
.sh-queue i.now{border-color:var(--heat);color:var(--heat);box-shadow:0 0 0 3px var(--heat-soft)}
.sh-queue i.y{background:var(--ok);border-color:var(--ok);color:#fff}.sh-queue i.n{background:var(--bad);border-color:var(--bad);color:#fff}
.sh-queue span{font-size:.85rem;color:var(--muted);margin-left:4px}
/* thermometer patience bar */
.sh-thermo{display:flex;align-items:center;gap:0;margin:0 0 12px}
.sh-thermo .bulb{flex:none;width:22px;height:22px;border-radius:50%;background:var(--cold);border:3px solid #fff;box-shadow:0 0 0 1.5px var(--line);position:relative;z-index:1;transition:background .3s}
.sh-thermo .tube{flex:1;height:10px;background:#fff;border:1.5px solid var(--line);border-left:0;border-radius:0 999px 999px 0;margin-left:-4px;overflow:hidden}
.sh-thermo .tube i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--cold),var(--heat))}
.sh-thermo .sec{flex:none;width:52px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;font-size:.95rem}
.sh-thermo.hot .bulb{background:var(--heat)}.sh-thermo.hot .sec{color:var(--heat)}
.sh-thermo.paused .sec{color:var(--muted)}
/* patient and prescription */
.sh-pt{display:flex;gap:12px;align-items:flex-start}
.sh-av{flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:600;font-size:1rem}
.sh-pt .nm{font-weight:600;line-height:1.3}.sh-pt .ro{font-size:.82rem;color:var(--muted)}
.sh-bub{position:relative;background:var(--cold-soft);border-radius:4px 16px 16px 16px;padding:12px 14px;margin:10px 0 0;font-size:1rem;line-height:1.5}
.sh-rx{border:1.5px solid var(--line);border-top:0;border-radius:0 0 14px 14px;background:#fff;padding:14px 16px 14px;position:relative;margin-top:6px}
.sh-rx:before{content:"";position:absolute;left:-1.5px;right:-1.5px;top:-8px;height:8px;background:radial-gradient(circle at 6px 0,transparent 5px,#fff 5.5px) 0 0/12px 8px repeat-x;border-left:1.5px solid var(--line);border-right:1.5px solid var(--line)}
.sh-rx .hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;border-bottom:1px dashed var(--line);padding-bottom:6px;margin-bottom:10px}
.sh-rx .sym{font-family:Georgia,"Times New Roman",serif;font-size:1.9rem;line-height:1;color:var(--heat);font-weight:700}
.sh-rx .no{font-size:.8rem;color:var(--muted);text-align:right}
.sh-q{font-size:1rem;line-height:1.55;margin:0}
.sh-opts{display:grid;gap:8px;margin-top:14px}
.sh-opt{font:inherit;text-align:left;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:11px 14px;cursor:pointer;display:flex;gap:10px;align-items:center;min-height:50px}
.sh-opt .k{flex:none;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--line);font-size:.8rem;font-weight:600;color:var(--muted)}
.sh-opt:hover:not([disabled]){border-color:var(--cold)}
.sh-opt[disabled]{cursor:default}
.sh-opt.right{border-color:var(--ok);background:var(--ok-soft)}.sh-opt.right .k{background:var(--ok);border-color:var(--ok);color:#fff}
.sh-opt.wrong{border-color:var(--bad);background:var(--bad-soft)}.sh-opt.wrong .k{background:var(--bad);border-color:var(--bad);color:#fff}
.sh-fb{margin-top:12px;border-radius:12px;padding:12px 14px;font-size:.93rem}
.sh-fb.ok{background:var(--ok-soft);border-left:4px solid var(--ok)}.sh-fb.no{background:var(--bad-soft);border-left:4px solid var(--bad)}
.sh-fb p{margin:0 0 6px}.sh-fb p:last-child{margin:0}
.sh-gain{font-weight:600;color:var(--ok);font-variant-numeric:tabular-nums}
/* station card between levels */
.sh-station{text-align:left}
.sh-station .big{font-size:3rem;font-weight:600;line-height:1;color:var(--heat);margin:0 0 4px}
/* hands-on drag round */
.sh-drag .fig{position:relative;max-width:520px;margin:6px auto 0}
.sh-drag svg{display:block;width:100%;height:auto}
.sh-zone{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px dashed var(--cold);background:#fff;color:var(--cold);font:inherit;font-weight:600;font-size:.95rem;cursor:pointer;display:grid;place-items:center;padding:0}
.sh-zone.full{border-style:solid;background:var(--cold);color:#fff}
.sh-zone.hover,.sh-slot.hover{box-shadow:0 0 0 4px var(--heat-soft);border-color:var(--heat)}
.sh-zone.right{background:var(--ok);border-color:var(--ok);color:#fff}.sh-zone.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
.sh-slots{display:grid;gap:6px;margin:12px 0}
.sh-slot{font:inherit;font-size:.92rem;display:flex;gap:10px;align-items:center;text-align:left;border:1.5px dashed var(--line);background:#fff;border-radius:12px;padding:6px 10px;min-height:44px;cursor:pointer;color:var(--muted);width:100%}
.sh-slot .l{flex:none;display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;font-weight:600;font-size:.85rem}
.sh-slot.full{border-style:solid;border-color:var(--cold);color:var(--ink)}
.sh-slot.right{border-color:var(--ok);background:var(--ok-soft)}.sh-slot.wrong{border-color:var(--bad);background:var(--bad-soft)}
.sh-slot .tx{flex:1;min-width:0}.sh-slot b{display:block;color:var(--ink)}.sh-slot small{display:block;color:var(--muted);font-size:.8rem}
.sh-slot .fix{display:block;font-size:.82rem;color:var(--ok);font-weight:600}
.sh-tray{display:flex;flex-wrap:wrap;gap:6px;min-height:52px;padding:8px;border-radius:14px;background:var(--heat-soft)}
.sh-chip{font:inherit;font-size:.85rem;text-align:left;background:#fff;border:1.5px solid var(--heat);color:var(--ink);border-radius:12px;padding:7px 11px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;line-height:1.3}
.sh-chip small{display:block;color:var(--muted);font-size:.75rem}
.sh-chip[aria-pressed="true"]{background:var(--heat);color:#fff}.sh-chip[aria-pressed="true"] small{color:#FBEFD9}
.sh-ghost{position:fixed;z-index:9999;pointer-events:none;opacity:.92;transform:translate(-50%,-60%) rotate(-2deg);box-shadow:0 8px 24px rgba(27,42,65,.25)}
/* report */
.sh-score{font-size:3rem;font-weight:600;line-height:1;margin:6px 0 4px;font-variant-numeric:tabular-nums}
.sh-score small{font-size:1rem;color:var(--muted);font-weight:400}
.sh-new{display:inline-block;background:var(--heat);color:#fff;border-radius:999px;font-size:.8rem;font-weight:600;padding:3px 10px;margin-left:6px;vertical-align:middle}
.sh-lo{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.sh-lo:last-child{border:0}
.sh-lo .t{font-size:.9rem;line-height:1.4;grid-column:1 / 3;grid-row:2}
.sh-lo .tag{justify-self:start}
.sh-lo .v{font-weight:600;white-space:nowrap;font-size:.9rem}.sh-lo .v.ok{color:var(--ok)}.sh-lo .v.no{color:var(--heat)}
.sh-lo .bar{grid-column:1 / 3;height:6px;background:var(--line);border-radius:999px;overflow:hidden}
.sh-lo .bar i{display:block;height:100%}
.sh-board{list-style:none;margin:0;padding:0}
.sh-board li{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:.93rem}
.sh-board li:last-child{border:0}
.sh-board .r{font-weight:600;color:var(--muted);text-align:center}
.sh-board li:nth-child(-n+3) .r{color:var(--heat)}
.sh-board .c{font-size:.8rem;color:var(--muted)}
.sh-board .s{font-weight:600;font-variant-numeric:tabular-nums}
.sh-board li.me{background:var(--heat-soft);border-radius:10px;padding-left:4px;padding-right:6px}
@media (prefers-reduced-motion:reduce){.sh *{transition:none!important}}
`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const L='ABCD';
const AV=['#2F6F9F','#B86E00','#2E7D4F','#7A4E9C','#A23B54','#1F7A86'];
const initials=n=>String(n).split(/\s+/).filter(w=>/^[A-Z]/.test(w)).slice(0,2).map(w=>w[0]).join('');
const BONUS=50,BASE=100;
const R=()=>(window.NAMTRACK&&NAMTRACK.REWARD)||'';

function jsonp(q){return new Promise((ok,no)=>{const T=window.NAMTRACK;if(!T||!T.ENDPOINT)return no(new Error('no endpoint'));
 const cb='shcb'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);const s=document.createElement('script');let done=false;
 const end=()=>{done=true;try{delete window[cb]}catch(e){window[cb]=undefined}s.remove()};
 window[cb]=j=>{end();ok(j)};s.onerror=()=>{if(!done){end();no(new Error('load'))}};setTimeout(()=>{if(!done){end();no(new Error('timeout'))}},15000);
 s.src=T.ENDPOINT+'?'+q+'&callback='+cb+'&hub_t='+Date.now();document.head.appendChild(s)})}

window.NAMSHIFT={start(C){
 const KEY='phd115:'+C.topic+':game';
 const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
 const put=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}};
 try{localStorage.setItem('phd115:last',JSON.stringify({topic:C.topic,act:'game',t:Date.now()}))}catch(e){}
 if(!document.getElementById('shcss')){const s=document.createElement('style');s.id='shcss';s.textContent=CSS;document.head.appendChild(s)}
 const root=document.getElementById(C.mount||'app');root.classList.add('sh');
 const loName=c=>(C.los.find(l=>l[0]===c)||[c,''])[1];
 // maximum possible score
 const TOTAL=C.levels.reduce((t,l)=>t+(l.type==='drag'?C.hands.zones.length:l.n)*(BASE+BONUS)*(l.mult||1),0);

 root.innerHTML=`<div class="sh-hud"><div class="in"><a href="${C.hub}">⌂ Study hub</a><span class="st" id="shSt">${esc(C.title)}</span><span class="pts" id="shPts" aria-live="off"></span></div></div>
 <main class="sh-main"><div class="in" id="shBody"></div></main>`;
 const body=document.getElementById('shBody'),stEl=document.getElementById('shSt'),ptsEl=document.getElementById('shPts');
 const me=()=>window.NAMTRACK&&NAMTRACK.id&&NAMTRACK.id();

 let S=null;      // current shift
 let timer=null;  // {limit, left, last, raf, onEnd, paused}
 const used={};   // item ids already shown this visit, so replays vary

 // ---------- timer (pauses while the tab is hidden) ----------
 function stopTimer(){if(timer){cancelAnimationFrame(timer.raf);timer=null}}
 function startTimer(sec,thermo,onEnd){stopTimer();timer={limit:sec*1000,left:sec*1000,last:performance.now(),onEnd,thermo};tick()}
 function tick(){if(!timer)return;const now=performance.now();if(document.visibilityState==='visible')timer.left-=now-timer.last;timer.last=now;
  const t=timer.thermo;if(t){const f=Math.max(0,1-timer.left/timer.limit);t.querySelector('i').style.width=(100*f)+'%';
   t.querySelector('.sec').textContent=Math.max(0,Math.ceil(timer.left/1000))+' s';t.classList.toggle('hot',timer.left<timer.limit*.3)}
  if(timer.left<=0){const f=timer.onEnd;stopTimer();f();return}timer.raf=requestAnimationFrame(tick)}
 const bonus=()=>timer?Math.round(BONUS*Math.max(0,timer.left)/timer.limit):0;
 function thermo(sec){return `<div class="sh-thermo" role="timer" aria-label="Time left"><span class="bulb"></span><span class="tube"><i></i></span><span class="sec">${sec} s</span></div>`}

 // ---------- intro ----------
 function intro(){stopTimer();const b=get();const id=me();stEl.innerHTML=esc(C.title);ptsEl.textContent='';
  body.innerHTML=`<section class="sh-hero"><p class="k">${esc(C.kicker)}</p><h1>Pharmacy Shift</h1>
   <p class="s">${C.blurb}</p>${id&&id.ok?`<p class="who">On duty: ${esc(id.name)}, ${esc(id.cls)}</p>`:''}
   ${R()?`<p class="who" style="color:#fff;background:rgba(240,178,74,.18);border-radius:10px;padding:8px 12px">🏆 ${esc(R())}</p>`:''}
   <button class="btn big" id="shGo">Start my shift</button></section>
  <div class="card"><h2>Your stations</h2><ol class="sh-stations">${C.levels.map((l,i)=>`<li><span class="n">${i+1}</span><span><b>${esc(l.name)}</b><small>${esc(l.blurb)}</small></span></li>`).join('')}</ol>
   <p class="mut" style="margin:12px 0 0;font-size:.9rem">Each right answer earns ${BASE} points plus up to ${BONUS} for speed. The patience bar fills as the patient waits. After you answer, the clock stops so you can read the explanation.</p></div>
  <div class="card"><h2>Your record</h2>${b&&b.done?`<p style="margin:0">Best shift: <b>${b.best}</b> of ${b.total} points · ${b.plays||1} shift${(b.plays||1)>1?'s':''} worked</p>`:'<p class="mut" style="margin:0">No shifts yet. Your best score counts on the leaderboard, so you can play as often as you like.</p>'}</div>
  <div class="card"><h2>Leaderboard, this topic</h2><div id="shBoard"><p class="mut" style="margin:0">Loading…</p></div><p style="margin:10px 0 0;font-size:.9rem"><a href="${C.board}" style="color:var(--cold)">Full leaderboard, all topics</a></p></div>`;
  document.getElementById('shGo').onclick=begin;board(document.getElementById('shBoard'),5)}

 // ---------- shift ----------
 function pick(l){ // balanced across the station's LOs, preferring items not yet seen this visit
  const pool=l.pool,n=l.n;const by={};C.bank.forEach((q,i)=>{if(pool.indexOf(q.lo)>=0&&(!q.at||q.at.indexOf(l.id)>=0)){(by[q.lo]=by[q.lo]||[]).push(i)}});
  const los=shuffle(Object.keys(by)),out=[];Object.keys(by).forEach(k=>{by[k]=shuffle(by[k]).sort((a,b)=>(used[a]?1:0)-(used[b]?1:0))});
  let r=0;while(out.length<n&&los.some(k=>by[k].length)){const k=los[r++%los.length];if(by[k].length)out.push(by[k].shift())}
  out.forEach(i=>used[i]=1);return shuffle(out)}
 function begin(){S={lv:-1,score:0,res:[],start:Date.now()};nextLevel()}
 function nextLevel(){S.lv++;if(S.lv>=C.levels.length)return finish();const l=C.levels[S.lv];
  S.items=l.type==='drag'?null:pick(l);S.i=0;S.mark=[];hud();
  const los=l.type==='drag'?[C.hands.lo]:l.pool;
  body.innerHTML=`<div class="card sh-station"><p class="tag">Station ${S.lv+1} of ${C.levels.length}</p><h2 style="font-size:1.6rem;margin-top:8px">${esc(l.name)}</h2>
   <p>${esc(l.intro||l.blurb)}</p><p class="mut" style="font-size:.9rem">${l.type==='drag'?C.hands.zones.length+' labels':l.n+' '+(l.n>1?'patients':'patient')}, ${l.secs} s ${l.type==='drag'?'for the whole board':'each'}${l.mult&&l.mult!==1?`, points ×${l.mult}`:''}. Checks ${los.join(', ')}.</p>
   <div class="row"><button class="btn big" id="shNext">Open the station</button></div></div>`;
  const b=document.getElementById('shNext');b.focus();b.onclick=()=>l.type==='drag'?drag(l):ask()}
 function hud(){const l=C.levels[S.lv];stEl.innerHTML=l?`Station ${S.lv+1}/${C.levels.length}: <b>${esc(l.name)}</b>`:esc(C.title);ptsEl.textContent=S.score+' pts'}
 function queue(){const l=C.levels[S.lv];return `<div class="sh-queue" aria-label="Queue">${S.items.map((x,i)=>`<i class="${i<S.i?(S.mark[i]?'y':'n'):i===S.i?'now':''}">${i+1}</i>`).join('')}</div>`}

 // ---------- quiz items ----------
 function ask(){const l=C.levels[S.lv];if(S.i>=S.items.length)return nextLevel();
  const q=C.bank[S.items[S.i]];const order=shuffle([0,1,2,3]);const ans=order.indexOf(0);
  const col=AV[(S.items[S.i]*7)%AV.length];
  const head=q.rx?`<div class="sh-rx"><div class="hd"><span class="sym" aria-hidden="true">℞</span><span class="no">Prescription for ${esc(q.who)}<br>${esc(q.role||'')}</span></div><p class="sh-q">${q.q}</p></div>`
   :`<div class="sh-pt"><span class="sh-av" style="background:${col}" aria-hidden="true">${esc(initials(q.who))}</span><div style="flex:1;min-width:0"><div class="nm">${esc(q.who)}</div><div class="ro">${esc(q.role||'')}</div><div class="sh-bub">${q.q}</div></div></div>`;
  body.innerHTML=`${queue()}<div class="card">${thermo(l.secs)}<span class="tag">${q.lo}</span><div style="margin-top:10px">${head}</div>
   <div class="sh-opts">${order.map((o,j)=>`<button class="sh-opt" data-j="${j}"><span class="k">${L[j]}</span><span>${q.o[o]}</span></button>`).join('')}</div><div id="shOut" aria-live="polite"></div></div>`;
  const bs=[...body.querySelectorAll('.sh-opt')];let over=false;
  function answer(j){if(over)return;over=true;const gain=j===ans?Math.round((BASE+bonus())*(l.mult||1)):0;stopTimer();
   body.querySelector('.sh-thermo').classList.add('paused');
   bs.forEach(b=>b.disabled=true);if(j>=0&&j!==ans)bs[j].classList.add('wrong');bs[ans].classList.add('right');
   const ok=gain>0;S.score+=gain;S.res.push({lo:q.lo,ok});S.mark[S.i]=ok;hud();
   const head=j<0?'Time is up. The patient had to wait.':ok?`Correct. <span class="sh-gain">+${gain}</span>`:`Not quite. The answer is ${L[ans]}.`;
   document.getElementById('shOut').innerHTML=`<div class="sh-fb ${ok?'ok':'no'}"><p><b>${head}</b></p><p>${q.why}</p></div>
    <div class="row"><button class="btn" id="shNx">${S.i+1<S.items.length?'Next patient':'Finish this station'}</button></div>`;
   const nx=document.getElementById('shNx');nx.focus({preventScroll:true});nx.onclick=()=>{S.i++;ask()}}
  bs.forEach(b=>b.onclick=()=>answer(+b.dataset.j));
  keyAnswer=e=>{if(over)return;const k=e.key.toUpperCase();const j='ABCD'.indexOf(k)>=0?'ABCD'.indexOf(k):'1234'.indexOf(k);if(j>=0&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||''))){e.preventDefault();answer(j)}};
  startTimer(l.secs,body.querySelector('.sh-thermo'),()=>answer(-1));
  window.scrollTo({top:0})}
 let keyAnswer=null;document.addEventListener('keydown',e=>{if(keyAnswer)keyAnswer(e)});

 // ---------- hands-on round: drag labels onto a diagram ----------
 function drag(l){keyAnswer=null;const H=C.hands;const chips=shuffle(H.chips.map((c,i)=>i));const place={};let sel=null,over=false;
  body.innerHTML=`<div class="card sh-drag">${thermo(l.secs)}<span class="tag">${H.lo}</span><h2 style="margin-top:8px">${esc(H.title)}</h2><p class="mut" style="font-size:.93rem">${H.how}</p>
   <div class="fig">${H.svg}${H.zones.map((z,i)=>`<button class="sh-zone" data-z="${i}" style="left:${z.x}%;top:${z.y}%" aria-label="Segment ${z.id}">${z.id}</button>`).join('')}</div>
   <p id="shTrayH" style="margin:12px 0 6px;font-size:.9rem;font-weight:600">Labels (${H.chips.length - H.zones.length} of them do not belong)</p><div class="sh-tray" id="shTray"></div>
   <div class="sh-slots">${H.zones.map((z,i)=>`<button class="sh-slot" data-z="${i}"><span class="l">${z.id}</span><span class="tx">Drop a label here</span></button>`).join('')}</div>
   <div class="row"><button class="btn" id="shChk" disabled>Check my board</button></div><div id="shOut" aria-live="polite"></div></div>`;
  const tray=document.getElementById('shTray'),chk=document.getElementById('shChk');
  const chipHTML=i=>`<b>${H.chips[i].t}</b><small>${H.chips[i].s||''}</small>`;
  function render(){const inTray=chips.filter(i=>!Object.values(place).includes(i));
   tray.innerHTML=inTray.map(i=>`<button class="sh-chip" data-c="${i}" aria-pressed="${sel===i}">${chipHTML(i)}</button>`).join('')||'<span class="mut" style="font-size:.9rem">All placed. Tap a filled segment to take its label back.</span>';
   H.zones.forEach((z,i)=>{const c=place[i];body.querySelector(`.sh-zone[data-z="${i}"]`).classList.toggle('full',c!=null);
    const s=body.querySelector(`.sh-slot[data-z="${i}"]`);s.classList.toggle('full',c!=null);s.querySelector('.tx').innerHTML=c!=null?chipHTML(c):(sel!=null?'Tap to place the selected label':'Drop a label here')});
   chk.disabled=over||Object.keys(place).length<H.zones.length;
   tray.querySelectorAll('.sh-chip').forEach(b=>{b.onpointerdown=e=>down(e,+b.dataset.c,b);b.onclick=e=>{if(b._dragged){b._dragged=false;return}sel=sel===+b.dataset.c?null:+b.dataset.c;render();const f=tray.querySelector(`[data-c="${sel}"]`);if(f)f.focus()}})}
  function drop(z,c){if(over)return;Object.keys(place).forEach(k=>{if(place[k]===c)delete place[k]});place[z]=c;sel=null;render()}
  body.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{if(over)return;const z=+b.dataset.z;if(sel!=null)drop(z,sel);else if(place[z]!=null){delete place[z];render()}});
  // pointer drag with a floating copy of the chip
  function down(e,c,src){if(over||e.button>0)return;const x0=e.clientX,y0=e.clientY;let g=null,hov=null;
   const zoneAt=(x,y)=>{const t=document.elementFromPoint(x,y);return t&&t.closest('[data-z]')};
   const mv=ev=>{if(!g&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<6)return;
    if(!g){g=src.cloneNode(true);g.classList.add('sh-ghost');g.style.width=src.offsetWidth+'px';document.body.appendChild(g);src.style.opacity=.35}
    ev.preventDefault();g.style.left=ev.clientX+'px';g.style.top=ev.clientY+'px';const z=zoneAt(ev.clientX,ev.clientY);
    if(hov!==z){body.querySelectorAll('.hover').forEach(h=>h.classList.remove('hover'));hov=z;if(z)body.querySelectorAll(`[data-z="${z.dataset.z}"]`).forEach(h=>h.classList.add('hover'))}};
   const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
    body.querySelectorAll('.hover').forEach(h=>h.classList.remove('hover'));
    if(g){g.remove();src.style.opacity='';src._dragged=true;const z=zoneAt(ev.clientX,ev.clientY);if(z&&ev.type==='pointerup')drop(+z.dataset.z,c)}};
   addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',up)}
  function check(timeUp){if(over)return;over=true;const bn=bonus();stopTimer();body.querySelector('.sh-thermo').classList.add('paused');let got=0;
   H.zones.forEach((z,i)=>{const c=place[i];const ok=c!=null&&H.chips[c].z===i;const gain=ok?Math.round((BASE+bn)*(l.mult||1)):0;got+=gain;S.res.push({lo:H.lo,ok});
    body.querySelector(`.sh-zone[data-z="${i}"]`).classList.add(ok?'right':'wrong');const s=body.querySelector(`.sh-slot[data-z="${i}"]`);s.classList.add(ok?'right':'wrong');
    if(!ok){const r=H.chips.findIndex(x=>x.z===i);s.querySelector('.tx').innerHTML=(c!=null?chipHTML(c):'<span>Empty</span>')+`<span class="fix">Should be: ${H.chips[r].t}</span>`}});
   S.score+=got;hud();const n=S.res.slice(-H.zones.length).filter(r=>r.ok).length;
   document.getElementById('shOut').innerHTML=`<div class="sh-fb ${n===H.zones.length?'ok':'no'}"><p><b>${timeUp?'Time is up. ':''}${n} of ${H.zones.length} correct.</b> <span class="sh-gain">+${got}</span></p><p>${H.why}</p></div>
    <div class="row"><button class="btn" id="shNx">Continue the shift</button></div>`;
   tray.hidden=true;document.getElementById('shTrayH').hidden=true;chk.hidden=true;const nx=document.getElementById('shNx');nx.focus({preventScroll:true});nx.onclick=nextLevel}
  chk.onclick=()=>check(false);render();startTimer(l.secs,body.querySelector('.sh-thermo'),()=>check(true));window.scrollTo({top:0})}

 // ---------- end of shift: score, outcome report, leaderboard ----------
 function finish(){keyAnswer=null;stopTimer();const prev=get()||{};const isBest=!prev.best||S.score>prev.best;
  const by={};C.los.forEach(l=>by[l[0]]={c:0,n:0});S.res.forEach(r=>{const b=by[r.lo]||(by[r.lo]={c:0,n:0});b.n++;if(r.ok)b.c++});
  const lo={};Object.keys(by).forEach(k=>lo[k]=[by[k].c,by[k].n]);
  put({best:Math.max(prev.best||0,S.score),total:TOTAL,done:true,plays:(prev.plays||0)+1,last:{score:S.score,at:Date.now(),secs:Math.round((Date.now()-S.start)/1000),lo}});
  stEl.innerHTML='Shift complete';ptsEl.textContent=S.score+' pts';
  const right=S.res.filter(r=>r.ok).length,weak=C.los.filter(l=>by[l[0]].n&&by[l[0]].c/by[l[0]].n<.8);
  const msg=!weak.length?'Every outcome at 80% or better. You are ready for the tutorial.':`Revise ${weak.map(l=>l[0]).join(', ')} with the slides, then work another shift.`;
  body.innerHTML=`<div class="card" style="border:2px solid var(--cold)"><p class="tag">End of shift</p><div class="sh-score">${S.score}<small> / ${TOTAL} points</small>${isBest?'<span class="sh-new">New best</span>':''}</div>
   <p style="margin:0 0 4px">${right} of ${S.res.length} answered correctly. ${msg}</p>${!isBest?`<p class="mut" style="margin:0;font-size:.9rem">Your best is still ${prev.best}.</p>`:''}</div>
  <div class="card"><h2>Outcome report</h2><p class="mut" style="font-size:.9rem">How you did on each learning outcome in this shift.</p>${C.los.map(l=>{const b=by[l[0]];const p=b.n?b.c/b.n:0;const ok=b.n&&p>=.8;
    return `<div class="sh-lo"><span class="tag">${l[0]}</span><span class="t">${esc(l[1])}</span><span class="v ${b.n?(ok?'ok':'no'):''}">${b.n?b.c+'/'+b.n+(ok?' ✓':' · revise'):'–'}</span><span class="bar"><i style="width:${100*p}%;background:${ok?'var(--ok)':'var(--heat)'}"></i></span></div>`}).join('')}
   <div class="row"><button class="btn big" id="shAgain">Work another shift</button><a class="btn ghost" href="${C.slides}">Revise with the slides</a></div></div>
  <div class="card"><h2>Leaderboard, this topic</h2>${R()?`<p style="margin:0 0 10px;font-size:.92rem">🏆 ${esc(R())}</p>`:''}<div id="shBoard"><p class="mut" style="margin:0">Sending your score…</p></div><p style="margin:10px 0 0;font-size:.9rem"><a href="${C.board}" style="color:var(--cold)">Full leaderboard, all topics</a></p></div>`;
  document.getElementById('shAgain').onclick=begin;window.scrollTo({top:0});
  const send=window.NAMTRACK&&NAMTRACK.sync?NAMTRACK.sync():Promise.resolve();
  send.catch(()=>{}).then(()=>setTimeout(()=>board(document.getElementById('shBoard'),10),2500))}

 async function board(el,n){if(!el)return;const id=me();
  try{const j=await jsonp('hub_op=board&hub_topic='+C.topic+(id&&id.ok?'&hub_matric='+encodeURIComponent(id.matric)+'&hub_class='+encodeURIComponent(id.cls):''));
   if(!j||!j.ok)throw new Error((j&&j.msg)||'bad reply');const rows=(j.rows||[]).slice(0,n);
   if(!rows.length){el.innerHTML='<p class="mut" style="margin:0">No scores yet. Finish a shift to be first on the board.</p>';return}
   const mine=j.me;el.innerHTML=`<ol class="sh-board">${rows.map(r=>`<li class="${r.me?'me':''}"><span class="r">${r.rank}</span><span>${esc(r.n)} <span class="c">${esc(r.c)}</span></span><span class="s">${r.s}</span></li>`).join('')}</ol>
    ${mine?`<p style="margin:10px 0 0;font-size:.92rem">You are <b>#${mine.rank}</b> of ${j.count} with <b>${mine.s}</b> points.</p>`:id&&id.ok?'<p class="mut" style="margin:10px 0 0;font-size:.9rem">Your score shows here within a minute or two of finishing a shift.</p>':'<p class="mut" style="margin:10px 0 0;font-size:.9rem">You are playing as a guest, so your score is not on the leaderboard'+(R()?' and does not count for the topic prizes. PHD115 students: sign in on the Study Hub page to qualify.':'.')+'</p>'}`}
  catch(e){el.innerHTML='<p class="mut" style="margin:0">The leaderboard is not reachable right now. Your score is saved on this device and will be sent when you are back online.</p>'}}
 intro();
}};
})();
