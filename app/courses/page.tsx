export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-parchment p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif text-sepia-900 mb-4">Courses</h1>
        <p className="text-sepia-700 mb-8">
          Course navigation coming in Epic 3 (Stories 3.1-3.6)
        </p>
        <div className="bg-white rounded-lg border border-sepia-200 p-8">
          <h2 className="text-2xl font-serif text-sepia-900 mb-4">
            📚 Course System Implementation Plan
          </h2>
          <ul className="space-y-2 text-sepia-700">
            <li>✅ Epic 1: Database & Content (Complete)</li>
            <li>🔄 Epic 2: AI Onboarding Flow (In Progress - Story 2.1 ✅)</li>
            <li>⏳ Epic 3: Course Navigation (Coming Soon)</li>
            <li>⏳ Epic 4: Interactive Exercises (Coming Soon)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
