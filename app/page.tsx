import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-parchment">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-5xl font-serif font-bold text-ink mb-4">Interlinear</h1>
          <p className="text-xl text-sepia-700">Spanish Reading Companion</p>
          <p className="mt-2 text-sepia-600">Click-to-define · AI pronunciation · Vocabulary tracking</p>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/signup"
            className="px-6 py-3 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 transition-colors font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border-2 border-sepia-700 text-sepia-700 rounded-md hover:bg-sepia-50 transition-colors font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  )
}
