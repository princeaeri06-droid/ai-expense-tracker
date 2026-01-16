from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List
from PIL import Image
import pytesseract
import uvicorn
import re
from io import BytesIO

app = FastAPI(
    title="Receipt OCR Service",
    description="Uploads an image, extracts text via Tesseract, and returns amount + item candidates.",
    version="0.1.0",
)


class OCRResponse(BaseModel):
    amount: float | None
    items: List[str]
    rawText: str


currency_pattern = re.compile(r'(\d+[.,]\d{2})')


def extract_amount(text: str) -> float | None:
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


@app.get("/health")
def health():
    return {"service": "ocr", "status": "ok"}


@app.post("/ocr", response_model=OCRResponse)
async def run_ocr(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    content = await file.read()
    try:
        image = Image.open(BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read image: {exc}") from exc

    text = pytesseract.image_to_string(image)
    amount = extract_amount(text)
    items = extract_items(text)

    return OCRResponse(amount=amount, items=items, rawText=text)


if __name__ == "__main__":
    uvicorn.run("ocr:app", host="0.0.0.0", port=8000, reload=True)






