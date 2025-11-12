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
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

const ContinueDialogSchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000)
})

const AnalyzeErrorsSchema = z.object({
  sessionId: z.string().uuid()
})

const GenerateOverviewSchema = z.object({
  textId: z.string().uuid()
})

const GenerateReviewSchema = z.object({
  sessionId: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
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
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

const ContinueDialogRoleplaySchema = z.object({
  sessionId: z.string().uuid(),
  userResponse: z.string().min(1).max(1000)
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

// Detect language (English vs Spanish)
function detectLanguage(text: string): 'en' | 'es' | 'mixed' {
  const englishWords = text.match(/\b(the|is|are|was|were|have|has|been|to|of|and|a|in|that|it|for|not|with|as|you|this|be|on|at|by|from)\b/gi) || []
  const spanishWords = text.match(/\b(el|la|los|las|de|que|es|en|y|a|un|una|por|con|para|del|como|al|lo|su|se|las|más|pero|su|me|ya|ser|ha|ha|sido|está|están|fue|será|son)\b/gi) || []

  const englishRatio = englishWords.length / (text.split(/\s+/).length || 1)

  if (englishRatio > 0.5) return 'en'
  if (englishRatio > 0.2) return 'mixed'
  return 'es'
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
  async ({ textId, level }) => {
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

    const systemPrompt = `Eres un tutor de español nivel ${level}.
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

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate Spanish-only
    const detectedLang = detectLanguage(aiMessage)
    if (detectedLang === 'en') {
      throw new Error('AI responded in English, enforcing Spanish-only')
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
      .select('*, library_texts(*)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Get conversation history
    const { data: turns, error: turnsError } = await supabase
      .from('dialog_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_number', { ascending: true })

    if (turnsError) throw turnsError

    // Build conversation history
    const history = turns.map(turn => {
      return `Tutor: ${turn.ai_message}${turn.user_response ? `\nEstudiante: ${turn.user_response}` : ''}`
    }).join('\n\n')

    const nextTurnNumber = turns.length + 1
    const shouldEnd = nextTurnNumber >= 10 // Auto-end after 10 turns

    // Generate AI response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    })

    const systemPrompt = `Eres un tutor de español nivel ${session.level}.
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

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate Spanish-only
    const detectedLang = detectLanguage(aiMessage)
    if (detectedLang === 'en') {
      throw new Error('AI responded in English, enforcing Spanish-only')
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

    // Build transcript
    const transcript = turns.map((turn) => {
      return `Turno ${turn.turn_number}:\nEstudiante: ${turn.user_response}`
    }).join('\n\n')

    // Use .withStructuredOutput() for guaranteed JSON response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0
    }).withStructuredOutput(ErrorAnalysisOutputSchema)

    const systemPrompt = `Analiza esta conversación de un estudiante de español nivel ${session.level}:

${transcript}

Identifica todos los errores gramaticales, de vocabulario y sintaxis.
Para cada error, proporciona:
1. El número de turno donde ocurrió
2. La frase incorrecta exacta del estudiante
3. La corrección apropiada
4. Una explicación clara y didáctica del error

Si no hay errores, devuelve un array vacío.`

    const result = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
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
  async ({ textId }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get text
    const text = await LibraryService.getText(textId)

    // Use .withStructuredOutput() for guaranteed JSON response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0
    }).withStructuredOutput(ProfessorOverviewOutputSchema)

    const systemPrompt = `Analiza este texto en español como un profesor experimentado:

${text.content}

Proporciona un análisis estructurado:

1. RESUMEN (2-3 oraciones): El tema principal y puntos clave
2. CONCEPTOS GRAMATICALES: Lista de estructuras gramaticales importantes (subjuntivo, tiempos verbales, etc.)
3. TEMAS DE VOCABULARIO: Lista de campos semánticos presentes (ej: "familia", "negocios", "naturaleza")
4. PATRONES DE SINTAXIS: Lista de construcciones sintácticas notables (ej: "oraciones condicionales", "voz pasiva")

Sé específico y didáctico.`

    const result = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
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
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
})

export const analyzeUserMessageTool = tool(
  async ({ userMessage, level }) => {
    // Use .withStructuredOutput() for guaranteed JSON response
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",  // Cost-effective for simple corrections
      temperature: 0.3
    }).withStructuredOutput(TurnCorrectionOutputSchema)

    const systemPrompt = `Eres un profesor de español analizando el mensaje de un estudiante de nivel ${level}.

Mensaje del estudiante: "${userMessage}"

Analiza este mensaje en busca de errores. Devuelve:
1. Si tiene algún error (true/false)
2. La versión completamente corregida
3. Lista de errores específicos con explicaciones

Categorías:
- grammar: conjugación verbal, concordancia, tiempos, etc.
- vocabulary: elección incorrecta de palabras, cognados falsos
- syntax: orden de palabras, palabras faltantes, palabras extra

¡Sé alentador! Si no hay errores, elogia al estudiante.

IMPORTANTE: Si NO hay errores, devuelve:
{
  "hasErrors": false,
  "correctedText": "[mensaje original sin cambios]",
  "errors": []
}`

    try {
      const result = await retryWithBackoff(async () => {
        return await invokeWithTimeout(
          model.invoke([{ role: "system", content: systemPrompt }]),
          30000
        )
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
  async ({ sessionId, level, errors }) => {
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

    // Build conversation transcript
    const transcript = turns.map((turn) => {
      return `Turno ${turn.turn_number}:\nEstudiante: ${turn.user_response}`
    }).join('\n\n')

    // Calculate error breakdown
    const errorBreakdown = {
      grammar: errors.filter(e => e.category === 'grammar').length,
      vocabulary: errors.filter(e => e.category === 'vocabulary').length,
      syntax: errors.filter(e => e.category === 'syntax').length
    }

    // Use .withStructuredOutput() for guaranteed JSON response
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.7
    }).withStructuredOutput(ProfessorReviewOutputSchema)

    const systemPrompt = `Eres un profesor de español experimentado y ALENTADOR evaluando a un estudiante de nivel ${level}.

CONVERSACIÓN:
${transcript}

ERRORES COMETIDOS (${errors.length} total):
${errors.map(e => `- ${e.errorText} → ${e.correction} (${e.category})`).join('\n')}

DESGLOSE:
- Gramática: ${errorBreakdown.grammar}
- Vocabulario: ${errorBreakdown.vocabulary}
- Sintaxis: ${errorBreakdown.syntax}

Proporciona una evaluación POSITIVA Y ALENTADORA:

1. CALIFICACIÓN (rating):
   - "Excelente": 0-2 errores
   - "Muy Bien": 3-5 errores
   - "Bien": 6-8 errores
   - "Necesita Práctica": 9+ errores

2. RESUMEN (summary):
   - Párrafo alentador (2-3 oraciones)
   - SIEMPRE empieza con algo positivo
   - Menciona el esfuerzo y progreso
   - Usa tono cálido y motivador
   - NO seas crítico ni negativo

3. FORTALEZAS (strengths):
   - 2-3 cosas ESPECÍFICAS que el estudiante hizo bien
   - Puede ser uso correcto de vocabulario, gramática, fluidez, etc.
   - Sé específico y genuino

4. ÁREAS DE MEJORA (improvements):
   - 1-2 sugerencias CONSTRUCTIVAS
   - Enfócate en las categorías con más errores
   - Usa lenguaje positivo: "Puedes mejorar..." no "Fallaste en..."
   - Ofrece consejos prácticos

5. DESGLOSE DE ERRORES (errorBreakdown):
   - Ya calculado, solo devuélvelo

IMPORTANTE:
- SIEMPRE sé positivo y alentador
- Enfócate en el crecimiento, no en los errores
- Haz que el estudiante se sienta bien con su progreso
- Usa español natural y cálido`

    const result = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
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
  async ({ dialogId, selectedRole, level }) => {
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

    const systemPrompt = `Eres ${oppositeCharacter} en este diálogo en español.

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

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate Spanish-only
    const detectedLang = detectLanguage(aiMessage)
    if (detectedLang === 'en') {
      throw new Error('AI responded in English, enforcing Spanish-only')
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
  async ({ sessionId, userResponse }) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

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
      level: session.level
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

    const systemPrompt = `Eres ${oppositeCharacter} en este diálogo.

Conversación hasta ahora:
${history}

${session.selected_role} respondió: "${userResponse}"

${shouldEnd ? 'Esta es la última respuesta. Finaliza la conversación naturalmente.' : 'Continúa la conversación:'}
- Mantente en personaje como ${oppositeCharacter}
- Responde de forma natural
- Usa vocabulario nivel ${session.level}
- ${shouldEnd ? 'Despídete amablemente' : 'Mantén la conversación fluida'}

Responde SOLO en español como ${oppositeCharacter}:`

    const response = await retryWithBackoff(async () => {
      return await invokeWithTimeout(
        model.invoke([{ role: "system", content: systemPrompt }]),
        30000
      )
    })

    const aiMessage = response.content as string

    // Validate Spanish-only
    const detectedLang = detectLanguage(aiMessage)
    if (detectedLang === 'en') {
      throw new Error('AI responded in English, enforcing Spanish-only')
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
