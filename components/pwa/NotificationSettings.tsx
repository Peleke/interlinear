'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NotificationSettingsProps {
  userId?: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return
    }

    setPermission(Notification.permission)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('Error checking subscription status:', err)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        await subscribeToNotifications()
      } else {
        setError('Notification permission denied')
      }
    } catch (err) {
      setError('Failed to request notification permission')
      console.error('Permission request failed:', err)
    }
  }

  const subscribeToNotifications = async () => {
    if (!userId) {
      setError('Please log in to enable notifications')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready

      // Get VAPID public key from the API
      const vapidResponse = await fetch('/api/notifications/vapid')
      if (!vapidResponse.ok) throw new Error('Failed to get VAPID key')

      const { publicKey } = await vapidResponse.json()

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      })

      // Save subscription to database
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      setSuccess('Push notifications enabled! You\'ll receive daily word notifications.')

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)

    } catch (err) {
      setError('Failed to enable notifications')
      console.error('Subscription failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove subscription from database
      if (userId) {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        })
      }

      setIsSubscribed(false)
      setSuccess('Push notifications disabled')

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)

    } catch (err) {
      setError('Failed to disable notifications')
      console.error('Unsubscribe failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const testNotification = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/test-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setSuccess('Test notification sent!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error('Failed to send test notification')
      }
    } catch (err) {
      setError('Failed to send test notification')
      console.error('Test notification failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle size={20} />
          <span className="font-medium">Push notifications not supported</span>
        </div>
        <p className="text-sm text-amber-600 mt-1">
          Your browser doesn't support push notifications. Try using Chrome, Firefox, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <X size={20} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <Check size={20} />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white border border-sepia-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          {isSubscribed ? (
            <Bell className="text-green-600" size={24} />
          ) : (
            <BellOff className="text-sepia-400" size={24} />
          )}
          <div>
            <h3 className="font-semibold text-sepia-900">Push Notifications</h3>
            <p className="text-sm text-sepia-600">
              Get notified about your daily word and learning reminders
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-sepia-50 rounded-lg">
            <div>
              <div className="font-medium text-sepia-900">Daily Word Notifications</div>
              <div className="text-sm text-sepia-600">
                Receive your word of the day at 9:00 AM
              </div>
            </div>
            <div className="flex items-center gap-2">
              {permission === 'default' && (
                <button
                  onClick={requestNotificationPermission}
                  disabled={loading}
                  className="px-4 py-2 bg-sepia-700 hover:bg-sepia-800 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {loading ? 'Enabling...' : 'Enable'}
                </button>
              )}

              {permission === 'granted' && !isSubscribed && (
                <button
                  onClick={subscribeToNotifications}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </button>
              )}

              {permission === 'granted' && isSubscribed && (
                <div className="flex gap-2">
                  <button
                    onClick={testNotification}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors text-sm"
                  >
                    Test
                  </button>
                  <button
                    onClick={unsubscribeFromNotifications}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md transition-colors"
                  >
                    {loading ? 'Disabling...' : 'Disable'}
                  </button>
                </div>
              )}

              {permission === 'denied' && (
                <span className="text-red-600 text-sm">
                  Blocked - Enable in browser settings
                </span>
              )}
            </div>
          </div>

          {isSubscribed && (
            <div className="text-sm text-sepia-600 bg-green-50 border border-green-200 rounded-lg p-3">
              ✅ You're subscribed to push notifications. You'll receive daily word notifications and can get test notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}