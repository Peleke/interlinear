# EPIC 001: Language-Agnostic Content Generation Architecture

**Epic ID**: EPIC-LANG-001
**Business Value**: Enable content creation for any language, starting with Latin
**Effort**: 13 Story Points
**Priority**: Critical
**Security Impact**: Medium - New LLM API surface area
**Performance Impact**: None (Spanish), <10s (Latin)

## Technical Overview

Transform the Spanish-only content authoring system into a language-agnostic platform using the Strategy pattern with language-specific processors. Maintain zero-regression for Spanish while adding Latin support through LLM-based processing.

### Architecture Decision Records

**ADR-001: Language Processor Strategy Pattern**
- **Decision**: Use Strategy pattern with factory for language routing
- **Rationale**: Enables adding languages without modifying existing code
- **Security**: Each processor validates inputs independently
- **Performance**: Spanish keeps existing NLP.js, Latin uses optimized LLM calls

**ADR-002: LLM vs NLP Library for Latin**
- **Decision**: Use OpenAI API for Latin processing instead of building NLP
- **Rationale**: 90% faster delivery, better accuracy for complex Latin morphology
- **Security**: API key rotation, request validation, response sanitization
- **Trade-off**: External dependency vs months of NLP development

### Security Requirements

1. **Input Validation**: All text inputs sanitized before LLM processing
2. **API Security**: OpenAI API keys in environment, request rate limiting
3. **Data Privacy**: No user content stored in logs or external caches
4. **Error Handling**: No sensitive information in error messages

### Performance Requirements

1. **Spanish Baseline**: Zero performance regression (<2s current)
2. **Latin Target**: <10s end-to-end processing for typical lesson
3. **Caching**: Aggressive caching for LLM responses (24h TTL)
4. **Fallback**: Graceful degradation if LLM API unavailable

### Flexibility Architecture

```typescript
// Core abstraction enables unlimited language support
interface LanguageProcessor {
  readonly language: Language;
  readonly capabilities: ProcessingCapabilities;

  extractVocabulary(text: string, options: VocabOptions): Promise<VocabCandidate[]>;
  identifyGrammar(text: string, options: GrammarOptions): Promise<GrammarConcept[]>;
  generateExercises(context: ExerciseContext): Promise<Exercise[]>;

  // Extensibility hooks
  validateInput(text: string): ValidationResult;
  estimateProcessingTime(text: string): number;
  getProcessingCost?(text: string): CostEstimate;
}

// Future extensibility
type Language = 'es' | 'la' | 'fr' | 'de' | 'gr';
type ProcessingCapabilities = {
  vocabulary: boolean;
  grammar: boolean;
  exercises: boolean;
  morphology: boolean;
  syntax: boolean;
};
```

### Database Schema Changes

**New Table: `language_processing_cache`**
```sql
CREATE TABLE language_processing_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL,
    language language_enum NOT NULL,
    processing_type TEXT NOT NULL, -- 'vocabulary' | 'grammar' | 'exercises'
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',

    UNIQUE(content_hash, language, processing_type)
);

CREATE INDEX idx_language_cache_lookup ON language_processing_cache(content_hash, language, processing_type);
CREATE INDEX idx_language_cache_cleanup ON language_processing_cache(expires_at);
```

### API Contract Specifications

**Content Generation Workflow API**
```typescript
// EXISTING: Must maintain exact compatibility
POST /api/content-generation/workflow
{
  text: string;
  language: 'es'; // CURRENTLY HARD-CODED
  options: {
    maxVocabulary: number;
    includeGrammar: boolean;
    exerciseTypes: ExerciseType[];
  };
}

// NEW: Enhanced with language parameter
POST /api/content-generation/workflow
{
  text: string;
  language: 'es' | 'la'; // NEW: Support both languages
  options: {
    maxVocabulary: number;
    includeGrammar: boolean;
    exerciseTypes: ExerciseType[];
    // NEW: Language-specific options
    processingHints?: LanguageHints;
  };
}
```

### Implementation Stories

1. **STORY-001**: Language Processor Architecture Foundation
2. **STORY-002**: Latin Language Processor Implementation
3. **STORY-003**: Refactor Existing Tools for Language Routing
4. **STORY-004**: UI Component Language Propagation

### Success Criteria

- [ ] Spanish content generation: Zero performance regression
- [ ] Latin content generation: <10s processing time
- [ ] Architecture supports adding French in <1 day
- [ ] Security: All inputs validated, no data leakage
- [ ] Caching: 80%+ cache hit rate for repeated content

### Risk Mitigation

**Technical Risks**:
- **Spanish Regression**: Comprehensive test suite, feature flags
- **LLM API Reliability**: Retry logic, exponential backoff, fallback processing
- **Performance**: Aggressive caching, parallel processing, timeout handling

**Security Risks**:
- **API Key Exposure**: Environment variables, key rotation procedures
- **Input Injection**: Comprehensive sanitization, character limits
- **Data Leakage**: No content logging, sanitized error messages

### Monitoring & Observability

**Key Metrics**:
- Processing time by language (p50, p95, p99)
- Error rates by processor type
- Cache hit rates
- LLM API usage and costs
- User adoption by language

**Alerts**:
- Processing time >15s (Latin) or >5s (Spanish)
- Error rate >5% for any processor
- Cache hit rate <70%
- LLM API failures >3 consecutive