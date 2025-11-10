import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/grammar-concepts
 * Create new grammar concept
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, display_name, description, content } = body;

    // Validate required fields
    if (!name || !display_name) {
      return NextResponse.json(
        { error: "name and display_name are required" },
        { status: 400 }
      );
    }

    // Create concept
    const { data, error } = await supabase
      .from("grammar_concepts")
      .insert({
        name: name.toLowerCase().replace(/\s+/g, "_"),
        display_name,
        description: description || null,
        content: content || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create grammar concept:", error);
      return NextResponse.json(
        { error: "Failed to create grammar concept" },
        { status: 500 }
      );
    }

    return NextResponse.json({ concept: data });
  } catch (error) {
    console.error("Grammar concept creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
