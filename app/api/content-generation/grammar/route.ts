/**
 * Grammar Extraction API Route
 *
 * POST /api/content-generation/grammar
 *
 * Extracts grammar concepts using LLM from content
 */

import { NextRequest, NextResponse } from 'next/server'
import { identifyGrammar, GrammarInput } from '@/lib/content-generation/tools/identify-grammar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input: GrammarInput = {
      content: body.content,
      targetLevel: body.targetLevel || 'A1',
      language: body.language || 'es',
      maxConcepts: body.maxConcepts || 5,
    }

    if (!input.content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      )
    }

    // Identify grammar
    const result = await identifyGrammar(input)

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: 'Grammar identification failed', result },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      grammar_concepts: result.grammar_concepts,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('Grammar identification API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
