import { tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { LibraryService } from '@/lib/services/library'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DialogStartResult {
  sessionId: string
  aiMessage: string
  turnNumber: number
}

export interface DialogTurnResult {
  aiMessage: string
  turnNumber: number
  shouldEnd: boolean
}

export interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

export interface ProfessorOverview {
  summary: string
  grammarConcepts: string[]
  vocabThemes: string[]
  syntaxPatterns: string[]
}

export interface ProfessorReview {
  rating: 'Excelente' | 'Muy Bien' | 'Bien' | 'Necesita Práctica'
  summary: string
  strengths: string[]
  improvements: string[]
  errorBreakdown: {
    grammar: number
    vocabulary: number
    syntax: number
  }
}

// ============================================================================
// ZOD SCHEMAS (for tool validation and structured output)
// ============================================================================

const StartDialogSchema = z.object({
  textId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es')
})

const ContinueDialogSchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000)
})

const AnalyzeErrorsSchema = z.object({
  sessionId: z.string().uuid()
})

const GenerateOverviewSchema = z.object({
  textId: z.string().uuid(),
  language: z.enum(['es', 'la']).default('es')
})

const GenerateReviewSchema = z.object({
  sessionId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es'),
  errors: z.array(z.object({
    turn: z.number().int().positive(),
    errorText: z.string(),
    correction: z.string(),
    explanation: z.string(),
    category: z.enum(['grammar', 'vocabulary', 'syntax'])
  }))
})

const StartDialogRoleplaySchema = z.object({
  dialogId: z.string().uuid(),
  selectedRole: z.string().min(1),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es')
})

const ContinueDialogRoleplaySchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000),
  language: z.enum(['es', 'la']).default('es')
})

// Structured output schemas
const ErrorAnalysisOutputSchema = z.object({
  errors: z.array(z.object({
    turn: z.number().int().positive(),
    errorText: z.string().min(1),
    correction: z.string().min(1),
    explanation: z.string().min(10)
  }))
})

const ProfessorOverviewOutputSchema = z.object({
  summary: z.string().min(20),
  grammarConcepts: z.array(z.string()).min(1),
  vocabThemes: z.array(z.string()).min(1),
  syntaxPatterns: z.array(z.string()).min(1)
})

const ProfessorReviewOutputSchema = z.object({
  rating: z.enum(['Excelente', 'Muy Bien', 'Bien', 'Necesita Práctica']),
  summary: z.string().min(50),
  strengths: z.array(z.string()).min(2).max(3),
  improvements: z.array(z.string()).min(1).max(2),
  errorBreakdown: z.object({
    grammar: z.number().int().min(0),
    vocabulary: z.number().int().min(0),
    syntax: z.number().int().min(0)
  })
})
// English version for Latin lessons
const ProfessorReviewOutputSchemaEN = z.object({
  rating: z.enum(['Excellent', 'Very Good', 'Good', 'Needs Practice']),
  summary: z.string().min(50),
  strengths: z.array(z.string()).min(2).max(3),
  improvements: z.array(z.string()).min(1).max(2),
  errorBreakdown: z.object({
    grammar: z.number().int().min(0),
    vocabulary: z.number().int().min(0),
    syntax: z.number().int().min(0)
  })
})

// Structured output schema for per-turn correction
const TurnCorrectionOutputSchema = z.object({
  hasErrors: z.boolean(),
  correctedText: z.string(),
  errors: z.array(z.object({
    errorText: z.string(),
    correction: z.string(),
    explanation: z.string(),
    category: z.enum(['grammar', 'vocabulary', 'syntax'])
  }))
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Detect language (English vs Spanish vs Latin)
function detectLanguage(text: string): 'en' | 'es' | 'la' | 'mixed' {
  const englishWords = text.match(/\b(the|is|are|was|were|have|has|been|to|of|and|a|in|that|it|for|not|with|as|you|this|be|on|at|by|from)\b/gi) || []
  const spanishWords = text.match(/\b(el|la|los|las|de|que|es|en|y|a|un|una|por|con|para|del|como|al|lo|su|se|las|más|pero|su|me|ya|ser|ha|ha|sido|está|están|fue|será|son)\b/gi) || []
  const latinWords = text.match(/\b(est|sunt|eram|erat|fuit|sum|esse|et|in|ad|cum|per|ex|de|ab|pro|contra|inter|post|ante|sub|super|sine|propter|ob|quod|qui|quae|sed|autem|enim|nam|igitur|ergo|tamen|itaque|aut|vel|atque|nec|neque|non|nihil|quidam|aliquis|omnis|totus|magnus|parvus|bonus|malus|multus|paucus|primus|ultimus|novus|vetus|facere|dicere|dare|ire|venire|videre|audire|scire|posse|velle|debere|habere|tenere|capere|ducere|mittere|ponere|stare|sedere|iacere|currere|ambulare|venire|abire|redire|homo|vir|femina|puer|puella|rex|regina|deus|dea|terra|caelum|aqua|ignis|sol|luna|tempus|locus|urbs|domus|via|ager|silva|mons|mare|flumen|arbor|flos|animal|equus|canis|lex|ius|pax|bellum|victoria|mors|vita|corpus|anima|mens|cor|oculus|manus|pes|caput|verbum|nomen|res|causa|modus|genus|species|numerus|ordo|pars|totum)\b/gi) || []

  const wordCount = text.split(/\s+/).length || 1
  const englishRatio = englishWords.length / wordCount
  const spanishRatio = spanishWords.length / wordCount
  const latinRatio = latinWords.length / wordCount

  if (englishRatio > 0.5) return 'en'
  if (spanishRatio > 0.3) return 'es'
  if (latinRatio > 0.2) return 'la'
  if (englishRatio > 0.2) return 'mixed'

  return 'es' // Default fallback
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error

      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Timeout wrapper
async function invokeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM timeout')), timeoutMs)
    )
  ])
}

// ============================================================================
// TOOL 1: START DIALOG
// ============================================================================

export const startDialogTool = tool(
  async ({ textId, level, language = 'es' }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get text and vocabulary
    const text = await LibraryService.getText(textId)
    const vocab = await LibraryService.getVocabularyForText(textId)

    const vocabList = vocab.map(v => `${v.word}: ${v.definition || 'sin definición'}`).join('\n')

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .insert({
        user_id: user.id,
        text_id: textId,
        level: level
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Generate first AI message
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    // Generate language-appropriate system prompt
    const getSystemPrompt = () => {
      if (language === 'la') {
        return `You are a Latin conversation tutor for level ${level}.
Start a natural conversation based on this Latin text:

${text.content}

The student has learned these vocabulary words:
${vocabList}

Create questions that:
- Use vocabulary from the text
- Are appropriate for level ${level}
- Encourage complete responses
- Are natural and encouraging
- Help practice Latin conversation skills

Respond in simple, clear Latin appropriate for level ${level}. If the student responds in English, gently guide them to use Latin.

Your first question:`
      } else {
        return `Eres un tutor de español nivel ${level}.
Inicia una conversación natural basada en este texto:

${text.content}

El estudiante ha aprendido estas palabras:
${vocabList}

Haz preguntas que:
- Usen el vocabulario del texto
- Sean apropiadas para nivel ${level}
- Fomenten respuestas completas
- Sean naturales y alentadoras

Responde SOLO en español. No uses inglés.

Primera pregunta:`
      }
    }

    const systemPrompt = getSystemPrompt()

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate target language
    const detectedLang = detectLanguage(aiMessage)
    const expectedLang = language || 'es'
    if (detectedLang === 'en' && expectedLang !== 'en') {
      throw new Error(`AI responded in English, enforcing ${expectedLang}-only`)
    }

    // Save first turn
    const { error: turnError } = await supabase
      .from('dialog_turns')
      .insert({
        session_id: session.id,
        turn_number: 1,
        ai_message: aiMessage
      })

    if (turnError) throw turnError

    return {
      sessionId: session.id,
      aiMessage,
      turnNumber: 1
    }
  },
  {
    name: "start_dialog",
    description: "Start an AI tutor dialog session based on a library text and CEFR level",
    schema: StartDialogSchema
  }
)

// ============================================================================
// TOOL 2: CONTINUE DIALOG
// ============================================================================

export const continueDialogTool = tool(
  async ({ sessionId, userResponse }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Get text separately (no foreign key constraint after migration)
    const text = await LibraryService.getText(session.text_id)

    // Get language from the text
    const language = (text.language as 'es' | 'la') || 'es'

    // Get conversation history
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Build conversation history with language-appropriate labels
    const getLabels = (lang: string) => {
      if (lang === 'la') {
        return { tutor: 'Magister', student: 'Discipulus' };
      }
      return { tutor: 'Tutor', student: 'Estudiante' };
    };

    const labels = getLabels(language);
    const history = turns.map(turn => {
      return `${labels.tutor}: ${turn.ai_message}${turn.user_response ? `\n${labels.student}: ${turn.user_response}` : ''}`
    }).join('\n\n')

    const nextTurnNumber = turns.length + 1
    const shouldEnd = nextTurnNumber >= 10 // Auto-end after 10 turns

    // Generate AI response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    // Generate language-specific system prompt
    const generateSystemPrompt = () => {
      if (language === 'la') {
        return `You are a Latin conversation tutor for level ${session.level}.
Conversation so far:
${history}

The student responded: "${userResponse}"

${shouldEnd ? 'This is the final question. Thank the student and suggest ending the session with "Excellent practice! Let us review what you have learned."' : 'Continue the conversation:'}
- Acknowledge their response
- ${shouldEnd ? 'End the conversation naturally' : 'Ask a follow-up question'}
- Use vocabulary from the text
- Maintain level ${session.level}
- Be encouraging

Respond ONLY in Latin appropriate for level ${session.level}.

Your response:`
      } else {
        return `Eres un tutor de español nivel ${session.level}.
Conversación hasta ahora:
${history}

El estudiante respondió: "${userResponse}"

${shouldEnd ? 'Esta es la última pregunta. Agradece al estudiante y sugiere terminar la sesión con "¡Excelente práctica! Vamos a revisar lo que has aprendido."' : 'Continúa la conversación:'}
- Reconoce su respuesta
- ${shouldEnd ? 'Finaliza la conversación de forma natural' : 'Haz una pregunta de seguimiento'}
- Usa vocabulario del texto
- Mantén nivel ${session.level}
- Sé alentador

Responde SOLO en español.

Tu respuesta:`
      }
    };

    const systemPrompt = generateSystemPrompt();

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate target language
    const detectedLang = detectLanguage(aiMessage)
    const expectedLang = language || 'es'
    if (detectedLang === 'en' && expectedLang !== 'en') {
      throw new Error(`AI responded in English, enforcing ${expectedLang}-only`)
    }

    // Update previous turn with user response
    const lastTurn = turns[turns.length - 1]
    await supabase
      .from('dialog_turns')
      .update({ user_response: userResponse })
      .eq('id', lastTurn.id)

    // Save new AI turn
    const { error: newTurnError } = await supabase
      .from('dialog_turns')
      .insert({
        session_id: sessionId,
        turn_number: nextTurnNumber,
        ai_message: aiMessage
      })

    if (newTurnError) throw newTurnError

    return {
      aiMessage,
      turnNumber: nextTurnNumber,
      shouldEnd
    }
  },
  {
    name: "continue_dialog",
    description: "Continue an AI tutor conversation with user's response",
    schema: ContinueDialogSchema
  }
)

// ============================================================================
// TOOL 3: ANALYZE ERRORS (with .withStructuredOutput())
// ============================================================================

export const analyzeErrorsTool = tool(
  async ({ sessionId }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Get all turns with user responses
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .not('user_response', 'is', null)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Determine language from session data (check if it's a dialog session with Latin content)
    const language = session.dialog_id ? 'la' : 'es' // Simple heuristic for now

    // Build language-appropriate transcript
    const getTranscriptLabels = () => {
      if (language === 'la') {
        return { turnLabel: 'Turn', studentLabel: 'Student' }
      } else {
        return { turnLabel: 'Turno', studentLabel: 'Estudiante' }
      }
    }

    const { turnLabel, studentLabel } = getTranscriptLabels()

    // Build transcript
    const transcript = turns.map((turn) => {
      return `${turnLabel} ${turn.turn_number}:\n${studentLabel}: ${turn.user_response}`
    }).join('\n\n')

    // Use regular ChatOpenAI with JSON mode instead of structured output
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0
    })

    const getSystemPrompt = () => {
      if (language === 'la') {
        return `Analyze this Latin conversation from a level ${session.level} student:

${transcript}

Identify all grammar, vocabulary, and syntax errors. For each error, provide:
1. The turn number where it occurred
2. The exact incorrect phrase from the student
3. The appropriate correction
4. A clear, educational explanation of the error

Respond with valid JSON using this exact structure:

{
  "errors": [
    {
      "turnNumber": 1,
      "errorText": "incorrect phrase",
      "correction": "correct version",
      "explanation": "explanation of the error",
      "category": "grammar/vocabulary/syntax"
    }
  ]
}

If there are no errors, return: {"errors": []}. MUST return valid JSON only.`
      } else {
        return `Analiza esta conversación de un estudiante de español nivel ${session.level}:

${transcript}

Identifica todos los errores gramaticales, de vocabulario y sintaxis. Para cada error, proporciona:
1. El número de turno donde ocurrió
2. La frase incorrecta exacta del estudiante
3. La corrección apropiada
4. Una explicación clara y didáctica del error

Responde con JSON válido usando esta estructura exacta:

{
  "errors": [
    {
      "turnNumber": 1,
      "errorText": "frase incorrecta",
      "correction": "versión correcta",
      "explanation": "explicación del error",
      "category": "grammar/vocabulary/syntax"
    }
  ]
}

Si no hay errores, devuelve: {"errors": []}. DEBE devolver solo JSON válido.`
      }
    }

    const systemPrompt = getSystemPrompt()

    const result = await retryWithBackoff(async () => {
      const response = await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
      
      // Parse JSON response manually
      const content = response.content as string
      return JSON.parse(content)
    }) as { errors: ErrorAnalysis[] }

    // Mark session as completed
    await supabase
      .from('tutor_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    return result.errors
  },
  {
    name: "analyze_errors",
    description: "Analyze conversation for grammar, vocabulary, and syntax errors",
    schema: AnalyzeErrorsSchema
  }
)

// ============================================================================
// TOOL 4: GENERATE OVERVIEW (with .withStructuredOutput())
// ============================================================================

export const generateOverviewTool = tool(
  async ({ textId, language = 'es' }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get text
    const text = await LibraryService.getText(textId)

    // Use regular ChatOpenAI with JSON mode instead of structured output
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0
    })

    const getSystemPrompt = () => {
      if (language === 'la') {
        return `Analyze this Latin text as an experienced professor:

${text.content}

Provide a structured analysis in English. Respond with valid JSON using this exact structure:

{
  "summary": "2-3 sentence summary of main topic and key points",
  "grammarConcepts": ["concept 1", "concept 2", "concept 3"],
  "vocabularyThemes": ["theme 1", "theme 2", "theme 3"], 
  "syntaxPatterns": ["pattern 1", "pattern 2", "pattern 3"]
}

Be specific and educational. Include important grammatical structures (cases, verb forms, constructions), semantic fields (e.g., "military", "politics", "nature"), and notable syntactic constructions (e.g., "ablative absolute", "indirect statement"). MUST return valid JSON only.`
      } else {
        return `Analiza este texto en español como un profesor experimentado:

${text.content}

Proporciona un análisis estructurado. Responde con JSON válido usando esta estructura exacta:

{
  "summary": "resumen de 2-3 oraciones del tema principal y puntos clave",
  "grammarConcepts": ["concepto 1", "concepto 2", "concepto 3"],
  "vocabularyThemes": ["tema 1", "tema 2", "tema 3"],
  "syntaxPatterns": ["patrón 1", "patrón 2", "patrón 3"]
}

Sé específico y didáctico. Incluye estructuras gramaticales importantes (subjuntivo, tiempos verbales, etc.), campos semánticos (ej: "familia", "negocios", "naturaleza"), y construcciones sintácticas notables (ej: "oraciones condicionales", "voz pasiva"). DEBE devolver solo JSON válido.`
      }
    }

    const systemPrompt = getSystemPrompt()

    const result = await retryWithBackoff(async () => {
      const response = await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
      
      // Parse JSON response manually
      const content = response.content as string
      return JSON.parse(content)
    }) as ProfessorOverview

    return result
  },
  {
    name: "generate_overview",
    description: "Generate a professor-style overview of a text's learning points",
    schema: GenerateOverviewSchema
  }
)

// ============================================================================
// TOOL 5: ANALYZE USER MESSAGE (Per-Turn Correction)
// ============================================================================

const AnalyzeMessageSchema = z.object({
  userMessage: z.string().min(1).max(1000),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es')
})

export const analyzeUserMessageTool = tool(
  async ({ userMessage, level, language = 'es' }) => {
    // DEBUG: Log what we're receiving
    console.log(`[DEBUG] analyzeUserMessageTool called with:`, {
      userMessage,
      level,
      language,
      messageLength: userMessage?.length
    })

    // Use regular ChatOpenAI with JSON mode instead of structured output
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",  // Cost-effective for simple corrections
      temperature: 0.3
    })

    // Generate language-appropriate system prompt with JSON format
    const getSystemPrompt = () => {
      if (language === 'la') {
        return `You are a strict Latin teacher analyzing a level ${level} student's Latin message. You MUST find errors if they exist!

Student's message: "${userMessage}"

Analyze this Latin message for errors. Be VERY STRICT - even small mistakes should be caught. 

Categories:
- grammar: verbal conjugation, noun cases, agreement, tenses, etc.
- vocabulary: incorrect word choice, anachronisms, non-Latin words
- syntax: word order, missing words, extra words

Common Latin errors to check for:
- Wrong verb conjugations (amo vs amamo vs amamus)
- Wrong noun cases (accusative vs nominative) 
- Wrong adjective agreement
- Missing or wrong prepositions
- Word order issues
- Using Spanish/English words instead of Latin

Respond with valid JSON using this exact structure:

{
  "hasErrors": true/false,
  "correctedText": "corrected version or original if no errors",
  "errors": [
    {
      "errorText": "the wrong part",
      "correction": "the correct version", 
      "explanation": "why it's wrong",
      "category": "grammar/vocabulary/syntax"
    }
  ]
}

Be encouraging but STRICT! If there are errors, explain them clearly. MUST return valid JSON only.`
      } else {
        return `Eres un profesor de español analizando el mensaje de un estudiante de nivel ${level}.

Mensaje del estudiante: "${userMessage}"

Analiza este mensaje en busca de errores.

Categorías:
- grammar: conjugación verbal, concordancia, tiempos, etc.
- vocabulary: elección incorrecta de palabras, cognados falsos
- syntax: orden de palabras, palabras faltantes, palabras extra

Responde con JSON válido usando esta estructura exacta:

{
  "hasErrors": true/false,
  "correctedText": "versión corregida o original si no hay errores",
  "errors": [
    {
      "errorText": "la parte incorrecta",
      "correction": "la versión correcta",
      "explanation": "por qué está mal",
      "category": "grammar/vocabulary/syntax"
    }
  ]
}

¡Sé alentador! Si no hay errores, elogia al estudiante. DEBE devolver solo JSON válido.`
      }
    }

    const systemPrompt = getSystemPrompt()

    // DEBUG: Log the prompt being used
    console.log(`[DEBUG] Using ${language} JSON mode prompt`)

    try {
      const result = await retryWithBackoff(async () => {
        const response = await invokeWithTimeout(
          model.invoke([{ role: "system", content: systemPrompt }]),
          30000
        )
        
        // Parse JSON response manually
        const content = response.content as string
        return JSON.parse(content)
      }) as {
        hasErrors: boolean
        correctedText: string
        errors: Array<{
          errorText: string
          correction: string
          explanation: string
          category: 'grammar' | 'vocabulary' | 'syntax'
        }>
      }

      // DEBUG: Log the result
      console.log(`[DEBUG] Analysis result for ${language}:`, {
        hasErrors: result.hasErrors,
        errorCount: result.errors?.length || 0,
        errors: result.errors
      })

      return result
    } catch (error) {
      console.error('Message analysis failed:', error)

      // Graceful fallback
      return {
        hasErrors: false,
        correctedText: userMessage,
        errors: []
      }
    }
  },
  {
    name: "analyze_user_message",
    description: "Analyze a single user message for language errors with per-turn feedback",
    schema: AnalyzeMessageSchema
  }
)

// ============================================================================
// TOOL 6: GENERATE PROFESSOR REVIEW
// ============================================================================

export const generateProfessorReviewTool = tool(
  async ({ sessionId, level, language = 'es', errors }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Get all turns to build transcript
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .not('user_response', 'is', null)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Build language-appropriate transcript labels
    const getTranscriptLabels = () => {
      if (language === 'la') {
        return { turnLabel: 'Turn', studentLabel: 'Student' }
      } else {
        return { turnLabel: 'Turno', studentLabel: 'Estudiante' }
      }
    }

    const { turnLabel, studentLabel } = getTranscriptLabels()

    // Build conversation transcript
    const transcript = turns.map((turn) => {
      return `${turnLabel} ${turn.turn_number}:\n${studentLabel}: ${turn.user_response}`
    }).join('\n\n')

    // Calculate error breakdown
    const errorBreakdown = {
      grammar: errors.filter(e => e.category === 'grammar').length,
      vocabulary: errors.filter(e => e.category === 'vocabulary').length,
      syntax: errors.filter(e => e.category === 'syntax').length
    }

    // Use regular ChatOpenAI with JSON mode instead of structured output
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    // Generate fully language-appropriate professor review prompt
    const getSystemPrompt = () => {
      const ratingOptions = language === 'la' 
        ? '"Excellent", "Very Good", "Good", "Needs Practice"'
        : '"Excelente", "Muy Bien", "Bien", "Necesita Práctica"'

      if (language === 'la') {
        return `You are an experienced and ENCOURAGING Latin professor evaluating a level ${level} student.

CONVERSATION:
${transcript}

ERRORS MADE (${errors.length} total):
${errors.map(e => `- ${e.errorText} → ${e.correction} (${e.category})`).join('\n')}

BREAKDOWN:
- Grammar: ${errorBreakdown.grammar}
- Vocabulary: ${errorBreakdown.vocabulary}
- Syntax: ${errorBreakdown.syntax}

Provide a POSITIVE AND ENCOURAGING evaluation in English. Respond with valid JSON using this exact structure:

{
  "rating": "one of: ${ratingOptions}",
  "summary": "encouraging paragraph (2-3 sentences) in English",
  "strengths": ["specific thing 1", "specific thing 2", "specific thing 3"],
  "improvements": ["constructive suggestion 1", "constructive suggestion 2"],
  "errorBreakdown": {
    "grammar": ${errorBreakdown.grammar},
    "vocabulary": ${errorBreakdown.vocabulary},
    "syntax": ${errorBreakdown.syntax}
  }
}

RATING GUIDELINES:
- "Excellent": 0-2 errors
- "Very Good": 3-5 errors  
- "Good": 6-8 errors
- "Needs Practice": 9+ errors

IMPORTANT:
- ALWAYS be positive and encouraging
- Focus on growth, not errors
- Make the student feel good about their progress
- Provide feedback in clear, warm English
- MUST return valid JSON only`
      } else {
        return `Eres un profesor de español experimentado y ALENTADOR evaluando a un estudiante de nivel ${level}.

CONVERSACIÓN:
${transcript}

ERRORES COMETIDOS (${errors.length} total):
${errors.map(e => `- ${e.errorText} → ${e.correction} (${e.category})`).join('\n')}

DESGLOSE:
- Gramática: ${errorBreakdown.grammar}
- Vocabulario: ${errorBreakdown.vocabulary}
- Sintaxis: ${errorBreakdown.syntax}

Proporciona una evaluación POSITIVA Y ALENTADORA. Responde con JSON válido usando esta estructura exacta:

{
  "rating": "uno de: ${ratingOptions}",
  "summary": "párrafo alentador (2-3 oraciones)",
  "strengths": ["cosa específica 1", "cosa específica 2", "cosa específica 3"],
  "improvements": ["sugerencia constructiva 1", "sugerencia constructiva 2"],
  "errorBreakdown": {
    "grammar": ${errorBreakdown.grammar},
    "vocabulary": ${errorBreakdown.vocabulary},
    "syntax": ${errorBreakdown.syntax}
  }
}

GUÍAS DE CALIFICACIÓN:
- "Excelente": 0-2 errores
- "Muy Bien": 3-5 errores
- "Bien": 6-8 errores
- "Necesita Práctica": 9+ errores

IMPORTANTE:
- SIEMPRE sé positivo y alentador
- Enfócate en el crecimiento, no en los errores
- Haz que el estudiante se sienta bien con su progreso
- DEBE devolver solo JSON válido`
      }
    }

    const systemPrompt = getSystemPrompt()

    const result = await retryWithBackoff(async () => {
      const response = await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
      
      // Parse JSON response manually
      const content = response.content as string
      return JSON.parse(content)
    }) as ProfessorReview

    return {
      ...result,
      errorBreakdown
    }
  },
  {
    name: "generate_professor_review",
    description: "Generate an encouraging professor review of a completed tutor session",
    schema: GenerateReviewSchema
  }
)

// ============================================================================
// TOOL 7: START DIALOG ROLEPLAY
// ============================================================================

export const startDialogRoleplayTool = tool(
  async ({ dialogId, selectedRole, level, language = 'es' }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch dialog with exchanges
    const { data: dialog, error: dialogError } = await supabase
      .from('lesson_dialogs')
      .select('*, dialog_exchanges(*)')
      .eq('id', dialogId)
      .single()

    if (dialogError || !dialog) {
      throw new Error('Dialog not found')
    }

    // Sort exchanges by sequence_order
    const exchanges = (dialog.dialog_exchanges || []).sort(
      (a: any, b: any) => a.sequence_order - b.sequence_order
    )

    // Debug logging
    console.log('[DEBUG] Dialog ID:', dialogId)
    console.log('[DEBUG] Selected role:', selectedRole)
    console.log('[DEBUG] Exchanges count:', exchanges.length)
    console.log('[DEBUG] Exchanges:', JSON.stringify(exchanges, null, 2))

    // Find opposite character
    const speakers = Array.from(new Set(exchanges.map((e: any) => e.speaker))) as string[]
    console.log('[DEBUG] All speakers:', speakers)
    const oppositeCharacter = speakers.find(s => s !== selectedRole)
    console.log('[DEBUG] Opposite character found:', oppositeCharacter)

    if (!oppositeCharacter) {
      throw new Error('Could not determine opposite character')
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .insert({
        user_id: user.id,
        dialog_id: dialogId,
        selected_role: selectedRole,
        level: level
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Format exchanges for prompt
    const formattedExchanges = exchanges
      .map((e: any) => `${e.speaker}: ${e.spanish}`)
      .join('\n')

    // Generate first AI message
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    // Generate language-appropriate system prompt
    const getSystemPrompt = () => {
      if (language === 'la') {
        return `You are ${oppositeCharacter} in this Latin dialogue.

CONTEXT: ${dialog.context || 'N/A'}
${dialog.setting ? `SETTING: ${dialog.setting}` : ''}

ORIGINAL DIALOGUE (for reference):
${formattedExchanges}

The student is playing the role of ${selectedRole} at level ${level}.

Instructions:
- Stay in character as ${oppositeCharacter}
- Begin the conversation naturally
- Match the general tone of the original dialogue
- Use vocabulary appropriate for level ${level}
- Be warm and encouraging
- Speak ONLY in Latin appropriate for level ${level}

Generate your first line as ${oppositeCharacter}:`
      } else {
        return `Eres ${oppositeCharacter} en este diálogo en español.

CONTEXTO: ${dialog.context || 'N/A'}
${dialog.setting ? `ESCENARIO: ${dialog.setting}` : ''}

DIÁLOGO ORIGINAL (para referencia):
${formattedExchanges}

El estudiante está jugando el papel de ${selectedRole} a nivel ${level}.

Instrucciones:
- Mantente en el personaje como ${oppositeCharacter}
- Comienza la conversación de forma natural
- Coincide con el tono general del diálogo original
- Usa vocabulario apropiado para el nivel ${level}
- Sé cálido y alentador
- Habla SOLO en español

Genera tu primera línea como ${oppositeCharacter}:`
      }
    }

    const systemPrompt = getSystemPrompt()

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate target language
    const detectedLang = detectLanguage(aiMessage)
    const expectedLang = language || 'es'
    if (detectedLang === 'en' && expectedLang !== 'en') {
      throw new Error(`AI responded in English, enforcing ${expectedLang}-only`)
    }

    // Save first turn
    const { error: turnError } = await supabase
      .from('dialog_turns')
      .insert({
        session_id: session.id,
        turn_number: 1,
        ai_message: aiMessage
      })

    if (turnError) throw turnError

    return {
      sessionId: session.id,
      aiMessage,
      oppositeCharacter,
      turnNumber: 1
    }
  },
  {
    name: "start_dialog_roleplay",
    description: "Start a dialog roleplay session where the student plays one character and AI plays the opposite character",
    schema: StartDialogRoleplaySchema
  }
)

// ============================================================================
// TOOL 8: CONTINUE DIALOG ROLEPLAY
// ============================================================================

export const continueDialogRoleplayTool = tool(
  async ({ sessionId, userResponse, language = 'es' }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Language is now passed as parameter from API

    // Get session with dialog
    const { data: session, error: sessionError } = await supabase
      .from('tutor_sessions')
      .select('*, lesson_dialogs(*)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')
    if (!session.dialog_id) throw new Error('Not a roleplay session')

    // Analyze user's message for errors
    const correction = await analyzeUserMessageTool.invoke({
      userMessage: userResponse,
      level: session.level,
      language
    })

    // Get conversation history
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Build conversation history
    const history = turns.map(turn => {
      return `${session.selected_role === session.lesson_dialogs.context ? 'Tú' : turn.ai_message ? 'AI' : 'Tú'}: ${turn.ai_message || turn.user_response || ''}`
    }).join('\n')

    const nextTurnNumber = turns.length + 1
    const shouldEnd = nextTurnNumber >= 10 // Auto-end after 10 turns

    // Find opposite character from dialog exchanges
    const { data: exchanges } = await supabase
      .from('dialog_exchanges')
      .select('speaker')
      .eq('dialog_id', session.dialog_id)

    const speakers = Array.from(new Set((exchanges || []).map(e => e.speaker)))
    const oppositeCharacter = speakers.find((s: string) => s !== session.selected_role)

    // Generate AI response as opposite character
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    // Generate language-appropriate system prompt
    const getSystemPrompt = () => {
      if (language === 'la') {
        return `You are ${oppositeCharacter} in this Latin dialogue.

Conversation so far:
${history}

${session.selected_role} responded: "${userResponse}"

${shouldEnd ? 'This is the final response. End the conversation naturally.' : 'Continue the conversation:'}
- Stay in character as ${oppositeCharacter}
- Respond naturally
- Use level ${session.level} vocabulary
- ${shouldEnd ? 'Say goodbye kindly' : 'Keep the conversation flowing'}

Respond ONLY in Latin appropriate for level ${session.level} as ${oppositeCharacter}:`
      } else {
        return `Eres ${oppositeCharacter} en este diálogo.

Conversación hasta ahora:
${history}

${session.selected_role} respondió: "${userResponse}"

${shouldEnd ? 'Esta es la última respuesta. Finaliza la conversación naturalmente.' : 'Continúa la conversación:'}
- Mantente en personaje como ${oppositeCharacter}
- Responde de forma natural
- Usa vocabulario nivel ${session.level}
- ${shouldEnd ? 'Despídete amablemente' : 'Mantén la conversación fluida'}

Responde SOLO en español como ${oppositeCharacter}:`
      }
    }

    const systemPrompt = getSystemPrompt()

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate target language
    const detectedLang = detectLanguage(aiMessage)
    const expectedLang = language || 'es'
    if (detectedLang === 'en' && expectedLang !== 'en') {
      throw new Error(`AI responded in English, enforcing ${expectedLang}-only`)
    }

    // Update previous turn with user response
    const lastTurn = turns[turns.length - 1]
    await supabase
      .from('dialog_turns')
      .update({ user_response: userResponse })
      .eq('id', lastTurn.id)

    // Save new AI turn
    await supabase
      .from('dialog_turns')
      .insert({
        session_id: sessionId,
        turn_number: nextTurnNumber,
        ai_message: aiMessage
      })

    return {
      aiMessage,
      turnNumber: nextTurnNumber,
      shouldEnd,
      correction
    }
  },
  {
    name: "continue_dialog_roleplay",
    description: "Continue a dialog roleplay session with error analysis and AI response",
    schema: ContinueDialogRoleplaySchema
  }
)
