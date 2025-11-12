/**
 * Generation Job Status Polling Endpoint
 *
 * GET /api/generation-jobs/[jobId]
 *
 * Returns current status and progress of a content generation job
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch job with RLS (user can only see their own jobs)
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      jobId: job.id,
      lessonId: job.lesson_id,
      readingId: job.reading_id,
      status: job.status,
      progress: job.progress || {},
      results: job.results || {},
      error: job.error,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    })
  } catch (error) {
    console.error('[Job Status] Error fetching job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}
