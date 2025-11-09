import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/vocabulary/search
 *
 * Autocomplete search for vocabulary items across Spanish/English
 * Returns ranked results by usage_count with reuse indicators
 *
 * Query params:
 * - q: search query (required)
 * - language: 'es' | 'is' (optional, defaults to both)
 * - limit: max results (optional, default 10)
 *
 * Response:
 * {
 *   items: [{
 *     id: uuid,
 *     spanish: string,
 *     english: string,
 *     part_of_speech: string,
 *     difficulty_level: string,
 *     usage_count: number,
 *     used_in_lessons: string[] // lesson titles
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const language = searchParams.get("language"); // 'es' | 'is'
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ items: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Build base query with usage count calculation
    let dbQuery = supabase
      .from("lesson_vocabulary_items")
      .select(`
        id,
        spanish,
        english,
        part_of_speech,
        difficulty_level,
        lesson_vocabulary!inner(
          lesson:lessons!inner(
            id,
            title
          )
        )
      `);

    // Apply language filtering
    if (language === "es") {
      dbQuery = dbQuery.ilike("spanish", `%${searchTerm}%`);
    } else if (language === "is") {
      dbQuery = dbQuery.ilike("english", `%${searchTerm}%`);
    } else {
      // Search both Spanish AND English
      dbQuery = dbQuery.or(`spanish.ilike.%${searchTerm}%,english.ilike.%${searchTerm}%`);
    }

    dbQuery = dbQuery.limit(limit);

    const { data, error } = await dbQuery;

    if (error) {
      console.error("Vocabulary search error:", error);
      return NextResponse.json(
        { error: "Failed to search vocabulary" },
        { status: 500 }
      );
    }

    // Transform results to include usage_count and lesson titles
    const itemsMap = new Map();

    data?.forEach((item: any) => {
      const vocabId = item.id;

      if (!itemsMap.has(vocabId)) {
        itemsMap.set(vocabId, {
          id: item.id,
          spanish: item.spanish,
          english: item.english,
          part_of_speech: item.part_of_speech,
          difficulty_level: item.difficulty_level,
          usage_count: 0,
          used_in_lessons: [],
        });
      }

      const vocabItem = itemsMap.get(vocabId);

      // Aggregate lesson usage
      item.lesson_vocabulary?.forEach((lv: any) => {
        if (lv.lesson) {
          vocabItem.usage_count += 1;
          vocabItem.used_in_lessons.push(lv.lesson.title);
        }
      });
    });

    // Convert map to array and sort by usage_count (descending)
    const items = Array.from(itemsMap.values()).sort(
      (a, b) => b.usage_count - a.usage_count
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Vocabulary search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
