/**
 * Lesson Publish Validation System
 * Validates lessons before publishing to ensure quality and completeness
 * Related to Issue #48: Lesson Publish System (Phase 2)
 */

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  details?: any
}

export interface ValidationReport {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    contentScore: number // 0-100 score for content completeness
    errorCount: number
    warningCount: number
    canPublish: boolean // true if no critical errors
  }
}

export interface LessonForValidation {
  id: string
  title: string | null
  overview: string | null
  course_id: string | null
  author_id: string | null
  lessonContent: Array<{
    id: string
    content_type: string
    content: string | null
  }>
  exercises: Array<{
    id: string
    type: string
    prompt: string
    spanish_text: string | null
    english_text: string | null
  }>
  readings: Array<{
    id: string
    title: string
    content: string
    word_count: number
  }>
  dialogs: Array<{
    id: string
    context: string
    setting: string | null
    exchanges: Array<{
      id: string
      sequence_order: number
      speaker: string
      spanish: string
      english: string
    }>
  }>
  grammarConcepts: Array<{
    id: string
    name: string
    content: string
  }>
}

/**
 * Main validation function - checks all aspects of lesson completeness
 */
export function validateLessonForPublish(lesson: LessonForValidation): ValidationReport {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // 1. Basic lesson metadata validation
  validateBasicMetadata(lesson, errors, warnings)

  // 2. Content completeness validation
  validateContentCompleteness(lesson, errors, warnings)

  // 3. Exercise validation
  validateExercises(lesson, errors, warnings)

  // 4. Dialog validation
  validateDialogs(lesson, errors, warnings)

  // 5. Reading validation
  validateReadings(lesson, errors, warnings)

  // 6. Grammar concepts validation
  validateGrammarConcepts(lesson, errors, warnings)

  // Calculate content score and determine if publishable
  const contentScore = calculateContentScore(lesson, errors, warnings)
  const errorCount = errors.length
  const warningCount = warnings.length
  const canPublish = errorCount === 0 // No critical errors

  return {
    isValid: canPublish,
    errors,
    warnings,
    summary: {
      contentScore,
      errorCount,
      warningCount,
      canPublish
    }
  }
}

/**
 * Validate basic lesson metadata (title, overview, etc.)
 */
function validateBasicMetadata(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  // Title is required
  if (!lesson.title || lesson.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Lesson title is required',
      severity: 'error'
    })
  } else if (lesson.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Lesson title must be at least 3 characters',
      severity: 'error'
    })
  } else if (lesson.title.trim().length > 100) {
    warnings.push({
      field: 'title',
      message: 'Lesson title is quite long (over 100 characters)',
      severity: 'warning'
    })
  }

  // Overview is required
  if (!lesson.overview || lesson.overview.trim().length === 0) {
    errors.push({
      field: 'overview',
      message: 'Lesson overview/description is required',
      severity: 'error'
    })
  } else if (lesson.overview.trim().length < 10) {
    errors.push({
      field: 'overview',
      message: 'Lesson overview must be at least 10 characters',
      severity: 'error'
    })
  }

  // Course assignment is required
  if (!lesson.course_id) {
    errors.push({
      field: 'course_id',
      message: 'Lesson must be assigned to a course',
      severity: 'error'
    })
  }

  // Author is required
  if (!lesson.author_id) {
    errors.push({
      field: 'author_id',
      message: 'Lesson must have an author',
      severity: 'error'
    })
  }
}

/**
 * Validate that lesson has sufficient content
 */
function validateContentCompleteness(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  const hasReadings = lesson.readings && lesson.readings.length > 0
  const hasExercises = lesson.exercises && lesson.exercises.length > 0
  const hasDialogs = lesson.dialogs && lesson.dialogs.length > 0
  const hasGrammarContent = (lesson.lessonContent &&
    lesson.lessonContent.some(block =>
      block.content_type === 'grammar' && block.content && block.content.trim().length > 0
    )) || (lesson.grammarConcepts && lesson.grammarConcepts.length > 0)
  const hasVocabularyContent = lesson.lessonContent &&
    lesson.lessonContent.some(block =>
      block.content_type === 'vocabulary' && block.content && block.content.trim().length > 0
    )

  const contentTypes = [hasReadings, hasExercises, hasDialogs].filter(Boolean).length

  // Must have at least ONE main content type
  if (contentTypes === 0) {
    errors.push({
      field: 'content',
      message: 'Lesson must have at least one reading, exercise, or dialog',
      severity: 'error',
      details: { hasReadings, hasExercises, hasDialogs }
    })
  }

  // Warn if only one content type
  if (contentTypes === 1) {
    warnings.push({
      field: 'content',
      message: 'Lesson has only one type of content. Consider adding variety for better learning.',
      severity: 'warning',
      details: { hasReadings, hasExercises, hasDialogs }
    })
  }

  // Recommend grammar or vocabulary content
  if (!hasGrammarContent && !hasVocabularyContent) {
    warnings.push({
      field: 'content',
      message: 'Consider adding grammar notes or vocabulary to enhance learning',
      severity: 'warning'
    })
  }
}

/**
 * Validate exercises are properly structured
 */
function validateExercises(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!lesson.exercises || lesson.exercises.length === 0) {
    // No exercises is okay, but flag it
    warnings.push({
      field: 'exercises',
      message: 'No exercises found. Consider adding exercises for practice.',
      severity: 'warning'
    })
    return
  }

  lesson.exercises.forEach((exercise, index) => {
    const exerciseField = `exercise_${index + 1}`

    // Validate prompt
    if (!exercise.prompt || exercise.prompt.trim().length === 0) {
      errors.push({
        field: exerciseField,
        message: `Exercise ${index + 1}: Prompt is required`,
        severity: 'error'
      })
    }

    // Validate exercise type
    if (!exercise.type) {
      errors.push({
        field: exerciseField,
        message: `Exercise ${index + 1}: Exercise type is required`,
        severity: 'error'
      })
    }

    // Validate fill_blank exercises specifically
    if (exercise.type === 'fill_blank') {
      // For fill_blank exercises, Spanish text can be in either spanish_text field or prompt field
      const spanishText = exercise.spanish_text || exercise.prompt

      if (!spanishText || spanishText.trim().length === 0) {
        errors.push({
          field: exerciseField,
          message: `Exercise ${index + 1}: Fill-in-blank exercises require Spanish text`,
          severity: 'error'
        })
      }

      // Check if Spanish text has blank markers (only if there's text to check)
      if (spanishText && !spanishText.includes('___')) {
        errors.push({
          field: exerciseField,
          message: `Exercise ${index + 1}: Fill-in-blank text must contain blank markers (___) `,
          severity: 'error'
        })
      }

      // English text is optional but recommended
      if (!exercise.english_text || exercise.english_text.trim().length === 0) {
        warnings.push({
          field: exerciseField,
          message: `Exercise ${index + 1}: Consider adding English translation for context`,
          severity: 'warning'
        })
      }
    }
  })
}

/**
 * Validate dialogs are properly structured
 */
function validateDialogs(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!lesson.dialogs || lesson.dialogs.length === 0) {
    warnings.push({
      field: 'dialogs',
      message: 'No dialogs found. Consider adding dialogs for conversation practice.',
      severity: 'warning'
    })
    return
  }

  lesson.dialogs.forEach((dialog, index) => {
    const dialogField = `dialog_${index + 1}`

    // Validate context
    if (!dialog.context || dialog.context.trim().length === 0) {
      errors.push({
        field: dialogField,
        message: `Dialog ${index + 1}: Context description is required`,
        severity: 'error'
      })
    }

    // Validate exchanges exist
    if (!dialog.exchanges || dialog.exchanges.length === 0) {
      errors.push({
        field: dialogField,
        message: `Dialog ${index + 1}: At least one exchange is required`,
        severity: 'error'
      })
      return
    }

    // Validate exchanges
    dialog.exchanges.forEach((exchange, exchIndex) => {
      const exchangeField = `${dialogField}_exchange_${exchIndex + 1}`

      if (!exchange.spanish || exchange.spanish.trim().length === 0) {
        errors.push({
          field: exchangeField,
          message: `Dialog ${index + 1}, Exchange ${exchIndex + 1}: Spanish text is required`,
          severity: 'error'
        })
      }

      if (!exchange.english || exchange.english.trim().length === 0) {
        errors.push({
          field: exchangeField,
          message: `Dialog ${index + 1}, Exchange ${exchIndex + 1}: English translation is required`,
          severity: 'error'
        })
      }

      if (!exchange.speaker || exchange.speaker.trim().length === 0) {
        errors.push({
          field: exchangeField,
          message: `Dialog ${index + 1}, Exchange ${exchIndex + 1}: Speaker name is required`,
          severity: 'error'
        })
      }
    })

    // Check for roleplay potential (multiple speakers)
    const speakers = Array.from(new Set(dialog.exchanges.map(e => e.speaker).filter(s => s)))
    if (speakers.length < 2) {
      warnings.push({
        field: dialogField,
        message: `Dialog ${index + 1}: Only one speaker found. Roleplay requires multiple speakers.`,
        severity: 'warning'
      })
    }
  })
}

/**
 * Validate readings are properly structured
 */
function validateReadings(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!lesson.readings || lesson.readings.length === 0) {
    warnings.push({
      field: 'readings',
      message: 'No readings found. Consider adding readings for comprehension practice.',
      severity: 'warning'
    })
    return
  }

  lesson.readings.forEach((reading, index) => {
    const readingField = `reading_${index + 1}`

    // Validate title
    if (!reading.title || reading.title.trim().length === 0) {
      errors.push({
        field: readingField,
        message: `Reading ${index + 1}: Title is required`,
        severity: 'error'
      })
    }

    // Validate content
    if (!reading.content || reading.content.trim().length === 0) {
      errors.push({
        field: readingField,
        message: `Reading ${index + 1}: Content is required`,
        severity: 'error'
      })
    } else if (reading.content.trim().length < 50) {
      warnings.push({
        field: readingField,
        message: `Reading ${index + 1}: Content seems quite short (less than 50 characters)`,
        severity: 'warning'
      })
    }

    // Calculate actual word count from content if the stored word_count seems wrong
    const actualWordCount = reading.content ? reading.content.trim().split(/\s+/).filter(word => word.length > 0).length : 0
    const wordCount = reading.word_count && reading.word_count > 10 ? reading.word_count : actualWordCount

    // Validate word count (should be reasonable)
    if (wordCount < 10) {
      warnings.push({
        field: readingField,
        message: `Reading ${index + 1}: Very low word count (${wordCount} words)`,
        severity: 'warning'
      })
    }
  })
}

/**
 * Validate grammar concepts
 */
function validateGrammarConcepts(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!lesson.grammarConcepts || lesson.grammarConcepts.length === 0) {
    // Grammar concepts are optional
    return
  }

  lesson.grammarConcepts.forEach((concept, index) => {
    const conceptField = `grammar_concept_${index + 1}`

    // Validate name
    if (!concept.name || concept.name.trim().length === 0) {
      errors.push({
        field: conceptField,
        message: `Grammar Concept ${index + 1}: Name is required`,
        severity: 'error'
      })
    }

    // Validate content
    if (!concept.content || concept.content.trim().length === 0) {
      errors.push({
        field: conceptField,
        message: `Grammar Concept ${index + 1}: Content is required`,
        severity: 'error'
      })
    } else if (concept.content.trim().length < 20) {
      warnings.push({
        field: conceptField,
        message: `Grammar Concept ${index + 1}: Content seems quite brief`,
        severity: 'warning'
      })
    }
  })
}

/**
 * Calculate a content completeness score (0-100)
 */
function calculateContentScore(
  lesson: LessonForValidation,
  errors: ValidationError[],
  warnings: ValidationError[]
): number {
  let score = 100

  // Deduct points for errors
  score -= errors.length * 15

  // Deduct smaller amounts for warnings
  score -= warnings.length * 5

  // Bonus points for content variety
  const hasReadings = lesson.readings && lesson.readings.length > 0
  const hasExercises = lesson.exercises && lesson.exercises.length > 0
  const hasDialogs = lesson.dialogs && lesson.dialogs.length > 0
  const hasGrammar = lesson.lessonContent?.some(b => b.content_type === 'grammar' && b.content)
  const hasVocabulary = lesson.lessonContent?.some(b => b.content_type === 'vocabulary' && b.content)

  const contentTypes = [hasReadings, hasExercises, hasDialogs, hasGrammar, hasVocabulary].filter(Boolean).length

  // Bonus for content variety (up to +20 points)
  score += Math.min(contentTypes * 4, 20)

  // Ensure score stays in 0-100 range
  return Math.max(0, Math.min(100, score))
}

/**
 * Quick validation check - just returns boolean
 */
export function canLessonBePublished(lesson: LessonForValidation): boolean {
  const report = validateLessonForPublish(lesson)
  return report.summary.canPublish
}