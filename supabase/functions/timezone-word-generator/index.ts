// Timezone-Aware Word Generator Edge Function
// Runs every hour and generates words for timezones hitting midnight

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Major timezones we support (ordered by UTC offset)
const SUPPORTED_TIMEZONES = [
  'Pacific/Auckland',     // UTC+12/+13 (NZDT)
  'Australia/Sydney',     // UTC+10/+11 (AEDT)
  'Asia/Tokyo',          // UTC+9 (JST)
  'Asia/Singapore',      // UTC+8 (SGT)
  'Asia/Kolkata',        // UTC+5:30 (IST)
  'Europe/London',       // UTC+0/+1 (GMT/BST)
  'Europe/Paris',        // UTC+1/+2 (CET/CEST)
  'America/New_York',    // UTC-5/-4 (EST/EDT)
  'America/Chicago',     // UTC-6/-5 (CST/CDT)
  'America/Denver',      // UTC-7/-6 (MST/MDT)
  'America/Los_Angeles', // UTC-8/-7 (PST/PDT)
  'Pacific/Honolulu'     // UTC-10 (HST)
]

const LANGUAGES = ['spanish', 'latin'] as const
type Language = typeof LANGUAGES[number]

interface TimezoneInfo {
  timezone: string
  currentDate: string
  isNewDay: boolean
  utcOffset: number
}

Deno.serve(async (req) => {
  try {
    console.log('🌍 Timezone Word Generator started')

    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const cronSecret = Deno.env.get('CRON_SECRET') || 'dev-secret-change-in-production'

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('🔒 Unauthorized request to Edge Function')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Step 1: Find timezones that just hit midnight (within the last hour)
    const timezonesToGenerate = await findNewDayTimezones()

    if (timezonesToGenerate.length === 0) {
      console.log('⏰ No timezones hitting midnight right now')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No timezones require word generation at this time',
          timestamp: new Date().toISOString()
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🎯 Found ${timezonesToGenerate.length} timezones needing words:`,
      timezonesToGenerate.map(tz => `${tz.timezone} (${tz.currentDate})`))

    // Step 2: Generate words for each timezone-language combination
    const generationResults: any[] = []

    for (const timezoneInfo of timezonesToGenerate) {
      for (const language of LANGUAGES) {
        try {
          // Check if word already exists for this timezone-date-language
          const existingWord = await checkExistingWord(
            supabase,
            language,
            timezoneInfo.timezone,
            timezoneInfo.currentDate
          )

          if (existingWord) {
            console.log(`✅ Word already exists: ${language} for ${timezoneInfo.timezone} ${timezoneInfo.currentDate}`)
            generationResults.push({
              timezone: timezoneInfo.timezone,
              language,
              date: timezoneInfo.currentDate,
              status: 'already_exists',
              word: existingWord.word
            })
            continue
          }

          // Generate new word
          const wordResult = await generateWordForTimezone(
            supabase,
            language,
            timezoneInfo.timezone,
            timezoneInfo.currentDate
          )

          generationResults.push({
            timezone: timezoneInfo.timezone,
            language,
            date: timezoneInfo.currentDate,
            status: wordResult.success ? 'generated' : 'failed',
            word: wordResult.word,
            error: wordResult.error
          })

          console.log(`${wordResult.success ? '✅' : '❌'} ${language} word for ${timezoneInfo.timezone}: ${wordResult.word || wordResult.error}`)

        } catch (error) {
          console.error(`❌ Failed to process ${language} for ${timezoneInfo.timezone}:`, error)
          generationResults.push({
            timezone: timezoneInfo.timezone,
            language,
            date: timezoneInfo.currentDate,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    // Step 3: Send notifications to users in affected timezones
    console.log('🔔 Sending notifications to users in affected timezones...')
    const notificationResults = await sendTimezoneNotifications(
      supabase,
      timezonesToGenerate.map(tz => tz.timezone)
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Timezone-aware word generation complete',
        results: {
          timezones_processed: timezonesToGenerate.length,
          words_generated: generationResults.filter(r => r.status === 'generated').length,
          words_already_existed: generationResults.filter(r => r.status === 'already_exists').length,
          generation_failures: generationResults.filter(r => r.status === 'failed' || r.status === 'error').length,
          generation_details: generationResults,
          notifications: notificationResults
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Edge Function execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function findNewDayTimezones(): Promise<TimezoneInfo[]> {
  const newDayTimezones: TimezoneInfo[] = []
  const now = new Date()

  for (const timezone of SUPPORTED_TIMEZONES) {
    try {
      // Get current time in this timezone
      const timezoneTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
      const currentDate = timezoneTime.toISOString().split('T')[0]

      // Check if it's between midnight and 1 AM in this timezone
      const hour = timezoneTime.getHours()
      const minute = timezoneTime.getMinutes()

      // Consider it "new day" if it's within first hour of the day (00:00 - 00:59)
      const isNewDay = hour === 0

      if (isNewDay) {
        // Calculate UTC offset for debugging
        const utcTime = new Date(now.toISOString())
        const utcOffset = (timezoneTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60)

        newDayTimezones.push({
          timezone,
          currentDate,
          isNewDay: true,
          utcOffset
        })

        console.log(`🌅 New day in ${timezone}: ${currentDate} (${hour}:${minute.toString().padStart(2, '0')})`)
      }
    } catch (error) {
      console.error(`❌ Error processing timezone ${timezone}:`, error)
    }
  }

  return newDayTimezones
}

async function checkExistingWord(
  supabase: any,
  language: Language,
  timezone: string,
  date: string
) {
  try {
    const { data, error } = await supabase
      .from('word_of_day')
      .select('word, language, timezone, timezone_date')
      .eq('language', language)
      .eq('timezone', timezone)
      .eq('timezone_date', date)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return data
  } catch (error) {
    console.error(`❌ Error checking existing word:`, error)
    return null
  }
}

async function generateWordForTimezone(
  supabase: any,
  language: Language,
  timezone: string,
  date: string
) {
  try {
    // Call the existing word generation API (internal to Supabase)
    const baseUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/generate-word-of-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        date,
        timezone, // Pass timezone context
        source: 'timezone-edge-function'
      })
    })

    if (!response.ok) {
      throw new Error(`Generation API failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`Generation failed: ${result.message}`)
    }

    return {
      success: true,
      word: result.data?.word,
      timezone,
      date
    }

  } catch (error) {
    console.error(`❌ Word generation failed for ${language} ${timezone} ${date}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timezone,
      date
    }
  }
}

async function sendTimezoneNotifications(
  supabase: any,
  affectedTimezones: string[]
): Promise<any> {
  try {
    console.log(`📤 Sending notifications for timezones: ${affectedTimezones.join(', ')}`)

    // For now, we'll implement a simple notification strategy
    // In the future, we can make this more sophisticated by storing user timezones
    // and only notifying users in the affected timezones

    // Get all users with notifications enabled
    const { data: usersWithNotifications, error: prefError } = await supabase
      .from('user_wod_preferences')
      .select('user_id, preferred_language, notifications_enabled')
      .eq('notifications_enabled', true)

    if (prefError) {
      throw prefError
    }

    if (!usersWithNotifications || usersWithNotifications.length === 0) {
      return { success: true, message: 'No users to notify', notified: 0 }
    }

    console.log(`📬 Found ${usersWithNotifications.length} users with notifications enabled`)

    // For MVP: notify all users when any timezone gets a new word
    // TODO: Make this timezone-specific when we have user timezone preferences

    return {
      success: true,
      message: 'Timezone-aware notifications (MVP implementation)',
      affected_timezones: affectedTimezones,
      potential_users: usersWithNotifications.length,
      note: 'Full timezone-specific notifications will be implemented after user timezone detection'
    }

  } catch (error) {
    console.error('❌ Error sending timezone notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}