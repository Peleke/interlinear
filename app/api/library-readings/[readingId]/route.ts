import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/library-readings/[readingId]
 * Update library reading
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ readingId: string }> }
) {
  try {
    const supabase = await createClient();
    const { readingId } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("library_readings")
      .update({
        title: body.title,
        author: body.author,
        content: body.content,
        difficulty_level: body.difficulty_level,
        language: body.language,
        updated_at: new Date().toISOString(),
      })
      .eq("id", readingId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update library reading:", error);
      return NextResponse.json(
        { error: "Failed to update library reading" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reading: data });
  } catch (error) {
    console.error("Update reading error:", error);
    return NextResponse.json(
      { error: "Failed to update reading" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library-readings/[readingId]
 * Delete library reading
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ readingId: string }> }
) {
  try {
    const supabase = await createClient();
    const { readingId } = await params;

    const { error } = await supabase
      .from("library_readings")
      .delete()
      .eq("id", readingId);

    if (error) {
      console.error("Failed to delete library reading:", error);
      return NextResponse.json(
        { error: "Failed to delete library reading" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reading error:", error);
    return NextResponse.json(
      { error: "Failed to delete reading" },
      { status: 500 }
    );
  }
}
