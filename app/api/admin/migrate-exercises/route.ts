import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Add spanish_text and english_text columns
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE exercises
        ADD COLUMN IF NOT EXISTS spanish_text TEXT,
        ADD COLUMN IF NOT EXISTS english_text TEXT;
      `
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
