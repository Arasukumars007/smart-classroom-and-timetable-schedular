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

EXPOSE 8000

# Run migrations, seed sample data (skipped if already seeded), then start the server.
# PORT is provided by Render at runtime; falls back to 8000 for local Docker use.
CMD sh -c "alembic upgrade head && python seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
