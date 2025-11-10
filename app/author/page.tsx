'use client'

import Link from 'next/link'
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react'

export default function AuthorHub() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-sepia-900 mb-2">
          Content Authoring
        </h1>
        <p className="text-sepia-600 text-lg">
          Create and manage your lessons and courses
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link
          href="/author/lessons"
          className="group bg-white rounded-lg p-8 border-2 border-sepia-200 shadow-sm hover:border-gold hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-sepia-100 rounded-lg group-hover:bg-gold/20 transition-colors">
              <BookOpen className="h-8 w-8 text-sepia-700 group-hover:text-gold transition-colors" />
            </div>
            <ArrowRight className="h-6 w-6 text-sepia-400 group-hover:text-gold transition-colors" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-sepia-900 mb-2">
            Lessons
          </h3>
          <p className="text-sepia-600">
            Create individual lessons with readings, exercises, and vocabulary. Build standalone
            learning experiences or combine them into courses.
          </p>
        </Link>

        <Link
          href="/author/courses"
          className="group bg-white rounded-lg p-8 border-2 border-sepia-200 shadow-sm hover:border-gold hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-sepia-100 rounded-lg group-hover:bg-gold/20 transition-colors">
              <GraduationCap className="h-8 w-8 text-sepia-700 group-hover:text-gold transition-colors" />
            </div>
            <ArrowRight className="h-6 w-6 text-sepia-400 group-hover:text-gold transition-colors" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-sepia-900 mb-2">
            Courses
          </h3>
          <p className="text-sepia-600">
            Organize lessons into structured courses. Set learning paths, manage lesson order,
            and create comprehensive learning experiences.
          </p>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-sepia-200 shadow-sm">
          <h3 className="text-sm font-semibold text-sepia-600 uppercase tracking-wide mb-2">
            Your Impact
          </h3>
          <p className="text-3xl font-bold text-sepia-900">--</p>
          <p className="text-sm text-sepia-500 mt-1">Total Learners</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-sepia-200 shadow-sm">
          <h3 className="text-sm font-semibold text-sepia-600 uppercase tracking-wide mb-2">
            Content Created
          </h3>
          <p className="text-3xl font-bold text-sepia-900">--</p>
          <p className="text-sm text-sepia-500 mt-1">Lessons Published</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-sepia-200 shadow-sm">
          <h3 className="text-sm font-semibold text-sepia-600 uppercase tracking-wide mb-2">
            Engagement
          </h3>
          <p className="text-3xl font-bold text-sepia-900">--</p>
          <p className="text-sm text-sepia-500 mt-1">Avg Completion Rate</p>
        </div>
      </div>
    </div>
  )
}
