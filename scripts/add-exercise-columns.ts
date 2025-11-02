import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumns() {
  console.log('🔧 Adding spanish_text and english_text columns to exercises table...');

  // Try to update a row to see if columns exist (will fail if they don't)
  // This is a workaround since Supabase doesn't have direct ALTER TABLE via JS client
  const { data: testData, error: testError } = await supabase
    .from('exercises')
    .select('id, spanish_text, english_text')
    .limit(1);

  if (testError && testError.message.includes('column')) {
    console.log('⚠️  Columns don\'t exist. Please run this SQL manually in Supabase dashboard:');
    console.log('');
    console.log('ALTER TABLE exercises');
    console.log('ADD COLUMN IF NOT EXISTS spanish_text TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS english_text TEXT;');
    console.log('');
    console.log('Then re-run: npm run seed:lessons:v2 -- lessons');
    process.exit(1);
  }

  console.log('✅ Columns already exist or test passed!');
}

addColumns();
