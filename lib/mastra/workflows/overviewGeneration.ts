/**
 * AI-Powered Overview Generation Workflow
 * Uses Mastra + OpenAI to generate engaging lesson overviews
 */

import { createOpenAIProvider } from '../providers/openai';

interface LessonData {
  id: string
  title: string
  language: 'es' | 'la'
  readings?: any[]
  exercises?: any[]
  dialogs?: any[]
  grammar?: any[]
  vocabulary?: any[]
}

export async function generateAIOverview(
  lesson: LessonData,
  overviewType: 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'
): Promise<string> {
  try {
    console.log(`🤖 Generating AI-powered ${overviewType} overview for lesson: ${lesson.title}`);

    const openai = await createOpenAIProvider();
    const prompt = buildPrompt(lesson, overviewType);

    console.log(`📝 Using prompt for ${overviewType} overview generation`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(lesson.language)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Higher creativity for engaging content
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log(`✅ Generated ${overviewType} overview successfully`);
    return content.trim();

  } catch (error) {
    console.error(`❌ Error generating ${overviewType} overview:`, error);
    throw new Error(`Failed to generate ${overviewType} overview`);
  }
}

function getSystemPrompt(language: 'es' | 'la'): string {
  const langName = language === 'es' ? 'Spanish' : 'Latin';
  const culturalContext = language === 'es'
    ? 'Spanish-speaking cultures and modern communication'
    : 'classical civilization and historical texts';

  return `You are an expert ${langName} language educator and content creator. Your goal is to write engaging, informative lesson overviews that motivate learners and clearly communicate the value of each lesson component.

**Writing Guidelines:**
- Use engaging, encouraging language that builds confidence
- Focus on practical benefits and real-world applications
- Include specific details about what students will gain
- Use markdown formatting for structure and emphasis
- Maintain a friendly but professional tone
- Incorporate cultural context about ${culturalContext}
- Keep overviews concise but comprehensive (150-400 words)
- Use bullet points and formatting to enhance readability

**Key Principles:**
- Emphasize the interactive and practical nature of activities
- Highlight progression and skill-building
- Connect learning to real-world usage
- Build excitement about the learning journey
- Address different learning styles and preferences`;
}

function buildPrompt(lesson: LessonData, overviewType: string): string {
  const { title, language, readings, exercises, dialogs, grammar, vocabulary } = lesson;
  const langName = language === 'es' ? 'Spanish' : 'Latin';

  const lessonContext = `
**Lesson Context:**
- Title: "${title}"
- Language: ${langName}
- Readings: ${readings?.length || 0} items
- Exercises: ${exercises?.length || 0} items
- Dialogs: ${dialogs?.length || 0} items
- Grammar Concepts: ${grammar?.length || 0} items
- Vocabulary Words: ${vocabulary?.length || 0} items
`;

  switch (overviewType) {
    case 'general':
      return `${lessonContext}

Create an engaging **General Lesson Overview** that introduces students to the entire lesson. This overview should:

1. Welcome students to the lesson with enthusiasm
2. Provide a compelling summary of what they'll learn
3. Highlight the practical benefits and real-world applications
4. Give a brief overview of the lesson structure and components
5. Motivate students to dive into the content

Focus on the overall learning journey and how all components work together to build comprehensive ${langName} skills. Use markdown formatting including headers, bullet points, and emphasis to create an visually appealing and scannable overview.`;

    case 'readings':
      return `${lessonContext}

Create an engaging overview for the **Interactive Readings** section. This should:

1. Explain the value of reading practice in language learning
2. Describe what makes these readings special and interactive
3. Highlight features like vocabulary support, comprehension questions, and cultural context
4. Set expectations for difficulty level and progression
5. Motivate students about the authentic ${langName} content they'll explore

${readings?.length ? `The lesson contains ${readings.length} reading(s).` : 'This section will contain carefully selected readings when available.'}

Focus on building excitement about reading comprehension and vocabulary expansion through authentic texts.`;

    case 'exercises':
      return `${lessonContext}

Create an engaging overview for the **Practice Exercises** section. This should:

1. Explain how exercises reinforce learning from other lesson components
2. Describe the variety of exercise types and their benefits
3. Highlight features like immediate feedback and progress tracking
4. Set expectations for difficulty and skill-building progression
5. Motivate students about practicing and testing their knowledge

${exercises?.length ? `The lesson contains ${exercises.length} exercise(s).` : 'This section will contain targeted practice activities when available.'}

Emphasize how exercises help consolidate learning and build confidence through practice.`;

    case 'dialogs':
      return `${lessonContext}

Create an engaging overview for the **Interactive Conversations** section. This should:

1. Explain the importance of conversation practice in language learning
2. Describe authentic scenarios and real-world applicability
3. Highlight interactive features like role-play and pronunciation guidance
4. Set expectations for cultural context and social interactions
5. Motivate students about developing speaking and listening skills

${dialogs?.length ? `The lesson contains ${dialogs.length} dialog(s).` : 'This section will feature interactive conversations when available.'}

Focus on building confidence for real-world ${langName} communication and cultural understanding.`;

    case 'grammar':
      return `${lessonContext}

Create an engaging overview for the **Grammar Concepts** section. This should:

1. Explain how grammar provides the foundation for effective communication
2. Describe the clear explanations and practical examples approach
3. Highlight how concepts connect to real usage in the lesson
4. Set expectations for building systematic language knowledge
5. Motivate students about mastering essential ${langName} structures

${grammar?.length ? `The lesson covers ${grammar.length} grammar concept(s).` : 'This section will cover essential grammar concepts when available.'}

Focus on making grammar approachable and demonstrating its practical value for communication.`;

    default:
      throw new Error(`Unknown overview type: ${overviewType}`);
  }
}

// Export types for use in other files
export type { LessonData };