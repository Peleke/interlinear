#!/usr/bin/env node

// Retroactively publish all lessons that don't have a published_at timestamp
// This script should be run once to migrate existing lessons to the new publishing system

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function publishAllLessons() {
  try {
    console.log('🔍 Finding unpublished lessons...')

    // Get all lessons without a published_at timestamp
    const { data: unpublishedLessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, author_id')
      .is('published_at', null)

    if (fetchError) {
      throw new Error(`Failed to fetch unpublished lessons: ${fetchError.message}`)
    }

    console.log(`📚 Found ${unpublishedLessons?.length || 0} unpublished lessons`)

    if (!unpublishedLessons || unpublishedLessons.length === 0) {
      console.log('✅ All lessons are already published!')
      return
    }

    const publishTimestamp = new Date().toISOString()

    // Publish all unpublished lessons (using their author as publisher)
    const updatePromises = unpublishedLessons.map(async (lesson) => {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          published_at: publishTimestamp,
          published_by: lesson.author_id, // Use lesson's author as publisher
          version: 1
        })
        .eq('id', lesson.id)
        .select('id, title')
        .single()

      if (error) {
        console.error(`❌ Failed to publish lesson "${lesson.title}":`, error.message)
        return null
      }
      return data
    })

    const results = await Promise.all(updatePromises)
    const updatedLessons = results.filter(result => result !== null)

    console.log('🎉 Successfully published lessons:')
    updatedLessons?.forEach((lesson, index) => {
      console.log(`  ${index + 1}. ${lesson.title} (ID: ${lesson.id})`)
    })

    console.log(`\n✅ Migration complete! ${updatedLessons?.length || 0} lessons published.`)

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  publishAllLessons()
}

module.exports = { publishAllLessons }