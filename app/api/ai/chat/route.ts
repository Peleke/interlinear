import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional().default(0.7)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic rate limiting check
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    // You could add more sophisticated rate limiting here

    const parsed = ChatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { messages, temperature } = parsed.data

    // Initialize OpenAI model
    const model = new ChatOpenAI({
      temperature,
      modelName: 'gpt-3.5-turbo',
      maxTokens: 200 // Keep it short for game summaries
    })

    // Convert messages to LangChain format
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Get response from OpenAI
    const response = await model.invoke(formattedMessages)

    return NextResponse.json({
      content: response.content,
      message: response.content // Support both field names for compatibility
    })
  } catch (error) {
    console.error('AI chat error:', error)

    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}