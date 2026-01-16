from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from sklearn.linear_model import LinearRegression
import numpy as np
import uvicorn

app = FastAPI(
    title="Spending Forecast Service",
    description="Fits a linear regression on monthly totals and forecasts next month's spend.",
    version="0.1.0",
)


class MonthlyExpense(BaseModel):
    month: str
    total: float


class ForecastRequest(BaseModel):
    history: List[MonthlyExpense]


class ForecastResponse(BaseModel):
    predictedMonth: str
    predictedTotal: float
    explanation: str


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


@app.get("/health")
def health():
    return {"service": "predictor", "status": "ok"}


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


if __name__ == "__main__":
    uvicorn.run("predict:app", host="0.0.0.0", port=8000, reload=True)

