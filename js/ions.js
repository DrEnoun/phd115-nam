/* PHD115 · Chemistry with Dr. NAM · toggleable list of common polyatomic ions, to help with naming compounds.
   Sits next to the periodic table button on slides and activities. Press I to open or close. */
(function(){
if(window.IONS)return;
const sb=s=>s.replace(/_(\d+)/g,'<sub>$1</sub>');
const ch=c=>c===1?'+':c===-1?'−':(Math.abs(c)+(c>0?'+':'−'));
// [formula (_n = subscript), charge, name, other name, an example compound you may meet]
const D=[
 ['NH_4',1,'ammonium','','ammonium chloride, NH_4Cl'],
 ['H_3O',1,'hydronium','','found in every acid in water'],
 ['OH',-1,'hydroxide','','magnesium hydroxide, Mg(OH)_2 (antacid)'],
 ['CN',-1,'cyanide','','potassium cyanide, KCN'],
 ['C_2H_3O_2',-1,'acetate','also written CH_3COO⁻','sodium acetate, NaC_2H_3O_2'],
 ['NO_3',-1,'nitrate','','potassium nitrate, KNO_3 (toothpaste for sensitive teeth)'],
 ['NO_2',-1,'nitrite','','sodium nitrite, NaNO_2 (food preservative)'],
 ['HCO_3',-1,'hydrogen carbonate','bicarbonate','sodium bicarbonate, NaHCO_3 (baking soda, antacid)'],
 ['HSO_4',-1,'hydrogen sulfate','bisulfate','sodium hydrogen sulfate, NaHSO_4'],
 ['HSO_3',-1,'hydrogen sulfite','bisulfite','sodium bisulfite, NaHSO_3 (antioxidant in medicines)'],
 ['H_2PO_4',-1,'dihydrogen phosphate','','potassium dihydrogen phosphate, KH_2PO_4 (buffers)'],
 ['MnO_4',-1,'permanganate','','potassium permanganate, KMnO_4 (antiseptic soak)'],
 ['ClO_4',-1,'perchlorate','','potassium perchlorate, KClO_4'],
 ['ClO_3',-1,'chlorate','','potassium chlorate, KClO_3'],
 ['ClO_2',-1,'chlorite','','sodium chlorite, NaClO_2'],
 ['ClO',-1,'hypochlorite','','sodium hypochlorite, NaClO (bleach, disinfectant)'],
 ['CO_3',-2,'carbonate','','calcium carbonate, CaCO_3 (antacid, calcium tablets)'],
 ['SO_4',-2,'sulfate','','iron(II) sulfate, FeSO_4 (iron tablets)'],
 ['SO_3',-2,'sulfite','','sodium sulfite, Na_2SO_3'],
 ['S_2O_3',-2,'thiosulfate','','sodium thiosulfate, Na_2S_2O_3 (cyanide antidote)'],
 ['HPO_4',-2,'hydrogen phosphate','','disodium hydrogen phosphate, Na_2HPO_4 (buffers)'],
 ['CrO_4',-2,'chromate','','potassium chromate, K_2CrO_4'],
 ['Cr_2O_7',-2,'dichromate','','potassium dichromate, K_2Cr_2O_7 (orange oxidiser)'],
 ['C_2O_4',-2,'oxalate','','calcium oxalate, CaC_2O_4 (kidney stones)'],
 ['O_2',-2,'peroxide','','sodium peroxide, Na_2O_2'],
 ['PO_4',-3,'phosphate','','calcium phosphate, Ca_3(PO_4)_2 (bones and teeth)'],
 ['C_6H_5O_7',-3,'citrate','','sodium citrate, Na_3C_6H_5O_7 (keeps blood from clotting)']
].map(([f,c,n,o,x])=>({f,c,n,o,x,html:sb(f)+'<sup>'+ch(c)+'</sup>',key:(n+' '+o+' '+f.replace(/_/g,'')+' '+x.replace(/_/g,'')).toLowerCase()}));
const css=`
.io-btn{font:inherit;font-weight:600;cursor:pointer;border-radius:10px;display:inline-flex;align-items:center;gap:6px}
.io-float{position:fixed;left:12px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:9;background:rgba(27,42,65,.9);color:#fff;border:1px solid rgba(255,255,255,.25);padding:8px 11px;font-size:14px}
.io-ico{font-weight:700;font-size:.8em;letter-spacing:-.5px;line-height:1}
.io-btn,.pt-btn{vertical-align:middle}
span[data-pt-slot]:not([style]) .io-btn{margin-left:6px}
#io-ov{position:fixed;inset:0;z-index:2147483050;background:rgba(6,11,18,.72);display:flex;align-items:center;justify-content:center;padding:calc(10px + env(safe-area-inset-top,0px)) 10px calc(10px + env(safe-area-inset-bottom,0px));font-family:Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#io-ov[hidden]{display:none!important}
.io-panel{background:#fff;color:#1B2A41;border-radius:16px;width:min(1080px,100%);max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.35)}
.io-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #D7E0E8}
.io-top h2{margin:0;font:700 17px/1.3 Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1B2A41;letter-spacing:0;text-transform:none;text-shadow:none;flex:1;min-width:150px;white-space:nowrap}
.io-q{font:inherit;font-size:14px;border:1.5px solid #D7E0E8;border-radius:10px;padding:7px 10px;min-width:0;width:190px;color:#1B2A41;background:#fff}
.io-q:focus{outline:2px solid #2F6F9F;outline-offset:1px;border-color:#2F6F9F}
.io-seg{display:flex;background:#F2F6F9;border:1px solid #D7E0E8;border-radius:10px;padding:3px;gap:3px}
.io-seg button{font:inherit;font-size:13px;font-weight:600;border:0;border-radius:8px;padding:6px 10px;background:transparent;color:#1B2A41;cursor:pointer;white-space:nowrap}
.io-seg button[aria-pressed=true]{background:#2F6F9F;color:#fff}
.io-x{font:inherit;font-size:20px;line-height:1;border:0;background:#F2F6F9;border-radius:10px;width:36px;height:36px;cursor:pointer;color:#1B2A41}
.io-body{overflow:auto;padding:12px 14px 14px;-webkit-overflow-scrolling:touch}
.io-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.io-card{border:1px solid rgba(27,42,65,.12);border-radius:12px;padding:9px 12px;display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:center}
.io-card.p{background:#FBEFD9}.io-card.m1{background:#E1EEF7}.io-card.m2{background:#E3F3E9}.io-card.m3{background:#EDE7F6}
.io-f{font-size:20px;font-weight:700;white-space:nowrap;min-width:84px}
.io-f sub{font-size:.62em}.io-f sup{font-size:.62em;color:#B3261E}.io-card.p .io-f sup{color:#2F6F9F}
.io-n{font-weight:700;font-size:15px;line-height:1.25}.io-o{font-size:12px;color:#56657A;line-height:1.3}
.io-x2{grid-column:1/-1;font-size:12px;color:#3D4C61;margin-top:5px;padding-top:5px;border-top:1px dashed rgba(27,42,65,.18);line-height:1.35}
.io-x2 sub{font-size:.75em}
.io-none{color:#56657A;font-size:14px;padding:10px 2px}
.io-tips{margin-top:14px;background:#F8FAFC;border:1px solid #D7E0E8;border-radius:12px;padding:10px 14px;font-size:14px;line-height:1.55}
.io-tips h3{margin:0 0 6px;font-size:15px;color:#2F6F9F}
.io-tips ol{margin:0;padding-left:20px}.io-tips li{margin:3px 0}.io-tips sub,.io-tips sup{font-size:.7em}
.io-tips b{color:#1B2A41}
#ctl .io-btn .io-ico{display:none}
.bar .io-btn{background:transparent;color:#2F6F9F;border:1.5px solid #2F6F9F;padding:6px 10px;font-size:.85rem}
.io-sh{display:none}
@media (max-width:420px){.bar .io-btn .io-lbl{display:none}.bar .io-btn .io-sh{display:inline}}
@media (max-width:600px){#ctl .io-btn .io-lbl{display:none}#ctl .io-btn .io-sh{display:inline}}
@media (max-width:560px){.io-top h2{flex:1 1 calc(100% - 60px)}.io-q{order:3;flex:1 1 100%;width:auto}.io-seg{order:4;width:100%}.io-seg button{flex:1;padding:6px 4px;font-size:12px}}
@media print{.io-toggle{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let ov=null,lastFocus=null,filt='all',q='';
const cls=c=>c>0?'p':'m'+(-c);
function card(d){return `<div class="io-card ${cls(d.c)}"><div class="io-f">${d.html}</div><div><div class="io-n">${d.n}</div>${d.o?`<div class="io-o">${sb(d.o)}</div>`:''}</div><div class="io-x2">e.g. ${sb(d.x)}</div></div>`}
function paint(){if(!ov)return;
 ov.querySelectorAll('.io-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===filt));
 const t=q.trim().toLowerCase().replace(/[\s⁺⁻+\-−]/g,'');
 const L=D.filter(d=>(filt==='all'||String(d.c)===filt)&&(!t||d.key.replace(/\s/g,'').includes(t)));
 ov.querySelector('.io-grid').innerHTML=L.length?L.map(card).join(''):'<p class="io-none">No ion matches. Try another name or formula.</p>'}
function build(){ov=document.createElement('div');ov.id='io-ov';ov.hidden=true;
 ov.innerHTML=`<div class="io-panel" role="dialog" aria-modal="true" aria-labelledby="io-h"><div class="io-top"><h2 id="io-h">Polyatomic ions</h2>
 <input class="io-q" type="search" placeholder="Search, e.g. sulfate or SO4" aria-label="Search the ions">
 <div class="io-seg" role="group" aria-label="Show ions by charge"><button data-f="all">All</button><button data-f="1">1+</button><button data-f="-1">1−</button><button data-f="-2">2−</button><button data-f="-3">3−</button></div>
 <button class="io-x" aria-label="Close">✕</button></div>
 <div class="io-body"><div class="io-grid"></div>
 <div class="io-tips"><h3>Naming tips</h3><ol>
 <li><b>Positive ion first, then the negative ion.</b> Na<sub>2</sub>SO<sub>4</sub> is sodium sulfate.</li>
 <li><b>Keep the ion's name as it is.</b> Do not change it to -ide. KNO<sub>3</sub> is potassium nitrate.</li>
 <li><b>Need more than one? Use brackets.</b> Ca(NO<sub>3</sub>)<sub>2</sub> and (NH<sub>4</sub>)<sub>3</sub>PO<sub>4</sub>.</li>
 <li><b>-ate has one more O than -ite.</b> Sulfate SO<sub>4</sub><sup>2−</sup>, sulfite SO<sub>3</sub><sup>2−</sup>.</li>
 <li><b>per-…-ate has one more O than -ate. hypo-…-ite has one less O than -ite.</b> ClO<sub>4</sub><sup>−</sup> perchlorate, ClO<sub>3</sub><sup>−</sup> chlorate, ClO<sub>2</sub><sup>−</sup> chlorite, ClO<sup>−</sup> hypochlorite.</li>
 <li><b>"Hydrogen" adds one H and the charge goes up by one.</b> CO<sub>3</sub><sup>2−</sup> carbonate becomes HCO<sub>3</sub><sup>−</sup> hydrogen carbonate (bicarbonate).</li>
 <li><b>Three ions end in -ide:</b> hydroxide OH<sup>−</sup>, cyanide CN<sup>−</sup> and peroxide O<sub>2</sub><sup>2−</sup>.</li>
 </ol></div></div></div>`;
 document.body.appendChild(ov);
 ['pointerdown','pointerup','click','touchstart','touchend'].forEach(t=>ov.addEventListener(t,e=>e.stopPropagation()));
 ov.addEventListener('click',e=>{if(e.target===ov){close();return}const b=e.target.closest('.io-seg button');if(b){filt=b.dataset.f;paint();return}if(e.target.closest('.io-x'))close()});
 ov.querySelector('.io-q').addEventListener('input',e=>{q=e.target.value;paint()});
 ov.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();else if((e.key==='i'||e.key==='I')&&e.target.tagName!=='INPUT')close()});
 paint()}
function open(){if(window.PT&&PT.close)PT.close();if(!ov)build();lastFocus=document.activeElement;ov.hidden=false;paint();ov.querySelector('.io-x').focus();document.querySelectorAll('.io-toggle').forEach(b=>b.setAttribute('aria-expanded','true'))}
function close(){if(!ov||ov.hidden)return;ov.hidden=true;document.querySelectorAll('.io-toggle').forEach(b=>b.setAttribute('aria-expanded','false'));if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function toggle(){(!ov||ov.hidden)?open():close()}
function button(cls){const b=document.createElement('button');b.type='button';b.className='io-btn io-toggle '+(cls||'');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Show or hide the list of polyatomic ions');
 b.innerHTML='<span class="io-ico" aria-hidden="true">SO₄²⁻</span><span class="io-lbl">Polyatomic ions</span><span class="io-sh">Ions</span>';b.addEventListener('click',e=>{e.stopPropagation();toggle()});return b}
function mount(){if(document.querySelector('.io-toggle'))return;const pt=document.querySelector('.pt-toggle');
 if(pt&&!pt.classList.contains('pt-float')){const b=button(pt.className.replace(/\bpt-\S+/g,'').trim());pt.parentNode.insertBefore(b,pt.nextSibling);return}
 const slot=document.querySelector('[data-pt-slot]');if(slot&&!pt){slot.appendChild(button(slot.dataset.ptSlot||''));return}
 document.body.appendChild(button('io-float'))}
function init(){mount();
 document.addEventListener('keydown',e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;if((e.key==='i'||e.key==='I')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();toggle()}},true)}
// opening the periodic table closes this list, and the other way round
addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.pt-toggle'))close()},true);
window.IONS={open,close,toggle,data:D};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
