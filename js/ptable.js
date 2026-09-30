/* PHD115 · Chemistry with Dr. NAM · toggleable periodic table (shared by slides and activities).
   Masses: standard atomic weights to 2 d.p.; [n] = mass number of the most stable isotope.
   Electronegativity: Pauling values as printed in Ball, The Basics of GOB Chemistry, Figure 4.4.3. */
(function(){
if(window.PT)return;
const E="H,Hydrogen,1.01,2.1|He,Helium,4.00,|Li,Lithium,6.94,1.0|Be,Beryllium,9.01,1.5|B,Boron,10.81,2.0|C,Carbon,12.01,2.5|N,Nitrogen,14.01,3.0|O,Oxygen,16.00,3.5|F,Fluorine,19.00,4.0|Ne,Neon,20.18,|Na,Sodium,22.99,0.9|Mg,Magnesium,24.31,1.2|Al,Aluminium,26.98,1.5|Si,Silicon,28.09,1.8|P,Phosphorus,30.97,2.1|S,Sulfur,32.07,2.5|Cl,Chlorine,35.45,3.0|Ar,Argon,39.95,|K,Potassium,39.10,0.8|Ca,Calcium,40.08,1.0|Sc,Scandium,44.96,1.3|Ti,Titanium,47.87,1.5|V,Vanadium,50.94,1.6|Cr,Chromium,52.00,1.6|Mn,Manganese,54.94,1.5|Fe,Iron,55.85,1.8|Co,Cobalt,58.93,1.9|Ni,Nickel,58.69,1.9|Cu,Copper,63.55,1.9|Zn,Zinc,65.38,1.6|Ga,Gallium,69.72,1.6|Ge,Germanium,72.63,1.8|As,Arsenic,74.92,2.0|Se,Selenium,78.97,2.4|Br,Bromine,79.90,2.8|Kr,Krypton,83.80,|Rb,Rubidium,85.47,0.8|Sr,Strontium,87.62,1.0|Y,Yttrium,88.91,1.2|Zr,Zirconium,91.22,1.4|Nb,Niobium,92.91,1.6|Mo,Molybdenum,95.95,1.8|Tc,Technetium,[98],1.9|Ru,Ruthenium,101.07,2.2|Rh,Rhodium,102.91,2.2|Pd,Palladium,106.42,2.2|Ag,Silver,107.87,1.9|Cd,Cadmium,112.41,1.7|In,Indium,114.82,1.7|Sn,Tin,118.71,1.8|Sb,Antimony,121.76,1.9|Te,Tellurium,127.60,2.1|I,Iodine,126.90,2.5|Xe,Xenon,131.29,|Cs,Caesium,132.91,0.7|Ba,Barium,137.33,0.9|La,Lanthanum,138.91,|Ce,Cerium,140.12,|Pr,Praseodymium,140.91,|Nd,Neodymium,144.24,|Pm,Promethium,[145],|Sm,Samarium,150.36,|Eu,Europium,151.96,|Gd,Gadolinium,157.25,|Tb,Terbium,158.93,|Dy,Dysprosium,162.50,|Ho,Holmium,164.93,|Er,Erbium,167.26,|Tm,Thulium,168.93,|Yb,Ytterbium,173.05,|Lu,Lutetium,174.97,|Hf,Hafnium,178.49,1.3|Ta,Tantalum,180.95,1.5|W,Tungsten,183.84,1.7|Re,Rhenium,186.21,1.9|Os,Osmium,190.23,2.2|Ir,Iridium,192.22,2.2|Pt,Platinum,195.08,2.2|Au,Gold,196.97,2.4|Hg,Mercury,200.59,1.9|Tl,Thallium,204.38,1.8|Pb,Lead,207.2,1.9|Bi,Bismuth,208.98,1.9|Po,Polonium,[209],2.0|At,Astatine,[210],2.2|Rn,Radon,[222],|Fr,Francium,[223],0.7|Ra,Radium,[226],0.9|Ac,Actinium,[227],1.1|Th,Thorium,232.04,1.3|Pa,Protactinium,231.04,1.4|U,Uranium,238.03,1.4|Np,Neptunium,[237],|Pu,Plutonium,[244],|Am,Americium,[243],|Cm,Curium,[247],|Bk,Berkelium,[247],|Cf,Californium,[251],|Es,Einsteinium,[252],|Fm,Fermium,[257],|Md,Mendelevium,[258],|No,Nobelium,[259],|Lr,Lawrencium,[262],|Rf,Rutherfordium,[267],|Db,Dubnium,[268],|Sg,Seaborgium,[269],|Bh,Bohrium,[270],|Hs,Hassium,[277],|Mt,Meitnerium,[278],|Ds,Darmstadtium,[281],|Rg,Roentgenium,[282],|Cn,Copernicium,[285],|Nh,Nihonium,[286],|Fl,Flerovium,[289],|Mc,Moscovium,[290],|Lv,Livermorium,[293],|Ts,Tennessine,[294],|Og,Oganesson,[294],".split('|').map((s,i)=>{const[sym,name,m,en]=s.split(',');return{z:i+1,sym,name,m,en}});
const NONMET=new Set(['H','C','N','O','F','P','S','Cl','Se','Br','I']),MLOID=new Set(['B','Si','Ge','As','Sb','Te']),NOBLE=new Set(['He','Ne','Ar','Kr','Xe','Rn']);
function pos(z){ // [row, col] in an 18-column table; f-block rows 9 and 10
 if(z===1)return[1,1];if(z===2)return[1,18];
 if(z<=10)return[2,z<=4?z-2:z+8];if(z<=18)return[3,z<=12?z-10:z];
 if(z<=36)return[4,z-18];if(z<=54)return[5,z-36];
 if(z>=57&&z<=71)return[9,z-54];if(z>=89&&z<=103)return[10,z-86];
 if(z<=86)return[6,z<=56?z-54:z-68];return[7,z<=88?z-86:z-100]}
function cat(e){if(NOBLE.has(e.sym)||e.z===118)return'ng';if(MLOID.has(e.sym))return'ml';if(NONMET.has(e.sym))return'nm';if(e.z>=113)return'uk';return'mt'}
const GRP={1:'1A',2:'2A',13:'3A',14:'4A',15:'5A',16:'6A',17:'7A',18:'8A'};
function valence(e){const[r,c]=pos(e.z);if(r>7)return null;if(e.z===2)return 2;if(c===1)return 1;if(c===2)return 2;if(c>=13)return c-10;return null}
const css=`
.pt-btn{font:inherit;font-weight:600;cursor:pointer;border-radius:10px;display:inline-flex;align-items:center;gap:6px}
.pt-float{position:fixed;left:12px;bottom:calc(52px + env(safe-area-inset-bottom,0px));z-index:9;background:rgba(27,42,65,.9);color:#fff;border:1px solid rgba(255,255,255,.25);padding:8px 11px;font-size:14px}
.pt-ico{display:inline-grid;grid-template-columns:repeat(3,4px);gap:1.5px}.pt-ico i{width:4px;height:4px;background:currentColor;border-radius:1px}.pt-ico i:nth-child(2){opacity:0}
#pt-ov{position:fixed;inset:0;z-index:50;background:rgba(6,11,18,.72);display:flex;align-items:center;justify-content:center;padding:calc(10px + env(safe-area-inset-top,0px)) 10px calc(10px + env(safe-area-inset-bottom,0px));font-family:Lexend,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#pt-ov[hidden]{display:none!important}
.pt-panel{background:#fff;color:#1B2A41;border-radius:16px;width:min(1180px,100%);max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.35)}
.pt-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #D7E0E8}
.pt-top h2{margin:0;font-size:17px;flex:1;min-width:150px;white-space:nowrap}
.pt-seg{display:flex;background:#F2F6F9;border:1px solid #D7E0E8;border-radius:10px;padding:3px;gap:3px}
.pt-seg button{font:inherit;font-size:13px;font-weight:600;border:0;border-radius:8px;padding:6px 10px;background:transparent;color:#1B2A41;cursor:pointer}
.pt-seg button[aria-pressed=true]{background:#2F6F9F;color:#fff}
.pt-x{font:inherit;font-size:20px;line-height:1;border:0;background:#F2F6F9;border-radius:10px;width:36px;height:36px;cursor:pointer;color:#1B2A41}
.pt-body{overflow:auto;padding:10px 12px 12px;-webkit-overflow-scrolling:touch}
.pt-grid{display:grid;grid-template-columns:repeat(18,minmax(40px,1fr));gap:3px;min-width:760px}
.pt-gl{font-size:10px;color:#56657A;text-align:center;font-weight:600;align-self:end;line-height:1.2}
.pt-el{border:1px solid rgba(27,42,65,.12);border-radius:6px;padding:3px 2px 2px;text-align:center;cursor:pointer;min-height:48px;display:flex;flex-direction:column;justify-content:space-between;font:inherit;color:#1B2A41;background:#fff}
.pt-el .z{font-size:8.5px;text-align:left;padding-left:2px;color:#56657A;line-height:1}.pt-el .s{font-size:15px;font-weight:700;line-height:1.1}.pt-el .v{font-size:8.5px;line-height:1.1;white-space:nowrap}
.pt-el.mt{background:#FBEFD9}.pt-el.nm{background:#E1EEF7}.pt-el.ml{background:#E3F3E9}.pt-el.ng{background:#EDE7F6}.pt-el.uk{background:#F2F2F2;color:#777}
.pt-el:hover,.pt-el.on{outline:2.5px solid #B86E00;outline-offset:-1px}
.pt-el.dim{opacity:.35}
.pt-f{font-size:10px;color:#56657A;display:flex;align-items:center;justify-content:center;text-align:center}
.pt-info{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:8px 14px;border-top:1px solid #D7E0E8;font-size:14px;min-height:52px;background:#F8FAFC}
.pt-info b.big{font-size:22px;color:#2F6F9F}
.pt-leg{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#56657A;margin-left:auto}.pt-leg span{display:inline-flex;align-items:center;gap:4px}.pt-leg i{width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.12);display:inline-block}
.pt-note{font-size:11px;color:#56657A;padding:0 14px 10px;background:#F8FAFC}
#ctl .pt-btn .pt-ico{display:none}
.bar .pt-btn{background:transparent;color:#2F6F9F;border:1.5px solid #2F6F9F;padding:6px 10px;font-size:.85rem}
.pt-sh{display:none}
@media (max-width:420px){.bar .pt-btn .pt-lbl{display:none}.bar .pt-btn .pt-sh{display:inline}}
@media (max-width:560px){.pt-top h2{flex:1 1 calc(100% - 60px)}.pt-seg{order:3;width:100%}.pt-seg button{flex:1;white-space:nowrap;font-size:12px;padding:6px 4px}}
@media print{.pt-toggle{display:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let mode='mass',sel=null,ov=null,lastFocus=null;
function val(e){if(mode==='mass')return e.m;if(mode==='en')return e.en||'—';const v=valence(e);return v==null?'—':v+' e⁻'}
function cell(e){const[r,c]=pos(e.z);return `<button class="pt-el ${cat(e)}${mode==='en'&&!e.en?' dim':''}${sel===e.z?' on':''}" style="grid-row:${r+1};grid-column:${c}" data-z="${e.z}" aria-label="${e.name}, ${e.sym}, atomic number ${e.z}"><span class="z">${e.z}</span><span class="s">${e.sym}</span>${mode==='both'?`<span class="v">${e.m}</span><span class="v" style="color:#2F6F9F;font-weight:600">${e.en||'—'}</span>`:`<span class="v">${val(e)}</span>`}</button>`}
function grid(){let h='';for(let c=1;c<=18;c++){h+=`<div class="pt-gl" style="grid-row:1;grid-column:${c}">${GRP[c]?GRP[c]+'<br>':''}${c}</div>`}
 h+=`<div class="pt-f" style="grid-row:7;grid-column:3">57–71</div><div class="pt-f" style="grid-row:8;grid-column:3">89–103</div><div style="grid-row:9;grid-column:1/-1;height:6px"></div>`;
 h+=E.map(cell).join('').replace(/grid-row:(10|11);/g,(m,r)=>`grid-row:${+r+1};`);
 h+=`<div class="pt-f" style="grid-row:11;grid-column:1/4">Lanthanides</div><div class="pt-f" style="grid-row:12;grid-column:1/4">Actinides</div>`;return h}
function info(){const e=E.find(x=>x.z===sel);if(!e)return `<span>Tap an element for details.</span>`;const[r,c]=pos(e.z);const v=valence(e);
 const kind={mt:'metal',nm:'nonmetal',ml:'metalloid',ng:'noble gas',uk:'properties not yet known'}[cat(e)];
 return `<b class="big">${e.sym}</b><span><b>${e.name}</b> · Z = ${e.z}</span><span>Atomic mass: <b>${e.m}</b></span><span>Electronegativity: <b>${e.en||'—'}</b></span>${r<=7?`<span>Group ${GRP[c]?GRP[c]+' ('+c+')':c} · Period ${r}</span>`:''}${v!=null?`<span>Valence electrons: <b>${v}</b></span>`:''}<span>${kind}</span>`}
function paint(){ov.querySelector('.pt-grid').innerHTML=grid();ov.querySelector('.pt-info').innerHTML=info()+legend();
 ov.querySelectorAll('.pt-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode))}
function legend(){return `<span class="pt-leg"><span><i style="background:#FBEFD9"></i>metal</span><span><i style="background:#E3F3E9"></i>metalloid</span><span><i style="background:#E1EEF7"></i>nonmetal</span><span><i style="background:#EDE7F6"></i>noble gas</span></span>`}
function build(){ov=document.createElement('div');ov.id='pt-ov';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Periodic table');
 ov.innerHTML=`<div class="pt-panel"><div class="pt-top"><h2>Periodic table</h2><div class="pt-seg" role="group" aria-label="Show"><button data-m="mass">Atomic mass</button><button data-m="en">Electronegativity</button><button data-m="val">Valence e⁻</button></div><button class="pt-x" aria-label="Close periodic table">×</button></div>
 <div class="pt-body"><div class="pt-grid"></div></div><div class="pt-info"></div><div class="pt-note">Atomic masses to 2 d.p. ([n] = mass number of the most stable isotope). Electronegativity: Pauling values as in Ball, <i>The Basics of GOB Chemistry</i>, Figure 4.4.3 (La–Lu 1.0–1.2; noble gases have no value).</div></div>`;
 document.body.appendChild(ov);
 ['pointerdown','pointerup','click','touchstart','touchend'].forEach(t=>ov.addEventListener(t,e=>e.stopPropagation()));
 ov.addEventListener('click',e=>{if(e.target===ov){close();return}const b=e.target.closest('.pt-el');if(b){sel=+b.dataset.z;paint();return}
  const m=e.target.closest('.pt-seg button');if(m){mode=m.dataset.m;try{localStorage.setItem('phd115:ptmode',mode)}catch(_){}paint();return}if(e.target.closest('.pt-x'))close()});
 ov.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'||e.key==='p'||e.key==='P')close()});
 try{mode=localStorage.getItem('phd115:ptmode')||'mass'}catch(_){}paint()}
function open(){if(!ov)build();lastFocus=document.activeElement;ov.hidden=false;paint();ov.querySelector('.pt-x').focus();document.querySelectorAll('.pt-toggle').forEach(b=>b.setAttribute('aria-expanded','true'))}
function close(){if(!ov)return;ov.hidden=true;document.querySelectorAll('.pt-toggle').forEach(b=>b.setAttribute('aria-expanded','false'));if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function toggle(){(!ov||ov.hidden)?open():close()}
function button(cls){const b=document.createElement('button');b.type='button';b.className='pt-btn pt-toggle '+(cls||'');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Show or hide the periodic table');
 b.innerHTML='<span class="pt-ico" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="pt-lbl">Periodic table</span><span class="pt-sh">PT</span>';b.addEventListener('click',e=>{e.stopPropagation();toggle()});return b}
function mount(){if(document.querySelector('.pt-toggle'))return;const slot=document.querySelector('[data-pt-slot]');if(slot)slot.appendChild(button(slot.dataset.ptSlot||''));else document.body.appendChild(button('pt-float'))}
function init(){mount();
 document.addEventListener('keydown',e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;if((e.key==='p'||e.key==='P')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();toggle()}},true)}
window.PT={open,close,toggle,mount,data:E,setMode(m){mode=m;if(ov)paint()}};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
