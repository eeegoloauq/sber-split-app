# Sber Split App

Сервис для удобного деления счета в ресторанах с использованием OCR для автоматического распознавания чеков.

## Технологический стек

### Frontend
- Vite
- React
- TypeScript

### Backend
- Python
- FastAPI
- Tesseract OCR
- Pillow

## Установка и запуск

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # для Linux/Mac
# или
.\venv\Scripts\activate  # для Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## Требования к системе
- Node.js 16+
- Python 3.8+
- Tesseract OCR
- Tesseract Russian Language Pack 