/* neat.js — tidy text on every slide deck.
   1. Each sentence starts on a new line.
   2. The last word of a sentence never sits alone on a new line.
   3. Calculations and equations (2 × 16.00 = 32.00 g/mol) stay on one line.
   4. Bigger, easier-to-read text.
   Load this after the deck's own script. */
(function(){
'use strict';
const stage=document.getElementById('stage');
if(!stage||typeof autofit!=='function'||/noneat/.test(location.search))return;

// ---------- 4. bigger text
const css=`
#stage .body{font-size:calc(var(--fs,1)*25px)}
#stage figcaption{font-size:15px!important;line-height:1.3}
#stage .cap{font-size:max(.72em,16px)!important}
#stage .tap{font-size:18px!important}
#stage .chip{font-size:15px!important}
#stage .eyebrow{font-size:16px!important}
#stage .lo{font-size:18px!important}
#stage .attrib,#stage .srcl{font-size:16px!important}
#stage .outs small{font-size:15px!important}
#stage li,#stage p,#stage td,#stage .bubble,#stage .side,#stage .card,#stage .tile,#stage .soft,#stage .idea,#stage .ftxt,#stage .tryans,#stage .why,#stage .ans,#stage .step>div{text-wrap:pretty}
#stage .nbr{white-space:nowrap}
`;
const st=document.createElement('style');st.id='neat-css';st.textContent=css;document.head.appendChild(st);

// ---------- 1–3. text rules
const SKIP='.ftap,.fb,.floop,h1,h2,h3,.head,.foot,.feq,.eqbox,.cw,.board,.chip,.eyebrow,.divn,.divp,.rail,svg,script,style,.lo,.num,.who,.attrib,.srcl,code,pre,.lr,.lrs,[data-neat-off],.opt>b,.opt .k,.oc .n';
const NOBREAK='table,figcaption,.cap,.tap,.fhint,.ftab,.opts,.opt,.sum b,.close';      // glue only, no sentence breaks
const BLOCK='li,p,td,th,div,figcaption,button,h4,label,dd,dt';
const ABBR=new Set(['e.g','i.e','dr','mr','mrs','ms','vs','approx','fig','figs','no','etc','st','cf','al','eq','ch','pp','p','vol','ed','sec','ref','min','max','prof','ts','b']);
const UNITS='g/mol|mol/L|kJ/mol|J/g°C|J/g·°C|cal/g°C|mg|kg|g|mol|mmol|mL|dL|L|u|amu|kJ|kcal|cal|J|K|°C|°F|%|M|atm|mmHg|kPa|Pa|cm|mm|nm|m|ppm|s|min|h';
const RE_SENT=/([.!?])(["”’)]*)(\s+)(?=[A-Z“"‘(0-9])/g;
const RE_PART=/(\s+)(?=\((?:[b-h]|ii|iii|iv|v|vi)\)\s)/g;
const RE_OPS=/[ \t]+([×÷=+→⇌≈≤≥⟶←−\/])[ \t]+/g;
const RE_LABEL=/\b(Step|step|Example|Part|Figure|Table|Exercise|Rule)[ \t]+(?=\d)/g;
const RE_UNIT=new RegExp('(\\d)[ \\t]+(?=(?:'+UNITS+')(?![A-Za-z]))','g');
const RE_COLON=/:[ \t]+(?=[\d(−-])/g;
const NB=' ';

function prevTokOK(acc){
  const s=acc.replace(/\s+$/,'');
  if(s.replace(/<[^>]*>/g,'').trim().length<4)return false;      // "1." / "(a)" labels
  const m=s.match(/(\S+)[.!?]["”’)]*$/);if(!m)return true;
  const t=m[1].replace(/^[(“"‘]+/,'').toLowerCase();
  if(ABBR.has(t))return false;
  if(/^[A-Z]$/.test(m[1])&&!/\d[ \u00a0]+[A-Z][.!?]["”’)]*$/.test(s))return false;   // initials like "A." (but "1.56 L." is a unit)
  return true;
}
function glueLast(node,end){ // keep the last word with the one before it
  const s=node.data.slice(0,end);const k=s.search(/[ \t][^ \t ]{1,14}$/);
  if(k<0)return false;
  node.data=node.data.slice(0,k)+NB+node.data.slice(k+1);return true;
}
function processSlide(slide){
  if(slide.dataset.neat)return;slide.dataset.neat=1;
  const w=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT,{acceptNode(n){
    const p=n.parentElement;if(!p||!n.data.trim()&&!/\s/.test(n.data))return NodeFilter.FILTER_REJECT;
    return p.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  const nodes=[];let n;while(n=w.nextNode())nodes.push(n);
  const state=new Map();
  for(const node of nodes){
    const block=node.parentElement.closest(BLOCK)||node.parentElement;
    let S=state.get(block);if(!S){S={acc:'',prev:null};state.set(block,S)}
    const noBreak=!!node.parentElement.closest(NOBREAK);
    let text=node.data;
    // sentence ended in the previous node, this node starts with a space + capital
    if(!noBreak&&/[.!?]["”’)]*$/.test(S.acc)&&/^\s+[A-Z“"‘(0-9]/.test(text)&&prevTokOK(S.acc)){
      if(S.prev&&S.prev.isConnected)glueLast(S.prev,S.prev.data.length);
      const ws=text.match(/^\s+/)[0];text=text.slice(ws.length);node.data=text;
      node.parentNode.insertBefore(Object.assign(document.createElement('br'),{className:'nbrk'}),node);
      S.acc='';
    }
    // previous node ended with ". " and this node starts with a capital ("water. <b>Chlorine</b>")
    else if(!noBreak&&/[.!?]["”’)]*\s+$/.test(S.acc)&&/^[A-Z“"‘(0-9]/.test(text)&&S.prev&&S.prev.isConnected&&prevTokOK(S.acc)){
      const p=S.prev,ws=p.data.match(/\s+$/)[0];p.data=p.data.slice(0,-ws.length);glueLast(p,p.data.length);
      p.parentNode.insertBefore(Object.assign(document.createElement('br'),{className:'nbrk'}),p.nextSibling);
      S.acc='';
    }
    // this node starts with the full stop of a sentence ("</b>. Next")
    if(/^[.!?]/.test(text)&&S.prev&&S.prev.isConnected)glueLast(S.prev,S.prev.data.length);
    // breaks inside this node
    const cuts=[];
    if(!noBreak){RE_SENT.lastIndex=0;let m;
      while(m=RE_SENT.exec(text)){
        const endPunct=m.index+m[1].length+m[2].length;
        if(prevTokOK(S.acc+text.slice(0,endPunct)))cuts.push([endPunct,m[3].length]);
      }
      // part labels in running text: "... (b) C2H4 ..." -> new line before (b)
      if(block.dataset.parts||/\(a\)\s/.test(block.textContent)){block.dataset.parts=1;RE_PART.lastIndex=0;
        while(m=RE_PART.exec(text)){const e=m.index;if((S.acc+text.slice(0,e)).trim().length>0&&!cuts.some(c=>c[0]===e))cuts.push([e,m[1].length])}
        cuts.sort((a,b)=>a[0]-b[0]);}
    }
    if(cuts.length){
      const frag=document.createDocumentFragment();let pos=0;const pieces=[];
      for(const [e,len] of cuts){const t=document.createTextNode(text.slice(pos,e));glueLast(t,t.data.length);frag.appendChild(t);pieces.push(t);
        frag.appendChild(Object.assign(document.createElement('br'),{className:'nbrk'}));pos=e+len}
      const last=document.createTextNode(text.slice(pos));frag.appendChild(last);pieces.push(last);
      if(/[.!?]["”’)]*\s*$/.test(last.data))glueLast(last,last.data.replace(/\s+$/,'').length);
      node.parentNode.replaceChild(frag,node);
      pieces.forEach(t=>glueMath(t,block));
      S.acc=last.data;S.prev=last;
    }else{
      if(/[.!?]["”’)]*\s*$/.test(text)&&!noBreak)glueLast(node,text.replace(/\s+$/,'').length);
      S.acc+=text;S.prev=node;glueMath(node,block);
    }
  }
}
const GLUED=new WeakMap();
function glueMath(node,block){
  const o=node.data;
  const t=o.replace(RE_OPS,(m,op)=>NB+op+NB).replace(RE_UNIT,'$1'+NB).replace(RE_COLON,':'+NB).replace(RE_LABEL,'$1'+NB).replace(/(^|\s)(\((?:[a-h]|i|ii|iii|iv|v|vi)\))[ \t]+/g,'$1$2'+NB);
  if(t!==o){node.data=t;let a=GLUED.get(block);if(!a){a=[];GLUED.set(block,a)}a.push([node,o]);block.classList.add('neat-g')}
}
// If glued text is wider than its box, let it wrap again.
function unglue(slide){
  slide.querySelectorAll('.neat-g').forEach(b=>{
    if(b.scrollWidth>b.clientWidth+2){const a=GLUED.get(b);if(a)a.forEach(([nd,o])=>{nd.data=nd.data.replace(/ /g,' ')});b.classList.remove('neat-g')}
  });
}

stage.querySelectorAll('.slide').forEach(processSlide);
const orig=window.autofit;
function fitNow(s){
  const b=s.querySelector('.body');if(!b){orig(s);return}
  // how far text goes below the bottom of the slide body (pictures themselves are ignored)
  const spill=()=>{if(b.scrollHeight<=b.clientHeight+2)return 0;
    const R=b.getBoundingClientRect(),sc=R.height/(b.offsetHeight||1);
    const lim=R.bottom-(parseFloat(getComputedStyle(b).paddingBottom)||0)*sc;let w=0;
    for(const el of b.querySelectorAll('*')){
      if(/^(IMG|SVG|CANVAS|IFRAME)$/i.test(el.tagName)||el.closest('svg,canvas')||el.querySelector('img,svg,canvas,iframe'))continue;
      const d=el.getBoundingClientRect().bottom-lim;if(d>w)w=d}
    return w/sc};
  // pictures shrink a little together with the text (never below 70 %)
  const imgs=[...b.querySelectorAll('img')].filter(i=>!i.closest('.lra,.simbox'));
  imgs.forEach(i=>{i.style.maxHeight='';const sc=b.getBoundingClientRect().height/(b.offsetHeight||1);i._h0=i.getBoundingClientRect().height/sc});
  const setF=f=>{b.style.setProperty('--fs',f);imgs.forEach(i=>{if(i._h0>40){i.style.maxHeight=(i._h0*Math.max(.7,f))+'px';i.style.width='auto'}})};
  const best=min=>{let f=1,bestF=1,bestW=Infinity;
    for(f=1;f>=min-1e-9;f-=0.02){setF(f);const w=spill();
      if(w<=1){bestF=f;bestW=0;break}if(w<bestW-2){bestW=w;bestF=f}}
    setF(bestF);return bestW};
  if(best(0.6)>1){const brs=[...s.querySelectorAll('br.nbrk')];if(brs.length){brs.forEach(br=>br.replaceWith(' '));best(0.54)}}
  b.dataset.fit=1;
}

window.autofit=function(s){
  if(!s)return orig(s);
  if(s.dataset.neatFit){orig(s);return}
  s.dataset.neatFit=1;unglue(s);fitNow(s);
};
stage.querySelectorAll('.body').forEach(b=>delete b.dataset.fit);
// pictures and fonts that finish loading late change the height: fit the current slide again
let T=0;function refitSoon(){clearTimeout(T);T=setTimeout(()=>{const sl=stage.querySelector('.slide.on');if(sl&&sl.dataset.neatFit)fitNow(sl)},250)}
stage.addEventListener('load',e=>{if(e.target.tagName==='IMG'){const sl=e.target.closest('.slide');if(sl&&!sl.classList.contains('on')){const b=sl.querySelector('.body');if(b)delete b.dataset.fit}else refitSoon()}},true);
addEventListener('load',refitSoon);
[400,1200,3000].forEach(t=>setTimeout(()=>{const sl=stage.querySelector('.slide.on');if(sl&&sl.dataset.neatFit)fitNow(sl)},t));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refitSoon);
try{paint()}catch(e){}
})();
