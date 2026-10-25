FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PORT=8000
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --upgrade pip && pip install -r /app/backend/requirements.txt
COPY backend/ /app/backend/
RUN useradd --system --uid 10001 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["sh","-c","uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]
