FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y

RUN groupadd -r gunicorn && useradd --no-log-init -r -g gunicorn gunicorn
USER gunicorn

ENV PATH="/home/gunicorn/.local/bin:${PATH}"

WORKDIR /home/gunicorn

COPY --chown=gunicorn:gunicorn requirements.txt .

RUN pip install --user --no-cache-dir -r requirements.txt

COPY --chown=gunicorn:gunicorn *.py ./
COPY --chown=gunicorn:gunicorn static/ static/

ENV FLASK_DEBUG=True
