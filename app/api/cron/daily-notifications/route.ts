import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function GET(request: NextRequest) {
  try {
    // Configure web-push with VAPID keys at runtime
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('🕐 Daily notification CRON job started');

    // Verify this is a legitimate CRON request (basic security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('🔒 Unauthorized CRON request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch today's Spanish word
    const wordResponse = await fetch(`${request.nextUrl.origin}/api/daily-word`);
    if (!wordResponse.ok) {
      throw new Error('Failed to fetch daily word');
    }

    const wordData = await wordResponse.json();
    const { word, definitions, partOfSpeech, examples } = wordData.data;

    console.log(`📚 Today's word: ${word} (${partOfSpeech})`);

    // 2. Get all active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No active push subscriptions found');
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions',
        wordData
      });
    }

    console.log(`📤 Sending to ${subscriptions.length} subscribers`);

    // 3. Create notification content
    const title = `¡Palabra del día! 📚`;
    const body = `${word} (${partOfSpeech}) - ${definitions[0] || 'Spanish word of the day'}`;
    const example = examples[0] || '';

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'daily-word',
      data: {
        word,
        definitions,
        partOfSpeech,
        examples,
        url: '/vocabulary',
        timestamp: Date.now(),
        type: 'daily-word'
      },
      actions: [
        {
          action: 'open',
          title: 'Learn More',
          icon: '/icon-192x192.svg'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ],
      // Show more details in the notification
      ...(example && {
        body: `${body}\n\nExample: "${example}"`
      })
    });

    // 4. Send notifications to all subscribers
    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log(`✅ Sent to user ${sub.user_id}`);
        return { success: true, userId: sub.user_id };
      } catch (error: any) {
        console.error(`❌ Failed to send to user ${sub.user_id}:`, error.message);

        // Clean up invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`🗑️ Removing invalid subscription for user ${sub.user_id}`);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }

        return { success: false, userId: sub.user_id, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`📊 Notifications sent: ${successCount} successful, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Daily word notifications sent`,
      stats: {
        wordOfDay: { word, partOfSpeech, definition: definitions[0] },
        subscribers: subscriptions.length,
        successful: successCount,
        failed: failCount,
        timestamp: new Date().toISOString()
      },
      results: results.map(r => ({ userId: r.userId, success: r.success }))
    });

  } catch (error) {
    console.error('❌ Error in daily notification CRON:', error);
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

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}