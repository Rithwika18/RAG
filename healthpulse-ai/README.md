# HealthPulse AI - Medical Report Analyzer

An AI-powered medical report analyzer application using **Retrieval-Augmented Generation (RAG)**. Users can upload lab test PDFs, instantly extract insights, detect abnormal blood readings, compare trends over time, and ask context-guided questions using local or cloud AI models.

---

## Key Features

- **Dynamic RAG Pipeline**: Uses ChromaDB and sentence-transformers locally to query context.
- **BYOK (Bring Your Own Key)**: Choose OpenAI, Gemini, or Claude. Keys are stored safely in local browser storage only.
- **Local AI Support**: Fully integrates with local Ollama instances (llama3, mistral, gemma).
- **Abnormal Value Detection**: Identifies lab values that fall outside reference ranges.
- **Doctor Consultation Prep**: Generates questions to ask, key observations, and suggested follow-ups.
- **Chronological Compare**: Line-chart tracking for Glucose, Cholesterol, Hemoglobin, etc.
- **Multilingual Output**: Get analyses in English, Hindi, or Telugu.

---

## Directory Structure

```
report_anlysics/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── config.py         # Configs & Directory creation
│   │   ├── database.py       # SQL Alchemy engines
│   │   ├── models.py         # SQLite Tables definitions
│   │   ├── schemas.py        # Pydantic payloads validations
│   │   ├── crud.py           # DB mutations
│   │   ├── auth.py           # Passwords hashing & JWT Token
│   │   ├── rag.py            # PDF text extract, ChromaDB, LLMs routes
│   │   └── routes/           # Auth, reports & settings endpoints
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── frontend/                 # React & Vite client
│   ├── src/
│   │   ├── context/          # State engines for keys & JWT
│   │   ├── components/       # Charts, UploadBox, ChatWindow, etc.
│   │   └── pages/            # View dashboards, logins, comparisons
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
└── docker-compose.yml
```

---

## Local Setup

### 1. Prerequisite: Local Ollama (Optional)
If using Local AI mode:
1. Download Ollama from [ollama.com](https://ollama.com).
2. Start the local daemon:
   ```bash
   ollama run llama3
   ```

### 2. Backend Setup
1. Move to backend folder and create a virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 3. Frontend Setup
1. Move to frontend folder:
   ```bash
   cd ../frontend
   npm install
   ```
2. Launch Vite developer server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## Running with Docker Compose

To spin up both services in parallel, run:
```bash
docker-compose up --build
```
- Frontend will be available at `http://localhost:5173`.
- Backend will be running at `http://localhost:8000`.

---

## Cloud Deployment

### 1. Backend on Render
1. Create a Web Service on [Render](https://render.com).
2. Select your repository, and set environment: **Docker**.
3. Point build context to `./backend` or use the main `backend/Dockerfile`.
4. Set environment variables:
   - `SECRET_KEY` (a random secure hash)
   - `DATABASE_URL` (optional, defaults to SQLite local storage)

### 2. Frontend on Vercel
1. Link your repository to [Vercel](https://vercel.com).
2. Set build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL` (points to your deployed Render URL)
