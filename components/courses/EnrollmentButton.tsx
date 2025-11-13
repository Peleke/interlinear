'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

interface EnrollmentButtonProps {
  courseId: number
  isEnrolled: boolean
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export default function EnrollmentButton({
  courseId,
  isEnrolled,
  variant = 'default',
  size = 'default'
}: EnrollmentButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEnrollment = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/courses/enroll', {
        method: isEnrolled ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      })

      if (!response.ok) {
        throw new Error('Failed to update enrollment')
      }

      // Refresh the page to update the enrollment status
      router.refresh()
    } catch (error) {
      console.error('Enrollment error:', error)
      // TODO: Add proper error handling/toast notification
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleEnrollment}
      disabled={loading}
      variant={variant}
      size={size}
      className="flex items-center gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isEnrolled ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {loading ? 'Processing...' : isEnrolled ? 'Unenroll' : 'Enroll'}
    </Button>
  )
}