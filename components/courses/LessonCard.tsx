import Link from 'next/link'
import { FileText, CheckCircle, Lock } from 'lucide-react'

interface LessonCardProps {
  id: number
  courseId: number
  title: string
  description?: string
  order: number
  isCompleted?: boolean
  isLocked?: boolean
  estimatedMinutes?: number
}

export default function LessonCard({
  id,
  courseId,
  title,
  description,
  order,
  isCompleted,
  isLocked,
  estimatedMinutes
}: LessonCardProps) {
  const content = (
    <div
      className={`
        group bg-white rounded-lg border
        ${isLocked ? 'border-sepia-100 opacity-60 cursor-not-allowed' : 'border-sepia-200 hover:border-sepia-400 hover:shadow-md cursor-pointer'}
        transition-all p-6 flex items-center gap-4
      `}
    >
      {/* Lesson number badge */}
      <div
        className={`
          flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold
          ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-sepia-100 text-sepia-700'}
          ${!isLocked && 'group-hover:bg-sepia-200'}
          transition-colors
        `}
      >
        {isCompleted ? (
          <CheckCircle className="h-6 w-6" />
        ) : isLocked ? (
          <Lock className="h-5 w-5" />
        ) : (
          <span>{order}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={`
            text-lg font-medium mb-1
            ${isLocked ? 'text-sepia-400' : 'text-sepia-900 group-hover:text-sepia-700'}
            transition-colors truncate
          `}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-sepia-600 line-clamp-2">{description}</p>
        )}
        {estimatedMinutes && (
          <p className="text-xs text-sepia-500 mt-2">~{estimatedMinutes} min</p>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex-shrink-0">
        {isLocked ? (
          <span className="text-xs text-sepia-400 font-medium">Locked</span>
        ) : isCompleted ? (
          <span className="text-xs text-green-600 font-medium">Complete</span>
        ) : (
          <FileText
            className={`
              h-6 w-6 text-sepia-300
              ${!isLocked && 'group-hover:text-sepia-500'}
              transition-colors
            `}
          />
        )}
      </div>
    </div>
  )

  // If locked, render as non-interactive div
  if (isLocked) {
    return content
  }

  // Otherwise wrap in Link
  return <Link href={`/courses/${courseId}/lessons/${id}`}>{content}</Link>
}
