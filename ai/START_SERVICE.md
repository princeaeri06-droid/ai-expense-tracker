# Starting the AI Service

## Quick Start

1. **Activate the virtual environment** (required):
   ```bash
   # Windows PowerShell
   .\.venv\Scripts\activate.ps1
   
   # Windows CMD
   .venv\Scripts\activate.bat
   
   # macOS/Linux
   source .venv/bin/activate
   ```

2. **Start the unified AI service**:
   ```bash
   uvicorn unified_service:app --reload --port 8000
   ```

## Troubleshooting

### "ModuleNotFoundError: No module named 'pytesseract'"
- Make sure the virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`

### "Tesseract OCR is not installed"
The `pytesseract` Python package requires the Tesseract OCR binary to be installed on your system.

**Windows:**
1. Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install it (default location: `C:\Program Files\Tesseract-OCR\tesseract.exe`)
3. Add to PATH or set environment variable:
   ```powershell
   $env:PYTESSERACT_CMD = "C:\Program Files\Tesseract-OCR\tesseract.exe"
   ```

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

### Service won't start
- Check that port 8000 is not already in use
- Make sure all dependencies are installed in the virtual environment
- Verify the virtual environment is activated before starting

## Services Included

The unified service includes:
- **OCR** (`/ocr`) - Extract text from receipt images
- **Categorization** (`/categorize`) - Auto-categorize expenses
- **Prediction** (`/predict`) - Predict future spending

## Health Check

Test if the service is running:
```bash
curl http://localhost:8000/health
```









