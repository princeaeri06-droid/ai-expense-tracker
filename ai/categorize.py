from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from typing import Literal
import uvicorn

app = FastAPI(
    title="Expense Categorization Service",
    description="Simple Naive Bayes text classifier for expense titles and descriptions.",
    version="0.1.0",
)


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


def build_model():
    texts = [f"{title} {desc}" for title, desc, _ in TRAINING_SAMPLES]
    labels = [label for *_, label in TRAINING_SAMPLES]
    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(stop_words="english")),
            ("nb", MultinomialNB()),
        ]
    )
    pipeline.fit(texts, labels)
    return pipeline


model = build_model()


class ExpenseText(BaseModel):
    title: str
    description: str


class CategorizationResponse(BaseModel):
    category: Literal["Food", "Travel", "Bills", "Shopping"]
    confidence: float


@app.get("/health")
def health():
    return {"service": "categorizer", "status": "ok"}


@app.post("/categorize", response_model=CategorizationResponse)
def categorize(expense: ExpenseText):
    text = f"{expense.title} {expense.description}"
    proba = model.predict_proba([text])[0]
    classes = model.classes_
    best_idx = proba.argmax()
    return {"category": classes[best_idx], "confidence": round(float(proba[best_idx]), 3)}


if __name__ == "__main__":
    uvicorn.run("categorize:app", host="0.0.0.0", port=8000, reload=True)






