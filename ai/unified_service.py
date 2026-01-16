"""
Unified AI Service - Combines OCR, Categorization, and Prediction services
Run this with: uvicorn unified_service:app --reload --port 8000
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime
from PIL import Image
import pytesseract
import re
from io import BytesIO
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LinearRegression
import numpy as np

app = FastAPI(
    title="Unified AI Expense Service",
    description="Combined OCR, Categorization, and Prediction service for expense tracker",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Categorization Model ==========
TRAINING_SAMPLES = [
    ("Dinner at Italian restaurant", "Pasta, drinks and dessert with friends", "Food"),
    ("Weekly grocery run", "Bought vegetables, fruits and snacks", "Food"),
    ("Uber to airport", "Ride share trip for business travel", "Travel"),
    ("Flight to New York", "Round trip ticket for conference", "Travel"),
    ("Electricity bill", "Monthly utility payment", "Bills"),
    ("Internet subscription", "Fiber plan invoice for November", "Bills"),
    ("New sneakers", "Online shopping for running shoes", "Shopping"),
    ("Bought gifts", "Birthday presents ordered online", "Shopping"),
]

def build_categorization_model():
    texts = [f"{title} {desc}" for title, desc, _ in TRAINING_SAMPLES]
    labels = [label for *_, label in TRAINING_SAMPLES]
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(stop_words="english")),
        ("nb", MultinomialNB()),
    ])
    pipeline.fit(texts, labels)
    return pipeline

categorization_model = build_categorization_model()

# ========== Models ==========
class ExpenseText(BaseModel):
    title: str
    description: str = ""

class CategorizationResponse(BaseModel):
    category: Literal["Food", "Travel", "Bills", "Shopping"]
    confidence: float

class MonthlyExpense(BaseModel):
    month: str
    total: float

class ForecastRequest(BaseModel):
    history: List[MonthlyExpense]

class ForecastResponse(BaseModel):
    predictedMonth: str
    predictedTotal: float
    explanation: str

class OCRResponse(BaseModel):
    amount: Optional[float] = None
    items: List[str] = []
    rawText: str

# ========== Routes ==========
@app.get("/health")
def health():
    return {
        "service": "unified-ai-service",
        "status": "ok",
        "timestamp": datetime.utcnow(),
        "features": ["ocr", "categorize", "predict"]
    }

# ========== OCR Endpoint ==========
currency_pattern = re.compile(r'(\d+[.,]\d{2})')

def extract_amount(text: str) -> Optional[float]:
    matches = currency_pattern.findall(text.replace(',', '.'))
    if not matches:
        return None
    try:
        return round(float(matches[-1]), 2)
    except ValueError:
        return None

def extract_items(text: str) -> List[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidates = []
    for line in lines:
        if any(char.isdigit() for char in line) and any(char.isalpha() for char in line):
            candidates.append(line)
        elif len(line.split()) >= 2:
            candidates.append(line)
        if len(candidates) >= 5:
            break
    return candidates

@app.post("/ocr", response_model=OCRResponse)
async def run_ocr(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    content = await file.read()
    try:
        image = Image.open(BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read image: {exc}") from exc

    try:
        text = pytesseract.image_to_string(image)
    except Exception as exc:
        error_msg = str(exc)
        if "tesseract" in error_msg.lower() or "is not installed" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Tesseract OCR is not installed. Please install Tesseract OCR on your system. "
                       "Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki. "
                       "Then set PYTESSERACT_CMD environment variable to the tesseract.exe path."
            )
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {error_msg}")
    
    amount = extract_amount(text)
    items = extract_items(text)

    return OCRResponse(amount=amount, items=items, rawText=text)

# ========== Categorization Endpoint ==========
@app.post("/categorize", response_model=CategorizationResponse)
def categorize(expense: ExpenseText):
    text = f"{expense.title} {expense.description}"
    proba = categorization_model.predict_proba([text])[0]
    classes = categorization_model.classes_
    best_idx = proba.argmax()
    return {
        "category": classes[best_idx],
        "confidence": round(float(proba[best_idx]), 3)
    }

# ========== Prediction Endpoint ==========
def train_and_predict(history: List[MonthlyExpense]) -> tuple[str, float, str]:
    if len(history) < 2:
        raise ValueError("Need at least two months of history to predict.")

    y = np.array([entry.total for entry in history])
    X = np.arange(len(history)).reshape(-1, 1)

    model = LinearRegression()
    model.fit(X, y)

    next_index = len(history)
    prediction = model.predict([[next_index]])[0]
    predicted_month = "Next Month"

    slope = model.coef_[0]
    trend = "increasing" if slope > 0 else "decreasing" if slope < 0 else "steady"
    explanation = (
        f"Detected a {trend} trend of ${abs(slope):.2f} per month. "
        f"Based on {len(history)} months of data."
    )

    return predicted_month, float(round(prediction, 2)), explanation

@app.post("/predict", response_model=ForecastResponse)
def predict(request: ForecastRequest):
    try:
        predicted_month, total, explanation = train_and_predict(request.history)
        return ForecastResponse(
            predictedMonth=predicted_month,
            predictedTotal=total,
            explanation=explanation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

# ========== Retrain Model Endpoint ==========
class TrainingDataItem(BaseModel):
    title: str
    description: str = ""
    category: str

class RetrainRequest(BaseModel):
    training_data: List[TrainingDataItem]
    user_id: Optional[str] = None

@app.post("/retrain")
def retrain_model(request: RetrainRequest):
    try:
        if len(request.training_data) < 3:
            raise HTTPException(status_code=400, detail="Need at least 3 training samples")
        
        # Combine new training data with existing samples
        all_training = TRAINING_SAMPLES.copy()
        for item in request.training_data:
            all_training.append((item.title, item.description, item.category))
        
        # Rebuild model with combined data
        global categorization_model
        texts = [f"{title} {desc}" for title, desc, _ in all_training]
        labels = [label for *_, label in all_training]
        
        categorization_model = Pipeline([
            ("tfidf", TfidfVectorizer(stop_words="english")),
            ("nb", MultinomialNB()),
        ])
        categorization_model.fit(texts, labels)
        
        return {
            "status": "success",
            "message": "Model retrained successfully",
            "training_samples": len(all_training),
            "new_samples": len(request.training_data),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(exc)}") from exc

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("unified_service:app", host="0.0.0.0", port=8000, reload=True)





