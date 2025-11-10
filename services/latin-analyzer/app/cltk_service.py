"""CLTK integration service for Latin morphological analysis."""

import logging
from typing import List, Optional, Dict, Any
from cltk import NLP

from app.models import WordAnalysis, MorphologyData

logger = logging.getLogger(__name__)


class CLTKService:
    """Service for CLTK Latin analysis."""

    def __init__(self):
        """Initialize CLTK with Latin language models."""
        self.nlp: Optional[NLP] = None
        self._initialize_cltk()

    def _initialize_cltk(self) -> None:
        """Initialize CLTK NLP pipeline for Latin."""
        try:
            logger.info("Initializing CLTK with Latin language models...")
            self.nlp = NLP(language="lat", suppress_banner=True)
            logger.info("CLTK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize CLTK: {e}")
            self.nlp = None

    def is_ready(self) -> bool:
        """Check if CLTK is ready."""
        return self.nlp is not None

    def analyze_text(
        self,
        text: str,
        include_morphology: bool = True,
        include_dependencies: bool = False
    ) -> List[WordAnalysis]:
        """
        Analyze Latin text using CLTK.

        Args:
            text: Latin text to analyze
            include_morphology: Whether to include detailed morphological analysis
            include_dependencies: Whether to include dependency parsing

        Returns:
            List of WordAnalysis objects
        """
        if not self.nlp:
            raise RuntimeError("CLTK is not initialized")

        # Process text with CLTK
        doc = self.nlp.analyze(text=text)

        words: List[WordAnalysis] = []

        for i, word in enumerate(doc.words):
            # Extract lemma
            lemma = word.lemma if hasattr(word, 'lemma') else None

            # Extract POS
            pos = word.upos if hasattr(word, 'upos') else None

            # Extract morphology if requested
            morphology_data = None
            if include_morphology and hasattr(word, 'features'):
                morphology_data = self._parse_morphology(word.features)

            # Extract dependency info if requested
            dependency_data = None
            if include_dependencies and hasattr(word, 'dependency_relation'):
                dependency_data = {
                    "relation": word.dependency_relation,
                    "governor": word.governor if hasattr(word, 'governor') else None
                }

            words.append(WordAnalysis(
                form=word.string,
                lemma=lemma,
                pos=pos,
                morphology=morphology_data,
                dependency=dependency_data,
                index=i
            ))

        return words

    def _parse_morphology(self, features: Dict[str, Any]) -> Optional[MorphologyData]:
        """
        Parse CLTK morphological features into structured format.

        Args:
            features: Raw CLTK features dictionary

        Returns:
            MorphologyData object or None
        """
        if not features:
            return None

        return MorphologyData(
            case=features.get("Case"),
            number=features.get("Number"),
            gender=features.get("Gender"),
            tense=features.get("Tense"),
            voice=features.get("Voice"),
            mood=features.get("Mood"),
            person=features.get("Person"),
            degree=features.get("Degree")
        )


# Global CLTK service instance
cltk_service = CLTKService()
