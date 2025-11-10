import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/lessons/[lessonId]/readings/[readingId]
 * Unlink reading from lesson
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; readingId: string }> }
) {
  try {
    const { lessonId, readingId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("lesson_readings")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("reading_id", readingId);

    if (error) {
      console.error("Failed to unlink reading:", error);
      return NextResponse.json(
        { error: "Failed to unlink reading" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reading unlink error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lessons/[lessonId]/readings/[readingId]
 * Update reading metadata (is_required, display_order)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; readingId: string }> }
) {
  try {
    const { lessonId, readingId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { is_required, display_order } = body;

    const updates: any = {};
    if (typeof is_required !== "undefined") updates.is_required = is_required;
    if (typeof display_order !== "undefined") updates.display_order = display_order;

    const { error } = await supabase
      .from("lesson_readings")
      .update(updates)
      .eq("lesson_id", lessonId)
      .eq("reading_id", readingId);

    if (error) {
      console.error("Failed to update reading:", error);
      return NextResponse.json(
        { error: "Failed to update reading" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reading update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
