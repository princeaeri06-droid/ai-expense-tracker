from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

app = FastAPI(
    title="AI Expense Assistant",
    description="Prototype AI layer for the expense tracker. Runs on port 8000.",
    version="0.1.0",
)


class ExpenseItem(BaseModel):
    title: str
    amount: float = Field(gt=0, description="Amount spent in the chosen currency")
    category: str | None = None


class ExpensePayload(BaseModel):
    currency: str = "USD"
    expenses: List[ExpenseItem]


@app.get("/health")
def health():
    return {"service": "ai-service", "status": "ok", "timestamp": datetime.utcnow()}


@app.post("/analyze")
def analyze(payload: ExpensePayload):
    total = sum(item.amount for item in payload.expenses)
    average = total / len(payload.expenses) if payload.expenses else 0
    categories = {item.category or "uncategorized" for item in payload.expenses}

    return {
        "currency": payload.currency,
        "total": round(total, 2),
        "average": round(average, 2),
        "uniqueCategories": sorted(categories),
        "recommendation": "Great job keeping expenses organized! Sync with the API to persist these insights.",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

