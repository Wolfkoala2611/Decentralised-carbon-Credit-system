# CarbonChain Backend

Run from this folder:

```bash
cd /Users/xsoul/Downloads
npm start
```

Or run directly:

```bash
node /Users/xsoul/Downloads/carbonchain_server.js
```

Open `http://localhost:3000`.

Optional cloud AI:

```bash
OPENAI_API_KEY=your_openai_key_here npm start
```

or:

```bash
GROK_API_KEY=your_xai_key_here npm start
```

Gemini is also supported:

```bash
GEMINI_API_KEY=your_gemini_key_here npm start
```

Provider priority is OpenAI, then Grok, then Gemini, then local fallback. You can override models with `OPENAI_MODEL`, `GROK_MODEL`, or `GEMINI_MODEL`.

For hackathon demos, the backend never sends provider quota/network errors to the UI. If all cloud providers fail, the project verification and calculator advice still return local AI-style output.
