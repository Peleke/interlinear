import Link from 'next/link'
import { BookOpen, Clock, Target } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface CourseCardProps {
  id: number
  title: string
  description: string
  level: string
  lessonCount: number
  estimatedHours?: number
  progress?: number // 0-100 for enrolled courses
  isEnrolled?: boolean
}

export default function CourseCard({
  id,
  title,
  description,
  level,
  lessonCount,
  estimatedHours,
  progress,
  isEnrolled
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <div className="group bg-white rounded-lg border border-sepia-200 hover:border-sepia-400 hover:shadow-lg transition-all p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-sepia-100 text-sepia-700 rounded">
                {level}
              </span>
              {isEnrolled && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                  Enrolled
                </span>
              )}
            </div>
            <h3 className="text-xl font-serif text-sepia-900 group-hover:text-sepia-700 transition-colors">
              {title}
            </h3>
          </div>
          <BookOpen className="h-8 w-8 text-sepia-300 group-hover:text-sepia-500 transition-colors flex-shrink-0 ml-4" />
        </div>

        {/* Description */}
        <div className="text-sepia-700 mb-6 flex-1 leading-relaxed prose prose-sm prose-sepia max-w-none">
          <ReactMarkdown>
            {description}
          </ReactMarkdown>
        </div>

        {/* Progress bar (if enrolled) */}
        {isEnrolled && typeof progress === 'number' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-sepia-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-sepia-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sepia-700 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 pt-4 border-t border-sepia-100">
          <div className="flex items-center gap-1 text-sm text-sepia-600">
            <Target className="h-4 w-4" />
            <span>{lessonCount} Lessons</span>
          </div>
          {estimatedHours && (
            <div className="flex items-center gap-1 text-sm text-sepia-600">
              <Clock className="h-4 w-4" />
              <span>~{estimatedHours}h</span>
            </div>
          )}
        </div>

        {/* Hover indicator */}
        <div className="mt-4 text-sepia-600 group-hover:text-sepia-900 text-sm font-medium">
          {isEnrolled ? 'Continue Learning →' : 'View Course →'}
        </div>
      </div>
    </Link>
  )
}
