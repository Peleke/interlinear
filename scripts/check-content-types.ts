import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContentTypes() {
  console.log('🔍 Checking content_type values in lesson_content...\n')

  // Get all distinct content types
  const { data: types, error: typesError } = await supabase
    .from('lesson_content')
    .select('content_type')

  if (typesError) {
    console.error('❌ Error fetching content types:', typesError)
    return
  }

  // Count by type
  const counts: Record<string, number> = {}
  types?.forEach(row => {
    counts[row.content_type] = (counts[row.content_type] || 0) + 1
  })

  console.log('📊 Content Type Distribution:')
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count} blocks`)
  })

  // Show sample of interlinear content
  const { data: samples } = await supabase
    .from('lesson_content')
    .select('id, lesson_id, content_type, content')
    .eq('content_type', 'interlinear')
    .limit(2)

  if (samples && samples.length > 0) {
    console.log('\n📝 Sample interlinear content:')
    samples.forEach((sample, idx) => {
      console.log(`\n  Sample ${idx + 1}:`)
      console.log(`  Lesson ID: ${sample.lesson_id}`)
      console.log(`  Content preview: ${sample.content?.substring(0, 100)}...`)
    })
  }
}

checkContentTypes().then(() => {
  console.log('\n✅ Check complete!')
  process.exit(0)
}).catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
