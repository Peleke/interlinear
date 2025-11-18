/**
 * Admin Trigger for Welcome Notifications
 * Manually trigger the welcome notification CRON job for testing
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Basic admin authentication (same as daily notifications)
    const { adminSecret } = await request.json();
    const expectedSecret = process.env.ADMIN_SECRET || 'admin-dev-secret';

    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger the welcome notification CRON job
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';
    const cronResponse = await fetch(`${request.nextUrl.origin}/api/cron/welcome-notifications`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!cronResponse.ok) {
      const errorData = await cronResponse.json();
      throw new Error(`Welcome notification CRON failed: ${errorData.message}`);
    }

    const result = await cronResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Welcome notifications triggered successfully',
      result
    });

  } catch (error) {
    console.error('Error triggering welcome notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin trigger endpoint for welcome notifications',
    usage: {
      method: 'POST',
      body: '{ "adminSecret": "your-admin-secret" }',
      description: 'Manually trigger welcome notifications for users who signed up ~1 hour ago'
    }
  });
}