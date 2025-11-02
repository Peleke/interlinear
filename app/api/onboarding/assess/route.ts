import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAssessmentPrompt, AssessmentLevel } from '@/lib/prompts/onboarding-assessment'

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  try {
    const body = await request.json()
    const { conversation, goals, customGoal } = body

    // Use GPT-4 to analyze the conversation and determine level
    const assessmentPrompt = getAssessmentPrompt(conversation)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: assessmentPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent assessments
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const assessment: AssessmentLevel = JSON.parse(responseText)

    // Validate level
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1']
    if (!validLevels.includes(assessment.level)) {
      console.warn('Invalid level returned:', assessment.level)
      assessment.level = 'A1' // Default to A1 if invalid
    }

    return NextResponse.json({
      level: assessment.level,
      confidence: assessment.confidence,
      reasoning: assessment.reasoning
    })
  } catch (error) {
    console.error('Assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to assess level' },
      { status: 500 }
    )
  }
}
