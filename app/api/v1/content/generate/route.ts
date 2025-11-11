import { NextResponse } from "next/server";
import { generateLessonContent } from "@/lib/langchain/agents/content-supervisor";

/**
 * POST /api/v1/content/generate
 * Generate lesson content (vocabulary, grammar, exercises) from reading text
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { readingText, targetLevel } = body;

    // Validate required fields
    if (!readingText || !targetLevel) {
      return NextResponse.json(
        { error: "readingText and targetLevel are required" },
        { status: 400 }
      );
    }

    // Validate CEFR level
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(targetLevel)) {
      return NextResponse.json(
        { error: `targetLevel must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate reading text length (reasonable bounds)
    const wordCount = readingText.trim().split(/\s+/).length;
    if (wordCount < 10) {
      return NextResponse.json(
        { error: "readingText must be at least 10 words" },
        { status: 400 }
      );
    }
    if (wordCount > 2000) {
      return NextResponse.json(
        { error: "readingText must be less than 2000 words" },
        { status: 400 }
      );
    }

    // Generate content using supervisor agent
    console.log(`Generating content for ${wordCount} words at ${targetLevel} level...`);
    const result = await generateLessonContent(readingText, targetLevel);

    // Parse the final content (should be JSON from supervisor)
    let content;
    try {
      const contentStr = typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content);

      // Extract JSON from markdown code blocks if present
      const jsonMatch = contentStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                       [null, contentStr];
      const jsonStr = jsonMatch[1] || contentStr;

      content = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse supervisor output:', parseError);
      // Return raw content if parsing fails
      content = result.content;
    }

    return NextResponse.json({
      success: true,
      content,
      metadata: {
        readingWordCount: wordCount,
        targetLevel,
        // Include message count for debugging/monitoring
        agentMessages: result.messages?.length || 0,
      }
    });

  } catch (error) {
    console.error("Content generation error:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: "OpenAI API configuration error" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
