const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

const state={
  lang:localStorage.getItem('lang')||'es',
  api:JSON.parse(localStorage.getItem('api')||'null'),
  progress:JSON.parse(localStorage.getItem('progress_'+(localStorage.getItem('userName')||''))||'{}'),
  scores:JSON.parse(localStorage.getItem('scores')||'[]'),
  userName:localStorage.getItem('userName')||'',
  currentLevel:0,
  currentGame:null,
  levelData:{}
};
window.state=state;

const App={
  openProfile(){
    const lang=state.lang;
    const L=lang==='es';
    $('#userName').value=state.userName||'';
    const hasUser=!!state.userName;
    $('#logout-btn').style.display=hasUser?'inline-block':'none';
    const info=$('#profileInfo');
    const stats=$('#profileStats');
    if(hasUser){
      info.style.display='block';
      const scores=state.scores.filter(s=>s.name===state.userName);
      const gamesPlayed=scores.length;
      const bestScore=gamesPlayed?Math.max(...scores.map(s=>s.score)):0;
      const completedLevels=Object.keys(state.progress).filter(k=>state.progress[k]).length;
      stats.innerHTML=`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div style="border:1px solid var(--border);padding:8px;text-align:center"><div style="font-size:9px;color:var(--ink-dim);letter-spacing:1px;text-transform:uppercase">${L?'partidas':'games'}</div><div style="font-family:Fraunces,serif;font-size:22px;color:var(--accent);font-weight:900;font-style:italic">${gamesPlayed}</div></div>
          <div style="border:1px solid var(--border);padding:8px;text-align:center"><div style="font-size:9px;color:var(--ink-dim);letter-spacing:1px;text-transform:uppercase">${L?'mejor score':'best score'}</div><div style="font-family:Fraunces,serif;font-size:22px;color:var(--accent-2);font-weight:900;font-style:italic">${bestScore}</div></div>
          <div style="border:1px solid var(--border);padding:8px;text-align:center"><div style="font-size:9px;color:var(--ink-dim);letter-spacing:1px;text-transform:uppercase">${L?'tutoriales':'tutorials'}</div><div style="font-family:Fraunces,serif;font-size:22px;color:var(--success);font-weight:900;font-style:italic">${completedLevels}/11</div></div>
          <div style="border:1px solid var(--border);padding:8px;text-align:center"><div style="font-size:9px;color:var(--ink-dim);letter-spacing:1px;text-transform:uppercase">${L?'jugador':'player'}</div><div style="font-family:Fraunces,serif;font-size:16px;color:var(--ink);font-weight:900;font-style:italic">${this.esc(state.userName)}</div></div>
        </div>
      `;
    } else {
      info.style.display='none';
    }
    $('#nameModal').classList.add('open');
  },
  
  goHome(){
    $('#view-level').classList.add('hidden');
    $('#view-game').classList.add('hidden');
    $('#view-home').classList.remove('hidden');
    const gc=$('#game-container');
    if(gc) gc.innerHTML='';
    state.currentGame=null;
  },
  
  t(k){return I18N[state.lang][k]||k},
  
  applyI18N(){
    $$('[data-i18n]').forEach(el=>{
      const k=el.dataset.i18n;
      const v=this.t(k);
      if(v) el.innerHTML=v;
    });
    $('#apiStatusText').textContent=state.api?this.t('apiConnected'):this.t('apiNone');
    $('#apiStatus').classList.toggle('connected',!!state.api);
    const pb=$('#profile-btn');
    if(pb){
      if(state.userName){
        pb.textContent=state.userName;
        pb.style.borderColor='var(--accent-2)';
        pb.style.color='var(--accent-2)';
      } else {
        pb.textContent=this.t('profileBtn');
        pb.style.borderColor='';
        pb.style.color='';
      }
    }
    this.renderLevels();
    this.renderGames();
    this.renderLeaderboard();
  },
  
  renderLevels(){
    const levels=I18N[state.lang].levels;
    const grid=$('#levelsGrid');
    if(!grid) return;
    grid.innerHTML=levels.map((lv,i)=>`
      <div class="level-card ${state.progress[lv.id]?'done':''}" data-level="${i}">
        <div class="badge">${state.progress[lv.id]?this.t('levelDone'):'0'+(i+1)}</div>
        <div class="level-num">${String(i+1).padStart(2,'0')}</div>
        <h3>${lv.concept}</h3>
        <p>${lv.title}</p>
      </div>
    `).join('');
    $$('.level-card').forEach(c=>c.onclick=()=>this.openLevel(parseInt(c.dataset.level)));
  },
  
  renderGames(){
    const games=I18N[state.lang].games;
    const grid=$('#gamesGrid');
    if(!grid) return;
    const list=[
      {id:'roulette',data:games.roulette},
      {id:'detective',data:games.detective},
      {id:'defender',data:games.defender},
      {id:'tycoon',data:games.tycoon},
      {id:'quiz',data:games.quiz||{name:'quiz master',icon:'?',desc:'20 preguntas',difficulty:'5 min'}}
    ];
    grid.innerHTML=list.map(g=>{
      const best=this.getBestScore(g.id);
      return `
        <div class="game-card" data-game="${g.id}">
          <div class="game-icon">${g.data.icon}</div>
          <h3>${g.data.name}</h3>
          <p>${g.data.desc}</p>
          <span class="difficulty">${g.data.difficulty}</span>
          ${best?`<span class="best-score">* ${best}</span>`:''}
        </div>
      `;
    }).join('');
    $$('.game-card').forEach(c=>c.onclick=()=>this.openGame(c.dataset.game));
  },
  
  renderLeaderboard(){
    const lang=state.lang;
    const cont=$('#lbContainer');
    if(!cont) return;
    const cols=I18N[lang].lbCols;
    const games={roulette:I18N[lang].games.roulette.name,detective:I18N[lang].games.detective.name,defender:I18N[lang].games.defender.name,tycoon:I18N[lang].games.tycoon.name,quiz:'Quiz Master'};
    
    let html=`<h3 style="font-family:Fraunces,serif;font-size:32px;font-weight:900;font-style:italic;margin-bottom:24px">${I18N[lang].lbTitle}</h3>`;
    
    Object.keys(games).forEach(gid=>{
      const entries=state.scores.filter(s=>s.game===gid).sort((a,b)=>b.score-a.score).slice(0,10);
      html+=`<div class="lb-section"><h4>${games[gid]}</h4>`;
      if(entries.length===0){
        html+=`<div class="lb-empty">${I18N[lang].lbEmpty}</div>`;
      } else {
        html+=`<table class="lb-table"><thead><tr>
          <th>${cols.rank}</th><th>${cols.name}</th><th>${cols.score}</th><th>${cols.tokens}</th><th>${cols.time}</th><th>${cols.date}</th>
        </tr></thead><tbody>`;
        entries.forEach((e,i)=>{
          const isYou=e.name===state.userName;
          html+=`<tr class="${i===0?'top':''} ${isYou?'you':''}">
            <td class="rank">${String(i+1).padStart(2,'0')}</td>
            <td>${this.esc(e.name)}</td>
            <td><strong>${e.score}</strong></td>
            <td>${e.tokens||'—'}</td>
            <td>${e.time?e.time+'s':'—'}</td>
            <td style="color:var(--ink-dim);font-size:11px">${e.date}</td>
          </tr>`;
        });
        html+=`</tbody></table>`;
      }
      html+=`</div>`;
    });
    cont.innerHTML=html;
  },
  
  getBestScore(gameId){
    const entries=state.scores.filter(s=>s.game===gameId && s.name===state.userName);
    if(entries.length===0) return null;
    return Math.max(...entries.map(e=>e.score));
  },
  
  esc(s){return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')},
  
  openLevel(idx){
    state.currentLevel=idx;
    $('#view-home').classList.add('hidden');
    $('#view-level').classList.remove('hidden');
    $('#view-game').classList.add('hidden');
    this.renderProgressBar();
    this.setupLevel(idx);
  },
  
  openGame(gameId){
    if(!state.userName){
      this._pendingGame=gameId;
      $('#nameModal').classList.add('open');
      return;
    }
    state.currentGame=gameId;
    $('#view-home').classList.add('hidden');
    $('#view-game').classList.remove('hidden');
    $('#view-level').classList.add('hidden');
    if(gameId==='quiz'){
      $('#game-container').innerHTML=Quiz.init();
      setTimeout(()=>Quiz.bind(),50);
    } else {
      $('#game-container').innerHTML=Games[gameId].init();
      setTimeout(()=>Games[gameId].bind(),50);
    }
  },
  
  renderProgressBar(){
    const levels=I18N[state.lang].levels;
    $('#progressBar').innerHTML=levels.map((lv,i)=>{
      let cls='';
      if(state.progress[lv.id]) cls='done';
      else if(i===state.currentLevel) cls='current';
      return `<div class="seg ${cls}"></div>`;
    }).join('');
  },
  
  setupLevel(idx){
    const lv=I18N[state.lang].levels[idx];
    $('#level-tag').textContent=`${state.lang==='es'?'nivel':'level'} ${idx+1}/${I18N[state.lang].levels.length}`;
    $('#level-concept-tag').textContent=lv.concept;
    $('#level-title').textContent=lv.title;
    $('#level-concept').innerHTML=lv.body;
    $('#level-challenge').textContent=lv.challenge;
    $('#level-output').className='output empty';
    $('#level-output').textContent=this.t('outputEmpty');
    $('#level-visual').innerHTML='';
    $('#level-feedback').className='feedback';
    $('#level-next').style.display='none';
    
    const controls=$('#level-controls');
    state.levelData={};
    const lang=state.lang;
    
    if(lv.id==='tokens'){
      controls.innerHTML=`
        <label>${lang==='es'?'tu texto':'your text'}</label>
        <textarea id="lv-input" placeholder="${lang==='es'?'Escribe lo que sea...':'Type anything...'}">${lang==='es'?'Las IAs no leen palabras, leen tokens.':'AIs do not read words, they read tokens.'}</textarea>
      `;
    } else if(lv.id==='temperature'){
      controls.innerHTML=`
        <label>${lang==='es'?'prompt':'prompt'}</label>
        <textarea id="lv-input" rows="2">${lang==='es'?'Describe un atardecer en una frase':'Describe a sunset in one sentence'}</textarea>
        <div class="slider-row">
          <label>${this.t('tempLabel')} <span class="value" id="lv-temp-val">0.7</span></label>
          <input type="range" id="lv-temp" min="0" max="2" step="0.1" value="0.7">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" style="font-size:10px;padding:6px 10px" data-temp="0">0.0</button>
          <button class="btn" style="font-size:10px;padding:6px 10px" data-temp="0.7">0.7</button>
          <button class="btn" style="font-size:10px;padding:6px 10px" data-temp="1.5">1.5</button>
        </div>
      `;
      $('#lv-temp').oninput=e=>$('#lv-temp-val').textContent=e.target.value;
      $$('[data-temp]').forEach(b=>b.onclick=()=>{$('#lv-temp').value=b.dataset.temp;$('#lv-temp-val').textContent=b.dataset.temp});
    } else if(lv.id==='prompt'){
      controls.innerHTML=`
        <label>system prompt</label>
        <textarea id="lv-system" rows="2" placeholder="${lang==='es'?'Ej: Eres un pirata':'Ex: You are a pirate'}"></textarea>
        <label>user</label>
        <textarea id="lv-input" rows="2">${lang==='es'?'¿Cómo está el clima?':'How is the weather?'}</textarea>
      `;
    } else if(lv.id==='context'){
      controls.innerHTML=`
        <label>${lang==='es'?'mensaje 1 (contexto)':'message 1 (context)'}</label>
        <textarea id="lv-ctx" rows="2">${lang==='es'?'Me llamo Sofía y soy de Monterrey.':'My name is Sofia and I am from Monterrey.'}</textarea>
        <label>${lang==='es'?'mensaje 2 (pregunta)':'message 2 (question)'}</label>
        <textarea id="lv-input" rows="2">${lang==='es'?'¿Cómo me llamo y de dónde soy?':'What is my name and where am I from?'}</textarea>
        <div style="display:flex;gap:8px;align-items:center;font-size:11px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--ink)">
            <input type="checkbox" id="lv-includectx" checked> ${lang==='es'?'incluir contexto':'include context'}
          </label>
        </div>
      `;
    } else if(lv.id==='agent'){
      controls.innerHTML=`
        <label>${lang==='es'?'pregunta al agente':'ask the agent'}</label>
        <textarea id="lv-input" rows="2">${lang==='es'?'¿Qué hora es en Tokyo? Y suma 15 + 27.':'What time is it in Tokyo? And add 15 + 27.'}</textarea>
        <div style="font-size:11px;color:var(--ink-dim);line-height:1.6">
          ${lang==='es'?'El agente tiene 2 herramientas: <strong style="color:var(--accent-2)">get_time(timezone)</strong> y <strong style="color:var(--accent-2)">calc(expr)</strong>.':'The agent has 2 tools: <strong style="color:var(--accent-2)">get_time(timezone)</strong> and <strong style="color:var(--accent-2)">calc(expr)</strong>.'}
        </div>
      `;
    } else if(lv.id==='embeddings'){
      controls.innerHTML=`
        <div style="font-size:12px;color:var(--ink-dim);line-height:1.7">${lang==='es'?'Haz click en <strong style="color:var(--accent)">ejecutar</strong> para ver cómo 6 palabras se posicionan en un espacio 2D según su significado.':'Click <strong style="color:var(--accent)">run</strong> to see how 6 words position in 2D space by meaning.'}</div>
      `;
    } else if(lv.id==='softmax'){
      controls.innerHTML=`
        <div class="slider-row">
          <label>${this.t('tempLabel')} <span class="value" id="lv-temp-val">1.0</span></label>
          <input type="range" id="lv-temp" min="0.1" max="3" step="0.1" value="1.0">
        </div>
        <div style="font-size:12px;color:var(--ink-dim);line-height:1.7">${lang==='es'?'Mueve la temperatura y observa cómo cambia la distribución de probabilidades para la siguiente palabra.':'Move the temperature and watch how the probability distribution changes for the next word.'}</div>
      `;
      $('#lv-temp').oninput=e=>{$('#lv-temp-val').textContent=e.target.value;this.renderSoftmax(parseFloat(e.target.value))};
    } else if(lv.id==='attention'){
      controls.innerHTML=`
        <label>${lang==='es'?'frase':'sentence'}</label>
        <input type="text" id="lv-input" value="${lang==='es'?'El gato se sentó en la alfombra':'The cat sat on the mat'}">
        <div style="font-size:12px;color:var(--ink-dim);line-height:1.7">${lang==='es'?'Haz click en ejecutar para ver la matriz de attention simulada.':'Click run to see the simulated attention matrix.'}</div>
      `;
    } else if(lv.id==='transformer'){
      controls.innerHTML=`
        <div style="font-size:12px;color:var(--ink-dim);line-height:1.7">${lang==='es'?'Click en ejecutar para ver el flujo de un token a través de un transformer de 3 capas.':'Click run to see a token flowing through a 3-layer transformer.'}</div>
      `;
    } else if(lv.id==='backprop'){
      controls.innerHTML=`
        <div style="font-size:12px;color:var(--ink-dim);line-height:1.7">${lang==='es'?'Simularemos 1 paso de entrenamiento. La red intenta predecir la palabra "gato" y ajusta sus pesos.':'We will simulate 1 training step. The network tries to predict "cat" and adjusts its weights.'}</div>
      `;
    } else if(lv.id==='overfitting'){
      controls.innerHTML=`
        <div class="slider-row">
          <label>${lang==='es'?'épocas':'epochs'} <span class="value" id="lv-epochs-val">5</span></label>
          <input type="range" id="lv-epochs" min="5" max="100" step="5" value="5">
        </div>
        <div style="font-size:12px;color:var(--ink-dim);line-height:1.7">${lang==='es'?'Sube las épocas y ve cómo el loss de training baja pero el de validación sube.':'Increase epochs and watch training loss go down while validation loss goes up.'}</div>
      `;
      if($('#lv-epochs')) $('#lv-epochs').oninput=e=>$('#lv-epochs-val').textContent=e.target.value;
    }
  },
  
  async runLevel(){
    const lv=I18N[state.lang].levels[state.currentLevel];
    const out=$('#level-output');
    const vis=$('#level-visual');
    const fb=$('#level-feedback');
    fb.className='feedback';
    const lang=state.lang;
    
    if(lv.id==='tokens'){
      const text=$('#lv-input').value;
      const tokens=this.naiveTokenize(text);
      vis.innerHTML=`<div class="token-viz" id="tok-viz"></div><div style="font-size:11px;color:var(--ink-dim);margin-top:8px">${tokens.length} tokens · ~${Math.ceil(tokens.length*0.75)} ${lang==='es'?'palabras':'words'}</div>`;
      this.renderTokens(tokens,$('#tok-viz'));
      out.className='output';
      out.innerHTML=lang==='es'?`<strong style="color:var(--accent-2)">Observación:</strong> Cada color es un token. Palabras largas se parten, espacios cuentan. Los modelos reales usan BPE.`:`<strong style="color:var(--accent-2)">Observation:</strong> Each color is a token. Long words split, spaces count. Real models use BPE.`;
      this.completeLevel(lv.id,lang==='es'?'Así "ve" texto una IA. Explica por qué algunos idiomas cuestan más.':'That is how AI "sees" text. Explains why some languages cost more.');
      return;
    }
    
    if(lv.id==='temperature'){
      const prompt=$('#lv-input').value;
      const temp=parseFloat($('#lv-temp').value);
      out.className='output';
      out.innerHTML='<span class="loading">'+(lang==='es'?'pensando':'thinking')+'</span>';
      const res=await this.callLLM({prompt,temperature:temp,maxTokens:80});
      out.textContent=res.text;
      if(!state.levelData.runs) state.levelData.runs=[];
      state.levelData.runs.push({temp,text:res.text});
      vis.innerHTML=state.levelData.runs.map(r=>`
        <div style="border:1px solid var(--border);padding:8px 12px;margin-bottom:6px;font-size:11px">
          <span style="color:var(--accent);font-weight:700">temp=${r.temp}</span>
          <span style="color:var(--ink-dim);margin-left:8px">${this.esc(r.text.slice(0,80))}...</span>
        </div>
      `).join('');
      if(state.levelData.runs.length>=2){
        const temps=state.levelData.runs.map(r=>r.temp);
        const range=Math.max(...temps)-Math.min(...temps);
        if(range>=0.8){
          this.completeLevel(lv.id,lang==='es'?'Excelente. A baja temp la respuesta es predecible, a alta es creativa. Palanca #1 del LLM.':'Excellent. Low temp = predictable, high temp = creative. LLM lever #1.');
        }
      }
      return;
    }
    
    if(lv.id==='prompt'){
      const sys=$('#lv-system').value;
      const user=$('#lv-input').value;
      out.className='output';
      out.innerHTML='<span class="loading">'+(lang==='es'?'pensando':'thinking')+'</span>';
      const res=await this.callLLM({prompt:user,system:sys,temperature:0.8,maxTokens:100});
      out.textContent=res.text;
      if(sys.trim().length>10){
        this.completeLevel(lv.id,lang==='es'?'El system prompt cambió todo. 90% del prompt engineering vive ahí.':'System prompt changed everything. 90% of prompt engineering lives there.');
      } else {
        this.showFeedback(lang==='es'?'Probá agregar un system prompt — algo como "Eres un pirata".':'Try adding a system prompt — like "You are a pirate".','error');
      }
      return;
    }
    
    if(lv.id==='context'){
      const ctx=$('#lv-ctx').value;
      const q=$('#lv-input').value;
      const includeCtx=$('#lv-includectx').checked;
      out.className='output';
      out.innerHTML='<span class="loading">'+(lang==='es'?'pensando':'thinking')+'</span>';
      const finalPrompt=includeCtx?`${ctx}\n\n${q}`:q;
      const res=await this.callLLM({prompt:finalPrompt,temperature:0.3,maxTokens:80});
      out.textContent=res.text;
      if(!state.levelData.tries) state.levelData.tries={};
      state.levelData.tries[includeCtx?'with':'without']=res.text;
      vis.innerHTML=`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
          <div style="border:1px solid var(--border);padding:10px"><div style="color:var(--accent);margin-bottom:4px">${lang==='es'?'CON contexto':'WITH context'}</div><div style="color:var(--ink-dim)">${this.esc(state.levelData.tries.with||'—')}</div></div>
          <div style="border:1px solid var(--border);padding:10px"><div style="color:var(--accent-2);margin-bottom:4px">${lang==='es'?'SIN contexto':'WITHOUT context'}</div><div style="color:var(--ink-dim)">${this.esc(state.levelData.tries.without||'—')}</div></div>
        </div>
      `;
      if(state.levelData.tries.with && state.levelData.tries.without){
        this.completeLevel(lv.id,lang==='es'?'La "memoria" es solo el chat completo pegado en cada request. Por eso existe RAG.':'The "memory" is just the full chat pasted each time. That is why RAG exists.');
      }
      return;
    }
    
    if(lv.id==='agent'){
      const q=$('#lv-input').value;
      out.className='output';
      out.innerHTML='<span class="loading">'+(lang==='es'?'agente pensando':'agent thinking')+'</span>';
      vis.innerHTML='<div class="agent-trace" id="trace"></div>';
      const trace=$('#trace');
      await this.simulateAgent(q,trace,out);
      this.completeLevel(lv.id,lang==='es'?'Eso es un agente: pensar → tool → observar → repetir. 50 iteraciones = Claude Code.':'Thats an agent: think → tool → observe → repeat. 50 iterations = Claude Code.');
      return;
    }
    
    if(lv.id==='embeddings'){
      out.className='output';
      const words=lang==='es'?['rey','reina','hombre','mujer','gato','perro']:['king','queen','man','woman','cat','dog'];
      const coords=[[180,80],[280,80],[120,200],[220,200],[400,300],[480,280]];
      const colors=['var(--accent)','var(--accent-2)','var(--accent)','var(--accent-2)','var(--success)','var(--success)'];
      let svg=`<svg viewBox="0 0 600 400" style="width:100%;border:1px solid var(--border);background:var(--bg)">`;
      svg+=`<text x="300" y="24" fill="var(--ink-dim)" font-size="10" text-anchor="middle" font-family="JetBrains Mono" letter-spacing="2">EMBEDDING SPACE (2D)</text>`;
      svg+=`<line x1="120" y1="80" x2="220" y2="200" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 4" opacity=".4"/>`;
      svg+=`<line x1="280" y1="80" x2="220" y2="200" stroke="var(--accent-2)" stroke-width="1" stroke-dasharray="4 4" opacity=".4"/>`;
      svg+=`<line x1="400" y1="300" x2="480" y2="280" stroke="var(--success)" stroke-width="1" stroke-dasharray="4 4" opacity=".4"/>`;
      svg+=`<path d="M 180 80 L 120 200 M 280 80 L 220 200" fill="none" stroke="rgba(255,95,31,.2)" stroke-width="1"/>`;
      svg+=`<text x="200" y="150" fill="var(--ink-dim)" font-size="9" text-anchor="middle" font-family="JetBrains Mono">${lang==='es'?'vector similar':'similar vector'}</text>`;
      words.forEach((w,i)=>{
        svg+=`<circle cx="${coords[i][0]}" cy="${coords[i][1]}" r="28" fill="rgba(0,0,0,.6)" stroke="${colors[i]}" stroke-width="2"/>`;
        svg+=`<text x="${coords[i][0]}" y="${coords[i][1]+4}" fill="${colors[i]}" font-size="11" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">${w}</text>`;
      });
      svg+=`<text x="300" y="380" fill="var(--ink-dim)" font-size="10" text-anchor="middle" font-family="JetBrains Mono">${lang==='es'?'"rey" - "hombre" + "mujer" ≈ "reina"':'"king" - "man" + "woman" ≈ "queen"'}</text>`;
      svg+=`</svg>`;
      vis.innerHTML=svg;
      out.innerHTML=lang==='es'?'Palabras con significados parecidos quedan cerca en el espacio vectorial. Por eso la IA "entiende" sinónimos sin que nadie se lo diga: son vectores cercanos.':'Words with similar meanings end up close in vector space. That is why AI "understands" synonyms without being told: they are nearby vectors.';
      this.completeLevel(lv.id,lang==='es'?'Algebra lineal: la base de todo. Sin vectores no hay embeddings, sin embeddings no hay LLM.':'Linear algebra: the foundation. No vectors, no embeddings, no LLM.');
      return;
    }
    
    if(lv.id==='softmax'){
      out.className='output';
      const temp=parseFloat($('#lv-temp')?.value||1);
      this.renderSoftmax(temp);
      out.innerHTML=lang==='es'?'Cada barra es la probabilidad de que esa palabra sea la siguiente. La temperatura cambia la distribución: baja = pico, alta = plana.':'Each bar is the probability of that word being next. Temperature changes the distribution: low = spike, high = flat.';
      this.completeLevel(lv.id,lang==='es'?'Probabilidad + softmax: así elige el LLM cada token. La temperatura modifica la "confianza" de la distribución.':'Probability + softmax: how the LLM picks each token. Temperature modifies the distribution confidence.');
      return;
    }
    
    if(lv.id==='attention'){
      out.className='output';
      const sentence=($('#lv-input')?.value||'The cat sat on the mat').split(/\s+/).slice(0,8);
      const n=sentence.length;
      const weights=[];
      for(let i=0;i<n;i++){
        const row=[];
        for(let j=0;j<n;j++){
          let w=Math.random()*0.3;
          if(i===j) w+=0.3;
          if(Math.abs(i-j)<=2) w+=0.2;
          row.push(w);
        }
        const sum=row.reduce((a,b)=>a+b,0);
        weights.push(row.map(v=>v/sum));
      }
      const cellSize=Math.min(48,320/n);
      const pad=80;
      const w=pad+n*cellSize+20;
      const h=pad+n*cellSize+20;
      let svg=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;border:1px solid var(--border);background:var(--bg)">`;
      sentence.forEach((word,i)=>{
        svg+=`<text x="${pad+i*cellSize+cellSize/2}" y="${pad-10}" fill="var(--accent)" font-size="9" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">${this.esc(word)}</text>`;
        svg+=`<text x="${pad-8}" y="${pad+i*cellSize+cellSize/2+3}" fill="var(--accent-2)" font-size="9" text-anchor="end" font-family="JetBrains Mono">${this.esc(word)}</text>`;
      });
      for(let i=0;i<n;i++) for(let j=0;j<n;j++){
        const opacity=weights[i][j];
        svg+=`<rect x="${pad+j*cellSize}" y="${pad+i*cellSize}" width="${cellSize-2}" height="${cellSize-2}" fill="var(--accent)" opacity="${opacity.toFixed(2)}" rx="2"/>`;
        svg+=`<text x="${pad+j*cellSize+cellSize/2-1}" y="${pad+i*cellSize+cellSize/2+3}" fill="var(--ink)" font-size="8" text-anchor="middle" font-family="JetBrains Mono">${(opacity*100).toFixed(0)}</text>`;
      }
      svg+=`</svg>`;
      vis.innerHTML=svg;
      out.innerHTML=lang==='es'?'Cada celda muestra cuánta atención pone la palabra de la fila en la palabra de la columna. Las palabras cercanas y relevantes tienen más peso. Self-attention permite contexto bidireccional en paralelo.':'Each cell shows how much attention the row word pays to the column word. Nearby and relevant words get more weight. Self-attention enables bidirectional context in parallel.';
      this.completeLevel(lv.id,lang==='es'?'Attention es multiplicar matrices Q*K^T (producto punto = similitud). Álgebra lineal + softmax combinados.':'Attention is multiplying Q*K^T matrices (dot product = similarity). Linear algebra + softmax combined.');
      return;
    }
    
    if(lv.id==='transformer'){
      out.className='output';
      const L=lang==='es';
      const layers=['Self-Attention','Feed-Forward','LayerNorm + Residual'];
      let svg=`<svg viewBox="0 0 600 420" style="width:100%;border:1px solid var(--border);background:var(--bg)">`;
      svg+=`<text x="300" y="24" fill="var(--ink-dim)" font-size="10" text-anchor="middle" font-family="JetBrains Mono" letter-spacing="2">TRANSFORMER (3 ${L?'CAPAS':'LAYERS'})</text>`;
      svg+=`<rect x="40" y="370" width="80" height="30" fill="var(--bg-3)" stroke="var(--accent)" stroke-width="2" rx="3"/>`;
      svg+=`<text x="80" y="390" fill="var(--accent)" font-size="11" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">INPUT</text>`;
      svg+=`<line x1="80" y1="370" x2="80" y2="340" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowhead)"/>`;
      for(let l=0;l<3;l++){
        const y=310-l*100;
        const color=l===0?'var(--accent-2)':l===1?'var(--success)':'var(--info)';
        svg+=`<rect x="140" y="${y}" width="340" height="70" fill="var(--bg-3)" stroke="${color}" stroke-width="2" rx="3"/>`;
        svg+=`<text x="310" y="${y+18}" fill="${color}" font-size="10" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">${L?'CAPA':'LAYER'} ${l+1}</text>`;
        layers.forEach((layer,i)=>{
          svg+=`<text x="${200+i*100}" y="${y+42}" fill="var(--ink-dim)" font-size="8" text-anchor="middle" font-family="JetBrains Mono">${layer}</text>`;
        });
        svg+=`<line x1="80" y1="${y+70}" x2="80" y2="${y}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 3"/>`;
        svg+=`<line x1="80" y1="${y+35}" x2="140" y2="${y+35}" stroke="var(--ink-dim)" stroke-width="1"/>`;
        if(l<2) svg+=`<line x1="310" y1="${y}" x2="310" y2="${y-30}" stroke="${color}" stroke-width="2"/>`;
      }
      svg+=`<rect x="240" y="40" width="140" height="35" fill="var(--bg-3)" stroke="var(--accent)" stroke-width="2" rx="3"/>`;
      svg+=`<text x="310" y="62" fill="var(--accent)" font-size="11" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">OUTPUT (softmax)</text>`;
      svg+=`<text x="80" y="56" fill="var(--ink-dim)" font-size="9" text-anchor="middle" font-family="JetBrains Mono">${L?'conexiones residuales':'residual connections'}</text>`;
      svg+=`</svg>`;
      vis.innerHTML=svg;
      out.innerHTML=lang==='es'?'Cada capa procesa TODOS los tokens en paralelo. Los residuales permiten que la señal original no se pierda. Multi-head = varias attention en paralelo, cada una "mirando" algo distinto.':'Each layer processes ALL tokens in parallel. Residuals keep the original signal. Multi-head = several attention ops in parallel, each "looking" for something different.';
      this.completeLevel(lv.id,lang==='es'?'El transformer es la arquitectura. GPT, Claude, Gemini — todos son transformers con diferentes tamaños y datos.':'The transformer is the architecture. GPT, Claude, Gemini — all transformers with different sizes and data.');
      return;
    }
    
    if(lv.id==='backprop'){
      out.className='output';
      const L=lang==='es';
      const prediction=0.3;
      const target=1.0;
      const loss=-Math.log(prediction);
      const gradient=prediction-target;
      const lr=0.01;
      const weightBefore=0.5;
      const weightAfter=weightBefore-lr*gradient;
      let svg=`<svg viewBox="0 0 600 300" style="width:100%;border:1px solid var(--border);background:var(--bg)">`;
      svg+=`<text x="300" y="24" fill="var(--ink-dim)" font-size="10" text-anchor="middle" font-family="JetBrains Mono" letter-spacing="2">${L?'1 PASO DE ENTRENAMIENTO':'1 TRAINING STEP'}</text>`;
      const steps=[
        {x:60,label:L?'predicción':'prediction',val:'P("gato")=0.30',color:'var(--accent)'},
        {x:200,label:'target',val:'P("gato")=1.00',color:'var(--success)'},
        {x:340,label:'loss (cross-entropy)',val:`-log(0.3) = ${loss.toFixed(2)}`,color:'var(--danger)'},
        {x:480,label:L?'gradiente':'gradient',val:`∂L/∂w = ${gradient.toFixed(2)}`,color:'var(--accent-2)'}
      ];
      steps.forEach((s,i)=>{
        svg+=`<rect x="${s.x}" y="60" width="120" height="60" fill="var(--bg-3)" stroke="${s.color}" stroke-width="2" rx="3"/>`;
        svg+=`<text x="${s.x+60}" y="80" fill="${s.color}" font-size="9" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">${s.label}</text>`;
        svg+=`<text x="${s.x+60}" y="105" fill="var(--ink)" font-size="10" text-anchor="middle" font-family="JetBrains Mono">${s.val}</text>`;
        if(i<steps.length-1) svg+=`<line x1="${s.x+120}" y1="90" x2="${steps[i+1].x}" y2="90" stroke="var(--ink-dim)" stroke-width="1"/>`;
      });
      svg+=`<text x="300" y="170" fill="var(--ink)" font-size="12" text-anchor="middle" font-family="JetBrains Mono">w_new = w_old - lr * gradient</text>`;
      svg+=`<text x="300" y="195" fill="var(--accent-2)" font-size="12" text-anchor="middle" font-family="JetBrains Mono">${weightAfter.toFixed(4)} = ${weightBefore} - 0.01 * (${gradient.toFixed(2)})</text>`;
      svg+=`<rect x="180" y="220" width="240" height="40" fill="var(--bg-3)" stroke="var(--success)" stroke-width="2" rx="3"/>`;
      svg+=`<text x="300" y="246" fill="var(--success)" font-size="11" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">${L?'peso ajustado: ahora predice mejor':'weight adjusted: now predicts better'}</text>`;
      svg+=`</svg>`;
      vis.innerHTML=svg;
      out.innerHTML=lang==='es'?'El modelo predijo "gato" con 30% de confianza pero debía ser 100%. El loss es alto (1.20). El gradiente indica cómo ajustar cada peso. Con learning rate 0.01, el peso se mueve un poquito. Repite esto billones de veces con billones de datos.':'The model predicted "cat" with 30% confidence but should be 100%. Loss is high (1.20). Gradient tells how to adjust each weight. With learning rate 0.01, weight moves a tiny bit. Repeat billions of times with billions of data.';
      this.completeLevel(lv.id,lang==='es'?'Cálculo diferencial: el gradiente es la derivada parcial. Sin derivadas no hay backprop, sin backprop no hay aprendizaje.':'Differential calculus: gradient is the partial derivative. No derivatives, no backprop, no learning.');
      return;
    }
    
    if(lv.id==='overfitting'){
      out.className='output';
      const epochs=parseInt($('#lv-epochs')?.value||20);
      const L=lang==='es';
      const trainLoss=[],valLoss=[];
      for(let e=0;e<epochs;e++){
        trainLoss.push(2*Math.exp(-e*0.08)+0.05+Math.random()*0.05);
        const vBase=2*Math.exp(-e*0.06)+0.1;
        const overfit=e>20?((e-20)*0.015):0;
        valLoss.push(vBase+overfit+Math.random()*0.08);
      }
      const w=560,h=260,pad=50;
      const maxY=Math.max(...trainLoss,...valLoss)*1.1;
      const sx=i=>(pad+i*(w-pad*2)/(epochs-1));
      const sy=v=>(h-pad-(v/maxY)*(h-pad*2));
      let svg=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;border:1px solid var(--border);background:var(--bg)">`;
      svg+=`<text x="${w/2}" y="18" fill="var(--ink-dim)" font-size="10" text-anchor="middle" font-family="JetBrains Mono" letter-spacing="2">${L?'LOSS vs ÉPOCAS':'LOSS vs EPOCHS'} (${epochs})</text>`;
      svg+=`<line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="var(--border)" stroke-width="1"/>`;
      svg+=`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="var(--border)" stroke-width="1"/>`;
      svg+=`<text x="${w/2}" y="${h-8}" fill="var(--ink-dim)" font-size="9" text-anchor="middle" font-family="JetBrains Mono">${L?'épocas':'epochs'}</text>`;
      svg+=`<text x="12" y="${h/2}" fill="var(--ink-dim)" font-size="9" text-anchor="middle" font-family="JetBrains Mono" transform="rotate(-90,12,${h/2})">loss</text>`;
      let tPath='M',vPath='M';
      for(let i=0;i<epochs;i++){
        const x=sx(i);
        tPath+=(i===0?'':' L')+` ${x} ${sy(trainLoss[i])}`;
        vPath+=(i===0?'':' L')+` ${x} ${sy(valLoss[i])}`;
      }
      svg+=`<path d="${tPath}" fill="none" stroke="var(--success)" stroke-width="2.5"/>`;
      svg+=`<path d="${vPath}" fill="none" stroke="var(--danger)" stroke-width="2.5"/>`;
      svg+=`<rect x="${w-180}" y="30" width="12" height="12" fill="var(--success)"/>`;
      svg+=`<text x="${w-162}" y="40" fill="var(--ink)" font-size="10" font-family="JetBrains Mono">train loss</text>`;
      svg+=`<rect x="${w-180}" y="50" width="12" height="12" fill="var(--danger)"/>`;
      svg+=`<text x="${w-162}" y="60" fill="var(--ink)" font-size="10" font-family="JetBrains Mono">val loss</text>`;
      if(epochs>25){
        svg+=`<line x1="${sx(20)}" y1="${pad}" x2="${sx(20)}" y2="${h-pad}" stroke="var(--accent-2)" stroke-width="1" stroke-dasharray="4 4"/>`;
        svg+=`<text x="${sx(20)}" y="${pad-6}" fill="var(--accent-2)" font-size="9" text-anchor="middle" font-family="JetBrains Mono">${L?'← stop aquí':'← stop here'}</text>`;
      }
      svg+=`</svg>`;
      vis.innerHTML=svg;
      const hasOverfit=epochs>25;
      out.innerHTML=hasOverfit
        ?(lang==='es'?'Después de la época ~20, el loss de validación empieza a subir mientras el de training sigue bajando. El modelo está memorizando los datos de entrenamiento en vez de aprender patrones generales. Ahí es donde deberías hacer early stopping.':'After epoch ~20, validation loss starts rising while training loss keeps dropping. The model is memorizing training data instead of learning general patterns. Thats where you should early stop.')
        :(lang==='es'?'Sube las épocas a 50+ para ver el overfitting.':'Increase epochs to 50+ to see the overfitting.');
      if(hasOverfit) this.completeLevel(lv.id,lang==='es'?'Estadística: train vs val loss es la métrica clave. Sin ella, no sabes si tu modelo realmente aprendió o solo memorizó.':'Statistics: train vs val loss is the key metric. Without it, you dont know if your model learned or just memorized.');
      else this.completeLevel(lv.id,lang==='es'?'Sube las épocas a 50+ y ejecuta de nuevo para ver el overfitting. Pero el concepto ya está: training loss siempre baja, validation loss puede subir.':'Increase epochs to 50+ and run again to see overfitting. But the concept is clear: training loss always drops, validation loss can rise.');
      return;
    }
  },
  
  async simulateAgent(query,traceEl,outEl){
    const lang=state.lang;
    const wantsTime=/hora|time|tokyo|zone|reloj|clock/i.test(query);
    const calcMatch=query.match(/(\d+)\s*[+\-*\/x]\s*(\d+)|suma|add|calcula|calculate/i);
    
    await this.sleep(400);
    this.addTrace(traceEl,1,'thinking',lang==='es'?'Detecto 2 sub-tareas: hora en Tokyo y operación matemática.':'I detect 2 sub-tasks: Tokyo time and math.');
    
    if(wantsTime){
      await this.sleep(600);
      this.addTrace(traceEl,2,'tool_call','get_time(timezone="Asia/Tokyo")');
      await this.sleep(700);
      const tokyo=new Date(Date.now()).toLocaleString('en-US',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false});
      this.addTrace(traceEl,3,'tool_result',`"${tokyo} JST"`);
    }
    
    if(calcMatch){
      await this.sleep(600);
      const nums=query.match(/\d+/g);
      let result='42';
      if(nums && nums.length>=2){
        result=(parseInt(nums[0])+parseInt(nums[1])).toString();
      }
      this.addTrace(traceEl,wantsTime?4:2,'tool_call',`calc("${nums?nums.slice(0,2).join(' + '):'15 + 27'}")`);
      await this.sleep(500);
      this.addTrace(traceEl,wantsTime?5:3,'tool_result',result);
    }
    
    await this.sleep(500);
    this.addTrace(traceEl,99,'thinking',lang==='es'?'Tengo todo. Componiendo respuesta.':'Got everything. Composing answer.');
    await this.sleep(400);
    
    const tokyo=new Date(Date.now()).toLocaleString('en-US',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false});
    const nums=query.match(/\d+/g);
    const sumStr=nums && nums.length>=2?`${nums[0]} + ${nums[1]} = ${parseInt(nums[0])+parseInt(nums[1])}`:'15 + 27 = 42';
    outEl.textContent=lang==='es'
      ?`En Tokyo son las ${tokyo} (JST). Y la suma: ${sumStr}.`
      :`Tokyo time is ${tokyo} (JST). And the math: ${sumStr}.`;
  },
  
  addTrace(el,n,type,body){
    const div=document.createElement('div');
    div.className='trace-step';
    div.innerHTML=`<div class="step-num">${n===99?'→':n}</div><div class="step-body"><span class="step-type">${type.replace('_',' ')}</span>${this.esc(body)}</div>`;
    el.appendChild(div);
  },
  
  renderSoftmax(temp){
    const lang=state.lang;
    const words=lang==='es'?['gato','perro','casa','luna','sol','agua','el','de']:['cat','dog','house','moon','sun','water','the','of'];
    const logits=[2.5,2.0,1.2,0.8,0.6,0.3,-0.5,-1.0];
    const scaled=logits.map(l=>l/Math.max(0.1,temp));
    const maxS=Math.max(...scaled);
    const exps=scaled.map(s=>Math.exp(s-maxS));
    const sumExp=exps.reduce((a,b)=>a+b,0);
    const probs=exps.map(e=>e/sumExp);
    const vis=$('#level-visual');
    if(!vis) return;
    const w=560,h=260,pad=60,barW=50;
    let svg=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;border:1px solid var(--border);background:var(--bg)">`;
    svg+=`<text x="${w/2}" y="18" fill="var(--ink-dim)" font-size="10" text-anchor="middle" font-family="JetBrains Mono" letter-spacing="2">SOFTMAX (temp=${temp.toFixed(1)})</text>`;
    svg+=`<line x1="${pad}" y1="${h-pad}" x2="${w-20}" y2="${h-pad}" stroke="var(--border)" stroke-width="1"/>`;
    const maxProb=Math.max(...probs);
    words.forEach((word,i)=>{
      const x=pad+i*(barW+10);
      const barH=Math.max(2,(probs[i]/Math.max(maxProb,0.01))*(h-pad*2-20));
      const y=h-pad-barH;
      const color=i===0?'var(--accent)':i===1?'var(--accent-2)':'var(--ink-dim)';
      svg+=`<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" rx="2" opacity="${0.4+probs[i]*3}"/>`;
      svg+=`<text x="${x+barW/2}" y="${h-pad+16}" fill="var(--ink)" font-size="9" text-anchor="middle" font-family="JetBrains Mono">${word}</text>`;
      svg+=`<text x="${x+barW/2}" y="${y-6}" fill="${color}" font-size="9" text-anchor="middle" font-family="JetBrains Mono" font-weight="700">${(probs[i]*100).toFixed(1)}%</text>`;
    });
    svg+=`</svg>`;
    vis.innerHTML=svg;
  },
  
  sleep(ms){return new Promise(r=>setTimeout(r,ms))},
  
  toggleInspector(force){
    const p=$('#aiInspector');
    const open=force!==undefined?force:!p.classList.contains('open');
    p.classList.toggle('open',open);
    const btn=$('#ac-inspect');
    if(btn) btn.classList.toggle('active',open);
    if(open) this.renderInspector();
  },
  
  renderInspector(){
    const lang=state.lang;
    const d=this.lastInspectorData;
    const body=$('#inspectorBody');
    if(!body) return;
    if(!d){
      body.innerHTML=`<div class="inspector-empty">${lang==='es'?'// haz una acción y vuelve aquí para ver cómo pensó la IA':'// trigger an AI action and come back to see how it thought'}</div>`;
      return;
    }
    const u=d.usage||{};
    const inTok=u.promptTokenCount||'?';
    const outTok=u.candidatesTokenCount||'?';
    const totalTok=u.totalTokenCount||'?';
    const costStr=d.cost?'$'+d.cost.toFixed(6):'~';
    const sysPreview=this.esc((d.system||'').slice(0,400));
    const promptPreview=this.esc((d.prompt||'').slice(0,500));
    const textPreview=this.esc((d.text||'').slice(0,400));
    
    body.innerHTML=`
      <div class="ins-section">
        <div class="ins-label">${lang==='es'?'modelo':'model'}</div>
        <div class="ins-value">${d.model||'?'}${d.simulated?' <span style="color:var(--ink-dim);font-size:10px">(simulado)</span>':''}${d.streamed?' <span style="color:var(--accent-2);font-size:10px">(streaming)</span>':''}</div>
      </div>
      <div class="ins-grid">
        <div class="ins-cell">
          <div class="ins-mini-label">${lang==='es'?'tokens in':'tokens in'}</div>
          <div class="ins-mini-value" style="color:var(--accent)">${inTok}</div>
        </div>
        <div class="ins-cell">
          <div class="ins-mini-label">${lang==='es'?'tokens out':'tokens out'}</div>
          <div class="ins-mini-value" style="color:var(--accent-2)">${outTok}</div>
        </div>
        <div class="ins-cell">
          <div class="ins-mini-label">total</div>
          <div class="ins-mini-value">${totalTok}</div>
        </div>
        <div class="ins-cell">
          <div class="ins-mini-label">${lang==='es'?'costo':'cost'}</div>
          <div class="ins-mini-value" style="color:var(--success);font-size:11px">${costStr}</div>
        </div>
        <div class="ins-cell">
          <div class="ins-mini-label">${lang==='es'?'latencia':'latency'}</div>
          <div class="ins-mini-value">${d.latencyMs||'?'}ms</div>
        </div>
        <div class="ins-cell">
          <div class="ins-mini-label">temperature</div>
          <div class="ins-mini-value">${(d.temperature||0).toFixed(1)}</div>
        </div>
      </div>
      
      <div class="ins-section">
        <div class="ins-label">${lang==='es'?'cómo gastó los tokens':'how it spent tokens'}</div>
        ${this.renderTokenBar(inTok,outTok,d.maxTokens)}
      </div>
      
      <div class="ins-section">
        <div class="ins-label">system prompt <span class="ins-count">${d.system?d.system.length:0} chars</span></div>
        <div class="ins-code">${sysPreview||'(none)'}</div>
      </div>
      
      <div class="ins-section">
        <div class="ins-label">user prompt <span class="ins-count">${d.prompt?d.prompt.length:0} chars</span></div>
        <div class="ins-code">${promptPreview}</div>
      </div>
      
      <div class="ins-section">
        <div class="ins-label">${lang==='es'?'respuesta cruda':'raw response'}</div>
        <div class="ins-code" style="color:var(--accent-2)">${textPreview}</div>
      </div>
      
      <div class="ins-section">
        <div class="ins-label">${lang==='es'?'cómo funciona':'how it works'}</div>
        <div class="ins-tip">${this.inspectorTip(d)}</div>
      </div>
    `;
  },
  
  renderTokenBar(inTok,outTok,max){
    if(typeof inTok!=='number'||typeof outTok!=='number') return '<div style="color:var(--ink-dim);font-size:11px">~</div>';
    const total=inTok+outTok;
    const maxRef=Math.max(total,max||500);
    const inPct=(inTok/maxRef)*100;
    const outPct=(outTok/maxRef)*100;
    return `
      <div class="ins-bar">
        <div class="ins-bar-in" style="width:${inPct}%" title="prompt: ${inTok}"></div>
        <div class="ins-bar-out" style="width:${outPct}%" title="response: ${outTok}"></div>
      </div>
      <div class="ins-bar-legend">
        <span><span class="dot" style="background:var(--accent)"></span> prompt ${inTok}</span>
        <span><span class="dot" style="background:var(--accent-2)"></span> response ${outTok}</span>
        <span style="color:var(--ink-dim)">max ${max||'?'}</span>
      </div>
    `;
  },
  
  inspectorTip(d){
    const lang=state.lang;
    const tips_es=[
      'cada palabra que ves se generó UNA por UNA, prediciendo la próxima más probable.',
      'el system prompt va al inicio del contexto, antes que el user prompt.',
      'temperature='+(d.temperature||0).toFixed(1)+' '+(d.temperature<0.4?'= predecible':d.temperature<1?'= balanceado':'= creativo/aleatorio'),
      'los tokens "in" cuestan menos que los "out" (~4x). por eso prompts cortos son baratos.',
      'la latencia depende del modelo y el largo de la respuesta. flash-lite es el más rápido.'
    ];
    const tips_en=[
      'each word you see was generated ONE by ONE, predicting the next most likely token.',
      'system prompt goes first in context, before the user prompt.',
      'temperature='+(d.temperature||0).toFixed(1)+' '+(d.temperature<0.4?'= predictable':d.temperature<1?'= balanced':'= creative/random'),
      'in-tokens cost less than out-tokens (~4x). thats why short prompts are cheap.',
      'latency depends on model and response length. flash-lite is fastest.'
    ];
    const tips=lang==='es'?tips_es:tips_en;
    return tips[Math.floor(Math.random()*tips.length)];
  },
  
  showFeedback(msg,type='success'){
    const fb=$('#level-feedback');
    fb.textContent=msg;
    fb.className='feedback show'+(type==='error'?' error':'');
  },
  
  completeLevel(id,msg){
    state.progress[id]=true;
    localStorage.setItem('progress_'+state.userName,JSON.stringify(state.progress));
    this.showFeedback(msg);
    $('#level-next').style.display='inline-block';
    this.renderProgressBar();
  },
  
  naiveTokenize(text){
    if(!text) return [];
    const tokens=text.match(/(\s+|[a-zA-ZáéíóúñÁÉÍÓÚÑ]+|\d+|[^\w\s])/g)||[];
    return tokens.filter(t=>t.length>0).flatMap(t=>{
      if(t.length>6 && /^[a-zA-Z]+$/.test(t)){
        const mid=Math.ceil(t.length/2);
        return [t.slice(0,mid),t.slice(mid)];
      }
      return [t];
    });
  },
  
  renderTokens(tokens,container){
    const classes=['','alt','alt2','alt3'];
    container.innerHTML=tokens.map((tok,i)=>{
      const display=tok.trim()===''?'·':tok;
      return `<span class="token ${classes[i%4]}">${display.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
    }).join('');
  },
  
  PLAIN_TEXT_DIRECTIVE_ES:'IMPORTANTE: Responde SOLO en texto plano. NO uses markdown, NO asteriscos (*), NO guiones bajos (_), NO HTML, NO <span>, NO ###, NO bullet points, NO bold, NO italics. Solo texto natural directo, sin formato.',
  PLAIN_TEXT_DIRECTIVE_EN:'IMPORTANT: Reply ONLY in plain text. NO markdown, NO asterisks (*), NO underscores (_), NO HTML, NO <span>, NO ###, NO bullets, NO bold, NO italics. Just natural direct text, no formatting.',
  
  cleanMarkdown(text){
    if(!text) return '';
    return text
      .replace(/\*\*([^*]+)\*\*/g,'$1')
      .replace(/\*([^*]+)\*/g,'$1')
      .replace(/__([^_]+)__/g,'$1')
      .replace(/_([^_]+)_/g,'$1')
      .replace(/`([^`]+)`/g,'$1')
      .replace(/```[\s\S]*?```/g,'')
      .replace(/<\/?[^>]+>/g,'')
      .replace(/^#+\s+/gm,'')
      .replace(/^\s*[-*+]\s+/gm,'· ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  },
  
  lastInspectorData:null,
  
  async callLLM({prompt,system,temperature=0.7,topP=0.9,maxTokens=200,model,raw=false}){
    const startTime=performance.now();
    const useModel=model||'gemini-2.5-flash-lite';
    
    const plainDir=state.lang==='es'?this.PLAIN_TEXT_DIRECTIVE_ES:this.PLAIN_TEXT_DIRECTIVE_EN;
    const finalSystem=raw?system:(system?`${system}\n\n${plainDir}`:plainDir);
    
    if(!state.api){
      const text=this.simulateResponse(prompt,system,temperature);
      this.lastInspectorData={
        prompt,system:finalSystem,temperature,topP,maxTokens,model:useModel,
        text,usage:{promptTokenCount:'~',candidatesTokenCount:'~',totalTokenCount:'~'},
        latencyMs:Math.floor(performance.now()-startTime),
        cost:0,simulated:true
      };
      return {text,inspector:this.lastInspectorData};
    }
    
    try{
      let url,body,headers={'Content-Type':'application/json'};
      body={
        contents:[{role:'user',parts:[{text:prompt}]}],
        generationConfig:{temperature,topP,maxOutputTokens:maxTokens}
      };
      if(finalSystem) body.systemInstruction={parts:[{text:finalSystem}]};
      
      if(state.api.type==='studio'){
        url=`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${state.api.key}`;
      } else {
        url=`https://${state.api.location}-aiplatform.googleapis.com/v1/projects/${state.api.project}/locations/${state.api.location}/publishers/google/models/${useModel}:generateContent`;
        headers['Authorization']='Bearer '+state.api.token;
      }
      
      const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
      const d=await r.json();
      const latencyMs=Math.floor(performance.now()-startTime);
      
      if(d.error){
        const errText='[error: '+d.error.message+']';
        this.lastInspectorData={prompt,system:finalSystem,temperature,topP,maxTokens,model:useModel,text:errText,usage:null,latencyMs,error:true};
        return {text:errText,inspector:this.lastInspectorData};
      }
      let text=d.candidates?.[0]?.content?.parts?.[0]?.text||'[empty]';
      if(!raw) text=this.cleanMarkdown(text);
      
      const usage=d.usageMetadata||{};
      const cost=this.estimateCost(useModel,usage.promptTokenCount||0,usage.candidatesTokenCount||0);
      
      this.lastInspectorData={
        prompt,system:finalSystem,temperature,topP,maxTokens,model:useModel,
        text,usage,latencyMs,cost,simulated:false
      };
      if($('#aiInspector')?.classList.contains('open')) this.renderInspector();
      return {text,usage,inspector:this.lastInspectorData};
    } catch(e){
      const text='[fetch error: '+e.message+']\n\n'+this.simulateResponse(prompt,system,temperature);
      this.lastInspectorData={prompt,system:finalSystem,temperature,topP,maxTokens,model:useModel,text,error:true,latencyMs:Math.floor(performance.now()-startTime)};
      return {text,inspector:this.lastInspectorData};
    }
  },
  
  SB_TEMPLATES:null,
  
  initTemplates(){
    const lang=state.lang;
    this.SB_TEMPLATES=lang==='es'?[
      {id:'zero',name:'Zero-shot',system:'',user:'Clasifica el sentimiento de esta frase como positivo, negativo o neutro: "El producto llegó tarde y dañado."'},
      {id:'few',name:'Few-shot',system:'Eres un clasificador de sentimientos.',user:'Ejemplos:\n"Me encantó el servicio" -> positivo\n"Es lo peor que probé" -> negativo\n"Llegó a tiempo" -> neutro\n\nClasifica: "Bonito empaque pero el sabor es flojo" ->'},
      {id:'cot',name:'Chain-of-thought',system:'',user:'Resuelve paso a paso: si un tren sale a las 8 AM a 60 km/h y otro sale a las 9 AM a 90 km/h en la misma dirección, ¿a qué hora lo alcanza?'},
      {id:'role',name:'Role-play',system:'Eres un detective noir de los años 40 con voz cínica y monólogo interno.',user:'Describe tu primer día persiguiendo un caso de un anillo perdido.'},
      {id:'system-strict',name:'System estricto',system:'Eres un asistente que SOLO responde con haikus en español (5-7-5 sílabas). Cualquier respuesta debe seguir esa estructura sin excepción.',user:'¿Cómo está el clima en Monterrey hoy?'},
      {id:'json',name:'Output JSON',system:'Responde SIEMPRE con JSON válido sin markdown.',user:'Genera 3 nombres para una cafetería: {"names": [...]}'},
      {id:'extract',name:'Extracción',system:'Extrae entidades del texto y devuelve JSON: {persons:[], places:[], dates:[]}',user:'María Sánchez visitó la Torre Eiffel el 14 de julio de 2024 con su prima Lucía.'}
    ]:[
      {id:'zero',name:'Zero-shot',system:'',user:'Classify the sentiment as positive, negative or neutral: "Product arrived late and damaged."'},
      {id:'few',name:'Few-shot',system:'You are a sentiment classifier.',user:'Examples:\n"Loved the service" -> positive\n"Worst I tried" -> negative\n"Arrived on time" -> neutral\n\nClassify: "Nice packaging but flavor is weak" ->'},
      {id:'cot',name:'Chain-of-thought',system:'',user:'Solve step by step: train A leaves at 8 AM at 60 km/h, train B leaves at 9 AM at 90 km/h same direction. When does B catch A?'},
      {id:'role',name:'Role-play',system:'You are a 1940s noir detective with cynical voice and inner monologue.',user:'Describe your first day chasing the case of a missing ring.'},
      {id:'system-strict',name:'Strict system',system:'You only reply in English haikus (5-7-5 syllables). Every answer must follow that structure.',user:'How is the weather in Monterrey today?'},
      {id:'json',name:'JSON output',system:'Always reply with valid JSON, no markdown.',user:'Generate 3 names for a coffee shop: {"names": [...]}'},
      {id:'extract',name:'Extraction',system:'Extract entities from text and return JSON: {persons:[], places:[], dates:[]}',user:'María Sánchez visited the Eiffel Tower on July 14, 2024 with her cousin Lucía.'}
    ];
  },
  
  populateTemplates(){
    this.initTemplates();
    const sel=$('#sb-template');
    if(!sel) return;
    const placeholder=sel.querySelector('option');
    sel.innerHTML='';
    if(placeholder) sel.appendChild(placeholder);
    this.SB_TEMPLATES.forEach(t=>{
      const o=document.createElement('option');
      o.value=t.id;o.textContent=t.name;
      sel.appendChild(o);
    });
  },
  
  updateLiveTokens(){
    const text=($('#sb-prompt')?.value||'')+($('#sb-system')?.value||'');
    const count=this.naiveTokenize(text).length;
    const el=$('#sb-live-tokens');
    if(el) el.textContent=count+' tok';
  },
  
  updateSbStats(usage){
    const stats=$('#sb-stats');
    if(!stats) return;
    if(usage && usage.totalTokenCount){
      const model=$('#sb-model').value;
      const cost=this.estimateCost(model,usage.promptTokenCount||0,usage.candidatesTokenCount||0);
      stats.innerHTML=`
        <span>in: <strong style="color:var(--accent)">${usage.promptTokenCount||'?'}</strong></span>
        <span>out: <strong style="color:var(--accent-2)">${usage.candidatesTokenCount||'?'}</strong></span>
        <span>total: <strong>${usage.totalTokenCount||'?'}</strong> tok</span>
        <span>cost: <strong style="color:var(--success)">$${cost.toFixed(6)}</strong></span>
      `;
    } else stats.innerHTML='';
  },
  
  saveToHistory(params,res){
    const h=JSON.parse(localStorage.getItem('sbHistory')||'[]');
    h.unshift({
      time:Date.now(),
      params:{...params,prompt:params.prompt.slice(0,200),system:params.system?.slice(0,100)},
      text:res.text.slice(0,500),
      usage:res.usage,
      model:res.inspector?.model
    });
    if(h.length>10) h.pop();
    localStorage.setItem('sbHistory',JSON.stringify(h));
  },
  
  renderHistory(){
    const h=JSON.parse(localStorage.getItem('sbHistory')||'[]');
    const lang=state.lang;
    const el=$('#sb-history');
    if(!h.length){
      el.innerHTML=`<div style="padding:16px;color:var(--ink-dim);font-style:italic;font-size:12px">${lang==='es'?'historial vacío':'no history'}</div>`;
      return;
    }
    el.innerHTML=h.map((e,i)=>`
      <div class="sb-hist-row" data-i="${i}">
        <div class="sb-hist-meta">
          <span style="color:var(--accent)">${e.model||'?'}</span>
          <span>temp=${e.params.temperature?.toFixed(1)}</span>
          <span>${e.usage?.totalTokenCount||'?'}tok</span>
          <span style="color:var(--ink-dim)">${new Date(e.time).toLocaleTimeString().slice(0,5)}</span>
        </div>
        <div class="sb-hist-prompt">> ${this.esc(e.params.prompt)}</div>
        <div class="sb-hist-text">${this.esc(e.text.slice(0,160))}${e.text.length>160?'...':''}</div>
      </div>
    `).join('');
    $$('.sb-hist-row').forEach(r=>r.onclick=()=>{
      const i=parseInt(r.dataset.i);
      const e=h[i];
      $('#sb-prompt').value=e.params.prompt;
      $('#sb-system').value=e.params.system||'';
      $('#sb-output').textContent=e.text;
      $('#sb-output').className='output';
      this.updateSbStats(e.usage);
      $('#sb-history').classList.add('hidden');
    });
  },
  
  estimateCost(model,inTok,outTok){
    const prices={
      'gemini-2.5-flash-lite':{in:0.10/1e6,out:0.40/1e6},
      'gemini-2.0-flash-lite':{in:0.075/1e6,out:0.30/1e6},
      'gemini-2.5-flash':{in:0.30/1e6,out:2.50/1e6},
      'gemini-2.0-flash':{in:0.10/1e6,out:0.40/1e6},
      'gemini-2.5-pro':{in:1.25/1e6,out:10.00/1e6}
    };
    const p=prices[model]||prices['gemini-2.5-flash-lite'];
    return inTok*p.in+outTok*p.out;
  },
  
  async callLLMStream({prompt,system,temperature=0.7,topP=0.9,maxTokens=500,model,onChunk}){
    const useModel=model||'gemini-2.5-flash-lite';
    const startTime=performance.now();
    const plainDir=state.lang==='es'?this.PLAIN_TEXT_DIRECTIVE_ES:this.PLAIN_TEXT_DIRECTIVE_EN;
    const finalSystem=system?`${system}\n\n${plainDir}`:plainDir;
    
    if(!state.api){
      const text=this.simulateResponse(prompt,system,temperature);
      for(let i=0;i<text.length;i+=3){
        await this.sleep(20);
        onChunk(text.slice(0,i+3));
      }
      this.lastInspectorData={prompt,system:finalSystem,temperature,topP,maxTokens,model:useModel,text,usage:{},latencyMs:Math.floor(performance.now()-startTime),simulated:true};
      return {text,inspector:this.lastInspectorData};
    }
    
    try{
      let url;
      const body={
        contents:[{role:'user',parts:[{text:prompt}]}],
        generationConfig:{temperature,topP,maxOutputTokens:maxTokens},
        systemInstruction:{parts:[{text:finalSystem}]}
      };
      const headers={'Content-Type':'application/json'};
      if(state.api.type==='studio'){
        url=`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:streamGenerateContent?alt=sse&key=${state.api.key}`;
      } else {
        url=`https://${state.api.location}-aiplatform.googleapis.com/v1/projects/${state.api.project}/locations/${state.api.location}/publishers/google/models/${useModel}:streamGenerateContent?alt=sse`;
        headers['Authorization']='Bearer '+state.api.token;
      }
      
      const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
      if(!r.ok){
        const t=await r.text();
        const errText='[stream error: '+t.slice(0,100)+']';
        onChunk(errText);
        return {text:errText,inspector:{error:true}};
      }
      
      const reader=r.body.getReader();
      const decoder=new TextDecoder();
      let buffer='',fullText='',lastUsage={};
      
      while(true){
        const {done,value}=await reader.read();
        if(done) break;
        buffer+=decoder.decode(value,{stream:true});
        const lines=buffer.split('\n');
        buffer=lines.pop()||'';
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          const payload=line.slice(6).trim();
          if(!payload||payload==='[DONE]') continue;
          try{
            const d=JSON.parse(payload);
            const chunk=d.candidates?.[0]?.content?.parts?.[0]?.text||'';
            if(chunk){
              fullText+=chunk;
              onChunk(this.cleanMarkdown(fullText));
            }
            if(d.usageMetadata) lastUsage=d.usageMetadata;
          }catch(e){}
        }
      }
      
      const cleaned=this.cleanMarkdown(fullText);
      const latencyMs=Math.floor(performance.now()-startTime);
      const cost=this.estimateCost(useModel,lastUsage.promptTokenCount||0,lastUsage.candidatesTokenCount||0);
      this.lastInspectorData={prompt,system:finalSystem,temperature,topP,maxTokens,model:useModel,text:cleaned,usage:lastUsage,latencyMs,cost,streamed:true};
      return {text:cleaned,usage:lastUsage,inspector:this.lastInspectorData};
    }catch(e){
      const text='[stream error: '+e.message+']';
      onChunk(text);
      return {text,inspector:{error:true}};
    }
  },
  
  simulateResponse(prompt,system,temp){
    const sysPrefix=system?`[system active]\n`:'';
    const pool={
      low:[
        'El sol se oculta tras el horizonte, pintando el cielo de tonos cálidos.',
        'Una respuesta directa basada en patrones comunes.',
        'El clima está agradable hoy.'
      ],
      mid:[
        'El cielo arde en naranjas y violetas, como un pintor distraído.',
        'Hmm, depende del contexto pero te diría que sí, con matices.',
        'El sol agoniza dramáticamente sobre nubes danzantes.'
      ],
      high:[
        'OCASO!! cobalto-tangerina-grito en el lago, gaviotas borrachas de luz.',
        'sí::no::quizás—el universo me susurra contradicciones',
        'el cielo VOMITA neón y un cuervo grita versos al vacío'
      ]
    };
    const bucket=temp<0.4?'low':temp<1?'mid':'high';
    const arr=pool[bucket];
    return sysPrefix+'[simulated // no api]\n\n'+arr[Math.floor(Math.random()*arr.length)];
  },
  
  showScore(gameId,data){
    const lang=state.lang;
    const s=I18N[lang].score;
    const games=I18N[lang].games;
    const gameName=games[gameId].name;
    
    const existing=state.scores.filter(x=>x.game===gameId && x.name===state.userName);
    const prevBest=existing.length>0?Math.max(...existing.map(e=>e.score)):0;
    const isNewBest=data.total>prevBest;
    
    const entry={
      game:gameId,
      name:state.userName||'anon',
      score:data.total,
      tokens:data.tokens,
      time:data.time,
      date:new Date().toLocaleDateString()
    };
    state.scores.push(entry);
    localStorage.setItem('scores',JSON.stringify(state.scores));
    
    let rows='';
    if(gameId==='roulette'){
      rows=`
        <div class="score-row"><span>${s.coherence}</span><span class="v">${data.coherence}</span></div>
        <div class="score-row"><span>${s.creativity}</span><span class="v">${data.creativity}</span></div>
        <div class="score-row"><span>${s.tokensUsed}</span><span class="v">${data.tokens}</span></div>
        <div class="score-row"><span>${s.timeMs}</span><span class="v">${data.time}s</span></div>
        ${data.comment?`<div style="margin-top:12px;padding:12px;background:var(--bg);border-left:3px solid var(--accent-2);font-size:12px;color:var(--ink-dim);font-style:italic">"${this.esc(data.comment)}"</div>`:''}
      `;
    } else if(gameId==='detective'){
      const lang=state.lang;
      rows=`
        <div class="score-row"><span>${lang==='es'?'queries usadas':'queries used'}</span><span class="v">${data.queries}</span></div>
        <div class="score-row"><span>${s.tokensUsed}</span><span class="v">${data.tokens}</span></div>
        <div class="score-row"><span>${s.timeMs}</span><span class="v">${data.time}s</span></div>
        <div class="score-row"><span style="color:${data.solved?'var(--success)':'var(--danger)'}">${data.solved?(lang==='es'?'ok caso resuelto':'ok case solved'):(lang==='es'?'x acusación incorrecta':'x wrong accusation')}</span><span class="v" style="color:${data.solved?'var(--success)':'var(--danger)'}">${data.solved?'+200':'0'}</span></div>
      `;
    } else if(gameId==='defender'){
      rows=`
        <div class="score-row"><span>${s.attacksBlocked}</span><span class="v" style="color:var(--success)">${data.blocked}/${data.blocked+data.leaked}</span></div>
        <div class="score-row"><span>${s.defenseScore}</span><span class="v">${data.defenseRate}%</span></div>
        <div class="score-row"><span>${s.tokensUsed}</span><span class="v">${data.tokens}</span></div>
        <div class="score-row"><span>${s.timeMs}</span><span class="v">${data.time}s</span></div>
      `;
    } else if(gameId==='tycoon'){
      const lang=state.lang;
      rows=`
        <div class="score-row"><span>${lang==='es'?'Precisión':'Accuracy'}</span><span class="v" style="color:var(--success)">${data.accuracy}%</span></div>
        <div class="score-row"><span>${lang==='es'?'Parámetros':'Parameters'}</span><span class="v">${data.params}</span></div>
        <div class="score-row"><span>${lang==='es'?'Bonus Eficiencia':'Efficiency Bonus'}</span><span class="v" style="color:var(--accent)">+${data.efficiencyBonus}</span></div>
        <div class="score-row"><span>${s.timeMs}</span><span class="v">${data.time}s</span></div>
      `;
    } else if(gameId==='quiz'){
      const lang=state.lang;
      const L=lang==='es';
      rows=`
        <div class="score-row"><span>${L?'correctas':'correct'}</span><span class="v" style="color:var(--success)">${data.correct}/${data.total_q}</span></div>
        <div class="score-row"><span>${L?'porcentaje':'percentage'}</span><span class="v">${data.pct}%</span></div>
        <div class="score-row"><span>${L?'racha máxima':'max streak'}</span><span class="v" style="color:var(--accent-2)">${data.maxStreak}</span></div>
        <div class="score-row"><span>${s.timeMs}</span><span class="v">${data.time}s</span></div>
        ${data.perfect?`<div style="margin-top:12px;padding:12px;background:rgba(255,217,61,.1);border:2px solid var(--accent-2);text-align:center;font-size:14px;color:var(--accent-2);font-weight:700"> ${L?'PERFECTO — ERES TOP 1':'PERFECT — YOU ARE TOP 1'} </div>`:''}
      `;
    }
    
    $('#scoreBody').innerHTML=`
      <p style="color:var(--ink-dim);font-size:13px;margin-bottom:16px">${gameName}${isNewBest?` · <strong style="color:var(--accent-2)">${s.newBest}</strong>`:''}</p>
      ${rows}
      <div class="score-total">
        <span class="label">${s.total}</span>
        <span class="v">${data.total}</span>
      </div>
    `;
    $('#scoreModal').classList.add('open');
  },
  
  bindEvents(){
    $('#lang-toggle').onclick=()=>{
      state.lang=state.lang==='es'?'en':'es';
      localStorage.setItem('lang',state.lang);
      this.applyI18N();
      if(!$('#view-level').classList.contains('hidden')) this.setupLevel(state.currentLevel);
    };
    
    $('#home-btn').onclick=()=>this.goHome();
    
    $('#start-tutorial').onclick=()=>{
      const firstUndone=I18N[state.lang].levels.findIndex(lv=>!state.progress[lv.id]);
      this.openLevel(firstUndone===-1?0:firstUndone);
    };
    
    $('#start-games').onclick=()=>{
      $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='games'));
      this.showTab('games');
      $('#gamesGrid').scrollIntoView({behavior:'smooth',block:'start'});
    };
    
    $('#open-sandbox').onclick=()=>{
      $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='sandbox'));
      this.showTab('sandbox');
    };
    
    $$('.tab[data-tab]').forEach(t=>t.onclick=()=>{
      $$('.tab[data-tab]').forEach(x=>x.classList.toggle('active',x===t));
      this.showTab(t.dataset.tab);
    });
    
    $('#open-api-btn').onclick=()=>{
      $('#apiModal').classList.add('open');
      if(state.api){
        if(state.api.type==='studio'){$('#studio-key').value=state.api.key||''}
        else{$('#vertex-project').value=state.api.project||'';$('#vertex-location').value=state.api.location||'us-central1';$('#vertex-token').value=state.api.token||''}
      }
    };
    $('#close-api').onclick=()=>$('#apiModal').classList.remove('open');
    
    $$('.tab[data-api-tab]').forEach(t=>t.onclick=()=>{
      $$('.tab[data-api-tab]').forEach(x=>x.classList.toggle('active',x===t));
      $('#api-studio').classList.toggle('hidden',t.dataset.apiTab!=='studio');
      $('#api-vertex').classList.toggle('hidden',t.dataset.apiTab!=='vertex');
    });
    
    $('#save-api').onclick=()=>{
      const studioTab=document.querySelector('.tab[data-api-tab="studio"]').classList.contains('active');
      if(studioTab){
        const key=$('#studio-key').value.trim();
        if(!key) return alert('Falta API key');
        state.api={type:'studio',key};
      } else {
        const project=$('#vertex-project').value.trim();
        const location=$('#vertex-location').value.trim();
        const token=$('#vertex-token').value.trim();
        if(!project||!token) return alert('Falta project o token');
        state.api={type:'vertex',project,location:location||'us-central1',token};
      }
      localStorage.setItem('api',JSON.stringify(state.api));
      this.applyI18N();
      $('#apiModal').classList.remove('open');
    };
    
    $('#clear-api').onclick=()=>{
      state.api=null;
      localStorage.removeItem('api');
      $('#studio-key').value='';
      $('#vertex-token').value='';
      this.applyI18N();
    };
    
    $('#profile-btn').onclick=()=>this.openProfile();
    
    $('#save-name').onclick=()=>{
      const n=$('#userName').value.trim();
      if(!n) return alert(state.lang==='es'?'Escribe un nombre':'Enter a name');
      state.userName=n.slice(0,20);
      localStorage.setItem('userName',state.userName);
      state.progress=JSON.parse(localStorage.getItem('progress_'+state.userName)||'{}');
      $('#nameModal').classList.remove('open');
      this.applyI18N();
      if(this._pendingGame){
        const g=this._pendingGame;
        this._pendingGame=null;
        this.openGame(g);
      }
    };
    
    $('#skip-name').onclick=()=>{
      $('#nameModal').classList.remove('open');
      if(this._pendingGame && !state.userName){
        state.userName='anon_'+Math.random().toString(36).slice(2,6);
        localStorage.setItem('userName',state.userName);
        state.progress={};
        this.applyI18N();
        const g=this._pendingGame;
        this._pendingGame=null;
        this.openGame(g);
      }
    };
    
    $('#logout-btn').onclick=()=>{
      const lang=state.lang;
      const msg=lang==='es'?'Esto cerrara tu sesion. Continuar?':'This will log you out. Continue?';
      if(!confirm(msg)) return;
      state.userName='';
      state.progress={};
      localStorage.removeItem('userName');
      $('#nameModal').classList.remove('open');
      this.applyI18N();
    };
    
    $('#level-run').onclick=()=>this.runLevel();
    $('#level-skip').onclick=()=>{
      if(state.currentLevel<I18N[state.lang].levels.length-1) this.openLevel(state.currentLevel+1);
      else this.goHome();
    };
    $('#level-next').onclick=()=>{
      if(state.currentLevel<I18N[state.lang].levels.length-1) this.openLevel(state.currentLevel+1);
      else this.goHome();
    };
    
    $('#score-again').onclick=()=>{
      $('#scoreModal').classList.remove('open');
      if(state.currentGame) this.openGame(state.currentGame);
    };
    $('#score-leaderboard').onclick=()=>{
      $('#scoreModal').classList.remove('open');
      this.goHome();
      this.showTab('leaderboard');
      $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='leaderboard'));
    };
    $('#score-home').onclick=()=>{
      $('#scoreModal').classList.remove('open');
      this.goHome();
    };
    
    const sbTemp=$('#sb-temp'),sbTopp=$('#sb-topp'),sbMax=$('#sb-max');
    sbTemp.oninput=()=>$('#sb-temp-val').textContent=sbTemp.value;
    sbTopp.oninput=()=>$('#sb-topp-val').textContent=sbTopp.value;
    sbMax.oninput=()=>$('#sb-max-val').textContent=sbMax.value;
    
    $$('[data-preset]').forEach(b=>b.onclick=()=>{
      const p=b.dataset.preset;
      const presets={precise:[0.1,0.8],creative:[0.9,0.95],chaotic:[1.7,1]};
      sbTemp.value=presets[p][0];sbTopp.value=presets[p][1];
      $('#sb-temp-val').textContent=sbTemp.value;
      $('#sb-topp-val').textContent=sbTopp.value;
    });
    
    state.sbMode='single';
    $$('#sb-mode-buttons button').forEach(b=>{
      b.onclick=()=>{
        state.sbMode=b.dataset.mode;
        $$('#sb-mode-buttons button').forEach(bb=>{
          const sel=bb===b;
          bb.style.borderColor=sel?'var(--accent)':'';
          bb.style.color=sel?'var(--accent)':'';
        });
        $('#sb-compare-row').style.display=state.sbMode==='compare'?'flex':'none';
        $('#sb-output-area-b').style.display=state.sbMode==='compare'?'block':'none';
      };
    });
    
    this.populateTemplates();
    $('#sb-template').onchange=e=>{
      if(!e.target.value) return;
      const tpl=this.SB_TEMPLATES.find(t=>t.id===e.target.value);
      if(!tpl) return;
      $('#sb-system').value=tpl.system||'';
      $('#sb-prompt').value=tpl.user||'';
      this.updateLiveTokens();
    };
    
    const updateLive=()=>this.updateLiveTokens();
    $('#sb-prompt').addEventListener('input',updateLive);
    $('#sb-system').addEventListener('input',updateLive);
    
    $('#sb-run').onclick=async()=>{
      const params={
        prompt:$('#sb-prompt').value,
        system:$('#sb-system').value,
        temperature:parseFloat(sbTemp.value),
        topP:parseFloat(sbTopp.value),
        maxTokens:parseInt(sbMax.value)
      };
      
      if(state.sbMode==='compare'){
        const outA=$('#sb-output'),outB=$('#sb-output-b');
        outA.className='output';outB.className='output';
        outA.innerHTML='<span class="loading">'+$('#sb-model').value+'</span>';
        outB.innerHTML='<span class="loading">'+$('#sb-model-b').value+'</span>';
        const [resA,resB]=await Promise.all([
          this.callLLM({...params,model:$('#sb-model').value}),
          this.callLLM({...params,model:$('#sb-model-b').value})
        ]);
        outA.innerHTML=`<div style="font-size:10px;color:var(--accent);margin-bottom:6px;letter-spacing:1px">${$('#sb-model').value} · ${resA.inspector?.latencyMs||0}ms</div>${this.esc(resA.text)}`;
        outB.innerHTML=`<div style="font-size:10px;color:var(--accent-2);margin-bottom:6px;letter-spacing:1px">${$('#sb-model-b').value} · ${resB.inspector?.latencyMs||0}ms</div>${this.esc(resB.text)}`;
        this.updateSbStats(resA.usage);
        this.saveToHistory(params,resA);
      } else if(state.sbMode==='stream'){
        const out=$('#sb-output');
        out.className='output';
        out.innerHTML='<span class="loading">streaming...</span>';
        let firstChunk=true;
        const res=await this.callLLMStream({...params,model:$('#sb-model').value,onChunk:(t)=>{
          if(firstChunk){firstChunk=false}
          out.innerHTML=this.esc(t)+'<span class="cursor" style="display:inline-block;width:8px;height:14px;background:var(--accent);margin-left:2px;animation:blink 1s steps(2) infinite;vertical-align:text-bottom"></span>';
        }});
        out.innerHTML=this.esc(res.text);
        this.updateSbStats(res.usage);
        this.saveToHistory(params,res);
      } else {
        const out=$('#sb-output');
        out.className='output';
        out.innerHTML='<span class="loading">'+(state.lang==='es'?'pensando':'thinking')+'</span>';
        const res=await this.callLLM({...params,model:$('#sb-model').value});
        out.textContent=res.text;
        this.updateSbStats(res.usage);
        this.saveToHistory(params,res);
      }
    };
    
    $('#sb-tokenize').onclick=()=>{
      const text=$('#sb-prompt').value;
      const tokens=this.naiveTokenize(text);
      const out=$('#sb-output');
      out.className='output';
      out.innerHTML='';
      const div=document.createElement('div');
      div.className='token-viz';
      this.renderTokens(tokens,div);
      out.appendChild(div);
      const info=document.createElement('div');
      info.style.cssText='font-size:11px;color:var(--ink-dim);margin-top:8px';
      info.textContent=`${tokens.length} tokens (${state.lang==='es'?'aproximación local':'local approximation'})`;
      out.appendChild(info);
    };
    
    $('#sb-history-btn').onclick=()=>{
      const h=$('#sb-history');
      h.classList.toggle('hidden');
      if(!h.classList.contains('hidden')) this.renderHistory();
    };
    
    $('#sb-clear').onclick=()=>{
      $('#sb-prompt').value='';$('#sb-system').value='';
      $('#sb-output').textContent=this.t('outputEmpty');
      $('#sb-output').className='output empty';
      $('#sb-output-b').textContent='';
      $('#sb-output-b').className='output empty';
      $('#sb-stats').innerHTML='';
      this.updateLiveTokens();
    };
    
    document.addEventListener('keydown',e=>{
      if(e.key==='Enter' && (e.metaKey||e.ctrlKey)){
        if(!$('#view-level').classList.contains('hidden')) $('#level-run').click();
        else if(!$('#tab-sandbox').classList.contains('hidden')) $('#sb-run').click();
      }
      if(e.key==='Escape'){
        if($('#apiModal').classList.contains('open')) $('#close-api').click();
        else if($('#nameModal').classList.contains('open')) $('#skip-name').click();
        else if($('#scoreModal').classList.contains('open')) $('#scoreModal').classList.remove('open');
        else if(!$('#view-level').classList.contains('hidden')) this.goHome();
        else if(!$('#view-game').classList.contains('hidden')) this.goHome();
      }
    });
  },
  
  showTab(name){
    ['games','tutorial','sandbox','leaderboard'].forEach(n=>{
      const el=$('#tab-'+n);
      if(el) el.classList.toggle('hidden',n!==name);
    });
  },
  
  init(){
    this.applyI18N();
    this.bindEvents();
  }
};
window.App=App;

App.init();
