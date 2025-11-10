import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/library-readings/search
 *
 * Search library readings by title, author, or difficulty
 * Query params:
 * - q: search query (required)
 * - limit: max results (optional, default 10)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ readings: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search by title OR author OR difficulty_level
    const { data, error } = await supabase
      .from("library_readings")
      .select("id, title, author, difficulty_level, word_count, language")
      .or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,difficulty_level.ilike.%${searchTerm}%`)
      .limit(limit)
      .order("title");

    if (error) {
      console.error("Reading search error:", error);
      return NextResponse.json(
        { error: "Failed to search library readings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ readings: data || [] });
  } catch (error) {
    console.error("Reading search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
