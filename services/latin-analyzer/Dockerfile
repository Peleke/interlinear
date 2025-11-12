FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (git needed for CLTK, curl for healthcheck)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# PRE-DOWNLOAD MODELS AT BUILD TIME (production optimization)
# This adds ~500MB to image but eliminates runtime download delays
RUN python -c "\
import os; \
os.environ['CLTK_INTERACTIVE'] = 'false'; \
from cltk import NLP; \
import stanza; \
print('Downloading Latin models...'); \
nlp = NLP(language='lat'); \
stanza.download('la', verbose=False); \
print('Models downloaded successfully');"

# Copy application code
COPY ./app /app/app

# Expose port
EXPOSE 8000

# Configure GitPython for CLTK (suppress warnings + explicit git path)
ENV GIT_PYTHON_REFRESH=quiet
ENV GIT_PYTHON_GIT_EXECUTABLE=/usr/bin/git

# Auto-approve CLTK/Stanza model downloads (no interactive prompts in Docker)
ENV CLTK_INTERACTIVE=false

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
