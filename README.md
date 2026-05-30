# llm.playground v2.0

Juego para enseñar cómo funciona un LLM, mientras alguien vibecodea en AI Studio.

## qué incluye

**3 juegos reales** (con leaderboard local):

1. **Temperature Roulette** — escribes una historia con la IA, eliges la temperatura de cada párrafo (0.2 a 2.0). Al final, la propia IA califica tu historia en coherencia y creatividad.
2. **Agente Escape Room** — estás en un cuarto cerrado. Le hablas en lenguaje natural a un agente IA que tiene tools (look, pickup, use, open, combine). El agente decide qué tool usar. Ves el trace en vivo.
3. **Prompt Injection Defender** — eres el guardián de un chatbot con un secreto. Escribes el system prompt y 7 NPCs lanzan ataques de prompt injection (autoridad, roleplay, urgencia, encoding, jailbreak, etc.). Ganas si bloqueas todos.

**Tutorial** — 5 niveles cortos como warmup (tokens, temp, prompting, contexto, agentes).

**Sandbox** — experimentación libre con sliders + 5 modelos Gemini.

**Leaderboard local** — top 10 por juego, guardado en `localStorage`.

**Bilingüe** ES/EN con toggle.

## cómo correrlo

Abre `index.html` en cualquier navegador. Listo.

Para deploy: súbelo a GitHub Pages, Vercel, Netlify, o cualquier static host. Solo necesita servir archivos estáticos.

## API keys (opcional pero recomendado para los juegos)

Click "api key" en la esquina:

- **AI Studio**: pega tu key de https://aistudio.google.com/app/apikey (gratis, fácil)
- **Vertex AI**: project + location + access token (`gcloud auth print-access-token`)

Todo en `localStorage`. Nada se envía a ningún server.

## minimizar costos de API

El default es **`gemini-2.5-flash-lite`** (~5x más barato que Flash). Está hardcoded en `app.js`:

```js
const useModel=model||'gemini-2.5-flash-lite';
```

En sandbox puedes cambiar modelo desde el dropdown.

**Estimado por juego**:
- Roulette: ~5 calls × ~150 tokens = 750 tokens
- Escape: ~5-10 calls × ~200 tokens = 1k-2k tokens
- Defender: 7 calls × ~150 tokens = ~1k tokens

Con Flash-Lite eso es < $0.001 por partida.

## estructura

```
llm-game/
├── index.html        # markup
├── styles.css        # estética (terminal retro-futurista)
├── i18n.js           # strings ES/EN + datos de niveles
├── games.js          # lógica de los 3 juegos
└── app.js            # bootstrap, sandbox, tutorial, leaderboard
```

## flujo recomendado para el evento

1. La persona empieza a vibecodear en AI Studio (5-7 min)
2. Abre el playground en otra pestaña
3. Click "▶ jugar" → elige un juego (2-5 min c/u)
4. Compite por leaderboard con los demás del evento

## customizar

- **Cambiar password del Defender**: en `games.js`, busca `const password='RHINO-7842'`
- **Agregar más ataques al Defender**: en `games.js`, busca `attacks_es` / `attacks_en`
- **Cambiar la lógica del Escape Room**: `games.js` → `Games.escape.executeTool()`
- **Agregar idiomas**: copia el bloque `es:` o `en:` de `i18n.js`
- **Cambiar modelos disponibles**: edita el `<select id="sb-model">` en `index.html`

## limpiar datos guardados

En consola del browser:
```js
localStorage.clear()
```
