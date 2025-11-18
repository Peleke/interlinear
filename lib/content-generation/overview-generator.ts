import { generateAIOverview, type LessonData } from '@/lib/mastra/workflows/overviewGeneration'

export async function generateLessonOverview(
  lesson: LessonData,
  overviewType: 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'
): Promise<string> {
  try {
    // Use AI-powered generation as primary method
    return await generateAIOverview(lesson, overviewType)
  } catch (error) {
    console.error('AI generation failed, falling back to template:', error)
    // Fallback to template-based generation if AI fails
    return generateFallbackOverview(lesson, overviewType)
  }
}

function generateFallbackOverview(
  lesson: LessonData,
  overviewType: 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'
): string {
  switch (overviewType) {
    case 'general':
      return generateGeneralOverview(lesson)
    case 'readings':
      return generateReadingsOverview(lesson)
    case 'exercises':
      return generateExercisesOverview(lesson)
    case 'dialogs':
      return generateDialogsOverview(lesson)
    case 'grammar':
      return generateGrammarOverview(lesson)
    default:
      throw new Error(`Unknown overview type: ${overviewType}`)
  }
}

function generateGeneralOverview(lesson: LessonData): string {
  const { title, language, readings, exercises, dialogs, grammar, vocabulary } = lesson

  const langName = language === 'es' ? 'Spanish' : 'Latin'
  const components = []

  if (readings?.length) {
    components.push(`${readings.length} interactive reading${readings.length > 1 ? 's' : ''}`)
  }
  if (exercises?.length) {
    components.push(`${exercises.length} practice exercise${exercises.length > 1 ? 's' : ''}`)
  }
  if (dialogs?.length) {
    components.push(`${dialogs.length} conversation dialog${dialogs.length > 1 ? 's' : ''}`)
  }
  if (grammar?.length) {
    components.push(`${grammar.length} grammar concept${grammar.length > 1 ? 's' : ''}`)
  }
  if (vocabulary?.length) {
    components.push(`${vocabulary.length} vocabulary word${vocabulary.length > 1 ? 's' : ''}`)
  }

  const componentsList = components.length > 0
    ? components.slice(0, -1).join(', ') + (components.length > 1 ? ', and ' : '') + components.slice(-1)
    : 'foundational content'

  return `Welcome to **${title}**! This comprehensive ${langName} lesson features ${componentsList}.

## What You'll Learn

Through interactive activities and engaging content, you'll develop practical language skills that you can use in real-world situations. Each component is carefully designed to reinforce key concepts and build your confidence.

## Lesson Structure

${readings?.length ? `- **📚 Interactive Readings**: Explore authentic ${langName} texts with comprehension support\n` : ''}${exercises?.length ? `- **✏️ Practice Exercises**: Reinforce your learning with targeted practice activities\n` : ''}${dialogs?.length ? `- **💬 Conversations**: Practice real-world dialogue patterns and pronunciation\n` : ''}${grammar?.length ? `- **📝 Grammar Concepts**: Master essential grammar rules with clear explanations\n` : ''}${vocabulary?.length ? `- **📖 Vocabulary**: Learn and practice key words with definitions and examples\n` : ''}

Take your time with each section and don't hesitate to review material as needed. ¡Vamos a aprender!`
}

function generateReadingsOverview(lesson: LessonData): string {
  const { readings, language } = lesson

  if (!readings?.length) {
    return `This section will contain interactive ${language === 'es' ? 'Spanish' : 'Latin'} readings to help you practice comprehension skills and learn vocabulary in context.`
  }

  const readingCount = readings.length
  const langName = language === 'es' ? 'Spanish' : 'Latin'

  return `Practice your ${langName} reading comprehension with ${readingCount} carefully selected text${readingCount > 1 ? 's' : ''}. Each reading includes:

- **Interactive vocabulary support** - Click on unfamiliar words for instant definitions
- **Comprehension questions** - Test your understanding as you read
- **Cultural context** - Learn about ${langName === 'Spanish' ? 'Spanish-speaking cultures' : 'classical civilization'}
- **Progressive difficulty** - Build confidence with appropriately leveled content

These authentic texts will help you develop natural reading skills while expanding your vocabulary and cultural knowledge.`
}

function generateExercisesOverview(lesson: LessonData): string {
  const { exercises, language } = lesson

  if (!exercises?.length) {
    return `This section will contain practice exercises to reinforce your learning and test your understanding of key concepts.`
  }

  const exerciseCount = exercises.length
  const langName = language === 'es' ? 'Spanish' : 'Latin'

  // Categorize exercise types
  const exerciseTypes = exercises.map(ex => ex.type).filter(Boolean)
  const uniqueTypes = [...new Set(exerciseTypes)]

  let typeDescription = ''
  if (uniqueTypes.includes('multiple_choice')) {
    typeDescription += '- **Multiple Choice Questions** - Test your comprehension and vocabulary\n'
  }
  if (uniqueTypes.includes('fill_blank')) {
    typeDescription += '- **Fill-in-the-Blank** - Practice grammar and vocabulary in context\n'
  }
  if (uniqueTypes.includes('translation')) {
    typeDescription += '- **Translation Practice** - Develop your ${langName}-English translation skills\n'
  }

  return `Strengthen your ${langName} skills with ${exerciseCount} targeted exercise${exerciseCount > 1 ? 's' : ''} designed to reinforce key concepts from this lesson.

${typeDescription || '- **Interactive Activities** - Various exercise types to keep learning engaging\n'}
- **Immediate Feedback** - Get instant corrections and explanations
- **Progress Tracking** - Monitor your improvement over time
- **Adaptive Difficulty** - Exercises that match your skill level

These exercises are designed to help you practice what you've learned and identify areas where you might need additional review.`
}

function generateDialogsOverview(lesson: LessonData): string {
  const { dialogs, language } = lesson

  if (!dialogs?.length) {
    return `This section will feature interactive conversations to help you practice speaking and listening skills in real-world contexts.`
  }

  const dialogCount = dialogs.length
  const langName = language === 'es' ? 'Spanish' : 'Latin'

  return `Practice real-world ${langName} conversations with ${dialogCount} interactive dialog${dialogCount > 1 ? 's' : ''}. These conversations feature:

- **Authentic Scenarios** - Practice language you'll actually use
- **Cultural Context** - Learn appropriate social interactions
- **Pronunciation Guide** - Audio support to perfect your accent
- **Role-Play Opportunities** - Practice both sides of conversations
- **Progressive Complexity** - Start simple and build to more advanced interactions

Each dialog is designed to help you develop confidence in speaking ${langName} and understanding native speakers in natural conversation.`
}

function generateGrammarOverview(lesson: LessonData): string {
  const { grammar, language } = lesson

  if (!grammar?.length) {
    return `This section will cover essential grammar concepts to help you understand and use the language correctly.`
  }

  const grammarCount = grammar.length
  const langName = language === 'es' ? 'Spanish' : 'Latin'

  return `Master essential ${langName} grammar with ${grammarCount} key concept${grammarCount > 1 ? 's' : ''} covered in this lesson:

- **Clear Explanations** - Understanding the "why" behind grammar rules
- **Practical Examples** - See grammar concepts in real contexts
- **Common Mistakes** - Learn what to avoid and how to correct errors
- **Practice Opportunities** - Apply new grammar knowledge immediately
- **Reference Materials** - Quick guides for future review

Each grammar concept builds on previous knowledge, helping you develop a solid foundation for confident ${langName} communication.`
}