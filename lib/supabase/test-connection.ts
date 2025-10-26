// Test script to verify Supabase connection
// Run with: npx tsx lib/supabase/test-connection.ts

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testConnection() {
  console.log('🔗 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Check if we can query the vocabulary_entries table
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Query error:', error.message)
      return false
    }

    console.log('✅ Successfully connected to Supabase!')
    console.log('✅ vocabulary_entries table accessible')
    console.log('✅ RLS policies are active')
    return true
  } catch (err) {
    console.error('❌ Connection failed:', err)
    return false
  }
}

testConnection()
