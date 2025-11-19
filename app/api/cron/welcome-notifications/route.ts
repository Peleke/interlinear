/**
 * Welcome Push Notifications CRON Job
 * Sends welcome notifications 1 hour after user signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configure web-push
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
    console.log('👋 Welcome notifications CRON job started');

    // Verify this is a legitimate CRON request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('🔒 Unauthorized CRON request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find users who signed up approximately 1 hour ago (with some buffer)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const oneHourFifteenMinutesAgo = new Date();
    oneHourFifteenMinutesAgo.setMinutes(oneHourFifteenMinutesAgo.getMinutes() - 75);

    console.log(`🕐 Looking for users who signed up between ${oneHourFifteenMinutesAgo.toISOString()} and ${oneHourAgo.toISOString()}`);

    // Get users who signed up in the target window and haven't been welcomed yet
    const { data: recentUsers, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .gte('created_at', oneHourFifteenMinutesAgo.toISOString())
      .lte('created_at', oneHourAgo.toISOString());

    if (userError) {
      console.error('❌ Error fetching recent users:', userError);
      // Try alternative approach with RPC call
      return await sendWelcomeNotificationsAlternative(oneHourFifteenMinutesAgo, oneHourAgo);
    }

    if (!recentUsers || recentUsers.length === 0) {
      console.log('📭 No users found in welcome notification window');
      return NextResponse.json({
        success: true,
        message: 'No users to welcome',
        welcomed: 0
      });
    }

    console.log(`👋 Found ${recentUsers.length} users to welcome`);

    // Get push subscriptions for these users
    const userIds = recentUsers.map(u => u.id);

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No push subscriptions found for recent users');
      return NextResponse.json({
        success: true,
        message: 'No subscriptions for recent users',
        welcomed: 0
      });
    }

    // Send welcome notifications
    const welcomeResults = await sendWelcomeNotifications(subscriptions, recentUsers);

    return NextResponse.json({
      success: true,
      message: 'Welcome notifications sent',
      results: welcomeResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in welcome notifications CRON:', error);
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

async function sendWelcomeNotifications(subscriptions: any[], users: any[]) {
  const sendPromises = subscriptions.map(async (sub) => {
    const user = users.find(u => u.id === sub.user_id);

    if (!user) {
      return { success: false, userId: sub.user_id, error: 'User not found' };
    }

    const welcomeNotification = JSON.stringify({
      title: '🎉 ¡Bienvenido a tu aventura lingüística!',
      body: 'Thanks for joining! Your personalized Spanish & Latin learning journey starts now.',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'welcome-notification',
      data: {
        url: '/word-of-day',
        type: 'welcome',
        timestamp: Date.now(),
        user_id: user.id
      },
      actions: [
        {
          action: 'explore',
          title: 'Explore Words',
          icon: '/icon-192x192.svg'
        },
        {
          action: 'settings',
          title: 'Settings'
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
      await webpush.sendNotification(pushSubscription, welcomeNotification);
      console.log(`✅ Sent welcome notification to user ${sub.user_id} (${user.email})`);
      return {
        success: true,
        userId: sub.user_id,
        email: user.email,
        signupTime: user.created_at
      };
    } catch (error: any) {
      console.error(`❌ Failed to send welcome to user ${sub.user_id}:`, error.message);

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

  console.log(`📊 Welcome notifications: ${successCount} successful, ${failCount} failed`);

  return {
    success: true,
    stats: {
      totalUsers: users.length,
      totalSubscriptions: subscriptions.length,
      successful: successCount,
      failed: failCount
    },
    results: results.map(r => ({
      userId: r.userId,
      success: r.success,
      email: r.success ? r.email : undefined
    }))
  };
}

// Alternative approach if direct auth.users access fails
async function sendWelcomeNotificationsAlternative(startTime: Date, endTime: Date) {
  try {
    console.log('🔄 Using alternative approach for welcome notifications');

    // Get all push subscriptions created in the time window
    // (assuming users enable notifications shortly after signup)
    const { data: recentSubs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString());

    if (error || !recentSubs || recentSubs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recent subscriptions found',
        welcomed: 0
      });
    }

    // Send welcome notifications to these recent subscriptions
    const results = await sendWelcomeNotificationsSimple(recentSubs);

    return NextResponse.json({
      success: true,
      message: 'Welcome notifications sent (alternative method)',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Alternative welcome notification method failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Welcome notifications failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function sendWelcomeNotificationsSimple(subscriptions: any[]) {
  const sendPromises = subscriptions.map(async (sub) => {
    const welcomeNotification = JSON.stringify({
      title: '🎉 Welcome to your language adventure!',
      body: 'Thanks for joining! Start exploring Spanish & Latin words today.',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: 'welcome-notification',
      data: {
        url: '/',
        type: 'welcome',
        timestamp: Date.now(),
        user_id: sub.user_id
      },
      actions: [
        {
          action: 'start',
          title: 'Get Started',
          icon: '/icon-192x192.svg'
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
      await webpush.sendNotification(pushSubscription, welcomeNotification);
      console.log(`✅ Sent simple welcome to user ${sub.user_id}`);
      return { success: true, userId: sub.user_id };
    } catch (error: any) {
      console.error(`❌ Failed to send simple welcome:`, error.message);
      return { success: false, userId: sub.user_id, error: error.message };
    }
  });

  const results = await Promise.all(sendPromises);

  return {
    success: true,
    welcomed: results.filter(r => r.success).length,
    results
  };
}

// Support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}