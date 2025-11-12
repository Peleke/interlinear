from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class AnalyzeRequest(BaseModel):
    """Request model for Latin text analysis."""
    text: str = Field(..., description="Latin text to analyze")
    include_morphology: bool = Field(default=True, description="Include detailed morphological analysis")
    include_dependencies: bool = Field(default=False, description="Include dependency parsing (slower)")


class MorphologyData(BaseModel):
    """Morphological analysis data."""
    case: Optional[str] = None
    number: Optional[str] = None
    gender: Optional[str] = None
    tense: Optional[str] = None
    voice: Optional[str] = None
    mood: Optional[str] = None
    person: Optional[str] = None
    degree: Optional[str] = None


class WordAnalysis(BaseModel):
    """Analysis result for a single word."""
    form: str = Field(..., description="Original word form")
    lemma: Optional[str] = Field(None, description="Dictionary form (lemma)")
    pos: Optional[str] = Field(None, description="Part of speech")
    morphology: Optional[MorphologyData] = Field(None, description="Detailed morphological features")
    dependency: Optional[Dict[str, Any]] = Field(None, description="Dependency parsing info")
    index: int = Field(..., description="Word position in text")


class AnalyzeResponse(BaseModel):
    """Response model for Latin text analysis."""
    success: bool = Field(..., description="Whether analysis succeeded")
    words: List[WordAnalysis] = Field(default_factory=list, description="Analyzed words")
    raw_text: str = Field(..., description="Original input text")
    error: Optional[str] = Field(None, description="Error message if failed")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    cltk_ready: bool = Field(..., description="Whether CLTK is loaded")
    version: str = Field(..., description="Service version")
