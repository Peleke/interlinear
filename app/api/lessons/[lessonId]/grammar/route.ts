import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/lessons/[lessonId]/grammar
 * Get all grammar concepts for a lesson
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lesson_grammar_concepts")
      .select(`
        grammar_concept:grammar_concepts!inner(
          id,
          name,
          display_name,
          description,
          content
        )
      `)
      .eq("lesson_id", lessonId);

    if (error) {
      console.error("Failed to fetch grammar concepts:", error);
      return NextResponse.json(
        { error: "Failed to fetch grammar concepts" },
        { status: 500 }
      );
    }

    const concepts = data?.map((item: any) => item.grammar_concept) || [];

    return NextResponse.json({ concepts });
  } catch (error) {
    console.error("Grammar fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lessons/[lessonId]/grammar
 * Link grammar concept to lesson
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { concept_id } = body;

    if (!concept_id) {
      return NextResponse.json(
        { error: "concept_id is required" },
        { status: 400 }
      );
    }

    // Check if already linked
    const { data: existing } = await supabase
      .from("lesson_grammar_concepts")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("grammar_concept_id", concept_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Concept already linked to this lesson" },
        { status: 400 }
      );
    }

    // Link concept
    const { error } = await supabase
      .from("lesson_grammar_concepts")
      .insert({
        lesson_id: lessonId,
        grammar_concept_id: concept_id,
      });

    if (error) {
      console.error("Failed to link grammar concept:", error);
      return NextResponse.json(
        { error: "Failed to link grammar concept" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grammar link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
