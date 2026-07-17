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

# For VPS/Docker Compose/Render/Railway: runs start.sh which waits for the DB, runs migrations, seeds data, and starts the server.
CMD ["./start.sh"]

