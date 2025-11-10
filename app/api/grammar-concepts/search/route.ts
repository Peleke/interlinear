import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/grammar-concepts/search
 *
 * Search grammar concepts by name or display_name
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
      return NextResponse.json({ concepts: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search by name OR display_name
    const { data, error } = await supabase
      .from("grammar_concepts")
      .select("id, name, display_name, description")
      .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .limit(limit)
      .order("display_name");

    if (error) {
      console.error("Grammar search error:", error);
      return NextResponse.json(
        { error: "Failed to search grammar concepts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ concepts: data || [] });
  } catch (error) {
    console.error("Grammar search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
