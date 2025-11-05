import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { AnimatedDemo } from '@/components/landing/AnimatedDemo'
import { DeviceMockup } from '@/components/landing/DeviceMockup'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-sepia-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-100/30 to-transparent pointer-events-none" />

        {/* Hero Content + Device Mockup Grid */}
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 bg-gold-100 text-gold-800 rounded-full text-sm font-semibold border border-gold-300">
                  ✨ Interactive Reading + Structured Courses
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-ink leading-tight">
                Stop switching tabs.
                <br />
                <span className="text-crimson">Start learning languages.</span>
              </h1>

              <p className="text-lg md:text-xl text-sepia-700 leading-relaxed">
                Click any word for instant translations. Track your vocabulary automatically.
                Follow structured courses with interactive lessons.
                <span className="font-semibold text-ink"> All in one seamless experience.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 bg-crimson hover:bg-crimson/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Start learning free →
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-2 border-sepia-700 text-sepia-700 hover:bg-sepia-700 hover:text-white transition-all duration-300"
                  >
                    Log in
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-sepia-500">
                No credit card required • Get started in 30 seconds
              </p>
            </div>

            {/* Right: Device Mockup */}
            <div className="lg:pl-8">
              <DeviceMockup />
            </div>
          </div>

          {/* Animated Demo - Below the hero grid */}
          <div className="mt-20 pt-12 border-t border-sepia-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-bold text-ink mb-2">See it in action</h3>
              <p className="text-sepia-600">Click any word to experience instant lookup</p>
            </div>
            <AnimatedDemo />
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-6">
              You know the drill.
            </h2>
            <p className="text-xl text-sepia-600 max-w-3xl mx-auto">
              You&apos;re reading in your target language. You hit an unknown word. Now what?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Old Way */}
            <div className="p-8 bg-sepia-50 rounded-2xl border-2 border-sepia-200">
              <h3 className="text-2xl font-serif font-bold text-crimson mb-6">The Old Way</h3>
              <ol className="space-y-3 text-sepia-700">
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">1.</span>
                  <span>Highlight the word</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">2.</span>
                  <span>Open a new tab</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">3.</span>
                  <span>Search in Google Translate</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">4.</span>
                  <span>Read the definition</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">5.</span>
                  <span>Go back to your article</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">6.</span>
                  <span>Try to remember where you were</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">7.</span>
                  <span>Repeat 47 more times</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-crimson">8.</span>
                  <span className="font-semibold">Give up and watch Netflix instead</span>
                </li>
              </ol>
            </div>

            {/* New Way */}
            <div className="p-8 bg-gradient-to-br from-gold-100 to-parchment rounded-2xl border-2 border-gold shadow-lg">
              <h3 className="text-2xl font-serif font-bold text-ink mb-6">The Interlinear Way</h3>
              <div className="space-y-6">
                <div className="text-6xl font-serif font-bold text-crimson">1</div>
                <p className="text-2xl font-serif text-ink">
                  Click any word.
                </p>
                <p className="text-lg text-sepia-600">
                  Get instant definition + native pronunciation. Done.
                </p>
                <div className="pt-4 text-sepia-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gold">✓</span>
                    <span>Inline definitions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gold">✓</span>
                    <span>Audio pronunciation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gold">✓</span>
                    <span>Auto-tracked vocabulary</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-serif text-ink font-semibold">
              This is why people don&apos;t learn languages through reading.
            </p>
            <p className="text-lg text-sepia-600 mt-2">
              Not because reading doesn&apos;t work, but because the tooling makes it feel like punishment.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-sepia-50 to-parchment">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-6">
              Everything You Need to Master a Language
            </h2>
            <p className="text-xl text-sepia-600 max-w-3xl mx-auto">
              From structured courses to free-form reading—all with instant word lookup
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📚"
              title="Structured Courses"
              description="Follow guided learning paths with interactive lessons. Each lesson combines reading practice, vocabulary building, and comprehension exercises—all with one-click word lookup."
            />
            <FeatureCard
              icon="🎯"
              title="Interactive Reading"
              description="Read anything in your target language. Click any word for instant dictionary definition with audio pronunciation. No context switching, no tabs, no friction."
            />
            <FeatureCard
              icon="📊"
              title="Smart Vocabulary Tracking"
              description="Every word you look up is automatically tracked, timestamped, and organized by frequency. Your vocabulary list builds itself while you read—no manual flashcard management."
            />
            <FeatureCard
              icon="🧠"
              title="AI Tutor Conversations"
              description="Practice speaking with an AI tutor about what you're reading. Get instant feedback, learn natural conversation patterns, and reinforce new vocabulary in context."
            />
            <FeatureCard
              icon="🎴"
              title="Spaced Repetition"
              description="Auto-generated flashcards from your reading with intelligent spacing. Review words when you're about to forget them. Built-in SRS keeps your vocabulary sharp."
            />
            <FeatureCard
              icon="📈"
              title="Progress Analytics"
              description="Track your reading time, vocabulary growth, and course completion. See your improvement over time with detailed stats and insights."
            />
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block p-8 bg-white rounded-2xl shadow-lg border border-sepia-200">
              <h3 className="text-2xl font-serif font-bold text-ink mb-4">The Complete Learning Experience</h3>
              <ul className="text-left space-y-3 text-sepia-700">
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Learn with structure</strong> or explore freely—your choice</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>One-click word lookup</strong> keeps you in flow, never breaking immersion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Automatic vocabulary tracking</strong> builds your word bank as you read</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>AI tutor conversations</strong> turn passive reading into active practice</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Spaced repetition</strong> ensures words stick in long-term memory</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-crimson to-sepia-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            Your Language Journey Starts Here
          </h2>
          <p className="text-xl md:text-2xl text-sepia-100 mb-8">
            Whether you follow structured courses or explore on your own, every word is one click away.
            This is language learning the way it should be: immersive, intelligent, and effortless.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="text-xl px-12 py-8 !bg-white hover:!bg-sepia-50 !text-crimson shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              Start learning free →
            </Button>
          </Link>
          <p className="text-sepia-200 mt-6 text-lg">
            No credit card required • 30-second setup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sepia-400 text-sm">
            Built with ❤️ for language learners everywhere
          </p>
          <p className="text-sepia-500 text-xs mt-2">
            Powered by ElevenLabs • Supabase • Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
