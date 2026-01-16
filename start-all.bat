@echo off
echo ===========================
echo STARTING AI SERVICES
echo ===========================
cd ai
echo Starting unified AI service (OCR, Categorization, Prediction)...
echo Make sure virtual environment is activated!
start cmd /k ".venv\Scripts\activate && uvicorn unified_service:app --reload --port 8000"
timeout /t 3

echo ===========================
echo STARTING NODE BACKEND
echo ===========================
cd ../server
start cmd /k "npm run dev"
timeout /t 3

echo ===========================
echo STARTING REACT FRONTEND
echo ===========================
cd ../client
start cmd /k "npm run dev"

echo ===========================
echo ALL SERVICES STARTED!
echo FRONTEND: http://localhost:5173
echo BACKEND:  http://localhost:5000
echo AI:       http://localhost:8000
pause
