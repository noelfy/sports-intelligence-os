FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV/MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
COPY pose_estimation/requirements.txt pose_estimation/
COPY backend/requirements.txt backend/
COPY analysis_engine/requirements.txt analysis_engine/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /var/data/uploads /var/data/output /var/data/static /var/data/calibration /var/data/recordings

# Expose port (Render sets PORT env var)
EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
