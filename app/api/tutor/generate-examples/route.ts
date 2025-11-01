import { NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

const ExamplesSchema = z.object({
  examples: z.array(z.string()).min(2).max(3)
})

export async function POST(request: Request) {
  try {
    const { word, definition } = await request.json()

    if (!word) {
      return NextResponse.json(
        { error: 'Missing word parameter' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      openAIApiKey: apiKey
    })

    const prompt = `Generate 2-3 example sentences in Spanish using the word "${word}".

${definition ? `Definition: ${definition}` : ''}

Requirements:
- Each sentence should be natural and conversational
- Use common vocabulary a beginner could understand
- Vary the grammatical context (different tenses, positions)
- Make sentences practical and useful for learning

Return ONLY a JSON object with this exact format:
{
  "examples": [
    "sentence 1",
    "sentence 2",
    "sentence 3"
  ]
}

Do not include any other text or explanation.`

    const response = await llm.invoke(prompt)
    const content = response.content as string

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    const validated = ExamplesSchema.parse(parsed)

    return NextResponse.json(validated)
  } catch (error) {
    console.error('Generate examples error:', error)
    return NextResponse.json(
      { error: 'Failed to generate examples' },
      { status: 500 }
    )
  }
}
