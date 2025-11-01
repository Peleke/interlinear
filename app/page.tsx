import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { AnimatedDemo } from '@/components/landing/AnimatedDemo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-sepia-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-100/30 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-ink leading-tight">
              Stop switching tabs.
              <br />
              <span className="text-crimson">Start learning languages.</span>
            </h1>

            <p className="text-xl md:text-2xl text-sepia-700 max-w-3xl mx-auto leading-relaxed">
              Every unknown word is one click away from becoming part of your permanent vocabulary.
              No app switching. No copy-paste. No losing your place.
              <span className="font-semibold text-ink"> Just pure, uninterrupted reading</span> that builds your language skills automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-crimson hover:bg-crimson/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Try it free →
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
              No credit card required.
            </p>
          </div>

          {/* Animated Demo */}
          <div className="mt-16">
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
              How It Works
            </h2>
            <p className="text-xl text-sepia-600 max-w-3xl mx-auto">
              The entire workflow collapses to a single click
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🎯"
              title="Instant Lookup"
              description="Click any word for instant dictionary definition with audio pronunciation powered by ElevenLabs neural TTS. No context switching, no tabs, no friction."
            />
            <FeatureCard
              icon="📊"
              title="Auto Tracking"
              description="Every click is tracked, timestamped, and sorted by frequency. Your vocabulary list builds itself while you read. No flashcard management required."
            />
            <FeatureCard
              icon="🧠"
              title="Stay in Flow"
              description="Inline definitions preserve your reading context. No more losing your place. Just pure, immersive reading that feels effortless, not like homework."
            />
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block p-8 bg-white rounded-2xl shadow-lg border border-sepia-200">
              <h3 className="text-2xl font-serif font-bold text-ink mb-4">What You Get</h3>
              <ul className="text-left space-y-3 text-sepia-700">
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Read faster</strong> (no tab switching)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Learn more</strong> (every word is trackable)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Remember better</strong> (frequency + recency data)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Stay motivated</strong> (reading feels effortless)</span>
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
            Start Reading Smarter
          </h2>
          <p className="text-xl md:text-2xl text-sepia-100 mb-8">
            This is reading the way it should be: immersive, intelligent, and completely frictionless.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="text-xl px-12 py-8 !bg-white hover:!bg-sepia-50 !text-crimson shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              Sign up free →
            </Button>
          </Link>
          <p className="text-sepia-200 mt-6 text-lg">
            No credit card required.
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
