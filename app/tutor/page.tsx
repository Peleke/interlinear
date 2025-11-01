export default function TutorPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-medium mb-4">
            Coming Soon
          </div>
          <h1 className="text-5xl font-serif text-sepia-900 mb-4">
            AI Tutor
          </h1>
          <p className="text-xl text-sepia-600 max-w-2xl mx-auto">
            Your personal language coach, powered by adaptive learning and real-time feedback
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sepia-900 mb-2">
              Dynamic Exercises
            </h3>
            <p className="text-sepia-600">
              AI-generated exercises tailored to the words you've clicked and your learning patterns
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sepia-900 mb-2">
              Progress Tracking
            </h3>
            <p className="text-sepia-600">
              Visualize your learning journey with detailed analytics and mastery levels
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sepia-900 mb-2">
              Spaced Repetition
            </h3>
            <p className="text-sepia-600">
              Smart scheduling ensures you review words at optimal intervals for retention
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sepia-900 mb-2">
              Conversational Practice
            </h3>
            <p className="text-sepia-600">
              Chat with AI in your target language to practice real-world communication
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sepia-900 mb-2">
              Pronunciation Feedback
            </h3>
            <p className="text-sepia-600">
              Record yourself and get instant feedback on pronunciation and intonation
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sepia-900 mb-2">
              Contextual Learning
            </h3>
            <p className="text-sepia-600">
              Exercises based on the actual texts you're reading, not random vocabulary lists
            </p>
          </div>
        </div>

        {/* Technology Preview */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-serif text-sepia-900 mb-6 text-center">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sepia-900 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-sepia-900 mb-1">Vocabulary Analysis</h4>
                <p className="text-sepia-600">
                  The AI analyzes your vocabulary history to identify patterns, gaps, and areas for improvement
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sepia-900 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-sepia-900 mb-1">Personalized Exercises</h4>
                <p className="text-sepia-600">
                  Generate custom fill-in-the-blank, translation, and usage exercises for words you need to practice
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sepia-900 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-sepia-900 mb-1">Adaptive Difficulty</h4>
                <p className="text-sepia-600">
                  Exercise difficulty adjusts based on your performance, ensuring optimal challenge level
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sepia-900 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-sepia-900 mb-1">Real-Time Feedback</h4>
                <p className="text-sepia-600">
                  Instant corrections and explanations help you learn from mistakes and reinforce correct usage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-block bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-serif text-sepia-900 mb-4">
              Want early access?
            </h3>
            <p className="text-sepia-600 mb-6 max-w-md">
              We're building AI Tutor right now. Join the waitlist to be notified when it launches.
            </p>
            <div className="flex gap-3 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border border-sepia-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sepia-500 w-64"
                disabled
              />
              <button
                className="px-6 py-2 bg-sepia-900 text-white rounded-md hover:bg-sepia-800 transition-colors cursor-not-allowed opacity-50"
                disabled
              >
                Notify Me
              </button>
            </div>
            <p className="text-sm text-sepia-500 mt-3">
              Email collection coming soon
            </p>
          </div>
        </div>

        {/* Back to Reader */}
        <div className="text-center mt-12">
          <a
            href="/reader"
            className="inline-flex items-center gap-2 text-sepia-700 hover:text-sepia-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reader
          </a>
        </div>
      </div>
    </div>
  )
}
