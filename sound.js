const Sound={
  ctx:null,
  enabled:JSON.parse(localStorage.getItem('soundEnabled')||'true'),
  
  init(){
    if(!this.ctx && (window.AudioContext||window.webkitAudioContext)){
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    }
  },
  
  toggle(){
    this.enabled=!this.enabled;
    localStorage.setItem('soundEnabled',JSON.stringify(this.enabled));
    if(this.enabled) this.blip(660,0.05);
    return this.enabled;
  },
  
  beep(freq=440,dur=0.1,type='square',vol=0.1){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    const t=this.ctx.currentTime;
    const osc=this.ctx.createOscillator();
    const gain=this.ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(vol,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t+dur);
  },
  
  sweep(f1,f2,dur=0.2,type='square',vol=0.08){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    const t=this.ctx.currentTime;
    const osc=this.ctx.createOscillator();
    const gain=this.ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(f1,t);
    osc.frequency.exponentialRampToValueAtTime(f2,t+dur);
    gain.gain.setValueAtTime(vol,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t+dur);
  },
  
  noise(dur=0.1,vol=0.05){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    const t=this.ctx.currentTime;
    const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*dur,this.ctx.sampleRate);
    const data=buf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1);
    const src=this.ctx.createBufferSource();
    src.buffer=buf;
    const gain=this.ctx.createGain();
    gain.gain.setValueAtTime(vol,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  },
  
  blip(freq=880,dur=0.04){this.beep(freq,dur,'square',0.06)},
  click(){this.beep(1200,0.02,'square',0.04)},
  step(){this.beep(220,0.03,'sine',0.05)},
  pickup(){this.sweep(440,880,0.15,'square',0.08)},
  unlock(){this.sweep(220,880,0.3,'sawtooth',0.07);setTimeout(()=>this.beep(1320,0.08),200)},
  fail(){this.sweep(440,110,0.25,'sawtooth',0.08)},
  win(){
    const notes=[523,659,784,1047];
    notes.forEach((n,i)=>setTimeout(()=>this.beep(n,0.12,'square',0.08),i*100));
  },
  shoot(){this.sweep(880,220,0.1,'sawtooth',0.05)},
  hit(){this.noise(0.08,0.06)},
  block(){this.sweep(660,1320,0.1,'square',0.06)},
  scan(){this.sweep(110,1760,0.6,'sine',0.04)},
  heat(temp){
    const f=200+temp*400;
    this.beep(f,0.08,'sawtooth',0.05);
  },
  type(){this.beep(800+Math.random()*400,0.015,'square',0.02)},
  open(){this.sweep(330,660,0.18,'triangle',0.06)},
};
window.Sound=Sound;
