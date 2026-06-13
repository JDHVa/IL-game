window.Games = window.Games || {};

Games.tycoon = {
  state: null,
  
  init() {
    this.state = {
      phase: 'build',
      startTime: Date.now(),
      layers: 1,
      neurons: 16,
      activation: 'relu',
      lr: 0.01,
      batchSize: 16,
      optimizer: 'adam',
      dataset: 'circles',
      epoch: 0,
      loss: 1.0,
      accuracy: 0.0,
      overfitting: false,
      timer: null
    };

    const t = I18N[window.state.lang].games.tycoon;
    
    const statsHTML = `
      <div class="hud-stat" id="tyc-phase-stat">${t.buildPhase}</div>
      <div class="hud-stat" id="tyc-epoch-stat" style="display:none">${t.epoch}: <span class="v">0</span></div>
      <div class="hud-stat" id="tyc-acc-stat" style="display:none">${t.accuracy}: <span class="v">0%</span></div>
    `;

    const stageHTML = `
      <div id="tyc-stage" style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;">
        <h3 style="color:var(--accent-2);margin-bottom:16px;">${t.networkTitle}</h3>
        <svg id="tyc-svg" width="100%" height="200" style="flex-grow:1;max-height:200px;"></svg>
        <div id="tyc-graph" style="width:100%;height:150px;border:1px solid var(--border);margin-top:20px;position:relative;display:none;">
          <svg id="tyc-loss-svg" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline id="tyc-loss-line" fill="none" stroke="var(--accent)" stroke-width="2" points=""></polyline>
            <polyline id="tyc-val-line" fill="none" stroke="var(--danger)" stroke-width="2" points="" style="display:none"></polyline>
          </svg>
          <div id="tyc-overfit-warn" style="position:absolute;top:10px;right:10px;color:var(--danger);font-weight:bold;font-size:12px;display:none;animation:blink 1s infinite">${t.overfitting}</div>
        </div>
      </div>
    `;

    const dialogHTML = `
      <div id="tyc-build-panel" class="tyc-panel">
        <p style="color:var(--ink-dim);font-size:12px;margin-bottom:12px">${t.intro}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.hiddenLayers}</label><select id="tyc-layers" class="btn" style="width:100%"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.neuronsPerLayer}</label><select id="tyc-neurons" class="btn" style="width:100%"><option value="4">4</option><option value="8">8</option><option value="16" selected>16</option><option value="32">32</option><option value="64">64</option></select></div>
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.activation}</label><select id="tyc-activation" class="btn" style="width:100%"><option value="relu">ReLU</option><option value="sigmoid">Sigmoid</option><option value="tanh">Tanh</option></select></div>
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.dataset}</label><select id="tyc-dataset" class="btn" style="width:100%"><option value="xor">${t.datasetXor}</option><option value="circles" selected>${t.datasetCircles}</option><option value="spiral">${t.datasetSpiral}</option></select></div>
        </div>
        <button class="btn primary" id="tyc-to-train" style="width:100%">${t.trainPhase} →</button>
      </div>

      <div id="tyc-train-panel" class="tyc-panel" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.learningRate}</label><select id="tyc-lr" class="btn" style="width:100%"><option value="0.001">0.001</option><option value="0.01" selected>0.01</option><option value="0.1">0.1</option><option value="1.0">1.0</option></select></div>
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.batchSize}</label><select id="tyc-batch" class="btn" style="width:100%"><option value="8">8</option><option value="16" selected>16</option><option value="32">32</option><option value="64">64</option></select></div>
          <div><label style="display:block;font-size:10px;color:var(--ink-dim);margin-bottom:4px">${t.optimizer}</label><select id="tyc-opt" class="btn" style="width:100%"><option value="sgd">SGD</option><option value="adam" selected>Adam</option></select></div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn ghost" id="tyc-back-build">← ${t.buildPhase}</button>
          <button class="btn primary" id="tyc-start-train" style="flex-grow:1">${t.trainBtn}</button>
          <button class="btn danger" id="tyc-eval" style="display:none;flex-grow:1">${t.evalBtn}</button>
        </div>
      </div>
    `;

    return Games.renderArcade('tycoon', t.icon, t.name.toUpperCase(), statsHTML, stageHTML, dialogHTML);
  },

  bind() {
    this.drawNetwork();
    
    const updateNet = () => {
      this.state.layers = parseInt(document.getElementById('tyc-layers').value);
      this.state.neurons = parseInt(document.getElementById('tyc-neurons').value);
      this.state.activation = document.getElementById('tyc-activation').value;
      this.state.dataset = document.getElementById('tyc-dataset').value;
      if(window.Sound) Sound.step();
      this.drawNetwork();
    };

    document.getElementById('tyc-layers').onchange = updateNet;
    document.getElementById('tyc-neurons').onchange = updateNet;
    document.getElementById('tyc-activation').onchange = updateNet;
    document.getElementById('tyc-dataset').onchange = updateNet;
    
    document.getElementById('tyc-to-train').onclick = () => {
      if(window.Sound) Sound.click();
      document.getElementById('tyc-build-panel').style.display = 'none';
      document.getElementById('tyc-train-panel').style.display = 'block';
      const t = I18N[window.state.lang].games.tycoon;
      document.getElementById('tyc-phase-stat').textContent = t.trainPhase;
    };
    
    document.getElementById('tyc-back-build').onclick = () => {
      if(window.Sound) Sound.click();
      document.getElementById('tyc-build-panel').style.display = 'block';
      document.getElementById('tyc-train-panel').style.display = 'none';
      const t = I18N[window.state.lang].games.tycoon;
      document.getElementById('tyc-phase-stat').textContent = t.buildPhase;
    };
    
    document.getElementById('tyc-start-train').onclick = () => {
      if(window.Sound) Sound.pickup();
      this.state.lr = parseFloat(document.getElementById('tyc-lr').value);
      this.state.batchSize = parseInt(document.getElementById('tyc-batch').value);
      this.state.optimizer = document.getElementById('tyc-opt').value;
      
      document.getElementById('tyc-lr').disabled = true;
      document.getElementById('tyc-batch').disabled = true;
      document.getElementById('tyc-opt').disabled = true;
      document.getElementById('tyc-back-build').style.display = 'none';
      document.getElementById('tyc-start-train').style.display = 'none';
      document.getElementById('tyc-eval').style.display = 'block';
      
      document.getElementById('tyc-graph').style.display = 'block';
      document.getElementById('tyc-epoch-stat').style.display = 'inline-block';
      document.getElementById('tyc-acc-stat').style.display = 'inline-block';
      
      this.startTraining();
    };
    
    document.getElementById('tyc-eval').onclick = () => {
      this.finish();
    };
  },

  drawNetwork() {
    const svg = document.getElementById('tyc-svg');
    if(!svg) return;
    
    const layers = this.state.layers;
    const neurons = this.state.neurons;
    const maxNodesDraw = 8;
    
    const totalLayers = layers + 2; 
    const colWidth = 100 / totalLayers;
    
    let html = '';
    const cols = [];
    
    cols.push({x: colWidth/2, nodes: 2});
    for(let i=0; i<layers; i++) {
      cols.push({x: colWidth/2 + (i+1)*colWidth, nodes: Math.min(neurons, maxNodesDraw)});
    }
    cols.push({x: 100 - colWidth/2, nodes: 1});
    
    for(let i=0; i<cols.length-1; i++) {
      const colA = cols[i];
      const colB = cols[i+1];
      for(let j=0; j<colA.nodes; j++) {
        const yA = 50 + (j - (colA.nodes-1)/2) * 15;
        for(let k=0; k<colB.nodes; k++) {
          const yB = 50 + (k - (colB.nodes-1)/2) * 15;
          html += `<line x1="${colA.x}%" y1="${yA}%" x2="${colB.x}%" y2="${yB}%" stroke="var(--border)" stroke-width="1" opacity="0.5"/>`;
        }
      }
    }
    
    for(let i=0; i<cols.length; i++) {
      const col = cols[i];
      const isInput = i===0;
      const isOutput = i===cols.length-1;
      const color = isInput ? 'var(--accent)' : (isOutput ? 'var(--success)' : 'var(--accent-2)');
      
      for(let j=0; j<col.nodes; j++) {
        const y = 50 + (j - (col.nodes-1)/2) * 15;
        html += `<circle cx="${col.x}%" cy="${y}%" r="4" fill="var(--bg)" stroke="${color}" stroke-width="2"/>`;
      }
      
      if(col.nodes < (i===0||i===cols.length-1 ? 0 : neurons)) {
        html += `<circle cx="${col.x}%" cy="${50 + (col.nodes/2)*15}%" r="1.5" fill="var(--ink-dim)"/>`;
        html += `<circle cx="${col.x}%" cy="${50 + (col.nodes/2 + 0.5)*15}%" r="1.5" fill="var(--ink-dim)"/>`;
        html += `<circle cx="${col.x}%" cy="${50 + (col.nodes/2 + 1)*15}%" r="1.5" fill="var(--ink-dim)"/>`;
      }
    }
    
    svg.innerHTML = html;
  },

  startTraining() {
    this.state.epoch = 0;
    this.state.lossHistory = [];
    this.state.valLossHistory = [];
    
    let targetAcc = 0;
    let requiredCapacity = 0;
    let difficultySpeed = 1;
    
    if(this.state.dataset === 'xor') { targetAcc = 100; requiredCapacity = 4; difficultySpeed = 2; }
    else if(this.state.dataset === 'circles') { targetAcc = 98; requiredCapacity = 16; difficultySpeed = 1; }
    else if(this.state.dataset === 'spiral') { targetAcc = 95; requiredCapacity = 64; difficultySpeed = 0.5; }
    
    const params = (2 * this.state.neurons) + 
                   (this.state.layers > 1 ? (this.state.layers-1)*(this.state.neurons*this.state.neurons) : 0) + 
                   (this.state.neurons * 1);
                   
    this.state.totalParams = params;
                   
    let capacityRatio = params / (requiredCapacity * requiredCapacity);
    if(this.state.dataset==='xor') capacityRatio = params / 10;
    
    let capacityFactor = Math.min(1.2, capacityRatio);
    if(capacityFactor < 0.2) targetAcc *= 0.5;
    else if(capacityFactor < 0.5) targetAcc *= 0.8;
    
    let lrFactor = 1;
    if(this.state.lr === 1.0) lrFactor = 0.2;
    else if(this.state.lr === 0.001) lrFactor = 0.3;
    else lrFactor = 1.0;
    
    const maxEpochs = 500;
    
    const tick = () => {
      this.state.epoch += 2;
      const progress = this.state.epoch / maxEpochs;
      
      const idealLoss = Math.exp(-progress * 5 * lrFactor * difficultySpeed);
      const noise = (Math.random() - 0.5) * 0.1 * (this.state.batchSize===8 ? 2 : this.state.batchSize===64 ? 0.2 : 1);
      
      let trainLoss = Math.max(0.01, idealLoss + noise);
      if(this.state.lr === 1.0) trainLoss += Math.random() * 0.5;
      
      let valLoss = trainLoss;
      const overfitThreshold = 0.4 * (1/capacityFactor);
      if(progress > overfitThreshold) {
        const overfitAmount = (progress - overfitThreshold) * 2 * capacityFactor;
        valLoss += overfitAmount;
        if(overfitAmount > 0.2 && !this.state.overfitting) {
          this.state.overfitting = true;
          document.getElementById('tyc-val-line').style.display = 'block';
          document.getElementById('tyc-overfit-warn').style.display = 'block';
          if(window.Sound) Sound.fail();
        }
      }
      
      this.state.lossHistory.push(trainLoss);
      this.state.valLossHistory.push(valLoss);
      
      const baseAcc = targetAcc * (1 - trainLoss);
      let currentAcc = baseAcc;
      if(this.state.overfitting) {
        currentAcc -= (valLoss - trainLoss) * 50;
      }
      this.state.accuracy = Math.max(10, Math.min(100, currentAcc));
      
      document.querySelector('#tyc-epoch-stat .v').textContent = this.state.epoch;
      document.querySelector('#tyc-acc-stat .v').textContent = Math.round(this.state.accuracy) + '%';
      
      this.drawGraph();
      
      if(window.Sound && this.state.epoch % 10 === 0) {
        Sound.beep(200 + (1-trainLoss)*600, 0.05, 'sine', 0.03);
      }
      
      if(this.state.epoch < maxEpochs) {
        this.state.timer = setTimeout(tick, 50);
      } else {
        if(window.Sound) Sound.unlock();
        document.getElementById('tyc-eval').classList.add('pulse');
      }
    };
    
    tick();
  },
  
  drawGraph() {
    const tLine = document.getElementById('tyc-loss-line');
    const vLine = document.getElementById('tyc-val-line');
    if(!tLine) return;
    
    const maxPoints = 250;
    const len = this.state.lossHistory.length;
    
    const getPts = (arr) => {
      let pts = '';
      for(let i=0; i<len; i++) {
        const x = (i / maxPoints) * 100;
        const y = Math.min(100, Math.max(0, arr[i] * 100));
        pts += `${x},${y} `;
      }
      return pts;
    };
    
    tLine.setAttribute('points', getPts(this.state.lossHistory));
    if(this.state.overfitting) {
      vLine.setAttribute('points', getPts(this.state.valLossHistory));
    }
  },

  finish() {
    if(this.state.timer) clearTimeout(this.state.timer);
    
    const finalAcc = Math.round(this.state.accuracy);
    const timeS = Math.floor((Date.now() - this.state.startTime) / 1000);
    
    let efficiencyBonus = 0;
    if(this.state.totalParams < 100) efficiencyBonus = 200;
    else if(this.state.totalParams < 500) efficiencyBonus = 100;
    else if(this.state.totalParams < 2000) efficiencyBonus = 50;
    else efficiencyBonus = 0;
    
    if(finalAcc < 50) efficiencyBonus = 0;
    
    let mult = 1;
    if(this.state.dataset === 'circles') mult = 1.5;
    else if(this.state.dataset === 'spiral') mult = 2.0;
    
    const timeBonus = Math.max(0, 300 - timeS);
    
    const rawTotal = (finalAcc * 10) + efficiencyBonus + timeBonus;
    const total = Math.round(rawTotal * mult);
    
    if(window.Sound) {
      if(finalAcc > 80) Sound.win();
      else Sound.blip(440, 0.5);
    }
    
    window.App.showScore('tycoon', {
      total: total,
      tokens: 0,
      time: timeS,
      accuracy: finalAcc,
      params: this.state.totalParams,
      efficiencyBonus: Math.round(efficiencyBonus * mult)
    });
  }
};
