import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Daily Word Generation CRON job started');

    // Verify this is a legitimate CRON request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('🔒 Unauthorized CRON request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Step 1: Generate Words for Both Languages
    console.log('📚 Generating daily words...');

    const generateSpanish = await generateWordOfDay('spanish', today, request.nextUrl.origin);
    const generateLatin = await generateWordOfDay('latin', today, request.nextUrl.origin);

    const generationResults = {
      spanish: generateSpanish,
      latin: generateLatin,
      date: today
    };

    // Step 2: Send Teaser Notifications
    console.log('🔔 Sending teaser notifications...');

    const notificationResults = await sendTeaserNotifications();

    return NextResponse.json({
      success: true,
      message: 'Daily word generation and notifications complete',
      results: {
        generation: generationResults,
        notifications: notificationResults,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in daily word generation CRON:', error);
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

async function generateWordOfDay(language: 'spanish' | 'latin', date: string, origin: string) {
  try {
    console.log(`🎲 Generating ${language} word for ${date}`);

    const response = await fetch(`${origin}/api/generate-word-of-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language, date })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Generated ${language} word: ${data.data?.word}`);
      return { success: true, word: data.data?.word, language };
    } else {
      const errorData = await response.json();
      throw new Error(`Generation failed: ${errorData.message}`);
    }

  } catch (error) {
    console.error(`❌ Failed to generate ${language} word:`, error);
    return {
      success: false,
      language,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendTeaserNotifications() {
  try {
    // Get all users with notification preferences
    const { data: usersWithNotifications, error: prefError } = await supabase
      .from('user_wod_preferences')
      .select(`
        user_id,
        preferred_language,
        notifications_enabled,
        notification_time
      `)
      .eq('notifications_enabled', true);

    if (prefError) {
      throw new Error(`Failed to fetch user preferences: ${prefError.message}`);
    }

    if (!usersWithNotifications || usersWithNotifications.length === 0) {
      console.log('📭 No users have notifications enabled');
      return { success: true, message: 'No users to notify', notified: 0 };
    }

    console.log(`📤 Sending teaser notifications to ${usersWithNotifications.length} users`);

    // Get push subscriptions for users with notifications enabled
    const userIds = usersWithNotifications.map(u => u.user_id);

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No push subscriptions found for users with notifications enabled');
      return { success: true, message: 'No subscriptions to notify', notified: 0 };
    }

    // Create language-specific teaser notifications
    const sendPromises = subscriptions.map(async (sub) => {
      const userPrefs = usersWithNotifications.find(u => u.user_id === sub.user_id);

      if (!userPrefs) {
        return { success: false, userId: sub.user_id, error: 'User preferences not found' };
      }

      const isSpanish = userPrefs.preferred_language === 'spanish';
      const title = isSpanish
        ? '📚 ¡Tu palabra del día está lista!'
        : '📚 Verbum diei paratum est!';

      const body = isSpanish
        ? 'Descubre una nueva palabra española fascinante'
        : 'Discover a fascinating Latin word today';

      const notificationPayload = JSON.stringify({
        title,
        body,
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: 'daily-word-teaser',
        data: {
          url: '/word-of-day',
          language: userPrefs.preferred_language,
          timestamp: Date.now(),
          type: 'word-teaser'
        },
        actions: [
          {
            action: 'open',
            title: isSpanish ? 'Ver Palabra' : 'See Word',
            icon: '/icon-192x192.svg'
          },
          {
            action: 'close',
            title: isSpanish ? 'Cerrar' : 'Close'
          }
        ]
      });

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log(`✅ Sent teaser to user ${sub.user_id} (${userPrefs.preferred_language})`);
        return { success: true, userId: sub.user_id, language: userPrefs.preferred_language };
      } catch (error: any) {
        console.error(`❌ Failed to send teaser to user ${sub.user_id}:`, error.message);

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

    console.log(`📊 Teaser notifications: ${successCount} successful, ${failCount} failed`);

    return {
      success: true,
      message: 'Teaser notifications sent',
      stats: {
        totalUsers: usersWithNotifications.length,
        totalSubscriptions: subscriptions.length,
        successful: successCount,
        failed: failCount
      },
      results: results.map(r => ({ userId: r.userId, success: r.success }))
    };

  } catch (error) {
    console.error('❌ Error sending teaser notifications:', error);
    return {
      success: false,
      error: 'Failed to send notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}