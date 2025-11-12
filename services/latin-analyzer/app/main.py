"""FastAPI application for Latin text analysis using CLTK."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import AnalyzeRequest, AnalyzeResponse, HealthResponse
from app.cltk_service import cltk_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Latin Analyzer API",
    description="Microservice for Latin morphological analysis using CLTK",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service status and CLTK readiness.
    """
    return HealthResponse(
        status="healthy",
        cltk_ready=cltk_service.is_ready(),
        version="1.0.0"
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """
    Analyze Latin text using CLTK.

    Args:
        request: AnalyzeRequest containing text and options

    Returns:
        AnalyzeResponse with word-level analysis

    Raises:
        HTTPException: If CLTK is not ready or analysis fails
    """
    if not cltk_service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="CLTK service is not ready. Please try again later."
        )

    try:
        logger.info(f"Analyzing text: {request.text[:50]}...")

        words = cltk_service.analyze_text(
            text=request.text,
            include_morphology=request.include_morphology,
            include_dependencies=request.include_dependencies
        )

        return AnalyzeResponse(
            success=True,
            words=words,
            raw_text=request.text,
            error=None
        )

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        return AnalyzeResponse(
            success=False,
            words=[],
            raw_text=request.text,
            error=str(e)
        )


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Latin Analyzer API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze (POST)",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
