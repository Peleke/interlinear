import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/library-readings
 * Create new library reading
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { title, author, content, language, difficulty_level, source } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    // Calculate word count
    const word_count = content.trim().split(/\s+/).length;

    // Create reading
    const { data, error } = await supabase
      .from("library_readings")
      .insert({
        title,
        author: author || null,
        content,
        language: language || "es",
        difficulty_level: difficulty_level || null,
        source: source || null,
        word_count,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create library reading:", error);
      return NextResponse.json(
        { error: "Failed to create library reading" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reading: data });
  } catch (error) {
    console.error("Library reading creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
