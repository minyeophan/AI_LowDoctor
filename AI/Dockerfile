FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-kor \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "ai_api:app", "--host", "0.0.0.0", "--port", "8000"]
