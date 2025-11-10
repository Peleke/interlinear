# Latin Analyzer Microservice

FastAPI + CLTK microservice for Latin morphological analysis.

## Features
- Lemmatization
- Part-of-speech tagging
- Morphological analysis
- Dependency parsing (optional)

## Quick Start

```bash
# Build and run with Docker
docker-compose up --build

# Or run locally
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API Endpoints

- `POST /analyze` - Analyze Latin text
- `GET /health` - Health check

## Example Request

```json
POST /analyze
{
  "text": "puella bona est"
}
```

## Example Response

```json
{
  "words": [
    {
      "form": "puella",
      "lemma": "puella",
      "pos": "NOUN",
      "morphology": {
        "case": "nominative",
        "number": "singular",
        "gender": "feminine"
      }
    }
  ]
}
```
