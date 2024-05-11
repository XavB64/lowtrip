FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY *.py .

ENV FLASK_DEBUG=True

COPY static/ static/