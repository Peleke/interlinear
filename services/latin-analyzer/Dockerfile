FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (git needed for CLTK model downloads)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Note: CLTK models will be downloaded on first API call (lazy loading)
# This avoids build failures and allows the service to start immediately

# Copy application code
COPY ./app /app/app

# Expose port
EXPOSE 8000

# Configure GitPython for CLTK (suppress warnings + explicit git path)
ENV GIT_PYTHON_REFRESH=quiet
ENV GIT_PYTHON_GIT_EXECUTABLE=/usr/bin/git

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
