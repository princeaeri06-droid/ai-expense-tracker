# AI Expense Tracker Monorepo

Full MERN + AI starter with three services:

- `client` — React + Vite + Tailwind UI (port 5173)
- `server` — Express API + MongoDB connector (port 5000)
- `ai` — FastAPI microservice for AI helpers (port 8000)

## Quick start

```bash
# Client
cd client
npm install
npm run dev

# Server
cd server
npm install
cp .env.example .env  # adjust Mongo credentials
npm run dev

# AI service
cd ai
python -m venv .venv && .venv\\Scripts\\activate  # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Category service (Naive Bayes)
cd ai
python -m venv .venv && .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn categorize:app --reload --port 8000

# OCR service (pytesseract)
cd ai
python -m venv .venv && .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn ocr:app --reload --port 8000

# Prediction service (Linear Regression)
cd ai
python -m venv .venv && .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn predict:app --reload --port 8000
```

## Endpoints

- Client: `http://localhost:5173`
- API health: `GET http://localhost:5000/api/health`
- Auth signup: `POST http://localhost:5000/api/auth/signup`
- Auth login: `POST http://localhost:5000/api/auth/login`
- Auth token check: `GET http://localhost:5000/api/auth/me` (requires `Authorization: Bearer <token>`)
- Secure sample: `GET http://localhost:5000/api/secure/ping` (requires token)
- Add expense: `POST http://localhost:5000/api/add-expense` (requires token)
- List expenses: `GET http://localhost:5000/api/expenses` (requires token)
- Update expense: `PATCH http://localhost:5000/api/expense/:id` (requires token)
- Delete expense: `DELETE http://localhost:5000/api/expense/:id` (requires token)
- AI health: `GET http://localhost:8000/health`
- AI analysis: `POST http://localhost:8000/analyze`
- AI categorization: `POST http://localhost:8000/categorize`
- AI OCR: `POST http://localhost:8000/ocr` (multipart image upload)
- AI forecast: `POST http://localhost:8000/predict`

## Environment variables

Copy `env.template` and fill in values for each platform:

```bash
cp env.template server/.env         # Render backend
cp env.template client/.env         # Vercel frontend (VITE_* values only)
cp env.template ai/.env             # Railway FastAPI services
```

| Key | Description |
| --- | ----------- |
| `MONGO_URI` | MongoDB connection string used by the Express API (Render) |
| `JWT_SECRET` | Secret for signing JWTs on the API |
| `VITE_API_BASE_URL` | Base URL of the deployed API (e.g., Render URL) |
| `VITE_AI_BASE_URL` | Base URL for the selected AI microservice (Railway) |
| `FASTAPI_PORT` | Port binding for Railway (set to `8000`) |
| `PYTESSERACT_CMD` | Optional path to Tesseract binary if Railway needs explicit command |

## Deployment guide

### Server → Render
1. Push this repo to GitHub.
2. In Render, create a **Web Service**:
   - Repository: select this project.
   - Root directory: `server`.
   - Runtime: Node 20+.
   - Build command: `npm install`.
   - Start command: `npm run start`.
3. Add environment variables from `server/.env` (`PORT`, `MONGO_URI`, `JWT_SECRET`).
4. Provision MongoDB (Render, Atlas, or external) and paste the URI.
5. Deploy; Render will expose the API URL (e.g., `https://expense-api.onrender.com`).

### AI services → Railway
1. Create a new Railway project and choose **Deploy from Repo** or **Dockerfile**:
   - Root directory: `ai`.
   - Build command: `pip install -r requirements.txt`.
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
   - Repeat deployments with `categorize:app`, `ocr:app`, or `predict:app` if you want dedicated instances.
2. Set `PORT` (Railway provides automatically) and any optional vars (`PYTESSERACT_CMD` if OCR needs it).
3. Confirm `scikit-learn`, `pytesseract`, etc., install; you may need to add Railway plugins (e.g., apt package for Tesseract) if OCR requires OS deps.

### Client → Vercel
1. Import the GitHub repo into Vercel.
2. In **Project Settings → Build & Development Settings**:
   - Root directory: `client`.
   - Framework preset: Vite.
   - Build command: `npm run build`.
   - Output directory: `dist`.
3. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = Render API URL.
   - `VITE_AI_BASE_URL` = Railway AI URL.
4. Deploy; Vercel will host the SPA at `https://your-client.vercel.app`.

## Next steps

- Wire client to API endpoints for expense CRUD.
- Add persistence models + validation on the server.
- Replace dummy AI logic with actual ML/NLP pipelines or third-party API calls.

