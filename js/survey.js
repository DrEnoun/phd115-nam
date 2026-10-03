/* PHD115 Study Hub · Dr. NAM · entrance and exit surveys.
   Item ids become column names in the Entry/Exit tabs of the lecturer's Sheet: do not rename an id mid-semester. */
(function(){
const TOPICS=[['ic1','Ionic & Covalent Compounds I'],['ic2','Ionic & Covalent Compounds II'],['em','Energy & Matters'],['cr1','Chemical Reactions I'],['cr2','Chemical Reactions II'],['sol','Solution']];
const AGREE=['Strongly disagree','Strongly agree'];
const conf=p=>({h:'Your confidence in each topic',intro:'Course-specific items (not part of a published scale). How confident are you that you can answer exam questions on each topic? 1 = not at all, 5 = very.',items:TOPICS.map(([k,t])=>({id:p+'conf_'+k,type:'scale',q:t,ends:['Not at all','Very']}))});
// MSLQ Self-Efficacy for Learning and Performance (Pintrich, Smith, Garcia & McKeachie, 1991). "This class/course" = PHD115.
const MSLQ=['I believe I will receive an excellent grade in PHD115.',"I'm certain I can understand the most difficult material presented in the readings for PHD115.","I'm confident I can learn the basic concepts taught in PHD115.","I'm confident I can understand the most complex material presented by the instructor in PHD115.","I'm confident I can do an excellent job on the assignments and tests in PHD115.",'I expect to do well in PHD115.',"I'm certain I can master the skills being taught in PHD115.",'Considering the difficulty of PHD115, the teacher, and my skills, I think I will do well in PHD115.'];
const se=p=>({h:'Your beliefs about PHD115',intro:'Answer about yourself and PHD115. 1 = not at all true of me, 7 = very true of me.',items:MSLQ.map((q,i)=>({id:p+'se'+(i+1),type:'scale',n:7,q,ends:['Not at all true of me','Very true of me']}))});
// ASCIv2 (Xu & Lewis, 2011). Stored as the raw position 1-7 (1 = left word). Reverse-coding is done in the Sheet.
const ASCI=[['easy','hard'],['complicated','simple'],['confusing','clear'],['comfortable','uncomfortable'],['satisfying','frustrating'],['challenging','unchallenging'],['pleasant','unpleasant'],['chaotic','organized']];
const asci=p=>({h:'How you feel about chemistry',intro:'Each line has two opposite words. Choose the box that best describes how you feel about chemistry. The middle box (4) means neither word fits better.',items:ASCI.map((w,i)=>({id:p+'asci'+(i+1),type:'scale',n:7,q:'Chemistry is: '+w[0]+' … '+w[1],ends:w,pair:1}))});
const SUS=['I would like to use the Study Hub frequently.','I found the Study Hub unnecessarily complicated.','I thought the Study Hub was easy to use.','I would need help from someone to be able to use the Study Hub.','I found the different parts of the Study Hub well connected.','I thought there was too much inconsistency in the Study Hub.','Most students would learn to use the Study Hub very quickly.','I found the Study Hub very awkward to use.','I felt very confident using the Study Hub.','I needed to learn a lot of things before I could get going with the Study Hub.'];
const USE=[['pre','Before-class activities'],['slides','Interactive slides'],['post','After-class activities'],['tut','Tutorials'],['game','Game'],['pdf','Printable PDFs'],['ptable','Periodic table tool']];
window.NAMSURVEY={
entry:{title:'Welcome survey',mins:6,
 intro:'Before you start, please tell us a little about yourself. Your answers help Dr. NAM improve the Study Hub. They do not affect your marks. If you agreed to the optional research use, your answers may also be used, without your name, in teaching research.',
 pages:[
 {h:'About you',items:[
  {id:'e_spm',type:'choice',q:'Your SPM Chemistry grade (or equivalent)',opts:['A+','A','A-','B+','B','C+','C','D','E','G','Did not take SPM Chemistry']},
  {id:'e_hours',type:'choice',q:'How many hours a week do you plan to study PHD115 outside class?',opts:['Less than 1','1–2','2–4','4–6','More than 6']},
  {id:'e_device',type:'choice',q:'Which device will you use most for studying?',opts:['Phone','Tablet','Laptop or computer']},
  {id:'e_net',type:'choice',q:'How reliable is your internet where you usually study?',opts:['Reliable','Sometimes unreliable','Often unreliable']},
  {id:'e_online',type:'choice',q:'Have you used self-paced online learning materials before?',opts:['Never','A few times','Often']}]},
 se('e_'),asci('e_'),conf('e_'),
 {h:'Your hopes',items:[{id:'e_hope',type:'text',q:'What do you hope the Study Hub will help you with?',opt:true}]}]},
exit:{title:'End-of-semester feedback',mins:9,
 intro:'Thank you for using the Study Hub this semester. Please tell us what you think, honestly: both good and bad feedback help. Your answers do not affect your marks. If you agreed to the optional research use, your answers may also be used, without your name, in teaching research.',
 pages:[
 se('x_'),asci('x_'),conf('x_'),
 {h:'Your experience',intro:'Course-specific items. How much do you agree?',items:[{id:'x_helped',type:'scale',q:'The Study Hub helped me prepare for classes, tests and the exam.',ends:AGREE},{id:'x_other',type:'scale',q:'I would like a Study Hub like this for my other subjects.',ends:AGREE}]},
 {h:'How useful was each part?',intro:'1 = not useful, 5 = very useful. Choose "Did not use" if you never used it.',items:USE.map(([k,t])=>({id:'x_use_'+k,type:'scale',q:t,ends:['Not useful','Very useful'],na:'Did not use'}))},
 {h:'Using the Study Hub',intro:'How much do you agree with each statement? 1 = strongly disagree, 5 = strongly agree.',items:SUS.map((q,i)=>({id:'x_sus'+(i+1),type:'scale',q,ends:AGREE}))},
 {h:'Your study habits',items:[
  {id:'x_freq',type:'choice',q:'How often did you use the Study Hub?',opts:['Rarely','About once a month','About once a fortnight','Weekly','Several times a week']},
  {id:'x_hours',type:'choice',q:'Apart from the Study Hub, how many hours a week did you study PHD115 outside class?',opts:['Less than 1','1–2','2–4','4–6','More than 6']},
  {id:'x_when',type:'choice',q:'When did you use the Study Hub most?',opts:['Before lectures','After lectures','Before tests and exams','Evenly through the semester']}]},
 {h:'Your thoughts',items:[
  {id:'x_best',type:'text',q:'What helped you most in the Study Hub, and why?'},
  {id:'x_worst',type:'text',q:'What was least helpful, confusing or did not work well?',opt:true},
  {id:'x_suggest',type:'text',q:'What should Dr. NAM add or change?',opt:true}]}]}
};

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CSS=`.svq{margin:14px 0 0}.svq p{margin:0 0 6px;font-weight:600;font-size:.95rem}.svq .opts{display:grid;gap:6px}
.svq button.o{font:inherit;font-weight:400;text-align:left;background:#fff;color:#1B2A41;border:1.5px solid #D7E0E8;border-radius:10px;padding:8px 12px;cursor:pointer}
.svq button.o.on{border-color:#2F6F9F;background:#E1EEF7;font-weight:600}
.svq .sc{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.svq .sc button.o{text-align:center;padding:9px 0;min-width:0}.svq .sc{gap:5px}
.svq .ends{display:flex;justify-content:space-between;font-size:.75rem;color:#56657A;margin-top:3px}
.svq textarea{width:100%;font:inherit;border:1.5px solid #D7E0E8;border-radius:10px;padding:8px}
.svq.miss p{color:#B3261E}.svbar{height:6px;background:#D7E0E8;border-radius:99px;overflow:hidden;margin:10px 0 2px}.svbar i{display:block;height:100%;background:#2F6F9F}
.svint{font-size:.88rem;color:#56657A;margin:4px 0 0}`;
window.NAMSURVEY.open=function(kind,opts){const S=NAMSURVEY[kind];if(!S||document.querySelector('.namov.sv'))return;
 if(!document.getElementById('svcss')){const s=document.createElement('style');s.id='svcss';s.textContent=CSS;document.head.appendChild(s)}
 const KEY='nam:survey:'+kind;let A={};try{A=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(A))}catch(e){}};
 let pg=-1;const d=document.createElement('div');d.className='namov sv';document.body.appendChild(d);
 function item(it){const v=A[it.id];
  if(it.type==='choice')return `<div class="svq" data-id="${it.id}"><p>${esc(it.q)}</p><div class="opts" ${it.opts.length>6&&it.opts.every(o=>o.length<4||/^Did not/.test(o))?'style="grid-template-columns:repeat(4,1fr)"':''}>${it.opts.map(o=>`<button class="o ${v===o?'on':''}" ${/^Did not/.test(o)?'style="grid-column:1/-1"':''} data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
  if(it.type==='scale')return `<div class="svq" data-id="${it.id}"><p>${it.pair?'<span style="font-weight:400">Chemistry is</span> '+esc(it.ends[0])+' <span style="font-weight:400">…</span> '+esc(it.ends[1]):esc(it.q)}</p><div class="sc" style="grid-template-columns:repeat(${it.n||5},1fr)">${Array.from({length:it.n||5},(_,i)=>i+1).map(n=>`<button class="o ${v==n?'on':''}" data-v="${n}">${n}</button>`).join('')}</div><div class="ends"><span>${esc(it.ends[0])}</span><span style="text-align:right">${esc(it.ends[1])}</span></div>${it.na?`<div class="opts" style="margin-top:6px"><button class="o ${v===it.na?'on':''}" data-v="${esc(it.na)}">${esc(it.na)}</button></div>`:''}</div>`;
  return `<div class="svq" data-id="${it.id}"><p>${esc(it.q)}${it.opt?' <span style="font-weight:400;color:#56657A">(optional)</span>':''}</p><textarea rows="3" data-t="1">${esc(v||'')}</textarea></div>`}
 function draw(msg){const n=S.pages.length;
  if(pg<0){d.innerHTML=`<div class="nambox"><h2>${S.title}</h2><p class="b">PHD115 Study Hub · Dr. NAM</p><p style="margin:0;font-size:.92rem">${S.intro}</p><p class="svint">About ${S.mins} minutes · ${n} short pages. Your answers are saved as you go.</p><div class="namrow"><button id="svnext">Start</button>${opts.skippable?'<button class="gh" id="svskip">Skip for now</button>':''}</div></div>`}
  else{const P=S.pages[pg];d.innerHTML=`<div class="nambox"><h2>${esc(P.h)}</h2><div class="svbar"><i style="width:${100*(pg+1)/n}%"></i></div><p class="svint">Page ${pg+1} of ${n}${P.intro?' · '+esc(P.intro):''}</p>${P.items.map(item).join('')}
   <div class="err" ${msg?'':'hidden'}>${esc(msg||'')}</div><div class="namrow"><button class="gh" id="svback">Back</button><button id="svnext">${pg===n-1?'Submit':'Next'}</button></div></div>`}
  d.scrollTop=0;
  d.querySelectorAll('.svq').forEach(q=>{const id=q.dataset.id;
   q.querySelectorAll('button.o').forEach(b=>b.onclick=()=>{const raw=b.dataset.v;A[id]=/^\d$/.test(raw)?+raw:raw;save();q.querySelectorAll('button.o').forEach(x=>x.classList.toggle('on',x===b));q.classList.remove('miss')});
   const t=q.querySelector('textarea');if(t)t.oninput=()=>{A[id]=t.value.slice(0,2000);save()}});
  const nx=d.querySelector('#svnext'),bk=d.querySelector('#svback'),sk=d.querySelector('#svskip');
  if(sk)sk.onclick=()=>{d.remove();opts.onSkip&&opts.onSkip()};
  if(bk)bk.onclick=()=>{pg--;draw()};
  nx.onclick=async()=>{if(pg>=0){const P=S.pages[pg];const miss=P.items.filter(it=>!it.opt&&(A[it.id]===undefined||A[it.id]===''||(it.type==='text'&&!String(A[it.id]).trim())));
    d.querySelectorAll('.svq').forEach(q=>q.classList.toggle('miss',miss.some(m=>m.id===q.dataset.id)));
    if(miss.length)return draw0('Please answer every question on this page.');}
   if(pg<S.pages.length-1){pg++;draw();return}
   nx.disabled=true;nx.textContent='Sending…';
   const ok=await opts.submit(A);
   if(ok){try{localStorage.removeItem(KEY)}catch(e){}d.innerHTML=`<div class="nambox"><h2>Thank you</h2><p style="margin:0">Your answers have been received.</p><div class="namrow"><button id="svdone">Continue to the Study Hub</button></div></div>`;d.querySelector('#svdone').onclick=()=>{d.remove();opts.onDone&&opts.onDone()}}
   else{nx.disabled=false;nx.textContent='Submit';const e=d.querySelector('.err');e.hidden=false;e.textContent='Could not send. Check your internet connection and press Submit again. Your answers are saved.'}};
  function draw0(m){const e=d.querySelector('.err');e.hidden=false;e.textContent=m;const f=d.querySelector('.svq.miss');if(f)f.scrollIntoView({behavior:'smooth',block:'center'})}
 }
 draw()};
})();
