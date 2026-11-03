/* PHD115 · Chemistry with Dr. NAM · toggleable table of specific heats (c) of common substances.
   Sits next to the periodic table and polyatomic ions buttons. Press C to open or close. */
(function(){
if(window.SHEAT)return;
const sb=s=>s.replace(/_(\d+)/g,'<sub>$1</sub>');
// [name, formula, group, c in J/g·°C, c in cal/g·°C (null = J ÷ 4.184), note, approx?]
// Values marked from Ball Table 7.2.1 match the lecture slides exactly.
const D=[
 ['water (liquid)','H_2O(ℓ)','liquid','4.184','1.00','The highest of the common liquids. It warms up and cools down slowly.'],
 ['ice','H_2O(s)','solid','2.059','0.492','About half of liquid water.'],
 ['steam','H_2O(g)','gas','2.042','0.488','About half of liquid water.'],
 ['ethanol','C_2H_6O','liquid','2.418','0.578','In hand rubs and many oral liquids.'],
 ['methanol','CH_3OH','liquid','2.53',null,''],
 ['acetone','C_3H_6O','liquid','2.17',null,'Nail polish remover.'],
 ['glycerol','C_3H_8O_3','liquid','2.43',null,'Used in syrups and creams.'],
 ['hexane','C_6H_14','liquid','1.648','0.394',''],
 ['benzene','C_6H_6','liquid','1.050','0.251',''],
 ['olive oil','','liquid','1.97',null,'',1],
 ['sea water','','liquid','3.93',null,'',1],
 ['mercury','Hg','metal','0.138','0.033','A liquid metal. Very low c.'],
 ['aluminium','Al','metal','0.900','0.215',''],
 ['iron','Fe','metal','0.452','0.108',''],
 ['copper','Cu','metal','0.385','0.092',''],
 ['zinc','Zn','metal','0.388',null,''],
 ['nickel','Ni','metal','0.444',null,''],
 ['titanium','Ti','metal','0.523',null,'Used in implants.'],
 ['magnesium','Mg','metal','1.02',null,''],
 ['sodium','Na','metal','1.23',null,''],
 ['tin','Sn','metal','0.227',null,''],
 ['silver','Ag','metal','0.235',null,''],
 ['gold','Au','metal','0.129',null,''],
 ['lead','Pb','metal','0.128',null,''],
 ['brass (alloy)','','metal','0.380',null,'Copper + zinc.',1],
 ['stainless steel','','metal','0.50',null,'Used for lab and hospital tools.',1],
 ['sodium chloride','NaCl','solid','0.866','0.207','Table salt.'],
 ['aluminium oxide','Al_2O_3','solid','1.276','0.305',''],
 ['iron(III) oxide','Fe_2O_3','solid','0.653','0.156','Rust.'],
 ['glass','','solid','0.84',null,'Beakers and bottles.',1],
 ['sand','','solid','0.83',null,'',1],
 ['granite (rock)','','solid','0.79',null,'',1],
 ['concrete','','solid','0.88',null,'',1],
 ['wood','','solid','1.7',null,'Depends on the type of wood.',1],
 ['human body (average)','','solid','3.47',null,'Close to water, because the body is mostly water.',1],
 ['hydrogen','H_2','gas','14.31','3.419','The highest c of all.'],
 ['helium','He','gas','5.19',null,''],
 ['nitrogen','N_2','gas','1.04',null,''],
 ['air','','gas','1.01',null,'',1],
 ['oxygen','O_2','gas','0.916','0.219',''],
 ['carbon dioxide','CO_2','gas','0.844',null,'']
].map(([n,f,g,j,c,x,a])=>({n,f,g,js:j,cs:c==null?(+j/4.184).toPrecision(3):c,j:+j,x,a:!!a,key:(n+' '+f.replace(/_/g,'').replace(/\(.\)/,'')+' '+g).toLowerCase()}));
const G={metal:'Metals',liquid:'Liquids',solid:'Solids & materials',gas:'Gases'};
const css=`
.sh-btn{font:inherit;font-weight:600;cursor:pointer;border-radius:10px;display:inline-flex;align-items:center;gap:6px;vertical-align:middle}
.sh-float{position:fixed;left:12px;bottom:calc(140px + env(safe-area-inset-bottom,0px));z-index:9;background:rgba(27,42,65,.9);color:#fff;border:1px solid rgba(255,255,255,.25);padding:8px 11px;font-size:14px}
.sh-ico{font-weight:700;font-size:.8em;line-height:1;font-style:italic}
span[data-pt-slot]:not([style]) .sh-btn{margin-left:6px}
#sh-ov{position:fixed;inset:0;z-index:2147483050;background:rgba(6,11,18,.72);display:flex;align-items:center;justify-content:center;padding:calc(10px + env(safe-area-inset-top,0px)) 10px calc(10px + env(safe-area-inset-bottom,0px));font-family:Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#sh-ov[hidden]{display:none!important}
.sh-panel{background:#fff;color:#1B2A41;border-radius:16px;width:min(1080px,100%);max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.35)}
.sh-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #D7E0E8}
.sh-top h2{margin:0;font:700 17px/1.3 Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1B2A41;letter-spacing:0;text-transform:none;text-shadow:none;flex:1;min-width:150px;white-space:nowrap}
.sh-q{font:inherit;font-size:14px;border:1.5px solid #D7E0E8;border-radius:10px;padding:7px 10px;min-width:0;width:180px;color:#1B2A41;background:#fff}
.sh-q:focus{outline:2px solid #2F6F9F;outline-offset:1px;border-color:#2F6F9F}
.sh-seg{display:flex;background:#F2F6F9;border:1px solid #D7E0E8;border-radius:10px;padding:3px;gap:3px;flex-wrap:wrap}
.sh-seg button{font:inherit;font-size:13px;font-weight:600;border:0;border-radius:8px;padding:6px 10px;background:transparent;color:#1B2A41;cursor:pointer;white-space:nowrap}
.sh-seg button[aria-pressed=true]{background:#2F6F9F;color:#fff}
.sh-x{font:inherit;font-size:20px;line-height:1;border:0;background:#F2F6F9;border-radius:10px;width:36px;height:36px;cursor:pointer;color:#1B2A41}
.sh-body{overflow:auto;padding:12px 14px 14px;-webkit-overflow-scrolling:touch}
.sh-key{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;background:#E8F4F2;border:1px solid #BFE3DD;border-radius:12px;padding:8px 14px;margin-bottom:10px;font-size:14px}
.sh-key b{font-size:18px;color:#0F5F6C!important;font-weight:700}
.sh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.sh-card{border:1px solid rgba(27,42,65,.12);border-radius:12px;padding:9px 12px}
.sh-card.metal{background:#E1EEF7}.sh-card.liquid{background:#E3F3E9}.sh-card.solid{background:#FBEFD9}.sh-card.gas{background:#EDE7F6}
.sh-card.w{box-shadow:inset 0 0 0 2px #2F6F9F}
.sh-n{font-weight:700;font-size:15px;line-height:1.25}.sh-n span{font-weight:600;color:#56657A;font-size:13px;margin-left:4px}
.sh-n sub{font-size:.75em}
.sh-v{display:flex;gap:14px;align-items:baseline;margin-top:4px}
.sh-j{font-size:22px;font-weight:700;color:#1B2A41}.sh-j small,.sh-c small{font-size:11px;font-weight:600;color:#56657A;margin-left:3px}
.sh-c{font-size:15px;font-weight:600;color:#3D4C61}
.sh-x2{font-size:12px;color:#3D4C61;margin-top:5px;padding-top:5px;border-top:1px dashed rgba(27,42,65,.18);line-height:1.35}
.sh-none{color:#56657A;font-size:14px;padding:10px 2px}
.sh-tips{margin-top:14px;background:#F8FAFC;border:1px solid #D7E0E8;border-radius:12px;padding:10px 14px;font-size:14px;line-height:1.55}
.sh-tips h3{margin:0 0 6px;font-size:15px;color:#2F6F9F}
.sh-tips ol{margin:0;padding-left:20px}.sh-tips li{margin:3px 0}.sh-tips sub{font-size:.7em}
#ctl .sh-btn .sh-ico{display:none}
.bar .sh-btn{background:transparent;color:#2F6F9F;border:1.5px solid #2F6F9F;padding:6px 10px;font-size:.85rem}
.sh-sh{display:none}
@media (max-width:420px){.bar .sh-btn .sh-lbl{display:none}.bar .sh-btn .sh-sh{display:inline}}
@media (max-width:600px){#ctl .sh-btn .sh-lbl{display:none}#ctl .sh-btn .sh-sh{display:inline}}
@media (max-width:560px){.sh-top h2{flex:1 1 calc(100% - 60px)}.sh-q{order:3;flex:1 1 100%;width:auto}.sh-seg{order:4;width:100%}.sh-seg button{flex:1;padding:6px 4px;font-size:12px}}
@media print{.sh-toggle{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let ov=null,lastFocus=null,filt='all',q='';
function card(d){return `<div class="sh-card ${d.g}${d.n.startsWith('water')?' w':''}"><div class="sh-n">${d.n}${d.f?`<span>${sb(d.f)}</span>`:''}</div>
 <div class="sh-v"><div class="sh-j">${d.a?'≈ ':''}${d.js}<small>J/g·°C</small></div><div class="sh-c">${d.cs}<small>cal/g·°C</small></div></div>${d.x?`<div class="sh-x2">${d.x}</div>`:''}</div>`}
function paint(){if(!ov)return;
 ov.querySelectorAll('.sh-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===filt));
 const t=q.trim().toLowerCase().replace(/\s+/g,' ');
 const L=D.filter(d=>(filt==='all'||d.g===filt)&&(!t||d.key.includes(t))).sort((a,b)=>b.j-a.j);
 ov.querySelector('.sh-grid').innerHTML=L.length?L.map(card).join(''):'<p class="sh-none">Nothing found. Try another name or formula.</p>'}
function build(){ov=document.createElement('div');ov.id='sh-ov';ov.hidden=true;
 ov.innerHTML=`<div class="sh-panel" role="dialog" aria-modal="true" aria-labelledby="sh-h"><div class="sh-top"><h2 id="sh-h">Specific heat, c</h2>
 <input class="sh-q" type="search" placeholder="Search, e.g. copper or Fe" aria-label="Search the table">
 <div class="sh-seg" role="group" aria-label="Show by group"><button data-f="all">All</button><button data-f="metal">Metals</button><button data-f="liquid">Liquids</button><button data-f="solid">Solids</button><button data-f="gas">Gases</button></div>
 <button class="sh-x" aria-label="Close">✕</button></div>
 <div class="sh-body"><div class="sh-key"><span>Key numbers:</span><b>1 cal = 4.184 J</b><span>·</span><b>c (water) = 4.184 J/g·°C = 1.00 cal/g·°C</b></div><div class="sh-grid"></div>
 <div class="sh-tips"><h3>How to use c</h3><ol>
 <li><b>q = m × c × ΔT.</b> c is the heat needed to warm 1 g of a substance by 1 °C.</li>
 <li><b>Big c = warms up slowly.</b> Water is like a big sponge for heat. Metals have a small c, so they get hot fast.</li>
 <li><b>Use the c for the right state.</b> Ice, liquid water and steam all have different c.</li>
 <li><b>Keep the units the same.</b> c in J/g·°C gives q in J. c in cal/g·°C gives q in cal.</li>
 <li><b>Values with ≈</b> change a little with the type of material and the temperature.</li>
 </ol></div></div></div>`;
 document.body.appendChild(ov);
 ['pointerdown','pointerup','click','touchstart','touchend'].forEach(t=>ov.addEventListener(t,e=>e.stopPropagation()));
 ov.addEventListener('click',e=>{if(e.target===ov){close();return}const b=e.target.closest('.sh-seg button');if(b){filt=b.dataset.f;paint();return}if(e.target.closest('.sh-x'))close()});
 ov.querySelector('.sh-q').addEventListener('input',e=>{q=e.target.value;paint()});
 ov.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();else if((e.key==='c'||e.key==='C')&&e.target.tagName!=='INPUT')close()});
 paint()}
function open(){if(window.PT&&PT.close)PT.close();if(window.IONS&&IONS.close)IONS.close();if(!ov)build();lastFocus=document.activeElement;ov.hidden=false;paint();ov.querySelector('.sh-x').focus();document.querySelectorAll('.sh-toggle').forEach(b=>b.setAttribute('aria-expanded','true'))}
function close(){if(!ov||ov.hidden)return;ov.hidden=true;document.querySelectorAll('.sh-toggle').forEach(b=>b.setAttribute('aria-expanded','false'));if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function toggle(){(!ov||ov.hidden)?open():close()}
function button(cls){const b=document.createElement('button');b.type='button';b.className='sh-btn sh-toggle '+(cls||'');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Show or hide the specific heat table');
 b.innerHTML='<span class="sh-ico" aria-hidden="true">c</span><span class="sh-lbl">Specific heat</span><span class="sh-sh">c</span>';b.addEventListener('click',e=>{e.stopPropagation();toggle()});return b}
function mount(){if(document.querySelector('.sh-toggle'))return;const after=document.querySelector('.io-toggle')||document.querySelector('.pt-toggle');
 if(after&&!/\b(pt|io)-float\b/.test(after.className)){const b=button(after.className.replace(/\b(pt|io)-\S+/g,'').trim());after.parentNode.insertBefore(b,after.nextSibling);return}
 const slot=document.querySelector('[data-pt-slot]');if(slot&&!after){slot.appendChild(button(slot.dataset.ptSlot||''));return}
 document.body.appendChild(button('sh-float'))}
function init(){mount();
 document.addEventListener('keydown',e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;if((e.key==='c'||e.key==='C')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();toggle()}},true)}
// opening the periodic table or the ions list closes this table
addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.pt-toggle,.io-toggle'))close()},true);
window.SHEAT={open,close,toggle,data:D};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
