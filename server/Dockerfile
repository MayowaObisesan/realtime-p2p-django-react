FROM python:3.9
LABEL authors="mayowa"

WORKDIR /app

COPY requirements.txt .

RUN apt update && apt upgrade -y && \
    pip install --upgrade pip &&  \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
