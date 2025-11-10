import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/lessons/[lessonId]/grammar/[conceptId]
 * Unlink grammar concept from lesson
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; conceptId: string }> }
) {
  try {
    const { lessonId, conceptId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("lesson_grammar_concepts")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("grammar_concept_id", conceptId);

    if (error) {
      console.error("Failed to unlink grammar concept:", error);
      return NextResponse.json(
        { error: "Failed to unlink grammar concept" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grammar unlink error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
