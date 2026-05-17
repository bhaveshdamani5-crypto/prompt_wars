# LexGuard AI — Contract Compliance & Redlining

AI legal shield for contract review: compliance scoring, threat detection, multi-agent redlines, simplification, negotiation, and chat — **powered only by Google Gemini**.

Repository: [github.com/bhaveshdamani5-crypto/prompt_wars](https://github.com/bhaveshdamani5-crypto/prompt_wars)

---

## API keys (Gemini only)

LexGuard does **not** use RAG or offline mock analysis. Every AI feature calls the **Gemini API**.

### 1. Main key (upload scan, simplify, negotiate, chat)

Create `backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
PORT=8000
HOST=0.0.0.0
```

### 2. When your main key quota is exhausted — use judge keys

The **3-agent courtroom** (Alpha / Beta / Gamma on the Redlines tab) can use **separate API keys** so analysis continues when the primary key hits quota limits:

```env
GEMINI_API_KEY_ALPHA=your_second_gemini_key
GEMINI_API_KEY_BETA=your_third_gemini_key
GEMINI_API_KEY_GAMMA=your_fourth_gemini_key
```

You can also provide a comma-separated pool:

```env
GEMINI_API_KEYS=key1,key2,key3
```

**Recommended when the main `GEMINI_API_KEY` is exhausted:** add at least the three judge keys above. Redlines and multi-agent debate will keep working on those keys while you refresh quota on the primary key.

> Do not commit `.env` to Git. Use `.env.example` as a template.

---

## Quick start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
```

Add `GEMINI_API_KEY` to `backend/.env`, then:

```bash
python -m app.main
```

API: http://localhost:8000 · Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 · Workspace: http://localhost:5173/app

Or run both with `run_project.bat` (Windows).

---

## Features

| Feature | Endpoint | Engine |
|--------|----------|--------|
| Contract upload & audit | `POST /api/analyze` | Gemini |
| Sample contract | `POST /api/analyze/sample` | Gemini |
| 3-agent redline debate | `POST /api/analyze/clause` | Gemini (judge keys) |
| Simplify (3 tiers + 7 languages) | `POST /api/intelligence/simplify` | Gemini |
| Voice script | `POST /api/intelligence/voice-script` | Gemini |
| Negotiate | `POST /api/intelligence/negotiate/*` | Gemini |
| Document chat | `POST /api/chat` | Gemini |

The document viewer shows **material clauses only** (high-importance text). Highlighted spans show a **“Click to analyze →”** tooltip on hover.

---

## Deploy / clone from GitHub

```bash
git clone git@github.com:bhaveshdamani5-crypto/prompt_wars.git
cd prompt_wars
```

Configure `backend/.env` with your Gemini keys (see above), then start backend and frontend as in Quick start.

For production frontend, set the API URL:

```env
# frontend/.env
VITE_API_URL=https://your-api-host:8000
```

---

## Project structure

```
lexguard-ai/
├── backend/          # FastAPI + Gemini services
├── frontend/         # React + Vite dashboard & landing
├── docs/             # Architecture notes
└── run_project.bat   # Local launcher (Windows)
```

---

## License

Use responsibly. LexGuard AI is not a substitute for licensed legal advice.
