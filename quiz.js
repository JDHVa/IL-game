const Quiz={
  state:null,
  QUESTIONS_ES:[
    {q:'Que es un "token" para un LLM?',opts:['Un pixel','Un trozo de texto (palabra o subpalabra)','Un byte','Una oracion completa'],ans:1,diff:1,cat:'tokens'},
    {q:'Si subes la temperatura a 2.0, que pasa?',opts:['Respuesta mas precisa','Respuesta mas creativa/caotica','Error del sistema','Respuesta mas corta'],ans:1,diff:1,cat:'params'},
    {q:'Que hace el system prompt?',opts:['Define la personalidad/reglas del modelo','Entrena al modelo','Borra la memoria','Cambia el idioma'],ans:0,diff:1,cat:'prompting'},
    {q:'Que es un embedding?',opts:['Un archivo ZIP','Una representacion numerica (vector) de una palabra','Un tipo de base de datos','Un algoritmo de compresion'],ans:1,diff:2,cat:'mates'},
    {q:'Que operacion matematica esta en el corazon de self-attention?',opts:['Division','Raiz cuadrada','Producto punto (dot product)','Logaritmo'],ans:2,diff:2,cat:'mates'},
    {q:'Que es softmax?',opts:['Un tipo de GPU','Funcion que convierte scores en probabilidades (0-1)','Un optimizador','Un dataset'],ans:1,diff:2,cat:'mates'},
    {q:'Que significa "context window" de 128K tokens?',opts:['Puede generar 128K palabras','Puede procesar ~128K tokens de entrada+salida','Tiene 128K parametros','Se entreno con 128K datos'],ans:1,diff:2,cat:'params'},
    {q:'Que es RAG?',opts:['Un tipo de red neuronal','Retrieval Augmented Generation: buscar docs y darlos al LLM','Un lenguaje de programacion','Un tipo de fine-tuning'],ans:1,diff:2,cat:'arquitectura'},
    {q:'En backpropagation, que se propaga hacia atras?',opts:['Los datos','Los gradientes del error','Los tokens','Las predicciones'],ans:1,diff:3,cat:'mates'},
    {q:'Que es overfitting?',opts:['El modelo es muy grande','El modelo memoriza en vez de generalizar','El modelo es muy lento','El modelo tiene bugs'],ans:1,diff:3,cat:'mates'},
    {q:'Cuantas dimensiones tiene un embedding tipico en GPT-3?',opts:['3','768','12,288','1 millon'],ans:2,diff:3,cat:'mates'},
    {q:'Que hace top_p (nucleus sampling)?',opts:['Limita el vocabulario','Selecciona del top-p% de probabilidad acumulada','Cambia el modelo','Agrega ruido'],ans:1,diff:3,cat:'params'},
    {q:'Que es un "head" en multi-head attention?',opts:['El primer token','Una attention independiente que mira algo distinto','El output final','Una capa de normalizacion'],ans:1,diff:3,cat:'arquitectura'},
    {q:'La formula de attention es Q*K^T/sqrt(d) -> softmax -> *V. Que es "d"?',opts:['El numero de datos','La dimension de los vectores key','El dropout rate','El numero de capas'],ans:1,diff:4,cat:'mates'},
    {q:'Cual es la diferencia entre GPT y BERT?',opts:['GPT es mas viejo','GPT usa decoder (genera), BERT usa encoder (entiende)','No hay diferencia','GPT es gratis, BERT no'],ans:1,diff:4,cat:'arquitectura'},
    {q:'Que es el "loss" en entrenamiento?',opts:['La velocidad','Una medida de que tan mal predice el modelo','El costo en dinero','La memoria usada'],ans:1,diff:2,cat:'mates'},
    {q:'Que papel juega el learning rate?',opts:['Controla cuanto se ajustan los pesos en cada paso','Define el tamano del modelo','Decide cuantos datos usar','Controla la temperatura'],ans:0,diff:3,cat:'mates'},
    {q:'Que son las "conexiones residuales" en un transformer?',opts:['Conexiones a internet','Atajos que suman la entrada a la salida de cada capa','Pesos no entrenados','Errores del modelo'],ans:1,diff:4,cat:'arquitectura'},
    {q:'Por que la IA a veces "alucina" (inventa datos)?',opts:['Esta rota','Predice tokens probables aunque no sean verdaderos','Le falta internet','Es un bug'],ans:1,diff:2,cat:'prompting'},
    {q:'Si un modelo tiene 70B parametros, cuantos pesos ajustables tiene?',opts:['70 mil','70 millones','70 mil millones','70 billones americanos'],ans:2,diff:4,cat:'arquitectura'}
  ],
  QUESTIONS_EN:[
    {q:'What is a "token" for an LLM?',opts:['A pixel','A chunk of text (word or subword)','A byte','A full sentence'],ans:1,diff:1,cat:'tokens'},
    {q:'If you raise temperature to 2.0, what happens?',opts:['More precise answer','More creative/chaotic answer','System error','Shorter answer'],ans:1,diff:1,cat:'params'},
    {q:'What does the system prompt do?',opts:['Defines personality/rules for the model','Trains the model','Clears memory','Changes language'],ans:0,diff:1,cat:'prompting'},
    {q:'What is an embedding?',opts:['A ZIP file','A numeric representation (vector) of a word','A database type','A compression algorithm'],ans:1,diff:2,cat:'math'},
    {q:'What math operation is at the heart of self-attention?',opts:['Division','Square root','Dot product','Logarithm'],ans:2,diff:2,cat:'math'},
    {q:'What is softmax?',opts:['A GPU type','Function that converts scores to probabilities (0-1)','An optimizer','A dataset'],ans:1,diff:2,cat:'math'},
    {q:'What does "128K token context window" mean?',opts:['Can generate 128K words','Can process ~128K tokens of input+output','Has 128K parameters','Was trained on 128K data'],ans:1,diff:2,cat:'params'},
    {q:'What is RAG?',opts:['A neural network type','Retrieval Augmented Generation: retrieve docs and feed to LLM','A programming language','A fine-tuning type'],ans:1,diff:2,cat:'architecture'},
    {q:'In backpropagation, what is propagated backwards?',opts:['The data','The error gradients','The tokens','The predictions'],ans:1,diff:3,cat:'math'},
    {q:'What is overfitting?',opts:['Model is too big','Model memorizes instead of generalizing','Model is too slow','Model has bugs'],ans:1,diff:3,cat:'math'},
    {q:'How many dimensions does a typical GPT-3 embedding have?',opts:['3','768','12,288','1 million'],ans:2,diff:3,cat:'math'},
    {q:'What does top_p (nucleus sampling) do?',opts:['Limits vocabulary','Samples from the top-p% cumulative probability','Changes model','Adds noise'],ans:1,diff:3,cat:'params'},
    {q:'What is a "head" in multi-head attention?',opts:['The first token','An independent attention looking for something different','The final output','A normalization layer'],ans:1,diff:3,cat:'architecture'},
    {q:'Attention formula: Q*K^T/sqrt(d) -> softmax -> *V. What is "d"?',opts:['Number of data points','Dimension of key vectors','Dropout rate','Number of layers'],ans:1,diff:4,cat:'math'},
    {q:'Whats the difference between GPT and BERT?',opts:['GPT is older','GPT uses decoder (generates), BERT uses encoder (understands)','No difference','GPT is free, BERT is not'],ans:1,diff:4,cat:'architecture'},
    {q:'What is "loss" in training?',opts:['Speed','A measure of how poorly the model predicts','Dollar cost','Memory used'],ans:1,diff:2,cat:'math'},
    {q:'What role does the learning rate play?',opts:['Controls how much weights adjust each step','Defines model size','Decides how much data to use','Controls temperature'],ans:0,diff:3,cat:'math'},
    {q:'What are "residual connections" in a transformer?',opts:['Internet connections','Shortcuts that add input to each layers output','Untrained weights','Model errors'],ans:1,diff:4,cat:'architecture'},
    {q:'Why does AI sometimes "hallucinate" (make up data)?',opts:['Its broken','It predicts likely tokens even if untrue','It lacks internet','Its a bug'],ans:1,diff:2,cat:'prompting'},
    {q:'If a model has 70B parameters, how many adjustable weights does it have?',opts:['70 thousand','70 million','70 billion','70 trillion'],ans:2,diff:4,cat:'architecture'}
  ],
  
  init(){
    const lang=window.state.lang;
    const L=lang==='es';
    const questions=lang==='es'?this.QUESTIONS_ES:this.QUESTIONS_EN;
    this.state={
      questions:questions.sort((a,b)=>a.diff-b.diff),
      current:0,correct:0,answers:[],
      startTime:Date.now(),streak:0,maxStreak:0
    };
    
    const stats=`
      <div class="arcade-stat"><span class="label">${L?'pregunta':'question'}</span><span class="value" id="qz-num">1/${questions.length}</span></div>
      <div class="arcade-stat"><span class="label">${L?'correctas':'correct'}</span><span class="value success" id="qz-correct">0</span></div>
      <div class="arcade-stat"><span class="label">streak</span><span class="value warn" id="qz-streak">0</span></div>
      <div class="arcade-stat"><span class="label">${L?'tiempo':'time'}</span><span class="value" id="qz-time">0s</span></div>
    `;
    
    const stage=`<div class="quiz-stage" id="qz-stage"></div>`;
    
    const dialog=`
      <div class="dialog-header">
        <span class="speaker agent" id="qz-speaker">${L?'DIFICULTAD':'DIFFICULTY'}</span>
        <span id="qz-hint">${L?'selecciona tu respuesta':'select your answer'}</span>
      </div>
      <div class="dialog-body" id="qz-dialog">${L?'20 preguntas, dificultad creciente. responde todas bien para ser top 1.':'20 questions, increasing difficulty. answer all correctly to be top 1.'}</div>
      <div class="dialog-choices" id="qz-choices"></div>
    `;
    
    return Games.renderArcade('quiz','?','QUIZ MASTER',stats,stage,dialog);
  },
  
  bind(){
    Games.bindSoundToggle();
    this._timer=setInterval(()=>{
      const s=Math.floor((Date.now()-this.state.startTime)/1000);
      const el=$('#qz-time'); if(el) el.textContent=s+'s';
    },1000);
    this.showQuestion();
  },
  
  showQuestion(){
    const lang=window.state.lang;
    const L=lang==='es';
    const s=this.state;
    if(s.current>=s.questions.length){this.finish();return}
    
    const q=s.questions[s.current];
    $('#qz-num').textContent=`${s.current+1}/${s.questions.length}`;
    
    const diffNames=L?['','facil','medio','dificil','experto']:['','easy','medium','hard','expert'];
    const diffColors=['','var(--success)','var(--accent-2)','var(--accent)','var(--danger)'];
    const pips=Array(q.diff).fill('<span class="diff-pip"></span>').join('');
    
    $('#qz-speaker').textContent=(L?'DIFICULTAD: ':'DIFFICULTY: ')+diffNames[q.diff].toUpperCase();
    $('#qz-speaker').style.color=diffColors[q.diff];
    
    const pct=Math.round((s.current/s.questions.length)*100);
    const streakBar=s.streak>0?`<div class="qz-streak-bar"><div class="qz-streak-fill" style="width:${Math.min(100,s.streak*20)}%"></div><span>${s.streak}x</span></div>`:'';
    
    const stage=$('#qz-stage');
    stage.innerHTML=`
      <div class="quiz-card entering">
        <div class="qz-header">
          <span class="qz-number">${String(s.current+1).padStart(2,'0')}</span>
          <span class="qz-category">${q.cat}</span>
        </div>
        <div class="qz-diff-bar" style="border-color:${diffColors[q.diff]}">
          <span class="qz-diff-label" style="color:${diffColors[q.diff]}">${diffNames[q.diff]}</span>
          <span class="qz-diff-pips" style="color:${diffColors[q.diff]}">${pips}</span>
        </div>
        <div class="qz-question">${Games.esc(q.q)}</div>
        ${streakBar}
        <div class="qz-progress-bar">
          <div class="qz-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="qz-progress-dots">
          ${s.questions.map((_,i)=>`<div class="qz-dot ${i<s.current?(s.answers[i]?'right':'wrong'):(i===s.current?'current':'')}"></div>`).join('')}
        </div>
      </div>
    `;
    
    const choices=$('#qz-choices');
    choices.innerHTML=q.opts.map((opt,i)=>`
      <button class="dialog-choice qz-opt" data-opt="${i}" style="animation-delay:${i*0.08}s">
        <span class="qz-opt-key">${String.fromCharCode(65+i)}</span>
        <span>${Games.esc(opt)}</span>
      </button>
    `).join('');
    
    $$('#qz-choices button').forEach(b=>{
      b.onclick=()=>this.answer(parseInt(b.dataset.opt));
    });
    
    $('#qz-dialog').textContent=L?'elige tu respuesta':'pick your answer';
    Sound.click();
  },
  
  async answer(choice){
    const s=this.state;
    const q=s.questions[s.current];
    const correct=choice===q.ans;
    const lang=window.state.lang;
    const L=lang==='es';
    
    $$('#qz-choices button').forEach(b=>{
      b.disabled=true;
      const i=parseInt(b.dataset.opt);
      if(i===q.ans){
        b.classList.add('correct-answer');
      } else if(i===choice && !correct){
        b.classList.add('wrong-answer');
      } else {
        b.style.opacity='0.3';
      }
    });
    
    const card=document.querySelector('.quiz-card');
    
    if(correct){
      s.correct++;s.streak++;
      if(s.streak>s.maxStreak) s.maxStreak=s.streak;
      Sound.pickup();
      $('#qz-correct').textContent=s.correct;
      $('#qz-streak').textContent=s.streak;
      if(card) card.classList.add('flash-correct');
      await Games.typewrite($('#qz-dialog'),(L?'correcto. ':'correct. ')+this.explanation(q,L),10);
    } else {
      s.streak=0;
      Sound.fail();
      $('#qz-streak').textContent=0;
      if(card) card.classList.add('flash-wrong');
      const correctOpt=q.opts[q.ans];
      await Games.typewrite($('#qz-dialog'),(L?'incorrecto. respuesta: ':'wrong. answer: ')+correctOpt+'. '+this.explanation(q,L),10);
    }
    
    s.answers.push(correct);
    s.current++;
    
    await Games.sleep(2200);
    this.showQuestion();
  },
  
  explanation(q,L){
    const tips={
      tokens:L?'los tokens son la unidad fundamental que procesa el LLM.':'tokens are the fundamental unit the LLM processes.',
      params:L?'los parametros controlan el comportamiento de generacion.':'parameters control generation behavior.',
      prompting:L?'el prompting es la interfaz entre humano y LLM.':'prompting is the interface between human and LLM.',
      mates:L?'las matematicas son el motor interno de toda IA.':'math is the internal engine of all AI.',
      math:L?'las matematicas son el motor interno de toda IA.':'math is the internal engine of all AI.',
      arquitectura:L?'la arquitectura define como se procesan los datos.':'architecture defines how data is processed.',
      architecture:L?'la arquitectura define como se procesan los datos.':'architecture defines how data is processed.'
    };
    return tips[q.cat]||'';
  },
  
  finish(){
    clearInterval(this._timer);
    const s=this.state;
    const timeS=Math.floor((Date.now()-s.startTime)/1000);
    const pct=Math.round((s.correct/s.questions.length)*100);
    const streakBonus=s.maxStreak*15;
    const timeBonus=Math.max(0,200-timeS);
    const total=pct*10+streakBonus+timeBonus;
    
    if(pct===100) Sound.win(); else Sound.blip(440);
    
    App.showScore('quiz',{
      correct:s.correct,
      total_q:s.questions.length,
      pct,
      maxStreak:s.maxStreak,
      time:timeS,
      total,
      perfect:pct===100
    });
  }
};
window.Quiz=Quiz;
