import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Basic admin authentication (in production, use proper auth)
    const { adminSecret } = await request.json();
    const expectedSecret = process.env.ADMIN_SECRET || 'admin-dev-secret';

    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger the new CRON job manually
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';
    const cronResponse = await fetch(`${request.nextUrl.origin}/api/cron/daily-word-generation`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!cronResponse.ok) {
      const errorData = await cronResponse.json();
      throw new Error(`CRON job failed: ${errorData.message}`);
    }

    const result = await cronResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Daily word generation and notifications triggered successfully',
      result
    });

  } catch (error) {
    console.error('Error triggering daily notifications:', error);
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
    message: 'Admin trigger endpoint for daily notifications',
    usage: {
      method: 'POST',
      body: '{ "adminSecret": "your-admin-secret" }',
      description: 'Manually trigger daily Spanish word notifications'
    }
  });
}