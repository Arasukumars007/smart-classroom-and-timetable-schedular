FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure the startup script has Unix line endings and is executable
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

EXPOSE 8000

# For Railway: railway.json startCommand overrides this CMD.
# For VPS/Docker Compose: runs migrations then starts the server.
CMD sh -c "alembic upgrade head && python seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"

