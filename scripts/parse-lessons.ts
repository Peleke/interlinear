import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Supabase client with service role key for write access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY (fallback):', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.error('\n⚠️  Using ANON_KEY - for production, add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Warn if using anon key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: Using ANON_KEY instead of SERVICE_ROLE_KEY');
  console.warn('   Add SUPABASE_SERVICE_ROLE_KEY to .env.local for full write permissions\n');
}

interface LessonYAML {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  xp_value: number;
  grammar_points?: Array<{
    id?: string;
    name: string;
    overview: string;
    examples: string[];
  }>;
  vocabulary?: Array<{
    word: string;
    translation: string;
    example: string;
  }>;
  exercises?: Array<{
    type: 'fill_blank' | 'multiple_choice' | 'translation';
    prompt: string;
    answer: string;
    options?: string[];
    xp_value?: number;
  }>;
}

async function parseAndSeedLesson(filePath: string) {
  try {
    console.log(`\n📖 Parsing lesson file: ${filePath}`);

    // Read and parse YAML file
    const fileContent = readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Validate required fields
    const requiredFields: (keyof LessonYAML)[] = ['id', 'title', 'level', 'xp_value'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const lessonData = data as LessonYAML;

    // Validate level enum
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(lessonData.level)) {
      throw new Error(`Invalid level: ${lessonData.level} (must be one of ${validLevels.join(', ')})`);
    }

    console.log(`\n✓ Lesson ID: ${lessonData.id}`);
    console.log(`✓ Title: ${lessonData.title}`);
    console.log(`✓ Level: ${lessonData.level}`);

    // Step 1: Upsert course by level
    console.log(`\n📦 Upserting course for level ${lessonData.level}...`);
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .upsert(
        {
          level: lessonData.level,
          title: `Spanish ${lessonData.level} Course`,
          description: `Complete ${lessonData.level} level Spanish course`,
          xp_total: 0 // Will be updated as lessons are added
        },
        { onConflict: 'level', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (courseError) throw new Error(`Course upsert failed: ${courseError.message}`);
    console.log(`✓ Course ID: ${course.id}`);

    // Step 2: Derive sequence order from filename (e.g., lesson-01.yaml → 1)
    const filenameMatch = filePath.match(/lesson-(\d+)\.yaml$/);
    const sequenceOrder = filenameMatch ? parseInt(filenameMatch[1]) : 1;

    // Extract overview from first paragraph of Markdown or use default
    const overview = content.split('\n\n')[1]?.substring(0, 100) || lessonData.title;

    // Step 3: Upsert lesson
    console.log(`\n📝 Upserting lesson...`);
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .upsert(
        {
          id: lessonData.id,
          course_id: course.id,
          title: lessonData.title,
          overview,
          xp_value: lessonData.xp_value,
          sequence_order: sequenceOrder,
          grammar_content: { markdown: content },
          vocabulary: lessonData.vocabulary || []
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (lessonError) throw new Error(`Lesson upsert failed: ${lessonError.message}`);
    console.log(`✓ Lesson inserted/updated with ID: ${lesson.id}`);

    // Step 4: Upsert grammar points and create associations
    if (lessonData.grammar_points && lessonData.grammar_points.length > 0) {
      console.log(`\n📚 Processing ${lessonData.grammar_points.length} grammar points...`);

      for (const gp of lessonData.grammar_points) {
        // Upsert grammar point
        const { data: grammarPoint, error: gpError } = await supabase
          .from('grammar_points')
          .upsert(
            {
              name: gp.name,
              overview: gp.overview,
              examples: gp.examples
            },
            { onConflict: 'name', ignoreDuplicates: false }
          )
          .select()
          .single();

        if (gpError) {
          console.warn(`⚠️  Grammar point "${gp.name}" upsert failed: ${gpError.message}`);
          continue;
        }

        // Create lesson-grammar association (delete and re-insert for idempotency)
        await supabase
          .from('lesson_grammar_points')
          .delete()
          .eq('lesson_id', lesson.id)
          .eq('grammar_point_id', grammarPoint.id);

        const { error: junctionError } = await supabase
          .from('lesson_grammar_points')
          .insert({
            lesson_id: lesson.id,
            grammar_point_id: grammarPoint.id
          });

        if (junctionError) {
          console.warn(`⚠️  Failed to associate grammar point "${gp.name}": ${junctionError.message}`);
        } else {
          console.log(`  ✓ Associated grammar point: ${gp.name}`);
        }
      }
    }

    // Step 5: Insert exercises (delete existing first for idempotency)
    if (lessonData.exercises && lessonData.exercises.length > 0) {
      console.log(`\n🎯 Processing ${lessonData.exercises.length} exercises...`);

      // Delete existing exercises for this lesson
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('lesson_id', lesson.id);

      if (deleteError) {
        console.warn(`⚠️  Failed to delete existing exercises: ${deleteError.message}`);
      }

      // Insert new exercises
      for (const ex of lessonData.exercises) {
        // Validate exercise type
        const validTypes = ['fill_blank', 'multiple_choice', 'translation'];
        if (!validTypes.includes(ex.type)) {
          throw new Error(`Invalid exercise type: ${ex.type} (must be one of ${validTypes.join(', ')})`);
        }

        const { error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            lesson_id: lesson.id,
            type: ex.type,
            prompt: ex.prompt,
            answer: ex.answer,
            options: ex.options || null,
            xp_value: ex.xp_value || 10
          });

        if (exerciseError) {
          console.warn(`⚠️  Failed to insert exercise: ${exerciseError.message}`);
        } else {
          console.log(`  ✓ Inserted ${ex.type} exercise: "${ex.prompt.substring(0, 50)}..."`);
        }
      }
    }

    console.log(`\n✅ Lesson "${lessonData.title}" successfully seeded!\n`);
  } catch (error) {
    console.error(`\n❌ Error parsing lesson:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: npm run seed:lessons -- <path-to-lesson.yaml>');
  console.error('   Example: npm run seed:lessons -- lessons/a1/lesson-01.yaml');
  process.exit(1);
}

parseAndSeedLesson(filePath);
