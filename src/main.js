/**
 * Vick Does Creative: a portfolio played as a 3D synthesizer.
 * Three.js scene, Web Audio synth engine, camera "modes" per synth part, and floating detail cards.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CH, LINKS, im } from './content.js';
import { applyCMS } from './cms.js';
await applyCMS(CH, LINKS); // content saved in /admin replaces the defaults (draft on previews, live on the live site)

/* ───────────── MODES (each part of the synth is a mode) ───────────── */
const MODES={
  gd:{part:'The keyboard',n:'12 projects',dock:'Graphic',glow:'#22ff7a',box:'kb'},
  ux:{part:'The keyboard',n:'7 case notes',dock:'UX/UI',glow:'#3fb2ff',box:'kb'},
  mo:{part:'The keyboard',n:'6 pieces',dock:'Motion',glow:'#ff6a20',box:'kb'},
  ds:{part:'The keyboard',n:'Designer',dock:'Roles',glow:'#3fb2ff',box:'kb'},
  st:{part:'The keyboard',n:'Strategist',dock:'Strategist',glow:'#2bd67b',box:'kb'},
  ar:{part:'The keyboard',n:'Artist',dock:'Artist',glow:'#ffffff',box:'kb'},
  te:{part:'The keyboard',n:'Teacher',dock:'Teacher',glow:'#ff7a2a',box:'kb'},
  info:{part:'The About row',n:'6 pages',dock:'About',glow:'#ff2a30',box:'info'},
  cv:{part:'The remote',n:'CV, contact & socials',dock:'CV & Contact',glow:'#ff6a20',box:'cv'},
};
const ORDER=['gd','ux','mo','tl','xp','ab','ds','st','ar','te','cv'], KBM=['gd','ux','mo','ab','sk','tl','aw','wk','sd','xp','ds','st','ar','te'], PADM=[], DOCK=['ab','gd','ux','mo','ds','cv']; // PADM: the life strip was removed (Nov 2026); kept empty so the shared code paths stay simple
const S={mode:null,card:null,persona:0,hover:null,hoverUntil:0,kb:'gd',pad:'fm',grp:null,grpLbl:null};
let lastHit=null;
{ Object.assign(MODES,{xp:{dock:'Experimental',glow:'#ff5ec8'},ab:{dock:'About',glow:'#ff2a30'},sk:{dock:'Skills',glow:'#ffb020'},tl:{dock:'Tools',glow:'#a46bff'},aw:{dock:'Awards',glow:'#ffd400'},wk:{dock:'Work',glow:'#00e0cc'},sd:{dock:'Study',glow:'#ff5ec8'}});
 ['ab','sk','tl','aw','wk','sd','xp'].forEach(k=>Object.assign(MODES[k],{part:'The keyboard',box:'kb'}));
 ['ds','st','ar','te','ab','sk','tl','aw','wk','sd','xp'].forEach(k=>MODES[k].n=CH[k].items.length+' keys');}
for(const k in MODES)if(CH[k]?.glow)MODES[k].glow=CH[k].glow; // glow colours can be changed in /admin
MODES.gd.n=CH.gd.items.length+' projects';MODES.ux.n=CH.ux.items.length+' case notes';MODES.mo.n=CH.mo.items.length+' pieces';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const CTRL={kb:[],pad:[],info:[],cv:[]}, BIGCAPS=[], ROWBTN=[];
const realCh=ch=>ch==='kb'?S.kb:ch==='pad'?S.pad:ch;

/* ───────────── CARD ───────────── */
/* Simple social glyphs for the Contact CTAs (generic marks, drawn in currentColor) */
function SOCIAL_ICON(label){const k=label.toLowerCase().split(/[ (]/)[0];
  const g={behance:'<text x="12" y="16.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="11" fill="currentColor">Bē</text>',
   instagram:'<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16.6" cy="7.4" r="1.2" fill="currentColor"/>',
   linkedin:'<rect x="3.5" y="3.5" width="17" height="17" rx="3.5" fill="currentColor"/><text x="12" y="16.6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="10" fill="#fff">in</text>',
   threads:'<text x="12" y="17.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="17" fill="currentColor">@</text>',
   x:'<path d="M5 4.5h3.6l10.4 15h-3.6z" fill="currentColor"/><path d="M18.6 4.5 5.4 19.5" stroke="currentColor" stroke-width="1.8"/>'}[k]||'<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>';
  return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${g}</svg>`}

const ICON={
  prev:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  out:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 16L16 8M9 8h7v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  copy:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path class="tick" d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
$('prev').innerHTML=ICON.prev; $('next').innerHTML=ICON.next; $('cls').innerHTML=ICON.close;
/* images get a placeholder until they arrive, then fade in */
const pic=(g,cls='')=>`<button class="pic ${cls}" data-src="${g.s}" aria-label="Enlarge: ${g.a}"><img src="${g.s}" alt="${g.a}" loading="lazy" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('ok')"></button>`;
function cardHTML(ch,i){
  const c=CH[ch],it=c.items[i];
  let h=it.img?.length?pic(it.img[0],'lead'):'';            // show the actual work first
  h+=`<header class="hd"><h2>${it.t}</h2><p class="k">${it.k}</p></header>`;
  if(it.hero) h+=`<div class="hero"><img src="assets/img/vick.jpg" alt="Portrait of Vickhal Roopram"><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
  if(it.bars) h+=`<div class="bars">${it.bars.map(b=>`<div class="bar"><span>${b[0]}</span><small>${b[1]}</small><div><i style="--w:${b[2]*100}%"></i></div></div>`).join('')}</div>`;
  if(it.life) h+=``+CH.life.items.map(x=>`<div class="d"><h3>${x.t}</h3>${x.d}</div>`).join('');
  if(it.contact) h+=`<div class="d"><p>For work, collaborations or a chat about design and faith:</p></div><div class="cta-row"><a class="cta" href="mailto:vickhal10@gmail.com">Email vickhal10@gmail.com</a><button class="cta ghost" id="cp">${ICON.copy}<span>Copy</span></button></div><p class="copy">Cell <span class="num">+27 73 482 7221</span></p><div class="socials">${LINKS.map(l=>`<a class="soc" href="${l[1]}" target="_blank" rel="noopener">${SOCIAL_ICON(l[0])}<span>${l[0]}<small>${l[1].replace(/^https:\/\/(www\.)?/,'').replace(/\/$/,'')}</small></span>${ICON.out}</a>`).join('')}</div>`;
  if(it.d) h+=`<div class="d">${it.d}</div>`;
  if(it.links) h+=`<div class="cta-row">${it.links.map((l,k)=>`<a class="cta${k?' ghost':''}" href="${l[1]}" target="_blank" rel="noopener">${l[0]} ${ICON.out}</a>`).join('')}</div>`;
  if(it.img?.length>1) h+=`<div class="gal">${it.img.slice(1).map(g=>pic(g)).join('')}</div>`;
  return h;
}
function openCard(ch,i){
  const c=CH[ch],n=c.items.length; i=((i%n)+n)%n; S.card={ch,i}; updateUI(); found(ch,`${c.items[i].t}`); if(ch==='life')S.persona=i;
  $('card').style.setProperty('--accent',c.col);
  $('eb').innerHTML='';
  $('ct').innerHTML=cardHTML(ch,i); $('ct').scrollTop=0;
  const card=$('card'); card.hidden=true; void card.offsetWidth; card.hidden=false;
  const rb=ROWBTN.find(a=>a[1]===ch);if(rb)press(rb[0]);
  const m=(KBM.includes(ch)?CTRL.kb:PADM.includes(ch)?CTRL.pad:CTRL[ch])?.[i]; if(m) press(m);
  const cp=$('cp'); if(cp) cp.onclick=()=>{const done=()=>{cp.classList.add('done');cp.innerHTML=ICON.check+'<span>Copied</span>';toast('Email copied to your clipboard');drum('blip')};
    navigator.clipboard?.writeText('vickhal10@gmail.com').then(done,()=>toast('Copy blocked: the address is vickhal10@gmail.com'))};
}
/* INTERACTIONS: 12 things to discover; the counter and "last interaction" line sit top left */
const FIND={gd:'Opened Design',ux:'Opened UI/UX',mo:'Opened Motion & 3D',tl:'Opened Tools',xp:'Opened Experimental',roles:'Turned a role knob',theme:'Switched day and night',cv:'Picked up the remote',about:'Read the About pages',beats:'Played the beats',drums:'Hit the drum pads',lamp:'Switched the lamp'};
const FKEY=ch=>['ds','st','ar','te'].includes(ch)?'roles':PADM.includes(ch)?'life':['ab','sk','aw','wk','sd','info'].includes(ch)?'about':ch;
const FOUND=new Set();try{JSON.parse(localStorage.getItem('vdc-found')||'[]').forEach(k=>FIND[k]&&FOUND.add(k))}catch{}
function found(id,text){const k=FKEY(id);if(!FIND[k])return;const fresh=!FOUND.has(k);FOUND.add(k);try{localStorage.setItem('vdc-found',JSON.stringify([...FOUND]))}catch{}
  $('ixn').textContent=`${FOUND.size}/${Object.keys(FIND).length}`;$('ixl').textContent=text||FIND[k];$('ixl').classList.remove('flash');void $('ixl').offsetWidth;$('ixl').classList.add('flash');if(fresh){const b=$('ix');b.classList.remove('new');void b.offsetWidth;b.classList.add('new')}}
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>{t.hidden=true},2600)}
function closeCard(){S.card=null;$('card').hidden=true;updateUI()}
$('prev').onclick=()=>{ensureAudio();openCard(S.card.ch,S.card.i-1);noteFor(S.card.i)};
$('next').onclick=()=>{ensureAudio();openCard(S.card.ch,S.card.i+1);noteFor(S.card.i)};
$('cls').onclick=closeCard;
$('ct').onclick=e=>{const b=e.target.closest('.pic');if(b){$('lb').querySelector('img').src=b.dataset.src;$('lb').hidden=false}};
$('lb').onclick=()=>$('lb').hidden=true;
function noteFor(i){playNote(60+[0,4,7,12,7,4,2,5,9,11,14,16][i%12])}

/* dock + hint */
$('home').onclick=()=>{ensureAudio();closeMenu();zoomOut()};
$('brand').onclick=e=>{e.preventDefault();ensureAudio();closeMenu();if(S.mode||S.card)zoomOut()};
function updateUI(){
  $('home').dataset.atHome=String(!S.mode&&!S.card);
  document.body.dataset.card=String(!!S.card); // phones hide the camera controls under the card sheet
  const g=S.card?MODES[S.card.ch]?.glow:S.mode?MODES[S.mode].glow:null;  // HUD buttons glow in the active mode's colour
  document.documentElement.style.setProperty('--glow',!g||g==='#ffffff'?'#ff5d1a':g);
}
/* HUD buttons: glow pulse + stroke trace on every press, same language as the synth controls */
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.ico,.ch button');if(!b)return;b.classList.remove('zap');void b.offsetWidth;b.classList.add('zap')});
document.addEventListener('animationend',e=>{if(e.animationName==='zap')e.target.classList.remove('zap')});

/* ───────────── AUDIO ───────────── */
const P={cutoff:.62,q:.22,dtime:.35,fb:.3,wet:.22,detune:.15,decay:.45,attack:.03,sub:.3,drums:.8,vol:.7,wave:1};
const PNAMES={cutoff:'Tone',q:'Resonance',dtime:'Echo time',fb:'Echo feedback',wet:'Echo mix',detune:'Detune',decay:'Decay',attack:'Attack',sub:'Sub osc',drums:'Drum level',vol:'Volume'};
const WAVES=['triangle','square','sawtooth'];
let ac,master,filter,delay,fb,wet,an,noiseBuf,muted=false,tdata;
function ensureAudio(){
  if(ac){if(ac.state==='suspended')ac.resume();return}
  try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  master=ac.createGain(); filter=ac.createBiquadFilter(); filter.type='lowpass';
  delay=ac.createDelay(1.2); fb=ac.createGain(); wet=ac.createGain(); an=ac.createAnalyser(); an.fftSize=1024; tdata=new Uint8Array(an.fftSize);
  filter.connect(master); filter.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
  master.connect(an); an.connect(ac.destination);
  noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  applyP();
}
function applyP(){ if(!ac)return; const t=ac.currentTime;
  filter.frequency.setTargetAtTime(180*Math.pow(90,P.cutoff),t,.02); filter.Q.setTargetAtTime(.5+P.q*16,t,.02);
  delay.delayTime.setTargetAtTime(.05+P.dtime*.7,t,.05); fb.gain.setTargetAtTime(P.fb*.85,t,.02); wet.gain.setTargetAtTime(P.wet,t,.02);
  master.gain.setTargetAtTime(muted?0:P.vol*.8,t,.02); }
const mtof=m=>440*Math.pow(2,(m-69)/12);
function playNote(m,len=1){
  if(!ac||muted)return; const t=ac.currentTime, f=mtof(m), g=ac.createGain(), dec=.25+P.decay*2.2*len;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.22,t+.005+P.attack*.6); g.gain.exponentialRampToValueAtTime(.0008,t+dec);
  g.connect(filter);
  [-1,1].forEach(s=>{const o=ac.createOscillator();o.type=WAVES[P.wave];o.frequency.value=f;o.detune.value=s*P.detune*30;o.connect(g);o.start(t);o.stop(t+dec+.05)});
  const so=ac.createOscillator(),sg=ac.createGain();so.type='sine';so.frequency.value=f/2;sg.gain.value=P.sub;so.connect(sg);sg.connect(g);so.start(t);so.stop(t+dec+.05);
}
function drum(k){
  if(!ac||muted)return; const t=ac.currentTime, out=ac.createGain(); out.gain.value=P.drums; out.connect(master);
  const env=(node,a,d)=>{const g=ac.createGain();g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.001,t+d);node.connect(g);g.connect(out);return g};
  const nz=(d,type,fq)=>{const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type=type;f.frequency.value=fq;s.connect(f);s.start(t);s.stop(t+d);return f};
  const osc=(type,f0,f1,d)=>{const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);o.start(t);o.stop(t+d);return o};
  ({kick:()=>env(osc('sine',150,40,.4),1,.4),
    snare:()=>{env(nz(.2,'bandpass',1800),.7,.18);env(osc('triangle',220,160,.12),.5,.12)},
    hat:()=>env(nz(.06,'highpass',7000),.4,.05),
    clap:()=>{[0,.012,.024].forEach(o=>{const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;const g=ac.createGain();g.gain.setValueAtTime(.6,t+o);g.gain.exponentialRampToValueAtTime(.001,t+o+.12);s.connect(f);f.connect(g);g.connect(out);s.start(t+o);s.stop(t+o+.15)})},
    tom:()=>env(osc('sine',220,90,.3),.8,.3),
    rim:()=>env(osc('square',800,600,.03),.3,.04),
    shaker:()=>env(nz(.12,'highpass',4500),.25,.11),
    crash:()=>env(nz(1.2,'highpass',3500),.35,1.1),
    blip:()=>env(osc('square',1200,2400,.08),.2,.08),
    whoosh:()=>{const f=nz(.6,'bandpass',600);f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(3000,t+.5);env(f,.35,.55)}})[k]?.();
}
function toggleMute(){muted=!muted;if(muted)stopDemo();const b=$('snd');b.setAttribute('aria-label',muted?'Sound off: unmute':'Sound on: mute');b.setAttribute('aria-pressed',!muted);flip(b);ensureAudio();applyP()}
function flip(b){b.classList.remove('flip');void b.offsetWidth;b.classList.add('flip')}
$('snd').onclick=toggleMute;

/* ───────────── 3D SCENE ───────────── */
const stage=$('stage');
await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
stage.prepend(renderer.domElement); $('loading').remove();
const scene=new THREE.Scene(); scene.background=new THREE.Color('#ece5d8');
const camera=new THREE.PerspectiveCamera(32,1,.1,300);
scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),0.04).texture; // studio reflections for the metal
const hemi=new THREE.HemisphereLight('#ffffff','#b9bab6',.45); scene.add(hemi);
const rim=new THREE.DirectionalLight('#dfe8ff',.9); rim.position.set(9,6,-12); scene.add(rim);
const sun=new THREE.DirectionalLight('#fff6ea',2.0); sun.position.set(-7,16,9); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-24,right:24,top:20,bottom:-20,near:1,far:60}); sun.shadow.radius=6; sun.shadow.bias=-.0004; scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.17})); floor.rotation.x=-Math.PI/2; floor.position.y=-30.9; floor.receiveShadow=true; scene.add(floor); // the room floor, under the desk
/* soft studio "pool" of light under the synth: a brighter spot in light mode, a lit stage in dark mode */
const pool=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.55,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(64,36),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,opacity:.5}));
  m.rotation.x=-Math.PI/2;m.position.set(-1.5,-30.89,-1.5);m.renderOrder=-1;scene.add(m);return m})();

/* ── Materials: Teenage-Engineering-style anodised & brushed aluminium, satin plastic ── */
function noiseTex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=8;return t}
const TEX={
  brush:noiseTex(512,512,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const y=Math.random()*h,g=110+Math.random()*60|0;x.strokeStyle=`rgba(${g},${g},${g},${.15+Math.random()*.35})`;x.lineWidth=Math.random()*1.4+.3;x.beginPath();x.moveTo(0,y);x.lineTo(w,y+(Math.random()-.5)*2);x.stroke()}},[2,2]),
  grain:noiseTex(256,256,(x,w,h)=>{const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=118+Math.random()*24|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0)},[3,3]),
  /* diamond knurl (crossed 45° grooves), as on precision audio knobs */
  knurl:noiseTex(256,64,(x,w,h)=>{x.fillStyle='#8a8a8a';x.fillRect(0,0,w,h);x.lineWidth=3.2;
    for(let i=-h;i<w+h;i+=8){x.strokeStyle='rgba(235,235,235,.9)';x.beginPath();x.moveTo(i,0);x.lineTo(i+h,h);x.stroke();x.strokeStyle='rgba(40,40,40,.9)';x.beginPath();x.moveTo(i+h,0);x.lineTo(i,h);x.stroke()}},[6,1])};
/* Theme-aware presets. `dark` is the colour in dark mode, `denv` the env-reflection strength in dark mode.
   Light: brushed aluminium + satin white keys. Dark: gunmetal anodised + graphite keys (studio product-shot look). */
const PRESET={ // playful, warm, matte: cream and warm-grey hardware (ref: portfolio-zxc.com), light → dark colour
  '#d4d6db':{color:'#e7dcc8',dark:'#3a342c',denv:.45,metalness:.25,roughness:.52,roughnessMap:TEX.brush,bumpMap:TEX.brush,bumpScale:.18},   // body
  '#e3e4e8':{color:'#d9cdb6',dark:'#2b2721',denv:.4,metalness:.15,roughness:.62,roughnessMap:TEX.grain,bumpMap:TEX.grain,bumpScale:.2},      // tiles
  '#eeeff2':{color:'#f5eddc',dark:'#5a544a',denv:.7,metalness:0,roughness:.55,clearcoat:.3,clearcoatRoughness:.45,bumpMap:TEX.grain,bumpScale:.12}, // keycaps: cream / warm grey
  '#2c2d31':{color:'#5b554b',dark:'#3d3932',denv:.7,metalness:0,roughness:.5,clearcoat:.35,clearcoatRoughness:.4,bumpMap:TEX.grain,bumpScale:.12},   // pad caps
  '#232427':{color:'#4b453c',dark:'#28241f',denv:.55,metalness:.2,roughness:.55,roughnessMap:TEX.grain,bumpMap:TEX.grain,bumpScale:.15},       // strip
  '#1c1c1e':{color:'#2b2823',dark:'#1d1a16',metalness:.1,roughness:.6},
  '#c4c6cc':{color:'#d6c59e',dark:'#8c7b5a',denv:.7,metalness:.85,roughness:.28},                                                                   // brass rings + screws
  '#1b1c1f':{color:'#24201b',dark:'#14120f',metalness:.1,roughness:.75,bumpMap:TEX.grain,bumpScale:.2}};                                         // deck recess
/* tag a material with its light/dark colour; the theme engine lerps every tagged material */
function themed(mt,l,d,le=mt.envMapIntensity,de=le){mt.userData.tc={l,d,le,de};return mt}
const mats={}; const M=(c,r=.62,m=0)=>{const k=c+r+m;if(mats[k])return mats[k];const p=PRESET[c.toLowerCase()];
  if(p){const {dark,denv,...o}=p;return mats[k]=themed(new THREE.MeshPhysicalMaterial(o),o.color,dark,1,denv??1)}
  return mats[k]=new THREE.MeshPhysicalMaterial({color:c,roughness:Math.min(r,.5),metalness:Math.max(m,.15),clearcoat:.25,clearcoatRoughness:.35,bumpMap:TEX.grain,bumpScale:.08,envMapIntensity:.9})};
/* anodised coloured knob cap + knurled metal band */
const A=c=>mats['A'+c]||(mats['A'+c]=new THREE.MeshPhysicalMaterial({color:c,metalness:.65,roughness:.28,clearcoat:.6,clearcoatRoughness:.2,bumpMap:TEX.grain,bumpScale:.05}));
const KN=mats.KN=themed(new THREE.MeshPhysicalMaterial({color:'#b9bcc2',metalness:1,roughness:.32,bumpMap:TEX.knurl,bumpScale:1.2,side:THREE.DoubleSide}),'#b9bcc2','#868990',1,.8);
function knurl(parent,r,h,y,proxy){const k=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,64,1,true),KN);k.position.y=y;k.castShadow=true;parent.add(k);k.userData.proxy=proxy;hits.push(k);return k}
function screw(parent,x,y,z){const s=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.025,20),M('#c4c6cc'));s.position.set(x,y,z);parent.add(s);const sl=new THREE.Mesh(new THREE.BoxGeometry(.11,.012,.022),new THREE.MeshStandardMaterial({color:'#55575c'}));sl.position.set(x,y+.014,z);sl.rotation.y=Math.random()*Math.PI;parent.add(sl)}
const geos={}; function rbox(w,h,d,r,mat){const k=[w,h,d,r].join();let g=geos[k];if(!g){const rr=Math.min(r,w/2-.001,h/2-.001,d/2-.001);g=geos[k]=new RoundedBoxGeometry(w,h,d,3,rr);g.userData.rr={w,h,d,r:rr}}const m=new THREE.Mesh(g,mat);m.castShadow=m.receiveShadow=true;return m}
function cyl(rt,rb,h,mat,seg=40){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);m.castShadow=m.receiveShadow=true;return m}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw?.(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return {c,x,t}}
/* printed labels: white text tinted by the material colour, so the theme engine can recolour them */
function labelPlane(text,w=.62,h=.3,color='#6b6e76',size=50,dark){const {t}=canvasTex(256,124,(x,W,H)=>{x.fillStyle='#fff';x.font=`600 ${size}px "IBM Plex Mono", monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,W/2,H/2+2)});
  const mt=themed(new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,color}),color,dark||LABEL_DARK[color]||color);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mt);p.rotation.x=-Math.PI/2;return p}
const LABEL_DARK={'#6b6e76':'#b9ab92','#7b7e86':'#a99c86'};

/* ───────────── PRESS FX: gap glow (light leaking around a cap) + comet stroke tracing the cap edge ───────────── */
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX=new Map(), FXL=[], FXMATS=[];
/* rounded rect path for both a canvas context and a THREE.Shape (quadratic corners: both APIs support them) */
function rrPath(p,x,y,w,h,r){r=Math.min(r,w/2,h/2);p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath()}
const haloTex={};
/* blurred rounded-rect mask; drawn with an off-canvas shadow so it works in every browser (no ctx.filter needed) */
function haloTexture(w,d,r){const k=[w,d,r].map(v=>v.toFixed(3)).join();if(haloTex[k])return haloTex[k];
  const m=.3,s=96,W=Math.round((w+2*m)*s),H=Math.round((d+2*m)*s),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),off=W*4;
  x.shadowColor='#fff';x.shadowOffsetX=off;
  x.shadowBlur=.16*s;x.fillStyle='#fff';x.beginPath();rrPath(x,m*s-off,m*s,w*s,d*s,r*s);x.fill();                  // wide soft bloom
  x.shadowBlur=.035*s;x.lineWidth=.05*s;x.strokeStyle='#fff';x.beginPath();rrPath(x,m*s-off-.015*s,m*s-.015*s,(w+.03)*s,(d+.03)*s,(r+.015)*s);x.stroke(); // bright rim right at the gap
  const t=new THREE.CanvasTexture(c);return haloTex[k]={t,m}}
function dims(mesh){const g=mesh.geometry;if(g.userData.rr)return g.userData.rr;const p=g.parameters,R=Math.max(p.radiusTop,p.radiusBottom);return {w:2*R,h:p.height,d:2*R,r:R}}
/* the effect record for a control; creates its gap halo the first time */
function fxOf(mesh){let f=FX.get(mesh);if(f)return f;const {w,h,d,r}=dims(mesh),ht=haloTexture(w,d,r);
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(w+2*ht.m,d+2*ht.m),new THREE.MeshBasicMaterial({map:ht.t,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
  halo.rotation.x=-Math.PI/2;halo.position.set(mesh.position.x,mesh.position.y-h/2+.026,mesh.position.z);halo.renderOrder=2;halo.visible=false;mesh.parent.add(halo);FXMATS.push(halo.material);
  f={m:mesh,halo,w,h,d,r,stroke:null,t0:-1e9,amp:0,col:new THREE.Color('#ff5d1a'),colFn:null,managed:false};FX.set(mesh,f);FXL.push(f);return f}
const STROKE_VS=`attribute float a;attribute float e;varying float vA;varying float vE;void main(){vA=a;vE=e;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const STROKE_FS=`uniform float uHead,uFade,uOp;uniform vec3 uCol;varying float vA;varying float vE;
void main(){float d=uHead-vA;float trail=d<0.?0.:smoothstep(.6,0.,d);float head=smoothstep(.07,0.,abs(d));
  float a=max(trail*.75+head,uFade);float edge=1.-pow(abs(vE*2.-1.),2.);
  gl_FragColor=vec4(mix(uCol,vec3(1.),head*.55),clamp(a*edge*uOp,0.,1.));
  #include <colorspace_fragment>
}`;
/* a thin ribbon hugging the cap outline; attribute a = distance from the front-centre (0) to the back (1), so two heads race round both sides */
function strokeFor(f){if(f.stroke)return f.stroke;const o=.018,bw=.085,N=192,s=new THREE.Shape();
  const hw=f.w/2,hd=f.d/2,r=Math.min(f.r,hw,hd);
  if(r>=Math.min(hw,hd)-.002&&Math.abs(hw-hd)<.002)s.absarc(0,0,hw,0,Math.PI*2,false);else rrPath(s,-hw,-hd,f.w,f.d,r);
  const P=s.getSpacedPoints(N);let i0=0;P.forEach((p,i)=>{if(p.y-Math.abs(p.x)*.01>P[i0].y-Math.abs(P[i0].x)*.01)i0=i});
  const pos=[],A_=[],E=[],idx=[];
  for(let i=0;i<=N;i++){const p=P[i%N],pa=P[(i-1+N)%N],pb=P[(i+1)%N];let nx=pb.y-pa.y,ny=-(pb.x-pa.x);const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;if(nx*p.x+ny*p.y<0){nx=-nx;ny=-ny}
    const u=(((i-i0)/N)%1+1)%1,a=Math.min(u,1-u)*2;
    pos.push(p.x+nx*o,0,p.y+ny*o, p.x+nx*(o+bw),0,p.y+ny*(o+bw));A_.push(a,a);E.push(0,1);
    if(i<N){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('a',new THREE.Float32BufferAttribute(A_,1));g.setAttribute('e',new THREE.Float32BufferAttribute(E,1));g.setIndex(idx);
  const mt=new THREE.ShaderMaterial({uniforms:{uHead:{value:0},uFade:{value:0},uOp:{value:0},uCol:{value:new THREE.Color()}},vertexShader:STROKE_VS,fragmentShader:STROKE_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:themeK>.5?THREE.AdditiveBlending:THREE.NormalBlending});
  const st=new THREE.Mesh(g,mt);st.position.y=f.h*.12;st.renderOrder=3;st.frustumCulled=false;f.m.add(st);FXMATS.push(mt);return f.stroke=st}
const defaultGlow=()=>S.mode?MODES[S.mode].glow:'#ff5d1a';
/* fire a press: gap flash + stroke. delay (ms) lets waves ripple across many controls */
function pulse(mesh,delay=0,amp=1){const f=fxOf(mesh);f.t0=performance.now()+delay;f.amp=amp;if(!f.managed)f.col.set((f.colFn||defaultGlow)())}
const lightCol=new THREE.Color();
function updateFx(now){const dark=themeK>.5, face=1-.72*Math.max(0,themeK); // dark caps light up fully, so in dark mode the light comes from the gap instead of the face
  for(const f of FXL){const mm=f.m.material,age=(now-f.t0)/1000;
    const flash=age<0?0:f.amp*Math.pow(Math.max(0,1-age/.6),1.4);
    let base=0,col=f.col;
    if(f.managed){base=mm.emissiveIntensity;col=mm.emissive;mm.emissiveIntensity=Math.max(base*face,flash*.85*face)}
    else if(mm.emissive){mm.emissive.copy(f.col);mm.emissiveIntensity=flash*.5*face}
    // white glow disappears on the light deck: use graphite instead
    lightCol.copy(col);if(!dark&&col.r+col.g+col.b>2.4)lightCol.set('#55575e');
    const op=Math.min(1,base*1.55+flash)*(dark?1:.85);
    f.halo.visible=op>.004;if(f.halo.visible){f.halo.material.opacity=op;f.halo.material.color.copy(lightCol).multiplyScalar(dark?1.35:1)}
    if(age>=0&&age<1.15&&f.amp>0){const st=strokeFor(f),u=st.material.uniforms;st.visible=true;
      u.uHead.value=reduceMotion?1.3:Math.min(1.3,age/.42);u.uFade.value=age<.38?0:Math.max(0,1-(age-.38)/.7)*.85;u.uOp.value=Math.min(1,f.amp*1.2);u.uCol.value.copy(lightCol)}
    else if(f.stroke)f.stroke.visible=false}}

const hits=[], anim=[];
function press(m){pulse(m);const u=m.userData;if(u.by===undefined)return;u.ty=u.by-.07;setTimeout(()=>u.ty=u.by,150)}
/* generic controls (own material clone so each can flash on its own) */
function pressable(mesh,act,tip){mesh.material=mesh.material.clone();fxOf(mesh);mesh.userData={tip,by:mesh.position.y,ty:mesh.position.y,down(){press(mesh);act()}};hits.push(mesh);anim.push(mesh)}
/* item control: a control that holds a piece of the portfolio */
function itemCtrl(mesh,ch,i,sound,{knob=null,pressy=true}={}){
  CTRL[ch][i]=mesh; mesh.material=mesh.material.clone(); mesh.material.emissive=new THREE.Color(MODES[realCh(ch)].glow);
  fxOf(mesh).managed=true;
  const has=()=>i<CH[realCh(ch)].items.length;
  function go(){const c=realCh(ch); if(S.mode!==c)zoomTo(c); else openCard(c,i)}
  mesh.userData={get ch(){return realCh(ch)},i,get item(){return has()},tip:ch==='pad'?'Open slot · drum pad':'Play a note',
    ...(pressy?{by:mesh.position.y,ty:mesh.position.y}:{}),
    down(){sound?.();if(pressy)press(mesh);else pulse(mesh);if(has())go()},
    drag(d){if(knob)knob.userData.r+=d/50},
    up(){}};
  hits.push(mesh); if(pressy)anim.push(mesh);
}
function paramKnob(pos,key,{r=.28,cap='#d0d2d6',ring='#3a3b3f',parent}){
  const g=new THREE.Group(); g.position.copy(pos); parent.add(g);
  const rg=cyl(r+.08,r+.1,.08,M(ring,.5)); rg.position.y=.04; g.add(rg);
  const rot=new THREE.Group(); g.add(rot);
  const cp=cyl(r,r+.02,.3,A(cap)); cp.position.y=.22; rot.add(cp); knurl(rot,r+.028,.2,.17,cp);
  const ind=new THREE.Mesh(new THREE.BoxGeometry(.04,.02,r*.7),M('#e9e9ec')); ind.position.set(0,.38,-r*.5); rot.add(ind);
  rg.userData.proxy=cp; ind.userData.proxy=cp; hits.push(rg,ind);
  rot.userData.r=0; anim.push(rot);
  if(key){const set=()=>{rot.userData.r=(.5-P[key])*4.4};set();rot.rotation.y=rot.userData.r;
    cp.material=cp.material.clone();fxOf(cp);
    cp.userData={tip:`${PNAMES[key]} · drag up/down`,live:()=>`${PNAMES[key]} ${Math.round(P[key]*100)}%`,down(){pulse(cp)},drag(d){P[key]=Math.min(1,Math.max(0,P[key]+d/180));set();applyP()},up(){}};hits.push(cp);}
  return {g,rot,cp};
}

const C={tile:'#e3e4e8',cap:'#eeeff2',body:'#d4d6db',recess:'#1b1c1f',black:'#232427',ring:'#c4c6cc'};
// (screws added after the body)
const synth=new THREE.Group(); scene.add(synth);
const TOP=.9, GX=c=>-8+c, GZ=r=>-2.5+r;
{const body=rbox(18.9,.9,7.3,.3,M(C.body,.55)); body.position.y=.45; synth.add(body);
 const lip=rbox(18.9,.4,7.3,.2,M(C.black,.5)); lip.position.set(0,.2,.14); synth.add(lip);
 const rec=rbox(17.25,.12,6.25,.05,M(C.recess,.8)); rec.position.y=TOP; synth.add(rec);}
[[-9.2,-3.4],[9.2,-3.4],[-9.2,3.4],[9.2,3.4]].forEach(([x,z])=>screw(synth,x,.905,z));
function tile(c,r,w=1,h=1,mat=M(C.tile,.6)){const m=rbox(w-.07,.3,h-.07,.07,mat);m.position.set(GX(c)+(w-1)/2,TOP+.15,GZ(r)+(h-1)/2);synth.add(m);return m}
function capMesh(c,r,label,lc,cc=C.cap,ldc){tile(c,r);const k=rbox(.72,.16,.72,.16,M(cc,.5));k.position.set(GX(c),TOP+.36,GZ(r));synth.add(k);if(label){const l=labelPlane(label,.66,.32,lc,50,ldc);l.position.y=.081;k.add(l)}return k}
function capBtn(c,r,label,act,tip,lc,cc,ldc){const k=capMesh(c,r,label,lc,cc,ldc);pressable(k,act,tip);return k}

// speaker (musical side: right)
tile(12,0,2,2);
const grille=(()=>{const {t}=canvasTex(256,256,(x)=>{x.fillStyle='#fff';for(let i=0;i<11;i++)for(let j=0;j<11;j++){const dx=i-5,dy=j-5;if(dx*dx+dy*dy<=27){x.beginPath();x.arc(28+i*20,28+j*20,5.2,0,7);x.fill()}}});
 const p=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),themed(new THREE.MeshBasicMaterial({map:t,transparent:true,color:'#3a3b40'}),'#3a3b40','#0e0f11'));p.rotation.x=-Math.PI/2;p.position.set(GX(12.5),TOP+.305,GZ(.5));synth.add(p);return p})();
// tone knob, wave, demo
tile(14,0,2,1); paramKnob(new THREE.Vector3(GX(14),TOP+.3,GZ(0)),'cutoff',{r:.3,cap:'#f2e8d5',ring:C.ring,parent:synth});
{const l=labelPlane('TONE',.6,.29);l.position.set(GX(15),TOP+.31,GZ(0));synth.add(l)}
capBtn(14,1,'WAVE',()=>{P.wave=(P.wave+1)%3;setSwitch();playNote(67,.4)},'Waveform: triangle / square / saw');
const beatsBtn=capBtn(15,1,'BEATS',()=>toggleDemo(),'Beats · each click plays the next of 5 tracks');
const stopBtn=capBtn(16,0,'STOP',()=>{stopDemo();drum('rim')},'Stop the music');
{const sq=new THREE.Mesh(new THREE.PlaneGeometry(.11,.11),new THREE.MeshBasicMaterial({color:'#d71920'}));sq.rotation.x=-Math.PI/2;sq.position.set(0,.082,-.27);stopBtn.add(sq);}
[stopBtn,beatsBtn].forEach(m=>{m.material.emissive=new THREE.Color('#ff5d1a');fxOf(m).managed=true});
capBtn(16,1,'MUTE',()=>toggleMute(),'Sound on / off');
// screen
tile(0,0,4,2,M(C.recess,.4));
const scr=canvasTex(800,380); const scrP=new THREE.Mesh(new THREE.PlaneGeometry(3.78,1.8),new THREE.MeshBasicMaterial({map:scr.t,toneMapped:false}));
scrP.rotation.x=-Math.PI/2; scrP.position.set(GX(1.5),TOP+.305,GZ(.5)); synth.add(scrP);
scrP.userData={tip:'Screen · click for the About page',down(){zoomTo('ab');openCard('ab',0)}}; hits.push(scrP);
// THEOLOGY: the four big knobs
const TH_LABEL=['DESIGNER','STRATEGIST','ARTIST','TEACHER'], BIG=['#4f8fc0','#4fa66a','#f2e8d5','#e2614b'];
for(let i=0;i<4;i++){const c0=4+i*2;tile(c0,0,2,2);
  const g=new THREE.Group(); g.position.set(GX(c0+.5),TOP+.3,GZ(.5)); synth.add(g);
  const ring=cyl(.8,.84,.12,M(C.ring,.4)); ring.position.y=.06; g.add(ring);
  const rot=new THREE.Group(); g.add(rot); rot.userData.r=0; anim.push(rot);
  const capm=cyl(.58,.62,.42,A(BIG[i])); capm.position.y=.33; rot.add(capm); knurl(rot,.63,.26,.26,capm);
  const ind=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,.34),M(i===2?'#3a3b40':'#ffffff',.5)); ind.position.set(0,.55,-.3); rot.add(ind);
  ring.userData.proxy=capm; ind.userData.proxy=capm; hits.push(ring,ind);
  const L=labelPlane(TH_LABEL[i],1.5,.3,'#7b7e86',40); L.position.set(0,.01,.98); g.add(L);
  const RK=['ds','st','ar','te'][i]; capm.material=capm.material.clone(); capm.material.emissive=new THREE.Color(MODES[RK].glow); BIGCAPS.push([capm,RK]); fxOf(capm).managed=true;
  capm.userData={tip:`${CH[RK].name} mode · lights up the keys`,down(){pulse(capm);playNote([48,52,55,60][i],1.4);zoomTo(RK)},drag(d){rot.userData.r+=d/50},up(){}}; hits.push(capm);
}
// ABOUT: red button row (cols 0-7, row 2); lead notes cols 8-16
// About row: only content about Vick — 9 wide buttons across the full row
CH.info.items.length=6;
function wideBtn(x,w,label,lc,ldc){const t=rbox(w-.07,.3,.93,.07,M(C.tile,.6));t.position.set(x,TOP+.15,GZ(2));synth.add(t);
  const k=rbox(w-.3,.16,.72,.16,M(C.cap,.5));k.position.set(x,TOP+.36,GZ(2));synth.add(k);
  const l=labelPlane(label,1.6,.5,lc,Math.min(40,Math.floor(400/label.length)),ldc);l.position.y=.081;k.add(l);t.userData.proxy=k;hits.push(t);return k}
{const F=['gd','ux','mo','tl','xp'],L=['DESIGN','UI/UX','MOTION','TOOLS','EXPERIMENTAL'],LC=['#1a9e4f','#2f86c2','#e5541a','#7c4ddb','#d14fa8'],W=17/5;
 for(let j=0;j<5;j++){const x=-8.5+W*(j+.5),f=F[j];
  const k=wideBtn(x,W,L[j],LC[j],MODES[f].glow);
  pressable(k,()=>{playNote(72+[0,4,7,11,14][j],.5);zoomTo(f)},`Filter · ${CH[f].name} · ${MODES[f].n||CH[f].items.length+' keys'} on the keys`);k.userData.filter=f;
  k.material.emissive=new THREE.Color(MODES[f].glow);ROWBTN.push([k,f]);fxOf(k).managed=true;}}
// drum pads: graphite caps with light print (KO II style)
const PADS=['kick','snare','hat','clap','tom','rim','shaker','crash','blip'];
PADS.forEach((p,i)=>capBtn(14+i%3,3+Math.floor(i/3),p.toUpperCase(),()=>{drum(p);found('drums','Hit the '+p)},`Drum pad · ${p}`,'#efe4cf','#2c2d31','#cdbfa6'));
// GRAPHIC: the keyboard
const WHITE=[0,2,4,5,7,9,11], sharpAfter={0:1,1:3,3:6,4:8,5:10};
const wMidi=i=>60+12*Math.floor(i/7)+WHITE[i%7];
const keyMeshes=[], sharpMeshes=[];
for(let i=0;i<14;i++){ const c=i; tile(c,3); const kt=tile(c,4,1,2);
  const k=rbox(.76,.16,1.62,.26,M(C.cap,.5)); k.position.set(GX(c),TOP+.36,GZ(4.5)); synth.add(k); keyMeshes.push(k); kt.userData.proxy=k; hits.push(kt);
  itemCtrl(k,'kb',i,()=>playNote(wMidi(i)));
  if(i<13 && sharpAfter[i%7]!==undefined){ const s=cyl(.3,.3,.18,M('#111214',.35)); s.position.set(GX(c)+.5,TOP+.4,GZ(3)); synth.add(s);
    const m=60+12*Math.floor(i/7)+sharpAfter[i%7]; pressable(s,()=>playNote(m),'Sharp key'); sharpMeshes.push(s); }
}
for(let i=0;i<10;i++){const d=cyl(.035,.035,.02,M('#6a6c72'));d.position.set(9.18,.91,-1.2+i*.22);synth.add(d)}

/* MOTION: the remote */
const RM=new THREE.Group(); RM.position.set(-11.7,0,.15); scene.add(RM);
{const b=rbox(2.15,.75,6.6,.3,M(C.body,.55));b.position.y=.375;RM.add(b);
 const r=rbox(1.95,.1,6.4,.05,M(C.recess,.8));r.position.y=.75;RM.add(r);}
const rmt=(w,d,x,z)=>{const m=rbox(w-.07,.26,d-.07,.07,M(C.tile,.6));m.position.set(x,.88,z);RM.add(m);return m};
rmt(1.9,1.3,0,-2.5); const rs=canvasTex(300,200); const rsP=new THREE.Mesh(new THREE.PlaneGeometry(1.74,1.14),new THREE.MeshBasicMaterial({map:rs.t,toneMapped:false}));
rsP.rotation.x=-Math.PI/2; rsP.position.set(0,1.015,-2.5); RM.add(rsP);
rmt(1.9,1.7,0,-1);
{const k=paramKnob(new THREE.Vector3(0,1.01,-1),null,{r:.48,cap:'#e2614b',ring:C.ring,parent:RM});itemCtrl(k.cp,'cv',0,()=>playNote(55,1),{knob:k.rot,pressy:false})}
rmt(1.9,.9,0,.35); {const pill=rbox(1.5,.16,.5,.24,M(C.cap,.5)); pill.position.set(0,1.08,.35); RM.add(pill);
 const l=labelPlane('CONTACT',.9,.25,'#ff5d1a',46);l.position.y=.081;pill.add(l); itemCtrl(pill,'cv',1,()=>drum('clap'))}
[['BE',-.47,1.3],['IG',.47,1.3],['IN',-.47,2.25],['+',.47,2.25]].forEach(([t,x,z],j)=>{rmt(.95,.95,x,z);const k=rbox(.68,.16,.68,.16,M(C.cap,.5));k.position.set(x,1.08,z);RM.add(k);
  const l=labelPlane(t,.6,.3,'#ff5d1a',50);l.position.y=.081;k.add(l);itemCtrl(k,'cv',2+j,()=>playNote(67+[0,2,4,7][j],.5))});

/* cables */
const CABLES=[];
function cable(loose,plug,color,r,isOn){
  const mat=M(color,.5), m=new THREE.Mesh(new THREE.BufferGeometry(),mat); m.castShadow=true; scene.add(m);
  const end=rbox(.32,.22,.6,.06,mat); scene.add(end);
  const c={m,end,loose,plug,r,isOn,t:0,last:-1};
  c.build=()=>{const k=c.t<.5?2*c.t*c.t:1-Math.pow(-2*c.t+2,2)/2, lift=Math.sin(Math.PI*c.t)*.9;
    const pts=loose.map((p,i)=>new THREE.Vector3(p[0]+(plug[i][0]-p[0])*k,p[1]+(plug[i][1]-p[1])*k+(i>0&&i<loose.length-1?lift:0),p[2]+(plug[i][2]-p[2])*k));
    m.geometry.dispose(); m.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,r,10);
    const e=pts.at(-1),e2=pts.at(-2); end.position.copy(e); end.position.y=Math.max(e.y,.11); end.lookAt(e2);};
  c.build(); CABLES.push(c); return c;
}
function socket(pos,rot){const g=new THREE.Group();g.position.set(...pos);scene.add(g);
  const s=cyl(.2,.2,.14,M('#1a1a1c',.4));s.rotation.set(...rot);g.add(s);
  const led=cyl(.06,.06,.04,new THREE.MeshStandardMaterial({color:'#3a3b40',emissive:'#ff5d1a',emissiveIntensity:0}));led.position.set(rot[2]?0:.35,.47,rot[2]?.35:0);g.add(led);return led}
const remoteLed=socket([-9.5,.45,1.5],[0,0,Math.PI/2]);
cable([[-11.7,.3,3.45],[-11.6,.12,4.6],[-10.2,.1,5.5],[-8,.1,5.2],[-6.4,.1,6.2],[-6,.11,7.4]],
      [[-11.7,.3,3.45],[-11.6,.12,4.4],[-11,.1,4.6],[-10.4,.1,3.4],[-10.25,.3,1.5],[-9.75,.45,1.5]],'#ff5d1a',.085,()=>S.mode==='cv').led=remoteLed;
function updateCables(){CABLES.forEach(c=>{const tgt=c.isOn()?1:0;if(Math.abs(c.t-tgt)<.002){if(c.t!==tgt){c.t=tgt;c.build();if(tgt===1)drum('rim')}}else{c.t+=(tgt-c.t)*.06;c.build()}
  c.led.material.emissiveIntensity=c.t>.97?1.6:0})}

/* ───────────── OFFICE: desk, desktop monitor (styled on the reference laptop), plant and lamp ─────────────
   The synths sit on a light-oak desk. Every synth is cabled into the monitor, and the monitor's screen is a live
   desktop that shows the keyboard's current channel as a grid of projects (click the screen to zoom in, click a tile to open it). */
const OFF={};
{ // desk: oak top (top surface at y = 0, so everything else keeps its height) on grey metal legs
  const wood=canvasTex(2048,1024,(x,W,H)=>{x.fillStyle='#d9c6a6';x.fillRect(0,0,W,H);
    for(let i=0;i<900;i++){const y=Math.random()*H,a=.03+Math.random()*.08,dk=Math.random()<.5;x.strokeStyle=dk?`rgba(120,86,48,${a})`:`rgba(255,240,215,${a})`;x.lineWidth=.6+Math.random()*2.2;
      x.beginPath();x.moveTo(0,y);for(let s=0;s<=W;s+=64)x.lineTo(s,y+Math.sin(s*.004+i)*6+(Math.random()-.5)*2);x.stroke()}
    for(let k=0;k<9;k++){const cx=Math.random()*W,cy=Math.random()*H;for(let r=4;r<38;r+=5){x.strokeStyle='rgba(120,86,48,.06)';x.beginPath();x.ellipse(cx,cy,r*3.2,r*.7,0,0,7);x.stroke()}}});
  wood.t.wrapS=wood.t.wrapT=THREE.ClampToEdgeWrapping; // one continuous plank pattern, no seam
  const wm=themed(new THREE.MeshPhysicalMaterial({map:wood.t,roughness:.58,clearcoat:.25,clearcoatRoughness:.5,bumpMap:TEX.grain,bumpScale:.05}),'#ffffff','#5d4f41',1,.6); // light oak by day, walnut under the lamp at night
  const top=rbox(32.5,.9,18.5,.3,wm); top.position.set(.6,-.45,-.1); top.castShadow=false; scene.add(top); OFF.top=top;
  const lm=themed(new THREE.MeshPhysicalMaterial({color:'#c3c6cc',metalness:.85,roughness:.38}),'#c3c6cc','#4a4d54',1,.7);
  [[-15.2,-8.8],[16.4,-8.8],[-15.2,8.6],[16.4,8.6]].forEach(([x,z])=>{const l=rbox(.85,30,.85,.2,lm);l.position.set(x,-15.9,z);l.castShadow=false;scene.add(l)});
  const apron=rbox(30.5,.7,.2,.05,lm); apron.position.set(.6,-1.25,-9.1); scene.add(apron);
}
/* plant: snake plant in a white ceramic pot */
const PLANT=new THREE.Group(); PLANT.position.set(14.7,0,-7.6); scene.add(PLANT);
{ const pot=cyl(1.25,1.0,2.1,new THREE.MeshPhysicalMaterial({color:'#f1efea',roughness:.32,clearcoat:.6,clearcoatRoughness:.25}),48); pot.position.y=1.05; PLANT.add(pot);
  const rimR=new THREE.Mesh(new THREE.TorusGeometry(1.2,.07,10,48),pot.material); rimR.rotation.x=-Math.PI/2; rimR.position.y=2.1; PLANT.add(rimR);
  const soil=new THREE.Mesh(new THREE.CircleGeometry(1.16,40),new THREE.MeshStandardMaterial({color:'#3b2c22',roughness:1})); soil.rotation.x=-Math.PI/2; soil.position.y=1.98; PLANT.add(soil);
  const leafM=new THREE.MeshPhysicalMaterial({color:'#3f8a47',roughness:.45,clearcoat:.4,clearcoatRoughness:.4,side:THREE.DoubleSide});
  const leafM2=new THREE.MeshPhysicalMaterial({color:'#5aa15a',roughness:.45,clearcoat:.4,clearcoatRoughness:.4,side:THREE.DoubleSide});
  const leafGeo=h=>{const s=new THREE.Shape();s.moveTo(-.26,0);s.bezierCurveTo(-.36,h*.45,-.2,h*.8,0,h);s.bezierCurveTo(.2,h*.8,.36,h*.45,.26,0);s.closePath();return new THREE.ShapeGeometry(s,12)};
  OFF.leaves=[];
  [[0,5.2,0,.06],[1.1,4.4,.35,.22],[2.2,4.8,-.3,.18],[3.3,3.9,.4,.3],[4.3,4.6,.2,.14],[5.2,3.6,-.4,.32],[.6,3.4,-.2,.36],[2.8,3.2,.5,.4],[4.9,5.0,0,.1]].forEach(([a,h,o,lean],i)=>{
    const g=new THREE.Group(); g.position.set(Math.cos(a)*o*.9,1.98,Math.sin(a)*o*.9); g.rotation.y=a; PLANT.add(g);
    const l=new THREE.Mesh(leafGeo(h),i%3?leafM:leafM2); l.rotation.x=-lean; l.castShadow=true; g.add(l); OFF.leaves.push({g:l,base:-lean,ph:i*1.7})});
}
/* lamp: coral mushroom lamp with a cream shade and a warm light; click it to switch it on or off */
const LAMP=new THREE.Group(); LAMP.position.set(12.4,0,-1.6); scene.add(LAMP);
const lampLight=new THREE.PointLight('#ffb36b',0,22,1.6); lampLight.position.set(0,3.1,0); LAMP.add(lampLight);
const lampDome=(()=>{const coral=new THREE.MeshPhysicalMaterial({color:'#ea8a7d',roughness:.35,clearcoat:.5,clearcoatRoughness:.3});
  const b=cyl(.85,.92,.18,coral,48); b.position.y=.09; LAMP.add(b);
  const st=cyl(.075,.075,3.1,coral,20); st.position.y=1.7; LAMP.add(st);
  const d=new THREE.Mesh(new THREE.SphereGeometry(1.35,48,24,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:'#f6ecdc',roughness:.6,emissive:'#ffcf96',emissiveIntensity:0,side:THREE.DoubleSide,transmission:0}));
  d.scale.y=.78; d.position.y=3.05; d.castShadow=true; LAMP.add(d);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.28,20,12),new THREE.MeshBasicMaterial({color:'#fff1d6'})); bulb.position.y=3.0; LAMP.add(bulb); OFF.bulb=bulb;
  [b,st].forEach(m=>{m.userData.proxy=d;hits.push(m)}); return d})();
const lampPool=(()=>{const {t}=canvasTex(256,256,(x)=>{const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,190,120,1)');g.addColorStop(.35,'rgba(255,170,100,.45)');g.addColorStop(1,'rgba(255,160,90,0)');x.fillStyle=g;x.fillRect(0,0,256,256)});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(13,13),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,opacity:0,toneMapped:false}));
  m.rotation.x=-Math.PI/2; m.position.set(12.4,.003,-1.6); m.renderOrder=1; scene.add(m); FXMATS.push(m.material); return m})();
const LAMPST={on:true,k:1};
lampDome.userData={tip:'Lamp · click to switch it on or off',down(){LAMPST.on=!LAMPST.on;LAMPST.dip=1;drum(LAMPST.on?'blip':'rim');found('lamp',LAMPST.on?'Lamp on':'Lamp off')}}; hits.push(lampDome);
function updateOffice(dt,t){
  LAMPST.k+=((LAMPST.on?1:0)-LAMPST.k)*(reduceMotion?1:1-Math.exp(-dt*8));
  const dk=Math.max(0,themeK), k=LAMPST.k;
  lampLight.intensity=k*lerp(9,26,dk); lampDome.material.emissiveIntensity=k*lerp(.25,.85,dk);
  OFF.bulb.material.color.setRGB(1,lerp(.8,.95,k),lerp(.62,.84,k)).multiplyScalar(.35+.65*k);
  lampPool.material.opacity=k*lerp(.18,.55,dk); lampPool.visible=k>.01;
  LAMPST.dip=Math.max(0,(LAMPST.dip||0)-dt*5); lampDome.position.y=3.05-.06*Math.sin(LAMPST.dip*Math.PI); // a little press on click
  if(!reduceMotion)OFF.leaves.forEach(l=>{l.g.rotation.x=l.base+Math.sin(t*.7+l.ph)*.025});
}
/* ───────────── CAMERA: overview + per-part framing ───────────── */
scene.updateMatrixWorld(true);
const boxOf=objs=>{const b=new THREE.Box3();objs.forEach(o=>b.expandByObject(o));return b};
const BOX={
  all:new THREE.Box3(new THREE.Vector3(-13.6,0,-4.6),new THREE.Vector3(13.6,1.6,4.6)), // the synths fill the view; lamp and plant sit at the edge
  kb:boxOf([...keyMeshes,...sharpMeshes,...ROWBTN.map(a=>a[0])]), cv:boxOf([RM]),
  th:new THREE.Box3(new THREE.Vector3(GX(4)-.5,TOP,GZ(0)-.6),new THREE.Vector3(GX(15)+.5,TOP+.8,GZ(1)+.9)),
  info:new THREE.Box3(new THREE.Vector3(-8.6,TOP,GZ(1)),new THREE.Vector3(8.6,TOP+.5,GZ(3)+.3)),
};
const POLAR={all:.3,kb:1.08,cv:1.0,info:1.05}; // overview is nearly top-down; parts get low, close, cinematic angles

/* ───────────── FIGMA: section titles + soft underlight per device (About Me · Contact · My Projects) ─────────────
   Hovering anywhere on a device (or its title) grows the title from Gotham Medium 28.7 to Ultra 90 (4K px) and fades
   in a subtle light underneath it, like an LED strip under the hardware. Colours come from the Figma glow layers;
   the My Projects light takes the colour of the keyboard's current mode and stays on while you're in a keyboard mode. */
const GROUPS={
  contact:{obj:RM,box:BOX.cv,foot:boxOf([RM.children[0]]),col:()=>'#ff2020',go:()=>zoomTo('cv')},
  projects:{obj:synth,box:boxOf([synth]),foot:boxOf([synth.children[0],synth.children[1]]),col:()=>MODES[S.kb]?.glow||'#00bfff',go:()=>zoomTo(S.kb)},
};
function underlightTexture(w,d,lam){ // white rim light: brightest right at the device edge, falling off almost immediately
  const m=lam*7, PPU=56, W=Math.round((w+2*m)*PPU), H=Math.max(32,Math.round((d+2*m)*PPU)), sx=(w+2*m)/W, sz=(d+2*m)/H, c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'), img=x.createImageData(W,H), r=Math.min(.32,d/3);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const px=(i+.5)*sx-m-w/2, pz=(j+.5)*sz-m-d/2, qx=Math.abs(px)-(w/2-r), qz=Math.abs(pz)-(d/2-r);
    const dist=Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-r;   // signed distance to the footprint edge
    const a=dist<=0?1:Math.exp(-dist/lam)*.8+Math.exp(-dist/(lam*3))*.12;                // sharp peak at the edge + a short soft tail
    const o=(j*W+i)*4; img.data[o]=img.data[o+1]=img.data[o+2]=255; img.data[o+3]=Math.min(1,a)*255}
  x.putImageData(img,0,0); const tx=new THREE.CanvasTexture(c); tx.anisotropy=8; return {tx,m}}
for(const [key,g] of Object.entries(GROUPS)){
  const s=g.foot.getSize(new THREE.Vector3()), c=g.foot.getCenter(new THREE.Vector3()), lam=.09; // glow + title follow the casing, not knobs/docks/cables
  const {tx,m}=underlightTexture(s.x,s.z,lam);
  const mat=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,opacity:0,toneMapped:false,color:new THREE.Color(g.col())});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(s.x+2*m,s.z+2*m),mat); mesh.rotation.x=-Math.PI/2; mesh.position.set(c.x,.004,c.z); mesh.renderOrder=1; mesh.visible=false; scene.add(mesh);
  FXMATS.push(mat); // additive on the dark stage, normal on the light deck (theme code switches it)
  Object.assign(g,{key,mesh,mat,k:0,tint:new THREE.Color(g.col())}); // titles were removed (Nov 2026); only the underlight remains
}
const GSET=new Map([[RM,'contact'],[synth,'projects']]);
function groupAt(o){ // which device the pointer is over: the control's parent chain first, then the devices' bounding boxes
  for(let p=o;p;p=p.parent)if(GSET.has(p))return GSET.get(p);
  if(o)return null; // a control that isn't on a synth (monitor, lamp)
  let best=null,bd=Infinity;const hit=new THREE.Vector3();
  for(const g of Object.values(GROUPS))if(ray.ray.intersectBox(g.box,hit)){const d=hit.distanceTo(ray.ray.origin);if(d<bd){bd=d;best=g.key}}
  return best}
function updateGroups(dt){
  const overview=!S.mode&&!S.card&&!fly, act=overview?(S.grpLbl||S.grp||(S.hover&&groupAt(S.hover))):null;
  const ease=reduceMotion?1:1-Math.exp(-dt*6), cEase=reduceMotion?1:1-Math.exp(-dt*4), dark=themeK>.5, t=performance.now()/1000;
  const kbOn=S.mode&&MODES[S.mode]?.box==='kb'||S.card&&KBM.includes(S.card.ch); // the keyboard is in a mode: keep its underlight on
  for(const g of Object.values(GROUPS)){
    const on=g.key===act, target=on?1:(g.key==='projects'&&kbOn?.75:0); g.k+=(target-g.k)*ease;
    g.tint.lerp(tmpCol.set(g.col()),cEase); g.mat.color.copy(g.tint);
    const breathe=reduceMotion?1:1+.035*Math.sin(t*1.6);
    g.mat.opacity=g.k*(dark?.48:.3)*breathe; g.mesh.visible=g.k>.004;
  }
}
const tmpCol=new THREE.Color();

/* ───────────── MENU (hamburger) ───────────── */
const menu=$('menu'), mnu=$('mnu');
function openMenu(){menu.classList.remove('out');menu.hidden=false;mnu.setAttribute('aria-expanded','true');mnu.setAttribute('aria-label','Close menu');drum('blip');menu.querySelector('button')?.focus({preventScroll:true})}
function closeMenu(){if(menu.hidden)return;mnu.setAttribute('aria-expanded','false');mnu.setAttribute('aria-label','Menu');
  if(reduceMotion){menu.hidden=true;return}menu.classList.add('out');menu.addEventListener('animationend',()=>{if(menu.classList.contains('out')){menu.hidden=true;menu.classList.remove('out')}},{once:true})}
mnu.onclick=()=>{ensureAudio();menu.hidden||menu.classList.contains('out')?openMenu():closeMenu()};
menu.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b){closeMenu();return}/* links and empty space both close it */const k=b.dataset.go;if(k==='home')return;closeMenu();ensureAudio();if(k==='about'){zoomTo('ab');openCard('ab',0);return}if(S.mode)S.mode=null;GROUPS[k].go()});
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!mnu.contains(e.target))closeMenu()});
const desktop=()=>innerWidth>760;
function frameFor(key){
  const b=BOX[key],c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()),pol=desktop()?POLAR[key]:key==='all'?.12:.78;
  const w=stage.clientWidth,h=stage.clientHeight, T=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
  let tanV=T, tanH=T*w/h;
  if(key!=='all'&&!desktop()) tanV=T*.62;
  const m=key==='all'?1.04:desktop()?.96:1.04;
  const d=Math.max((s.x/2*m)/tanH,((s.z*Math.cos(pol)+s.y*Math.sin(pol))/2*m+.3)/tanV)+s.y*.5;
  return {t:c,p:new THREE.Vector3(c.x,c.y+d*Math.cos(pol),c.z+d*Math.sin(pol)),d};
}
let fly=null, offX=0, offY=0;
const sA=new THREE.Spherical(), sB=new THREE.Spherical(), flyOff=new THREE.Vector3();
/* camera swoop: interpolate in spherical coordinates around a moving target, with a small lift mid-flight, so the camera arcs down to the part like a crane shot */
function flyTo(key,dur=2100){const f=frameFor(key);sA.setFromVector3(flyOff.copy(camera.position).sub(controls.target));sB.setFromVector3(flyOff.copy(f.p).sub(f.t));
  let dT=sB.theta-sA.theta;if(dT>Math.PI)dT-=2*Math.PI;if(dT<-Math.PI)dT+=2*Math.PI;
  fly={t0:controls.target.clone(),t1:f.t,r0:sA.radius,r1:sB.radius,p0:sA.phi,p1:sB.phi,th0:sA.theta,dT,lift:Math.min(.35,Math.abs(sB.phi-sA.phi)*.3),s:performance.now(),dur:reduceMotion?1:dur};controls.enabled=false;
  controls.minDistance=f.d*.35;controls.maxDistance=Math.max(f.d*1.8,frameFor('all').d*1.5)}
function zoomTo(ch){found(ch);if(S.mode===ch)return;if(KBM.includes(ch))S.kb=ch;if(PADM.includes(ch))S.pad=ch;const same=S.mode&&MODES[S.mode].box===MODES[ch].box;S.mode=ch;closeCard();drum(same?'blip':'whoosh');if(!same)flyTo(MODES[ch].box);updateUI();modeWave(ch)}
/* mode switch: the filter/knob that owns the mode strokes, then a wave of gap-glow + strokes ripples across the controls that now hold its projects */
function modeWave(ch){
  ROWBTN.concat(BIGCAPS).forEach(([m,k])=>{if(k===ch)pulse(m)});
  const g=KBM.includes(ch)?'kb':PADM.includes(ch)?'pad':CTRL[ch]?ch:null; if(!g)return;
  CTRL[g].forEach((m,j)=>{if(m&&j<CH[ch].items.length)pulse(m,180+j*45,.55)})}
function zoomOut(){S.mode=null;closeCard();drum('whoosh');flyTo('all');updateUI()}

/* ───────────── SCREENS ───────────── */
const FIG=[["..XXX..","..XXX..","XXXXXXX","..XXX..","..XXX..",".XX.XX.",".X...X."],
           ["..XXX..","..XXX..",".XXXXX.","X.XXX.X","..XXX..","..X.X..","..X.X.."],
           ["X.XXX.X","X.XXX.X",".XXXXX.","..XXX..","..XXX..",".X...X.","X.....X"]];
const FCOL=['#2bd67b','#3db4ff','#ff3fb4'], FN=['FAMILY MAN','FIGHTER','EXPLORER'];
function wrap(x,text,max){const w=text.split(' ');const L=[];let l='';for(const s of w){const t=l?l+' '+s:s;if(x.measureText(t).width>max&&l){L.push(l);l=s}else l=t}L.push(l);return L}
const scrCol=ch=>ch==='ar'?'#f1f1f1':ch==='info'?'#ff4a50':CH[ch]?.col||'#ff4a50';
function screenText(){
  const o=S.hover?.userData;
  if(o?.item){const c=CH[o.ch],it=c.items[o.i];
    return S.mode===o.ch?{h:c.name,r:`${pad(o.i+1)}/${pad(c.items.length)}`,t:it.t.toUpperCase(),col:scrCol(o.ch)}
      :{h:c.name,r:MODES[o.ch].n.toUpperCase(),t:`${MODES[o.ch].part.toUpperCase()} · CLICK TO ZOOM IN`,col:scrCol(o.ch)}}
  if(demo&&!o) return {h:'NOW PLAYING',r:`TRACK ${track+1}/5`,t:TRACKS[track].n,col:'#ff5d1a'};
  if(o?.tip) return {h:'VICKHAL ROOPRAM',r:'',t:o.tip.toUpperCase(),col:'#9a9ca3'};
  if(S.card){const c=CH[S.card.ch];return {h:c.name,r:`${pad(S.card.i+1)}/${pad(c.items.length)}`,t:c.items[S.card.i].t.toUpperCase(),col:scrCol(S.card.ch)}}
  if(S.mode) return {h:CH[S.mode].name,r:MODES[S.mode].n.toUpperCase(),t:'HOVER A CONTROL · CLICK TO OPEN',col:scrCol(S.mode)};
  return {h:'VICKHAL ROOPRAM',r:'',t:'UX & MOTION DESIGNER. PICK A MODE BELOW.',col:'#ff4a50'};
}
let level=0, lastKey='';
function drawScreens(time){
  let wave=null; if(ac&&an){an.getByteTimeDomainData(tdata);let s=0;for(let i=0;i<tdata.length;i+=4){const v=(tdata[i]-128)/128;s+=v*v}level=Math.min(1,Math.sqrt(s/(tdata.length/4))*4);wave=tdata}
  const x=scr.x,W=800,T=screenText();
  x.fillStyle='#0c0c0e';x.fillRect(0,0,W,380);
  x.font='26px Bungee, Impact, sans-serif';x.fillStyle=T.col;x.textBaseline='top';x.textAlign='left';x.fillText(T.h,30,26);
  x.font='600 24px "IBM Plex Mono", monospace';x.fillStyle='#8a8c92';x.textAlign='right';x.fillText(T.r,W-30,28);x.textAlign='left';
  x.font='700 44px "Noto Sans", sans-serif';x.fillStyle='#f4f4f4';wrap(x,T.t,W-60).slice(0,3).forEach((l,j)=>x.fillText(l,30,78+j*52));
  x.strokeStyle=T.col;x.lineWidth=3;x.beginPath();const y0=320;
  for(let i=0;i<=200;i++){const px=30+i*(W-60)/200;let v=wave?(wave[Math.floor(i*wave.length/201)]-128)/128*55:Math.sin(i*.12+time*2)*5;i?x.lineTo(px,y0+v):x.moveTo(px,y0+v)}x.stroke();
  scr.t.needsUpdate=true;
  const key=[muted,P.vol,demo?track+1:0,S.mode].join();
  if(key!==lastKey){lastKey=key;const r=rs.x;r.fillStyle='#0c0c0e';r.fillRect(0,0,300,200);r.fillStyle='#ff5d1a';r.font='34px Bungee, Impact, sans-serif';r.fillText('CV',22,26);
    r.font='600 20px "IBM Plex Mono", monospace';r.fillStyle='#8a8c92';r.fillText(muted?'MUTED':`VOL ${Math.round(P.vol*100)}%`,22,100);r.fillStyle=demo?'#ff5d1a':'#6b6d73';r.fillText(demo?`● TRACK ${track+1}/5`:'CONTACT · SOCIALS',22,140);rs.t.needsUpdate=true}
}
function refreshGlow(t){
  [stopBtn,beatsBtn].forEach(m=>m.material.emissiveIntensity=demo?.4+.25*Math.max(0,Math.sin(t*Math.PI*2*(TRACKS[track]?.bpm||120)/60)):0);
  const inKb=S.mode&&MODES[S.mode].box==='kb';
  ROWBTN.forEach(([m,k])=>{let e=0;if(S.kb===k){e=inKb?.35+.12*Math.sin(t*3):.12;if(S.hover?.userData?.item&&S.hover.userData.ch===k)e=.75;if(S.card?.ch===k)e=Math.max(e,.55)}if(S.hover===m)e=Math.max(e,.4);m.material.emissiveIntensity=e});
  BIGCAPS.forEach(([m,k])=>m.material.emissiveIntensity=S.mode===k?.3+.1*Math.sin(t*3):(S.hover===m?.2:0));
  for(const g in CTRL){const ch=realCh(g);CTRL[g].forEach((m,j)=>{if(!m)return;let e=0;
    const pv=g==='kb'&&S.hover?.userData?.filter;
    if(pv&&pv!==ch){m.material.emissive.set(MODES[pv].glow);m.material.emissiveIntensity=j<CH[pv].items.length?.3:0;return}
    if(g==='kb'||g==='pad'){m.material.emissive.set(MODES[ch].glow);if(j>=CH[ch].items.length){m.material.emissiveIntensity=0;return}}
    if(S.mode===ch)e=.45+.12*Math.sin(t*3+j*.5);
    if(!S.mode&&S.hover?.userData.ch===ch)e=.22;
    if(S.mode===ch&&S.hover===m)e=.55;
    if(S.card?.ch===ch&&S.card.i===j)e=.7;
    m.material.emissiveIntensity=e})}}

/* ───────────── BEATS: 5 tracks, each click plays the next ───────────── */
const TRACKS=[
 {n:'NEON DRIVE',bpm:118,wave:2,base:45,prog:[0,8,3,10],lead:'0.2.4.2.0.4.7.4.',bass:'x..x..x.x..x..x.',k:'x...x...x...x...',s:'....x.......x...',h:'..x...x...x...x.'},
 {n:'SUNDAY LO-FI',bpm:82,wave:0,base:48,prog:[0,9,5,7],lead:'4..2..0...2.4...',bass:'x.....x...x.....',k:'x......x..x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},
 {n:'ARCADE RUN',bpm:140,wave:1,base:52,prog:[0,0,5,7],lead:'02470247.7420742',bass:'x.x.x.x.x.x.x.x.',k:'x...x...x...x...',s:'....x.......x...',h:'xxxxxxxxxxxxxxxx'},
 {n:'DEEP HOUSE',bpm:124,wave:2,base:41,prog:[0,0,3,5],lead:'....4...4.....6.',bass:'..x...x...x..x..',k:'x...x...x...x...',s:'....x.......x...',c:'....x.......x...',h:'..x...x...x...x.'},
 {n:'JIU-JITSU BREAKS',bpm:100,wave:1,base:43,prog:[0,3,5,3],lead:'0..0..3.5..3.0..',bass:'x..x...x..x.x...',k:'x.....x...x.....',s:'....x.......x..x',h:'x.xxx.x.x.xxx.x.'}];
const SCALE=[0,2,3,5,7,8,10,12,14,15];
let demo=null,step=0,track=-1;
function stopDemo(){if(demo){clearInterval(demo);demo=null}}
function toggleDemo(){ensureAudio();found('beats','Playing '+TRACKS[(track+1)%TRACKS.length].n.toLowerCase());stopDemo();track=(track+1)%TRACKS.length;step=0;const T=TRACKS[track];P.wave=T.wave;
  demo=setInterval(()=>{const i=step%16,root=T.base+T.prog[Math.floor(step/16)%4];
    if(T.k[i]==='x')drum('kick'); if(T.s[i]==='x')drum('snare'); if(T.h[i]==='x')drum('hat'); if(T.c?.[i]==='x')drum('clap');
    if(T.bass[i]==='x')playNote(root-12,.22); const d=T.lead[i]; if(d!=='.')playNote(root+12+SCALE[+d],.3);
    step++},60000/T.bpm/4)}

/* ───────────── INPUT ───────────── */
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(), lbl=$('lbl'), cv=renderer.domElement;
function pick(e){const r=cv.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ptr,camera);
  const h=ray.intersectObjects(hits,true)[0];lastHit=h;let o=h?.object;while(o&&!o.userData.down&&!o.userData.up&&!o.userData.proxy)o=o.parent;return o?.userData.proxy||o}
function labelHTML(o){const u=o.userData;
  if(u.item){const c=CH[u.ch];return S.mode===u.ch?c.items[u.i].t:`${MODES[u.ch].n}<small>Click to open</small>`}
  return u.tip}
let drag=null, bodyTap=null;
cv.addEventListener('pointerdown',e=>{ensureAudio();if(e.button>0)return; // right drag pans, middle zooms
  const o=pick(e);if(!o){const g=!S.mode&&!S.card&&groupAt(null);if(g)bodyTap={g,x:e.clientX,y:e.clientY};return}controls.enabled=false;drag={o,y:e.clientY,x:e.clientX,sx:e.clientX,sy:e.clientY,m:0};o.userData.down?.();
  if(e.pointerType!=='mouse'){S.hover=o;S.hoverUntil=performance.now()+1600}try{cv.setPointerCapture(e.pointerId)}catch{}});
const controls=new OrbitControls(camera,cv); controls.enableDamping=true; controls.dampingFactor=.06; controls.enablePan=true; controls.screenSpacePanning=false; controls.zoomToCursor=true; controls.rotateSpeed=.7; controls.zoomSpeed=.9;
controls.minPolarAngle=.02; controls.maxPolarAngle=1.32; controls.minAzimuthAngle=-1.1; controls.maxAzimuthAngle=1.1;
const PANBOX=new THREE.Box3(new THREE.Vector3(-14,0,-8),new THREE.Vector3(16,3,8)); // panning stays over the desk
let lastLive='';
cv.addEventListener('pointermove',e=>{
  if(drag){const dy=e.clientY-drag.y,dx=e.clientX-drag.x;drag.y=e.clientY;drag.x=e.clientX;drag.m+=Math.abs(dy)+Math.abs(dx);drag.o.userData.drag?.(-dy+dx*.5);lastLive=drag.o.userData.live?.()||'';return}
  if(e.pointerType!=='mouse')return;const o=pick(e);S.grp=S.mode||S.card?null:groupAt(o);cv.style.cursor=o||S.grp?'pointer':'grab';S.hover=o||null;S.hoverUntil=Infinity});
const end=e=>{if(drag){drag.o.userData.up?.(e&&e.clientX!==undefined?Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy):drag.m);drag=null;lastLive='';if(!fly)controls.enabled=true}};
cv.addEventListener('pointerup',e=>{if(bodyTap&&Math.hypot(e.clientX-bodyTap.x,e.clientY-bodyTap.y)<6&&!S.mode)GROUPS[bodyTap.g].go();bodyTap=null;end(e)});cv.addEventListener('pointercancel',end);cv.addEventListener('pointerleave',()=>{if(!drag)S.hover=null;S.grp=null});
const KW='asdfghjkl;', KS={w:0,e:1,t:2,y:3,u:4,o:5,p:6}, KD='zxcvbnm,.';
const held=new Set();
addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.toLowerCase();
  if(k==='escape'){if(!$('menu').hidden){closeMenu();$('mnu').focus()}else if(!$('lb').hidden)$('lb').hidden=true;else if(S.card)closeCard();else if(S.mode)zoomOut();return}
  if(held.has(k))return;held.add(k);
  if(KW.includes(k)){ensureAudio();const i=KW.indexOf(k);press(keyMeshes[i]);playNote(wMidi(i))}
  else if(k in KS){ensureAudio();sharpMeshes[KS[k]]?.userData.down()}
  else if(KD.includes(k)){ensureAudio();drum(PADS[KD.indexOf(k)])}
  else if('123456'.includes(k)){ensureAudio();zoomTo(ORDER[+k-1])}
  else if(k==='0'){ensureAudio();zoomOut()}
  else if(S.card&&k==='arrowright'){openCard(S.card.ch,S.card.i+1)} else if(S.card&&k==='arrowleft'){openCard(S.card.ch,S.card.i-1)}});
addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));

/* ───────────── THEME: light / dark, eased between the two looks ───────────── */
const root=document.documentElement, themeBtn=$('thm'), sysDark=matchMedia('(prefers-color-scheme: dark)');
const LOOK={ // light → dark
  bg:['#ece5d8','#16140f'], sky:['#fff8ec','#8f7a62'], gnd:['#c9bca6','#120f0c'], hemi:[.55,.22], sun:[1.9,.75], sunCol:['#fff1dc','#ffd9b0'],
  rim:[.7,1.2], rimCol:['#ffe9cf','#ffab70'], shadow:[.2,.55], exp:[1,1.05], pool:['#ffffff','#2b241d'], poolOp:[.5,1]};
const LC={};for(const k in LOOK)if(typeof LOOK[k][0]==='string')LC[k]=LOOK[k].map(c=>new THREE.Color(c));
const lerp=(a,b,k)=>a+(b-a)*k;
const THEMED=[];{const seen=new Set();scene.traverse(o=>[o.material].flat().forEach(m=>{if(m?.userData?.tc&&!seen.has(m)){seen.add(m);THEMED.push(m)}}))}
let themeT=root.dataset.theme==='dark'?1:0, themeK=-1, blendDark=null;
function applyTheme(k){
  scene.background.lerpColors(LC.bg[0],LC.bg[1],k); hemi.color.lerpColors(LC.sky[0],LC.sky[1],k); hemi.groundColor.lerpColors(LC.gnd[0],LC.gnd[1],k);
  hemi.intensity=lerp(...LOOK.hemi,k); sun.intensity=lerp(...LOOK.sun,k); sun.color.lerpColors(LC.sunCol[0],LC.sunCol[1],k);
  rim.intensity=lerp(...LOOK.rim,k); rim.color.lerpColors(LC.rimCol[0],LC.rimCol[1],k); floor.material.opacity=lerp(...LOOK.shadow,k);
  renderer.toneMappingExposure=lerp(...LOOK.exp,k); pool.material.color.lerpColors(LC.pool[0],LC.pool[1],k); pool.material.opacity=lerp(...LOOK.poolOp,k);
  for(const m of THEMED){const u=m.userData.tc;m._tc||(m._tc=[new THREE.Color(u.l),new THREE.Color(u.d)]);m.color.lerpColors(m._tc[0],m._tc[1],k);if(u.le!==undefined&&'envMapIntensity' in m)m.envMapIntensity=lerp(u.le,u.de,k)}
  const bd=k>.5; if(bd!==blendDark){blendDark=bd;FXMATS.forEach(m=>{m.blending=bd?THREE.AdditiveBlending:THREE.NormalBlending;m.needsUpdate=true})}}
function setTheme(dark,{save=true,sweep=true}={}){
  themeT=dark?1:0; root.dataset.theme=dark?'dark':'light';
  if(save)try{localStorage.setItem('vdc-theme',dark?'dark':'light')}catch{}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#16140f':'#ece5d8');
  themeBtn.setAttribute('aria-pressed',String(dark)); themeBtn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode'); if(sweep)flip(themeBtn);
  if(sweep)found('theme',dark?'Night mode':'Day mode');
  if(sweep){ // a light sweep runs across every control, left to right, as the synth "re-lights"
    const v=new THREE.Vector3(); FXL.forEach(f=>{f.m.getWorldPosition(v);pulse(f.m,(v.x+13)*32,.6)}); drum(dark?'blip':'rim');}
}
themeBtn.onclick=()=>{ensureAudio();setTheme(themeT<.5)};
sysDark.addEventListener?.('change',e=>{let saved=null;try{saved=localStorage.getItem('vdc-theme')}catch{}if(!saved)setTheme(e.matches,{save:false})});
setTheme(themeT>.5,{save:false,sweep:false});

/* ───────────── LOOP ───────────── */
const ease=k=>k<.5?8*k*k*k*k:1-Math.pow(-2*k+2,4)/2, v3=new THREE.Vector3(); // quartic in-out: slow start, slow landing
function resize(){const w=stage.clientWidth,h=stage.clientHeight,mob=!desktop();controls.enableRotate=true;controls.enableZoom=true;controls.minPolarAngle=.02; /* touch: one finger orbits, pinch zooms; the on-screen controls are optional */renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(!fly){const f=frameFor(S.mode?MODES[S.mode].box:'all');camera.position.copy(f.p);controls.target.copy(f.t);controls.minDistance=f.d*.35;controls.maxDistance=frameFor('all').d*1.5;controls.update()}}
new ResizeObserver(resize).observe(stage); resize();
const clock=new THREE.Clock();
let lastNow=performance.now();
function loop(){const t=clock.getElapsedTime(),now=performance.now(),dt=Math.min(.05,(now-lastNow)/1000);lastNow=now;
  if(fly){const k=Math.min(1,(now-fly.s)/fly.dur),e=ease(k);controls.target.lerpVectors(fly.t0,fly.t1,e);
    sA.set(lerp(fly.r0,fly.r1,e)*(1+fly.lift*Math.sin(Math.PI*e)),lerp(fly.p0,fly.p1,e),fly.th0+fly.dT*e);camera.position.copy(controls.target).add(flyOff.setFromSpherical(sA));if(k>=1){fly=null;if(!drag)controls.enabled=true}}
  // keep the zoomed part clear of the card
  const w=stage.clientWidth,h=stage.clientHeight, tx=S.card&&desktop()?Math.min(235,w*.18):0, ty=S.card&&!desktop()?h*.28:0;
  offX+=(tx-offX)*.08; offY+=(ty-offY)*.08; camera.setViewOffset(w,h,offX,offY,w,h);
  anim.forEach(o=>{const u=o.userData;if(u.ty!==undefined)o.position.y+=(u.ty-o.position.y)*.35;if(u.tz!==undefined)o.position.z+=(u.tz-o.position.z)*.3;if(u.r!==undefined)o.rotation.y+=(u.r-o.rotation.y)*.18});
  if(S.hover&&now>S.hoverUntil&&!drag)S.hover=null;
  // floating label
  const ho=drag?.o||S.hover;
  if(ho&&!ho.userData.noLbl?.()){ho.getWorldPosition(v3);v3.y+=.45;v3.project(camera);
    const x=(v3.x+1)/2*w, y=(1-v3.y)/2*h; lbl.hidden=false; lbl.style.left=x+'px'; lbl.style.top=y+'px';
    const html=lastLive||labelHTML(ho); if(lbl._h!==html){lbl.innerHTML=html;lbl._h=html}} else lbl.hidden=true;
  updateGroups(dt); updateOffice(dt,t); PANBOX.clampPoint(controls.target,controls.target);
  if(Math.abs(themeK-themeT)>.002){themeK=themeK<0?themeT:themeK+(themeT-themeK)*(reduceMotion?1:.075);if(Math.abs(themeK-themeT)<=.002)themeK=themeT;applyTheme(themeK)}
  grille.scale.setScalar(1+level*.04); updateCables(); refreshGlow(t); updateFx(now); drawScreens(t); controls.update(); renderer.render(scene,camera); requestAnimationFrame(loop)}
updateUI();
{const it=$('intro');$('ixn').textContent=`${FOUND.size}/${Object.keys(FIND).length}`;
 const go=(sound)=>{if(it.classList.contains('out'))return;try{sessionStorage.setItem('vdc-in','1')}catch{}
   if(!sound&&!muted)toggleMute();ensureAudio();if(sound)drum('whoosh');it.classList.add('out');setTimeout(()=>it.remove(),900);
   const f=frameFor('all');camera.position.copy(f.t).add(new THREE.Vector3(0,f.d*1.9,f.d*.12));controls.update();flyTo('all',2600)};
 if(it){if(document.documentElement.classList.contains('entered'))it.remove();else{it.classList.add('ready');$('enter').disabled=false;$('enter').querySelector('span').textContent='Enter the portfolio';$('enter').onclick=()=>go(true);$('quiet').onclick=()=>go(false)}}}
loop();
