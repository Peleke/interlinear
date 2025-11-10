import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/lessons/[lessonId]/readings
 * Get all readings linked to a lesson
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lesson_readings")
      .select(`
        *,
        reading:library_readings!inner(
          id,
          title,
          author,
          content,
          difficulty_level,
          word_count,
          language
        )
      `)
      .eq("lesson_id", lessonId)
      .order("display_order");

    if (error) {
      console.error("Failed to fetch lesson readings:", error);
      return NextResponse.json(
        { error: "Failed to fetch lesson readings" },
        { status: 500 }
      );
    }

    const readings = data?.map((item: any) => ({
      ...item.reading,
      is_required: item.is_required,
      display_order: item.display_order,
    })) || [];

    return NextResponse.json({ readings });
  } catch (error) {
    console.error("Lesson readings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lessons/[lessonId]/readings
 * Link reading to lesson
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { reading_id, is_required = true } = body;

    if (!reading_id) {
      return NextResponse.json(
        { error: "reading_id is required" },
        { status: 400 }
      );
    }

    // Check if already linked
    const { data: existing } = await supabase
      .from("lesson_readings")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("reading_id", reading_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Reading already linked to this lesson" },
        { status: 400 }
      );
    }

    // Get current max display_order
    const { data: maxOrder } = await supabase
      .from("lesson_readings")
      .select("display_order")
      .eq("lesson_id", lessonId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrder?.display_order ?? -1) + 1;

    // Link reading
    const { error } = await supabase
      .from("lesson_readings")
      .insert({
        lesson_id: lessonId,
        reading_id,
        is_required,
        display_order: nextOrder,
      });

    if (error) {
      console.error("Failed to link reading:", error);
      return NextResponse.json(
        { error: "Failed to link reading" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reading link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
