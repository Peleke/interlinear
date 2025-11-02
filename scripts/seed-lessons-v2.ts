import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse as parseYAML } from 'yaml';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface VocabularyItem {
  spanish: string;
  english: string;
}

interface DialogExchange {
  speaker: string;
  spanish: string;
  english: string;
}

interface Dialog {
  context: string;
  setting?: string;
  exchanges: DialogExchange[];
}

interface Exercise {
  type: string;
  dialog_line?: number;
  prompt: string;
  spanish_text?: string;
  english_text?: string;
  answer: string;
}

interface ContentSection {
  title: string;
  content: string;
}

interface LessonYAML {
  id: number;
  title: string;
  title_english: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  lesson_number: number;
  description: string;
  grammar_concepts: string[];  // Natural keys
  dialog: Dialog;
  vocabulary: VocabularyItem[];
  exercises: Exercise[];
  content_sections: ContentSection[];
}

interface GrammarConceptYAML {
  name: string;
  display_name: string;
  description: string;
  content: string;
  associated_vocabulary: VocabularyItem[];
  related_grammar: string[];
}

// =============================================================================
// LOOKUP-OR-CREATE HELPERS
// =============================================================================

/**
 * Lookup or create a vocabulary item by natural key (spanish, english)
 * Returns the vocabulary ID (UUID)
 */
async function lookupOrCreateVocabulary(item: VocabularyItem): Promise<string> {
  // First, try to find existing vocabulary
  const { data: existing, error: lookupError } = await supabase
    .from('lesson_vocabulary_items')
    .select('id')
    .eq('spanish', item.spanish)
    .eq('english', item.english)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Vocabulary lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    return existing.id;
  }

  // If not found, create it
  const { data: newVocab, error: insertError } = await supabase
    .from('lesson_vocabulary_items')
    .insert({
      spanish: item.spanish,
      english: item.english
    })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Vocabulary insert failed: ${insertError.message}`);
  }

  return newVocab.id;
}

/**
 * Lookup or create a grammar concept by name
 * Returns the grammar concept ID (UUID)
 */
async function lookupOrCreateGrammarConcept(name: string, grammarData?: GrammarConceptYAML): Promise<string> {
  // First, try to find existing concept
  const { data: existing, error: lookupError } = await supabase
    .from('grammar_concepts')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Grammar concept lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    return existing.id;
  }

  // If not found and we have data, create it
  if (!grammarData) {
    throw new Error(`Grammar concept "${name}" not found and no data provided to create it`);
  }

  // Process associated vocabulary IDs
  const vocabIds: string[] = [];
  if (grammarData.associated_vocabulary) {
    for (const vocabItem of grammarData.associated_vocabulary) {
      const vocabId = await lookupOrCreateVocabulary(vocabItem);
      vocabIds.push(vocabId);
    }
  }

  const { data: newConcept, error: insertError } = await supabase
    .from('grammar_concepts')
    .insert({
      name: grammarData.name,
      display_name: grammarData.display_name,
      description: grammarData.description,
      content: grammarData.content,
      associated_vocab_ids: vocabIds,
      related_grammar_ids: []  // Will be populated later if needed
    })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Grammar concept insert failed: ${insertError.message}`);
  }

  return newConcept.id;
}

// =============================================================================
// SEEDING FUNCTIONS
// =============================================================================

/**
 * Load and seed all grammar concepts from YAML files
 */
async function seedGrammarConcepts(grammarDir: string): Promise<Map<string, string>> {
  console.log('\n📚 Seeding Grammar Concepts...');

  const grammarMap = new Map<string, string>();
  const files = readdirSync(grammarDir).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const filePath = join(grammarDir, file);
    const fileContent = readFileSync(filePath, 'utf-8');
    const grammarData = parseYAML(fileContent) as GrammarConceptYAML;

    console.log(`  📖 Processing: ${grammarData.display_name}`);

    const conceptId = await lookupOrCreateGrammarConcept(grammarData.name, grammarData);
    grammarMap.set(grammarData.name, conceptId);

    console.log(`    ✓ ID: ${conceptId}`);
  }

  console.log(`\n✅ Seeded ${grammarMap.size} grammar concepts\n`);
  return grammarMap;
}

/**
 * Seed a single lesson with all its relationships
 */
async function seedLesson(filePath: string, grammarMap: Map<string, string>): Promise<void> {
  console.log(`\n📖 Seeding Lesson: ${filePath}`);

  const fileContent = readFileSync(filePath, 'utf-8');
  const lessonData = parseYAML(fileContent) as LessonYAML;

  console.log(`  Title: ${lessonData.title} (${lessonData.title_english})`);
  console.log(`  Level: ${lessonData.level}, Lesson #${lessonData.lesson_number}`);

  // Step 1: Upsert course by level
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .upsert(
      {
        level: lessonData.level,
        title: `Spanish ${lessonData.level} Course`,
        description: `Complete ${lessonData.level} level Spanish course`
      },
      { onConflict: 'level', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (courseError) throw new Error(`Course upsert failed: ${courseError.message}`);

  // Step 2: Delete existing lesson by ID OR by (course_id, sequence_order)
  const lessonId = lessonData.id.toString();

  // First, try to delete by lesson ID
  await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  // Also delete by course + sequence (in case ID doesn't match)
  const { data: conflictingLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', course.id)
    .eq('sequence_order', lessonData.lesson_number)
    .maybeSingle();

  if (conflictingLesson) {
    console.log(`  ℹ️  Deleting conflicting lesson at sequence ${lessonData.lesson_number}...`);
    await supabase
      .from('lessons')
      .delete()
      .eq('id', conflictingLesson.id);
  }

  // Insert lesson (fresh insert, not upsert)
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      id: lessonId,
      course_id: course.id,
      title: lessonData.title,
      overview: lessonData.description,
      xp_value: 100,  // Default XP
      sequence_order: lessonData.lesson_number,
      grammar_content: {
        markdown: lessonData.content_sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n')
      },
      vocabulary: lessonData.vocabulary  // Keep for backward compatibility
    })
    .select()
    .single();

  if (lessonError) throw new Error(`Lesson insert failed: ${lessonError.message}`);
  console.log(`  ✓ Lesson ID: ${lessonId}`);

  // Step 3: Process vocabulary items (lookup-or-create)
  console.log(`\n  📝 Processing ${lessonData.vocabulary.length} vocabulary items...`);

  // Delete existing associations first
  await supabase
    .from('lesson_vocabulary')
    .delete()
    .eq('lesson_id', lessonId);

  for (const vocabItem of lessonData.vocabulary) {
    const vocabId = await lookupOrCreateVocabulary(vocabItem);

    // Create lesson-vocabulary association
    const { error: junctionError } = await supabase
      .from('lesson_vocabulary')
      .insert({
        lesson_id: lessonId,
        vocabulary_id: vocabId,
        is_new: true  // Assume all are new for now
      });

    if (junctionError) {
      console.warn(`    ⚠️  Failed to link vocab "${vocabItem.spanish}": ${junctionError.message}`);
    }
  }

  console.log(`    ✓ Linked ${lessonData.vocabulary.length} vocabulary items`);

  // Step 4: Link grammar concepts
  console.log(`\n  📚 Linking ${lessonData.grammar_concepts.length} grammar concepts...`);

  // Delete existing associations first
  await supabase
    .from('lesson_grammar_concepts')
    .delete()
    .eq('lesson_id', lessonId);

  for (const conceptName of lessonData.grammar_concepts) {
    const conceptId = grammarMap.get(conceptName);

    if (!conceptId) {
      console.warn(`    ⚠️  Grammar concept "${conceptName}" not found in map`);
      continue;
    }

    const { error: junctionError } = await supabase
      .from('lesson_grammar_concepts')
      .insert({
        lesson_id: lessonId,
        grammar_concept_id: conceptId
      });

    if (junctionError) {
      console.warn(`    ⚠️  Failed to link grammar concept "${conceptName}": ${junctionError.message}`);
    }
  }

  console.log(`    ✓ Linked ${lessonData.grammar_concepts.length} grammar concepts`);

  // Step 5: Create dialog
  if (lessonData.dialog) {
    console.log(`\n  💬 Creating dialog with ${lessonData.dialog.exchanges.length} exchanges...`);

    // Delete existing dialog first
    const { data: existingDialog } = await supabase
      .from('lesson_dialogs')
      .select('id')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existingDialog) {
      await supabase
        .from('lesson_dialogs')
        .delete()
        .eq('id', existingDialog.id);
    }

    // Create new dialog
    const { data: dialog, error: dialogError } = await supabase
      .from('lesson_dialogs')
      .insert({
        lesson_id: lessonId,
        context: lessonData.dialog.context,
        setting: lessonData.dialog.setting
      })
      .select('id')
      .single();

    if (dialogError) throw new Error(`Dialog insert failed: ${dialogError.message}`);

    // Insert dialog exchanges
    for (let i = 0; i < lessonData.dialog.exchanges.length; i++) {
      const exchange = lessonData.dialog.exchanges[i];

      const { error: exchangeError } = await supabase
        .from('dialog_exchanges')
        .insert({
          dialog_id: dialog.id,
          sequence_order: i,
          speaker: exchange.speaker,
          spanish: exchange.spanish,
          english: exchange.english
        });

      if (exchangeError) {
        console.warn(`    ⚠️  Failed to insert exchange ${i}: ${exchangeError.message}`);
      }
    }

    console.log(`    ✓ Created dialog with ${lessonData.dialog.exchanges.length} exchanges`);
  }

  // Step 6: Create exercises
  if (lessonData.exercises && lessonData.exercises.length > 0) {
    console.log(`\n  🎯 Creating ${lessonData.exercises.length} exercises...`);

    // Delete existing exercises first
    await supabase
      .from('exercises')
      .delete()
      .eq('lesson_id', lessonId);

    for (const exercise of lessonData.exercises) {
      const { error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          lesson_id: lessonId,
          type: 'translation',  // Default type for now
          prompt: exercise.prompt,
          answer: exercise.answer,
          xp_value: 10
        });

      if (exerciseError) {
        console.warn(`    ⚠️  Failed to insert exercise: ${exerciseError.message}`);
      }
    }

    console.log(`    ✓ Created ${lessonData.exercises.length} exercises`);
  }

  console.log(`\n✅ Lesson "${lessonData.title}" seeded successfully!\n`);
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage:');
    console.error('   npm run seed:lessons:v2 -- <lessons-dir>');
    console.error('   Example: npm run seed:lessons:v2 -- lessons');
    process.exit(1);
  }

  const lessonsDir = args[0];
  const grammarDir = join(lessonsDir, 'grammar');

  try {
    // Step 1: Seed all grammar concepts first
    const grammarMap = await seedGrammarConcepts(grammarDir);

    // Step 2: Seed all lesson YAML files
    const lessonFiles = readdirSync(lessonsDir)
      .filter(f => f.endsWith('.yaml') && f.startsWith('lesson-'))
      .sort();  // Process in order

    console.log(`\n📚 Found ${lessonFiles.length} lesson files to seed\n`);

    for (const file of lessonFiles) {
      const filePath = join(lessonsDir, file);
      await seedLesson(filePath, grammarMap);
    }

    console.log('\n🎉 All lessons seeded successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
