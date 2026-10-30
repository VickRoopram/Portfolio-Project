/**
 * Vick Does Creative: a portfolio played as a 3D synthesizer.
 * Three.js scene, Web Audio synth engine, camera "modes" per synth part, and floating detail cards.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CH, LINKS, im } from './content.js';

/* ───────────── MODES (each part of the synth is a mode) ───────────── */
const MODES={
  gd:{part:'The keyboard',n:'12 projects',dock:'Graphic',glow:'#22ff7a',box:'kb'},
  ux:{part:'The keyboard',n:'7 case notes',dock:'UX/UI',glow:'#3fb2ff',box:'kb'},
  mo:{part:'The keyboard',n:'6 pieces',dock:'Motion',glow:'#ff6a20',box:'kb'},
  ds:{part:'The keyboard',n:'Designer',dock:'Roles',glow:'#3fb2ff',box:'kb'},
  st:{part:'The keyboard',n:'Strategist',dock:'Strategist',glow:'#2bd67b',box:'kb'},
  ar:{part:'The keyboard',n:'Artist',dock:'Artist',glow:'#ffffff',box:'kb'},
  te:{part:'The keyboard',n:'Teacher',dock:'Teacher',glow:'#ff7a2a',box:'kb'},
  fm:{part:'The life strip',n:'Family Man',dock:'Life',glow:'#2bd67b',box:'life'},
  fi:{part:'The life strip',n:'The Fighter',dock:'Fighter',glow:'#3db4ff',box:'life'},
  ex:{part:'The life strip',n:'The Explorer',dock:'Explorer',glow:'#ff3fb4',box:'life'},
  info:{part:'The About row',n:'6 pages',dock:'About',glow:'#ff2a30',box:'info'},
  cv:{part:'The remote',n:'CV, contact & socials',dock:'CV & Contact',glow:'#ff6a20',box:'cv'},
};
const ORDER=['gd','ux','mo','tl','xp','ab','ds','st','ar','te','fm','fi','ex','cv'], KBM=['gd','ux','mo','ab','sk','tl','aw','wk','sd','xp','ds','st','ar','te'], PADM=['fm','fi','ex'], DOCK=['ab','gd','ux','mo','ds','fm','cv'];
const S={mode:null,card:null,persona:0,hover:null,hoverUntil:0,kb:'gd',pad:'fm'};
let lastHit=null;
{ Object.assign(MODES,{xp:{dock:'Experimental',glow:'#ff5ec8'},ab:{dock:'About',glow:'#ff2a30'},sk:{dock:'Skills',glow:'#ffb020'},tl:{dock:'Tools',glow:'#a46bff'},aw:{dock:'Awards',glow:'#ffd400'},wk:{dock:'Work',glow:'#00e0cc'},sd:{dock:'Study',glow:'#ff5ec8'}});
 ['ab','sk','tl','aw','wk','sd','xp'].forEach(k=>Object.assign(MODES[k],{part:'The keyboard',box:'kb'}));
 ['ds','st','ar','te','ab','sk','tl','aw','wk','sd','xp'].forEach(k=>MODES[k].n=CH[k].items.length+' keys');}
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

function cardHTML(ch,i){
  const c=CH[ch],it=c.items[i];
  let h=`<h2>${it.t}</h2><p class="k">${it.k}</p>`;
  if(it.hero) h+=`<div class="hero"><img src="assets/img/vick.jpg" alt="Portrait of Vickhal Roopram"><div class="d"><p><b>Vickhal Roopram</b><br>UX & Motion Designer<br>27 · South Africa</p></div></div>`;
  if(it.bars) h+=`<div class="bars">${it.bars.map(b=>`<div class="bar"><span>${b[0]}</span><small>${b[1]}</small><div><i style="--w:${b[2]*100}%"></i></div></div>`).join('')}</div>`;
  if(it.life) h+=``+CH.life.items.map(x=>`<div class="d"><h3>${x.t}</h3>${x.d}</div>`).join('');
  if(it.contact) h+=`<div class="d"><p>For work, collaborations or a chat about design and faith:</p></div><div class="copy"><span id="em">vickhal10@gmail.com</span><button class="btn" id="cp">Copy email</button></div><div class="copy">Cell: +27 73 482 7221</div><div class="socials">${LINKS.map(l=>`<a class="soc" href="${l[1]}" target="_blank" rel="noopener">${SOCIAL_ICON(l[0])}<span>${l[0]}<small>${l[1].replace(/^https:\/\/(www\.)?/,'').replace(/\/$/,'')}</small></span><b aria-hidden="true">↗</b></a>`).join('')}</div>`;
  if(it.d) h+=`<div class="d">${it.d}</div>`;
  if(it.tags) h+=`<div class="tags">${it.tags.map(t=>`<span>${t}</span>`).join('')}</div>`;
  if(it.links) h+=`<div class="links">${it.links.map(l=>`<a href="${l[1]}" target="_blank" rel="noopener">${l[0]} ↗</a>`).join('')}</div>`;
  if(it.img) h+=`<div class="gal">${it.img.map(g=>`<button data-src="${g.s}" aria-label="Enlarge: ${g.a}"><img src="${g.s}" alt="${g.a}" loading="lazy"></button>`).join('')}</div>`;
  return h;
}
function openCard(ch,i){
  const c=CH[ch],n=c.items.length; i=((i%n)+n)%n; S.card={ch,i}; updateUI(); if(ch==='life')S.persona=i;
  $('card').style.setProperty('--accent',c.col);
  $('eb').innerHTML='';
  $('ct').innerHTML=cardHTML(ch,i); $('ct').scrollTop=0;
  const card=$('card'); card.hidden=true; void card.offsetWidth; card.hidden=false;
  const rb=ROWBTN.find(a=>a[1]===ch);if(rb)press(rb[0]);
  const m=(KBM.includes(ch)?CTRL.kb:PADM.includes(ch)?CTRL.pad:CTRL[ch])?.[i]; if(m) press(m);
  const cp=$('cp'); if(cp) cp.onclick=()=>{navigator.clipboard?.writeText('vickhal10@gmail.com').then(()=>cp.textContent='Copied',()=>{const r=document.createRange();r.selectNodeContents($('em'));getSelection().removeAllRanges();getSelection().addRange(r);cp.textContent='Selected'})};
}
function closeCard(){S.card=null;$('card').hidden=true;updateUI()}
$('prev').onclick=()=>{ensureAudio();openCard(S.card.ch,S.card.i-1);noteFor(S.card.i)};
$('next').onclick=()=>{ensureAudio();openCard(S.card.ch,S.card.i+1);noteFor(S.card.i)};
$('cls').onclick=closeCard;
$('ct').onclick=e=>{const b=e.target.closest('.gal button');if(b){$('lb').querySelector('img').src=b.dataset.src;$('lb').hidden=false}};
$('lb').onclick=()=>$('lb').hidden=true;
function noteFor(i){playNote(60+[0,4,7,12,7,4,2,5,9,11,14,16][i%12])}

/* dock + hint */
$('home').onclick=()=>{ensureAudio();zoomOut()};
function updateUI(){
  $('home').dataset.atHome=String(!S.mode&&!S.card);
}

/* ───────────── AUDIO ───────────── */
const P={cutoff:.62,q:.22,dtime:.35,fb:.3,wet:.22,detune:.15,decay:.45,attack:.03,sub:.3,drums:.8,vol:.7,wave:1};
const PNAMES={cutoff:'Tone',q:'Resonance',dtime:'Echo time',fb:'Echo feedback',wet:'Echo mix',detune:'Detune',decay:'Decay',attack:'Attack',sub:'Sub osc',drums:'Drum level',vol:'Volume'};
const WAVES=['triangle','square','sawtooth'];
let ac,master,filter,delay,fb,wet,an,noiseBuf,muted=false,tdata,pulse=0;
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
function toggleMute(){muted=!muted;if(muted)stopDemo();$('snd').textContent=muted?'Sound off':'Sound on';$('snd').setAttribute('aria-pressed',!muted);ensureAudio();applyP()}
$('snd').onclick=toggleMute;

/* ───────────── 3D SCENE ───────────── */
const stage=$('stage');
await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
stage.prepend(renderer.domElement); $('loading').remove();
const scene=new THREE.Scene(); scene.background=new THREE.Color('#efefed');
const camera=new THREE.PerspectiveCamera(32,1,.1,300);
scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),0.04).texture; // studio reflections for the metal
scene.add(new THREE.HemisphereLight('#ffffff','#b9bab6',.45));
{const rim=new THREE.DirectionalLight('#dfe8ff',.9);rim.position.set(9,6,-12);scene.add(rim);}
const sun=new THREE.DirectionalLight('#fff6ea',2.0); sun.position.set(-7,16,9); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-18,right:18,top:14,bottom:-14,near:1,far:50}); sun.shadow.radius=6; sun.shadow.bias=-.0004; scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.17})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);

/* ── Materials: Teenage-Engineering-style anodised & brushed aluminium, satin plastic ── */
function noiseTex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=8;return t}
const TEX={
  brush:noiseTex(512,512,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const y=Math.random()*h,g=110+Math.random()*60|0;x.strokeStyle=`rgba(${g},${g},${g},${.15+Math.random()*.35})`;x.lineWidth=Math.random()*1.4+.3;x.beginPath();x.moveTo(0,y);x.lineTo(w,y+(Math.random()-.5)*2);x.stroke()}},[2,2]),
  grain:noiseTex(256,256,(x,w,h)=>{const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=118+Math.random()*24|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0)},[3,3]),
  knurl:noiseTex(256,32,(x,w,h)=>{x.fillStyle='#777';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){const g=x.createLinearGradient(i,0,i+8,0);g.addColorStop(0,'#333');g.addColorStop(.5,'#eee');g.addColorStop(1,'#333');x.fillStyle=g;x.fillRect(i,0,8,h)}},[6,1])};
const PRESET={
  '#d4d6db':{color:'#c9ccd2',metalness:.92,roughness:.34,roughnessMap:TEX.brush,bumpMap:TEX.brush,bumpScale:.4,anisotropy:.7},   // brushed aluminium body
  '#e3e4e8':{color:'#dcdee2',metalness:.7,roughness:.48,roughnessMap:TEX.grain,bumpMap:TEX.grain,bumpScale:.25},                  // bead-blasted tiles
  '#eeeff2':{color:'#f1f1ee',metalness:0,roughness:.5,clearcoat:.35,clearcoatRoughness:.4,bumpMap:TEX.grain,bumpScale:.15},       // satin key plastic
  '#232427':{color:'#1e1f22',metalness:.85,roughness:.4,roughnessMap:TEX.brush,bumpMap:TEX.brush,bumpScale:.3,anisotropy:.5},      // black anodised strip
  '#1c1c1e':{color:'#1c1c1e',metalness:.2,roughness:.55},
  '#c4c6cc':{color:'#d6d8dc',metalness:1,roughness:.18},                                                                         // polished steel rings
  '#1b1c1f':{color:'#16171a',metalness:.3,roughness:.7,bumpMap:TEX.grain,bumpScale:.2}};                                           // deck recess
const mats={}; const M=(c,r=.62,m=0)=>{const k=c+r+m;if(mats[k])return mats[k];const p=PRESET[c.toLowerCase()];
  return mats[k]=new THREE.MeshPhysicalMaterial(p?{...p}:{color:c,roughness:Math.min(r,.5),metalness:Math.max(m,.15),clearcoat:.25,clearcoatRoughness:.35,bumpMap:TEX.grain,bumpScale:.08,envMapIntensity:.9})};
/* anodised coloured knob cap + knurled metal band */
const A=c=>mats['A'+c]||(mats['A'+c]=new THREE.MeshPhysicalMaterial({color:c,metalness:.65,roughness:.28,clearcoat:.6,clearcoatRoughness:.2,bumpMap:TEX.grain,bumpScale:.05}));
const KN=mats.KN=new THREE.MeshPhysicalMaterial({color:'#b9bcc2',metalness:1,roughness:.32,bumpMap:TEX.knurl,bumpScale:1.2,side:THREE.DoubleSide});
function knurl(parent,r,h,y,proxy){const k=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,64,1,true),KN);k.position.y=y;k.castShadow=true;parent.add(k);k.userData.proxy=proxy;hits.push(k);return k}
function screw(parent,x,y,z){const s=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.025,20),M('#c4c6cc'));s.position.set(x,y,z);parent.add(s);const sl=new THREE.Mesh(new THREE.BoxGeometry(.11,.012,.022),new THREE.MeshStandardMaterial({color:'#55575c'}));sl.position.set(x,y+.014,z);sl.rotation.y=Math.random()*Math.PI;parent.add(sl)}
const geos={}; function rbox(w,h,d,r,mat){const k=[w,h,d,r].join();const g=geos[k]||(geos[k]=new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2-.001,h/2-.001,d/2-.001)));const m=new THREE.Mesh(g,mat);m.castShadow=m.receiveShadow=true;return m}
function cyl(rt,rb,h,mat,seg=40){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);m.castShadow=m.receiveShadow=true;return m}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw?.(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return {c,x,t}}
function labelPlane(text,w=.62,h=.3,color='#6b6e76',size=50){const {t}=canvasTex(256,124,(x,W,H)=>{x.fillStyle=color;x.font=`600 ${size}px "IBM Plex Mono", monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,W/2,H/2+2)});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));p.rotation.x=-Math.PI/2;return p}

const hits=[], anim=[];
function press(m){const u=m.userData;if(u.by===undefined)return;u.ty=u.by-.07;setTimeout(()=>u.ty=u.by,150)}
/* generic controls */
function pressable(mesh,act,tip){mesh.userData={tip,by:mesh.position.y,ty:mesh.position.y,down(){press(mesh);act()}};hits.push(mesh);anim.push(mesh)}
/* item control: a control that holds a piece of the portfolio */
function itemCtrl(mesh,ch,i,sound,{knob=null,pressy=true}={}){
  CTRL[ch][i]=mesh; mesh.material=mesh.material.clone(); mesh.material.emissive=new THREE.Color(MODES[realCh(ch)].glow);
  const has=()=>i<CH[realCh(ch)].items.length;
  function go(){const c=realCh(ch); if(S.mode!==c)zoomTo(c); else openCard(c,i)}
  mesh.userData={get ch(){return realCh(ch)},i,get item(){return has()},tip:ch==='pad'?'Open slot · drum pad':'Play a note',
    ...(pressy?{by:mesh.position.y,ty:mesh.position.y}:{}),
    down(){sound?.();if(pressy)press(mesh);if(has())go()},
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
    cp.userData={tip:`${PNAMES[key]} · drag up/down`,live:()=>`${PNAMES[key]} ${Math.round(P[key]*100)}%`,drag(d){P[key]=Math.min(1,Math.max(0,P[key]+d/180));set();applyP()},up(){}};hits.push(cp);}
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
function capMesh(c,r,label,lc){tile(c,r);const k=rbox(.72,.16,.72,.16,M(C.cap,.5));k.position.set(GX(c),TOP+.36,GZ(r));synth.add(k);if(label){const l=labelPlane(label,.66,.32,lc);l.position.y=.081;k.add(l)}return k}
function capBtn(c,r,label,act,tip,lc){const k=capMesh(c,r,label,lc);pressable(k,act,tip);return k}

// speaker (musical side: right)
tile(12,0,2,2);
const grille=(()=>{const {t}=canvasTex(256,256,(x)=>{x.fillStyle='#3a3b40';for(let i=0;i<11;i++)for(let j=0;j<11;j++){const dx=i-5,dy=j-5;if(dx*dx+dy*dy<=27){x.beginPath();x.arc(28+i*20,28+j*20,5.2,0,7);x.fill()}}});
 const p=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshBasicMaterial({map:t,transparent:true}));p.rotation.x=-Math.PI/2;p.position.set(GX(12.5),TOP+.305,GZ(.5));synth.add(p);return p})();
// tone knob, wave, demo
tile(14,0,2,1); paramKnob(new THREE.Vector3(GX(14),TOP+.3,GZ(0)),'cutoff',{r:.3,cap:'#f7f7f8',ring:C.ring,parent:synth});
{const l=labelPlane('TONE',.6,.29);l.position.set(GX(15),TOP+.31,GZ(0));synth.add(l)}
capBtn(14,1,'WAVE',()=>{P.wave=(P.wave+1)%3;setSwitch();playNote(67,.4)},'Waveform: triangle / square / saw');
const beatsBtn=capBtn(15,1,'BEATS',()=>toggleDemo(),'Beats · each click plays the next of 5 tracks');
const stopBtn=capBtn(16,0,'STOP',()=>{stopDemo();drum('rim')},'Stop the music');
{const sq=new THREE.Mesh(new THREE.PlaneGeometry(.11,.11),new THREE.MeshBasicMaterial({color:'#d71920'}));sq.rotation.x=-Math.PI/2;sq.position.set(0,.082,-.27);stopBtn.add(sq);}
[stopBtn,beatsBtn].forEach(m=>{m.material=m.material.clone();m.material.emissive=new THREE.Color('#ff5d1a')});
capBtn(16,1,'MUTE',()=>toggleMute(),'Sound on / off');
// screen
tile(0,0,4,2,M(C.recess,.4));
const scr=canvasTex(800,380); const scrP=new THREE.Mesh(new THREE.PlaneGeometry(3.78,1.8),new THREE.MeshBasicMaterial({map:scr.t,toneMapped:false}));
scrP.rotation.x=-Math.PI/2; scrP.position.set(GX(1.5),TOP+.305,GZ(.5)); synth.add(scrP);
scrP.userData={tip:'Screen · click for the About page',down(){zoomTo('ab');openCard('ab',0)}}; hits.push(scrP);
// THEOLOGY: the four big knobs
const TH_LABEL=['DESIGNER','STRATEGIST','ARTIST','TEACHER'], BIG=['#3d9ad8','#21b35c','#f1f1f1','#ff5d1a'];
for(let i=0;i<4;i++){const c0=4+i*2;tile(c0,0,2,2);
  const g=new THREE.Group(); g.position.set(GX(c0+.5),TOP+.3,GZ(.5)); synth.add(g);
  const ring=cyl(.8,.84,.12,M(C.ring,.4)); ring.position.y=.06; g.add(ring);
  const rot=new THREE.Group(); g.add(rot); rot.userData.r=0; anim.push(rot);
  const capm=cyl(.58,.62,.42,A(BIG[i])); capm.position.y=.33; rot.add(capm); knurl(rot,.63,.26,.26,capm);
  const ind=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,.34),M(i===2?'#3a3b40':'#ffffff',.5)); ind.position.set(0,.55,-.3); rot.add(ind);
  ring.userData.proxy=capm; ind.userData.proxy=capm; hits.push(ring,ind);
  const L=labelPlane(TH_LABEL[i],1.5,.3,'#7b7e86',40); L.position.set(0,.01,.98); g.add(L);
  const RK=['ds','st','ar','te'][i]; capm.material=capm.material.clone(); capm.material.emissive=new THREE.Color(MODES[RK].glow); BIGCAPS.push([capm,RK]);
  capm.userData={tip:`${CH[RK].name} mode · lights up the keys`,down(){playNote([48,52,55,60][i],1.4);zoomTo(RK)},drag(d){rot.userData.r+=d/50},up(){}}; hits.push(capm);
}
// ABOUT: red button row (cols 0-7, row 2); lead notes cols 8-16
// About row: only content about Vick — 9 wide buttons across the full row
CH.info.items.length=6;
function wideBtn(x,w,label,lc){const t=rbox(w-.07,.3,.93,.07,M(C.tile,.6));t.position.set(x,TOP+.15,GZ(2));synth.add(t);
  const k=rbox(w-.3,.16,.72,.16,M(C.cap,.5));k.position.set(x,TOP+.36,GZ(2));synth.add(k);
  const l=labelPlane(label,1.6,.5,lc,Math.min(40,Math.floor(400/label.length)));l.position.y=.081;k.add(l);t.userData.proxy=k;hits.push(t);return k}
{const F=['gd','ux','mo','tl','xp'],L=['DESIGN','UI/UX','MOTION','TOOLS','EXPERIMENTAL'],LC=['#1a9e4f','#2f86c2','#e5541a','#7c4ddb','#d14fa8'],W=17/5;
 for(let j=0;j<5;j++){const x=-8.5+W*(j+.5),f=F[j];
  const k=wideBtn(x,W,L[j],LC[j]);
  k.material=k.material.clone();k.material.emissive=new THREE.Color(MODES[f].glow);ROWBTN.push([k,f]);
  pressable(k,()=>{playNote(72+[0,4,7,11,14][j],.5);zoomTo(f)},`Filter · ${CH[f].name} · ${MODES[f].n||CH[f].items.length+' keys'} on the keys`);k.userData.filter=f;}}
// drum pads
const PADS=['kick','snare','hat','clap','tom','rim','shaker','crash','blip'];
PADS.forEach((p,i)=>capBtn(14+i%3,3+Math.floor(i/3),p.toUpperCase(),()=>drum(p),`Drum pad · ${p}`));
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

/* UX: the control strip */
const TU=new THREE.Group(); TU.position.set(-3.1,0,-6.5); scene.add(TU);
{const b=rbox(12.6,.8,2.7,.32,M(C.black,.5));b.position.y=.4;TU.add(b);[[-6.05,-1.1],[6.05,-1.1],[-6.05,1.1],[6.05,1.1]].forEach(([x,z])=>screw(TU,x,.805,z));
 const bez=rbox(3.3,.08,1.9,.18,M('#36373b',.4)); bez.position.set(-4.35,.82,0); TU.add(bez);}
const per=canvasTex(560,320); const perP=new THREE.Mesh(new THREE.PlaneGeometry(3.08,1.7),new THREE.MeshBasicMaterial({map:per.t,toneMapped:false}));
perP.rotation.x=-Math.PI/2; perP.position.set(-4.35,.87,0); TU.add(perP);
perP.userData={tip:'Life screen · click a figure: Family Man, Fighter or Explorer',down(){const u=lastHit?.uv?.x??0;playNote(76,.5);zoomTo(PADM[Math.min(2,Math.max(0,Math.floor(u*3)))])}}; hits.push(perP);
function setSwitch(){}
for(let j=0;j<8;j++){const c=j%4,rw=Math.floor(j/4);const pd=rbox(1.42,.18,.84,.12,M('#3b3c41',.5));pd.position.set(-1.85+c*1.55,.89,-.47+rw*.94);TU.add(pd);itemCtrl(pd,'pad',j,()=>drum(PADS[j]))}
[[4.2,-.42,'wet'],[4.2,.42,'cutoff'],[4.95,-.42,'decay'],[4.95,.42,'vol']].forEach(([x,z,k])=>paramKnob(new THREE.Vector3(x,.8,z),k,{r:.24,cap:'#6a6b70',ring:'#151517',parent:TU}));
{const d=rbox(1.6,.55,1.2,.2,M(C.black,.5));d.position.set(6.9,.28,.1);TU.add(d);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.33,.03,8,40),M('#1a1a1c'));ring.rotation.x=-Math.PI/2;ring.position.set(6.95,.56,.1);TU.add(ring);}
const shuf=cyl(.3,.32,.14,M('#5a5b60',.4)); shuf.position.set(6.95,.6,.1); TU.add(shuf);
shuf.userData={tip:'Shuffle · open a random piece of work',down(){const ch=KBM[Math.floor(Math.random()*KBM.length)];S.mode=null;zoomTo(ch);openCard(ch,Math.floor(Math.random()*CH[ch].items.length));drum('crash')}}; hits.push(shuf);

/* MOTION: the remote */
const RM=new THREE.Group(); RM.position.set(-11.7,0,.15); scene.add(RM);
{const b=rbox(2.15,.75,6.6,.3,M(C.body,.55));b.position.y=.375;RM.add(b);
 const r=rbox(1.95,.1,6.4,.05,M(C.recess,.8));r.position.y=.75;RM.add(r);}
const rmt=(w,d,x,z)=>{const m=rbox(w-.07,.26,d-.07,.07,M(C.tile,.6));m.position.set(x,.88,z);RM.add(m);return m};
rmt(1.9,1.3,0,-2.5); const rs=canvasTex(300,200); const rsP=new THREE.Mesh(new THREE.PlaneGeometry(1.74,1.14),new THREE.MeshBasicMaterial({map:rs.t,toneMapped:false}));
rsP.rotation.x=-Math.PI/2; rsP.position.set(0,1.015,-2.5); RM.add(rsP);
rmt(1.9,1.7,0,-1);
{const k=paramKnob(new THREE.Vector3(0,1.01,-1),null,{r:.48,cap:'#ff5d1a',ring:C.ring,parent:RM});itemCtrl(k.cp,'cv',0,()=>playNote(55,1),{knob:k.rot,pressy:false})}
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
const remoteLed=socket([-9.5,.45,1.5],[0,0,Math.PI/2]), stripLed=socket([5.3,.45,-3.68],[Math.PI/2,0,0]);
cable([[-11.7,.3,3.45],[-11.6,.12,4.6],[-10.2,.1,5.5],[-8,.1,5.2],[-6.4,.1,6.2],[-6,.11,7.4]],
      [[-11.7,.3,3.45],[-11.6,.12,4.4],[-11,.1,4.6],[-10.4,.1,3.4],[-10.25,.3,1.5],[-9.75,.45,1.5]],'#ff5d1a',.085,()=>S.mode==='cv').led=remoteLed;
cable([[4.6,.3,-6.5],[6,.12,-7.4],[8.2,.1,-8.1],[10.4,.1,-7.2],[12.6,.1,-8.2],[13.2,.11,-9.4]],
      [[4.6,.3,-6.5],[5.6,.12,-6.9],[6.2,.1,-6.0],[5.7,.1,-4.6],[5.3,.3,-4.15],[5.3,.45,-3.92]],'#1c1c1e',.07,()=>PADM.includes(S.mode)).led=stripLed;
function updateCables(){CABLES.forEach(c=>{const tgt=c.isOn()?1:0;if(Math.abs(c.t-tgt)<.002){if(c.t!==tgt){c.t=tgt;c.build();if(tgt===1)drum('rim')}}else{c.t+=(tgt-c.t)*.06;c.build()}
  c.led.material.emissiveIntensity=c.t>.97?1.6:0})}

/* ───────────── CAMERA: overview + per-part framing ───────────── */
scene.updateMatrixWorld(true);
const boxOf=objs=>{const b=new THREE.Box3();objs.forEach(o=>b.expandByObject(o));return b};
const BOX={
  all:new THREE.Box3(new THREE.Vector3(-12.9,0,-7.9),new THREE.Vector3(9.6,1.4,3.8)),
  kb:boxOf([...keyMeshes,...sharpMeshes,...ROWBTN.map(a=>a[0])]), cv:boxOf([RM]), life:boxOf([TU]),
  th:new THREE.Box3(new THREE.Vector3(GX(4)-.5,TOP,GZ(0)-.6),new THREE.Vector3(GX(15)+.5,TOP+.8,GZ(1)+.9)),
  info:new THREE.Box3(new THREE.Vector3(-8.6,TOP,GZ(1)),new THREE.Vector3(8.6,TOP+.5,GZ(3)+.3)),
};
const POLAR={all:.68,kb:.62,cv:.5,life:.55,info:.6};
const desktop=()=>innerWidth>760;
function frameFor(key){
  const b=BOX[key],c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()),pol=desktop()?POLAR[key]:.001;
  const w=stage.clientWidth,h=stage.clientHeight, T=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
  let tanV=T, tanH=T*w/h;
  if(key!=='all'&&!desktop()) tanV=T*.62;
  const m=key==='all'?1.3:desktop()?.9:1.02;
  const d=Math.max((s.x/2*m)/tanH,((s.z*Math.cos(pol)+s.y)/2*m+.3)/tanV)+s.y;
  return {t:c,p:new THREE.Vector3(c.x,c.y+d*Math.cos(pol),c.z+d*Math.sin(pol)),d};
}
let fly=null, offX=0, offY=0;
function flyTo(key){const f=frameFor(key);fly={p0:camera.position.clone(),t0:controls.target.clone(),p1:f.p,t1:f.t,s:performance.now(),dur:1500};controls.enabled=false;
  controls.minDistance=f.d*.55;controls.maxDistance=Math.max(f.d*1.6,frameFor('all').d*1.3)}
function zoomTo(ch){if(S.mode===ch)return;if(KBM.includes(ch))S.kb=ch;if(PADM.includes(ch))S.pad=ch;const same=S.mode&&MODES[S.mode].box===MODES[ch].box;S.mode=ch;closeCard();drum(same?'blip':'whoosh');if(!same)flyTo(MODES[ch].box);updateUI()}
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
  if(o?.tip) return {h:'VICK.SYS',r:'',t:o.tip.toUpperCase(),col:'#9a9ca3'};
  if(S.card){const c=CH[S.card.ch];return {h:c.name,r:`${pad(S.card.i+1)}/${pad(c.items.length)}`,t:c.items[S.card.i].t.toUpperCase(),col:scrCol(S.card.ch)}}
  if(S.mode) return {h:CH[S.mode].name,r:MODES[S.mode].n.toUpperCase(),t:'HOVER A CONTROL · CLICK TO OPEN',col:scrCol(S.mode)};
  return {h:'VICK.SYS',r:'v1.0',t:'HELLO USER, WELCOME TO MY PORTFOLIO.',col:'#ff4a50'};
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
  const p=per.x;p.fillStyle='#08090b';p.fillRect(0,0,560,320);
  FIG.forEach((f,k)=>{const sel=PADM.indexOf(S.pad)===k,ps=17,cx=95+k*185,bob=Math.sin(time*6+k)*level*14*(sel?1:.5)+(sel?Math.sin(time*2)*3:0);
    p.globalAlpha=sel?1:.38;p.fillStyle=FCOL[k];f.forEach((row,ry)=>[...row].forEach((ch,rx)=>{if(ch==='X')p.fillRect(cx-60+rx*ps,40+ry*ps-bob,ps-2,ps-2)}));
    p.font='20px Bungee, Impact, sans-serif';p.textAlign='center';p.fillText(FN[k],cx,200);p.textAlign='left'});
  p.globalAlpha=1;p.font='600 20px "IBM Plex Mono", monospace';p.fillStyle='#55575d';p.fillText('VICK.LIFE · CLICK A FIGURE',24,276);
  per.t.needsUpdate=true;
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
function toggleDemo(){ensureAudio();stopDemo();track=(track+1)%TRACKS.length;step=0;const T=TRACKS[track];P.wave=T.wave;
  demo=setInterval(()=>{const i=step%16,root=T.base+T.prog[Math.floor(step/16)%4];
    if(T.k[i]==='x')drum('kick'); if(T.s[i]==='x')drum('snare'); if(T.h[i]==='x')drum('hat'); if(T.c?.[i]==='x')drum('clap');
    if(T.bass[i]==='x')playNote(root-12,.22); const d=T.lead[i]; if(d!=='.')playNote(root+12+SCALE[+d],.3);
    step++},60000/T.bpm/4)}

/* ───────────── INPUT ───────────── */
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(), lbl=$('lbl'), cv=renderer.domElement;
function pick(e){const r=cv.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ptr,camera);
  const h=ray.intersectObjects(hits,true)[0];lastHit=h;let o=h?.object;while(o&&!o.userData.down&&!o.userData.up&&!o.userData.proxy)o=o.parent;return o?.userData.proxy||o}
function labelHTML(o){const u=o.userData;
  if(u.item){const c=CH[u.ch];return S.mode===u.ch?`<small>${c.name} · ${pad(u.i+1)}</small>${c.items[u.i].t}`:`<small>${MODES[u.ch].part} · click to zoom in</small>${c.name} · ${MODES[u.ch].n}`}
  return u.tip}
let drag=null;
cv.addEventListener('pointerdown',e=>{ensureAudio();const o=pick(e);if(!o)return;controls.enabled=false;drag={o,y:e.clientY,x:e.clientX,sx:e.clientX,sy:e.clientY,m:0};o.userData.down?.();
  if(e.pointerType!=='mouse'){S.hover=o;S.hoverUntil=performance.now()+1600}try{cv.setPointerCapture(e.pointerId)}catch{}});
const controls=new OrbitControls(camera,cv); controls.enableDamping=true; controls.enablePan=false; controls.minPolarAngle=.12; controls.maxPolarAngle=1.22; controls.minAzimuthAngle=-.95; controls.maxAzimuthAngle=.95;
let lastLive='';
cv.addEventListener('pointermove',e=>{
  if(drag){const dy=e.clientY-drag.y,dx=e.clientX-drag.x;drag.y=e.clientY;drag.x=e.clientX;drag.m+=Math.abs(dy)+Math.abs(dx);drag.o.userData.drag?.(-dy+dx*.5);lastLive=drag.o.userData.live?.()||'';return}
  if(e.pointerType!=='mouse')return;const o=pick(e);cv.style.cursor=o?'pointer':'grab';S.hover=o||null;S.hoverUntil=Infinity});
const end=e=>{if(drag){drag.o.userData.up?.(e&&e.clientX!==undefined?Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy):drag.m);drag=null;lastLive='';if(!fly)controls.enabled=true}};
cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('pointerleave',()=>{if(!drag)S.hover=null});
const KW='asdfghjkl;', KS={w:0,e:1,t:2,y:3,u:4,o:5,p:6}, KD='zxcvbnm,.';
const held=new Set();
addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.toLowerCase();
  if(k==='escape'){if(!$('lb').hidden)$('lb').hidden=true;else if(S.card)closeCard();else if(S.mode)zoomOut();return}
  if(held.has(k))return;held.add(k);
  if(KW.includes(k)){ensureAudio();const i=KW.indexOf(k);press(keyMeshes[i]);playNote(wMidi(i))}
  else if(k in KS){ensureAudio();sharpMeshes[KS[k]]?.userData.down()}
  else if(KD.includes(k)){ensureAudio();drum(PADS[KD.indexOf(k)])}
  else if('123456'.includes(k)){ensureAudio();zoomTo(ORDER[+k-1])}
  else if(k==='0'){ensureAudio();zoomOut()}
  else if(S.card&&k==='arrowright'){openCard(S.card.ch,S.card.i+1)} else if(S.card&&k==='arrowleft'){openCard(S.card.ch,S.card.i-1)}});
addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));

/* ───────────── LOOP ───────────── */
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2, v3=new THREE.Vector3();
function resize(){const w=stage.clientWidth,h=stage.clientHeight,mob=!desktop();controls.enableRotate=!mob;controls.enableZoom=!mob;controls.minPolarAngle=mob?0:.12;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(!fly){const f=frameFor(S.mode?MODES[S.mode].box:'all');camera.position.copy(f.p);controls.target.copy(f.t);controls.minDistance=f.d*.55;controls.maxDistance=frameFor('all').d*1.4;controls.update()}}
new ResizeObserver(resize).observe(stage); resize();
const clock=new THREE.Clock();
function loop(){const t=clock.getElapsedTime(),now=performance.now();
  if(fly){const k=Math.min(1,(now-fly.s)/fly.dur),e=ease(k);camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(k>=1){fly=null;if(!drag)controls.enabled=true}}
  // keep the zoomed part clear of the card
  const w=stage.clientWidth,h=stage.clientHeight, tx=S.card&&desktop()?Math.min(235,w*.18):0, ty=S.card&&!desktop()?h*.28:0;
  offX+=(tx-offX)*.08; offY+=(ty-offY)*.08; camera.setViewOffset(w,h,offX,offY,w,h);
  anim.forEach(o=>{const u=o.userData;if(u.ty!==undefined)o.position.y+=(u.ty-o.position.y)*.35;if(u.tz!==undefined)o.position.z+=(u.tz-o.position.z)*.3;if(u.r!==undefined)o.rotation.y+=(u.r-o.rotation.y)*.18});
  if(S.hover&&now>S.hoverUntil&&!drag)S.hover=null;
  // floating label
  const ho=drag?.o||S.hover;
  if(ho){ho.getWorldPosition(v3);v3.y+=.45;v3.project(camera);
    const x=(v3.x+1)/2*w, y=(1-v3.y)/2*h; lbl.hidden=false; lbl.style.left=x+'px'; lbl.style.top=y+'px';
    const html=lastLive||labelHTML(ho); if(lbl._h!==html){lbl.innerHTML=html;lbl._h=html}} else lbl.hidden=true;
  grille.scale.setScalar(1+level*.04); updateCables(); refreshGlow(t); drawScreens(t); controls.update(); renderer.render(scene,camera); requestAnimationFrame(loop)}
updateUI(); loop();
