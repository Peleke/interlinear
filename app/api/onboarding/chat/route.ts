import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getOnboardingSystemPrompt } from '@/lib/prompts/onboarding-assessment'

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  try {
    const body = await request.json()
    const { goals, customGoal, messages } = body

    // Build conversation history for OpenAI
    const systemPrompt = getOnboardingSystemPrompt(goals, customGoal)
    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }))
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 200
    })

    const aiMessage = completion.choices[0]?.message?.content || 'Lo siento, no entendí.'

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('Onboarding chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
