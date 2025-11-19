/**
 * Admin Test Push Notification API
 * Manually send a test notification to verify push system
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_CONTACT_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const { adminSecret, title = "🧪 Test Notification", body = "This is a test push notification!" } = await request.json();

    // Basic admin authentication
    if (adminSecret !== 'admin-dev-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Sending test push notification...');

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions to test',
        sent: 0
      });
    }

    // Test notification payload
    const testPayload = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        url: '/word-of-day',
        timestamp: new Date().toISOString()
      }
    };

    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    // Send to each subscription
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify(testPayload));
        sentCount++;
        results.push({ id: sub.id, status: 'sent' });
        console.log(`✅ Test notification sent to subscription ${sub.id}`);
      } catch (error) {
        failedCount++;
        results.push({ id: sub.id, status: 'failed', error: error.message });
        console.error(`❌ Failed to send to subscription ${sub.id}:`, error.message);

        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          console.log(`🗑️ Removed invalid subscription ${sub.id}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification batch complete',
      totalSubscriptions: subscriptions.length,
      sent: sentCount,
      failed: failedCount,
      results: results.slice(0, 5), // Limit results for readability
      payload: testPayload
    });

  } catch (error) {
    console.error('❌ Error sending test notification:', error);
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