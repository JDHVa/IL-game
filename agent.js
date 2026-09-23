// AGENT FORGE — arma un agente con las herramientas justas y míralo resolver una tarea.
// Enseña: descomposición de tareas, tool-use, el loop think→tool→observe y el costo
// de darle al agente herramientas de más (más contexto = más tokens). 100% determinista,
// no necesita API key — el "agente" es una simulación del loop real.
window.Games = window.Games || {};

Games.agent = {
  state: null,

  // herramientas disponibles. needed=true son las que la tarea realmente requiere.
  TOOLS: [
    { id: 'web_search', es: 'web_search(q)', en: 'web_search(q)', needed: true,
      es_d: 'busca en internet', en_d: 'search the web' },
    { id: 'get_weather', es: 'get_weather(city)', en: 'get_weather(city)', needed: true,
      es_d: 'clima de una ciudad', en_d: 'city weather' },
    { id: 'calc', es: 'calc(expr)', en: 'calc(expr)', needed: true,
      es_d: 'evalúa matemáticas', en_d: 'evaluate math' },
    { id: 'get_time', es: 'get_time(tz)', en: 'get_time(tz)', needed: false,
      es_d: 'hora por zona', en_d: 'time by zone' },
    { id: 'translate', es: 'translate(text)', en: 'translate(text)', needed: false,
      es_d: 'traduce texto', en_d: 'translate text' },
    { id: 'send_email', es: 'send_email(to)', en: 'send_email(to)', needed: false,
      es_d: 'envía un correo', en_d: 'send an email' }
  ],

  // subtareas que componen la misión (cada una necesita una herramienta concreta).
  SUBTASKS: [
    { tool: 'web_search', es: 'encontrar un restaurante italiano', en: 'find an italian restaurant',
      call: 'web_search("restaurante italiano cerca, abierto hoy")',
      obs_es: 'Trattoria Lucia · 4.6★ · abierto hasta 23:00',
      obs_en: 'Trattoria Lucia · 4.6★ · open until 23:00' },
    { tool: 'get_weather', es: 'revisar el clima de esta noche', en: 'check tonight\'s weather',
      call: 'get_weather("Monterrey")',
      obs_es: 'Despejado · 19°C esta noche',
      obs_en: 'Clear · 19°C tonight' },
    { tool: 'calc', es: 'calcular la propina (18% de $84)', en: 'calculate the tip (18% of $84)',
      call: 'calc("84 * 0.18")',
      obs_es: '84 * 0.18 = 15.12',
      obs_en: '84 * 0.18 = 15.12' }
  ],

  task_es: 'Planea la cena: encuentra un restaurante italiano, revisa el clima de esta noche y calcula la propina del 18% sobre una cuenta de $84.',
  task_en: 'Plan dinner: find an italian restaurant, check tonight\'s weather, and calculate an 18% tip on an $84 bill.',

  init() {
    const lang = window.state.lang;
    const L = lang === 'es';
    const t = (I18N[lang].games.agent) || { name: 'agent forge', icon: '◆' };
    this.state = { selected: new Set(), system: '', tokens: 0, steps: 0, startTime: Date.now(), running: false, finished: false, timer: null };

    const stats = `
      <div class="arcade-stat"><span class="label">${L ? 'pasos' : 'steps'}</span><span class="value" id="ag-steps">0</span></div>
      <div class="arcade-stat"><span class="label">tokens</span><span class="value warn" id="ag-tokens">0</span></div>
      <div class="arcade-stat"><span class="label">${L ? 'tiempo' : 'time'}</span><span class="value" id="ag-time">0s</span></div>
    `;

    const toolCards = this.TOOLS.map(tool => `
      <button class="ag-tool" data-tool="${tool.id}" type="button" style="text-align:left;border:1px solid var(--border);background:var(--bg-3);color:var(--ink);padding:10px;cursor:pointer;border-radius:3px;font-family:'JetBrains Mono',monospace;transition:.15s">
        <div style="font-size:12px;color:var(--accent)">${L ? tool.es : tool.en}</div>
        <div style="font-size:10px;color:var(--ink-dim);margin-top:3px">${L ? tool.es_d : tool.en_d}</div>
      </button>
    `).join('');

    const stage = `
      <div class="agent-stage" style="width:100%;height:100%;overflow:auto;padding:18px">
        <div class="agent-trace" id="ag-trace" style="max-width:760px;margin:0 auto"></div>
      </div>
      <div class="start-screen" id="ag-start-screen">
        <h2>${t.name || 'agent forge'}</h2>
        <p style="max-width:560px">${L ? this.task_es : this.task_en}</p>
        <div class="input-block" style="max-width:620px;width:100%">
          <label style="text-align:left">${L ? '1 · equipa solo las herramientas necesarias (de más = más tokens)' : '1 · equip only the tools you need (extras cost tokens)'}</label>
          <div id="ag-tools" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">${toolCards}</div>
          <label style="text-align:left">${L ? '2 · system prompt del agente' : '2 · agent system prompt'}</label>
          <textarea id="ag-system" rows="3" placeholder="${L ? 'Ej: Eres un agente de planificación. Descompón la tarea en subtareas y usa una herramienta por cada una...' : 'Ex: You are a planning agent. Break the task into subtasks and use one tool per subtask...'}"></textarea>
          <button class="btn primary" id="ag-run" style="font-size:14px;padding:14px 28px;margin-top:10px">${L ? 'forjar y ejecutar agente' : 'forge & run agent'} ▶</button>
        </div>
      </div>
    `;

    const dialog = `
      <div class="dialog-header">
        <span class="speaker agent" id="ag-speaker">AGENT</span>
        <span id="ag-hint">${L ? 'selecciona herramientas y escribe el system prompt' : 'select tools and write the system prompt'}</span>
      </div>
      <div class="dialog-body" id="ag-dialog">${Games.esc(L ? '> agente inactivo. equípalo y ejecútalo.' : '> agent idle. equip it and run.')}</div>
    `;

    return Games.renderArcade('agent', t.icon || '◆', 'AGENT FORGE', stats, stage, dialog);
  },

  bind() {
    Games.bindSoundToggle();
    const self = this;
    $$('.ag-tool').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.tool;
        if (self.state.selected.has(id)) {
          self.state.selected.delete(id);
          b.style.borderColor = 'var(--border)';
          b.style.background = 'var(--bg-3)';
        } else {
          self.state.selected.add(id);
          b.style.borderColor = 'var(--accent)';
          b.style.background = 'rgba(255,95,31,.08)';
        }
        if (window.Sound) Sound.click();
      };
    });
    $('#ag-run').onclick = () => this.run();
    this._timer = setInterval(() => {
      if (this.state.finished) return;
      const s = Math.floor((Date.now() - this.state.startTime) / 1000);
      const el = $('#ag-time'); if (el) el.textContent = s + 's';
    }, 1000);
  },

  addTrace(n, type, body) {
    const el = $('#ag-trace');
    if (!el) return;
    const div = document.createElement('div');
    div.className = 'trace-step';
    div.innerHTML = `<div class="step-num">${n === 99 ? '→' : n}</div><div class="step-body"><span class="step-type">${type.replace(/_/g, ' ')}</span>${Games.esc(body)}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    this.state.steps++;
    const st = $('#ag-steps'); if (st) st.textContent = this.state.steps;
  },

  addTokens(n) {
    this.state.tokens += n;
    const el = $('#ag-tokens'); if (el) el.textContent = this.state.tokens;
  },

  async run() {
    if (this.state.running) return;
    const lang = window.state.lang, L = lang === 'es';
    const sys = $('#ag-system').value.trim();
    if (sys.length < 15) { if (window.Sound) Sound.fail(); return alert(L ? 'Escribe un system prompt (mín. 15 caracteres)' : 'Write a system prompt (min 15 chars)'); }
    if (this.state.selected.size === 0) { if (window.Sound) Sound.fail(); return alert(L ? 'Equipa al menos una herramienta' : 'Equip at least one tool'); }

    this.state.running = true;
    this.state.system = sys;
    if (window.Sound) Sound.unlock();
    $('#ag-start-screen').classList.add('hidden');
    $('#ag-hint').textContent = L ? 'agente ejecutando...' : 'agent running...';

    // el system prompt va al contexto en cada iteración → cuesta tokens
    this.addTokens(Math.ceil(sys.length / 4) + 20);

    const equipped = this.state.selected;
    const solved = [];

    await Games.sleep(400);
    this.addTrace(1, 'thinking', L ? `Descompongo la tarea en ${this.SUBTASKS.length} subtareas.` : `Breaking the task into ${this.SUBTASKS.length} subtasks.`);
    this.addTokens(18);

    let step = 2;
    for (const sub of this.SUBTASKS) {
      await Games.sleep(550);
      this.addTrace(step++, 'thinking', (L ? 'Subtarea: ' : 'Subtask: ') + (L ? sub.es : sub.en) + (L ? ` → necesito ${sub.tool}` : ` → I need ${sub.tool}`));
      this.addTokens(16);

      if (equipped.has(sub.tool)) {
        await Games.sleep(500);
        if (window.Sound) Sound.pickup();
        this.addTrace(step++, 'tool_call', sub.call);
        await Games.sleep(550);
        this.addTrace(step++, 'tool_result', L ? sub.obs_es : sub.obs_en);
        this.addTokens(34);
        solved.push(sub);
      } else {
        await Games.sleep(500);
        if (window.Sound) Sound.fail();
        this.addTrace(step++, 'error', L ? `No tengo "${sub.tool}" equipada — no puedo resolver esta subtarea.` : `Missing "${sub.tool}" — cannot solve this subtask.`);
        this.addTokens(12);
      }
    }

    // herramientas de más: el agente las "considera" en cada paso → más contexto, más tokens
    const extras = [...equipped].filter(id => !this.SUBTASKS.some(s => s.tool === id));
    for (const ex of extras) {
      await Games.sleep(350);
      this.addTrace(step++, 'thinking', (L ? `Considero ${ex}... no aplica a esta tarea (contexto desperdiciado).` : `Considering ${ex}... not relevant here (wasted context).`));
      this.addTokens(15);
    }

    await Games.sleep(450);
    const success = solved.length === this.SUBTASKS.length;
    this.addTrace(99, 'thinking', success ? (L ? 'Tengo todo. Componiendo respuesta final.' : 'Got everything. Composing final answer.') : (L ? 'Me faltan datos: la respuesta estará incompleta.' : 'Missing data: the answer will be incomplete.'));
    this.addTokens(22);

    await Games.sleep(400);
    $('#ag-speaker').textContent = 'AGENT';
    const answer = success
      ? (L ? 'Reserva en Trattoria Lucia (4.6★, abierto hasta 23:00). Clima despejado, 19°C — buena noche para salir. Propina sugerida: $15.12 (18% de $84).'
           : 'Book Trattoria Lucia (4.6★, open until 23:00). Clear skies, 19°C — nice night out. Suggested tip: $15.12 (18% of $84).')
      : (L ? 'No pude completar la tarea: faltaron herramientas para algunas subtareas. Equipa las correctas y reintenta.'
           : 'Could not complete the task: some subtasks lacked tools. Equip the right ones and retry.');
    await Games.typewrite($('#ag-dialog'), answer, 10);
    $('#ag-hint').textContent = L ? 'ejecución terminada' : 'run finished';

    if (window.Sound) success ? Sound.win() : Sound.fail();
    setTimeout(() => this.finish(success, equipped, extras.length), 900);
  },

  finish(success, equipped, extraCount) {
    if (this.state.finished) return;
    this.state.finished = true;
    if (this._timer) clearInterval(this._timer);
    const timeS = Math.floor((Date.now() - this.state.startTime) / 1000);
    const toolsGiven = equipped.size;
    const toolsUsed = [...equipped].filter(id => this.SUBTASKS.some(s => s.tool === id)).length;

    const base = success ? 300 : 0;
    const extraPenalty = extraCount * 40;             // castigo por herramientas irrelevantes
    const tokenBonus = Math.max(0, 200 - Math.floor(this.state.tokens / 2));
    const timeBonus = Math.max(0, 120 - timeS);
    const total = Math.max(0, base + tokenBonus + timeBonus - extraPenalty);

    window.App.showScore('agent', {
      total,
      success,
      toolsGiven,
      toolsUsed,
      steps: this.state.steps,
      tokens: this.state.tokens,
      time: timeS
    });
  }
};
