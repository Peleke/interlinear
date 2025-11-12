#!/usr/bin/env node

// Retroactively publish all courses that don't have a published_at timestamp
// This script should be run once to migrate existing courses to the new publishing system

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function publishAllCourses() {
  try {
    console.log('🔍 Finding unpublished courses...')

    // Get all courses without a published_at timestamp
    const { data: unpublishedCourses, error: fetchError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        created_by,
        lessons:lessons(count)
      `)
      .is('published_at', null)

    if (fetchError) {
      throw new Error(`Failed to fetch unpublished courses: ${fetchError.message}`)
    }

    console.log(`📚 Found ${unpublishedCourses?.length || 0} unpublished courses`)

    if (!unpublishedCourses || unpublishedCourses.length === 0) {
      console.log('✅ All courses are already published!')
      return
    }

    const publishTimestamp = new Date().toISOString()

    // Publish all unpublished courses (using their creator as publisher)
    const updatePromises = unpublishedCourses.map(async (course) => {
      // Check if course has any lessons (courses without lessons might not be ready)
      const lessonCount = course.lessons?.[0]?.count || 0

      if (lessonCount === 0) {
        console.log(`⚠️  Skipping "${course.title}" - no lessons found`)
        return null
      }

      const { data, error } = await supabase
        .from('courses')
        .update({
          published_at: publishTimestamp,
          published_by: course.created_by, // Use course creator as publisher
          version: 1
        })
        .eq('id', course.id)
        .select('id, title')
        .single()

      if (error) {
        console.error(`❌ Failed to publish course "${course.title}":`, error.message)
        return null
      }

      console.log(`✅ Published: "${course.title}" (${lessonCount} lessons)`)
      return data
    })

    const results = await Promise.all(updatePromises)
    const publishedCourses = results.filter(result => result !== null)

    console.log('\n🎉 Course Publishing Summary:')
    console.log(`📈 Successfully published: ${publishedCourses.length} courses`)
    console.log(`⏭️  Skipped (no lessons): ${unpublishedCourses.length - publishedCourses.length} courses`)

    if (publishedCourses.length > 0) {
      console.log('\n📋 Published Courses:')
      publishedCourses.forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.title} (ID: ${course.id})`)
      })
    }

    console.log(`\n✅ Course migration complete!`)

  } catch (error) {
    console.error('❌ Course migration failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  publishAllCourses()
}

module.exports = { publishAllCourses }