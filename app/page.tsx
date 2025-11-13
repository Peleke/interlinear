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
                  🧠 AI Tutoring + 🏛️ Latin Language Support
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-ink leading-tight">
                Master Languages with
                <br />
                <span className="text-crimson">AI Tutoring.</span>
                <br />
                <span className="text-sepia-700 text-3xl md:text-4xl lg:text-5xl">Classical to Modern.</span>
              </h1>

              <p className="text-lg md:text-xl text-sepia-700 leading-relaxed">
                Real-time error correction. Character-based roleplay. Professor-style feedback.
                From Spanish conversations to Latin literature.
                <span className="font-semibold text-ink"> University-grade AI tutoring for serious learners.</span>
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
              Language apps are stuck in 2010.
            </h2>
            <p className="text-xl text-sepia-600 max-w-3xl mx-auto">
              Gamified flashcards and scripted chatbots that can't provide meaningful feedback
              or adapt to your learning style. You deserve better than green owls and streak counters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Old Way */}
            <div className="p-8 bg-sepia-50 rounded-2xl border-2 border-sepia-200">
              <h3 className="text-2xl font-serif font-bold text-crimson mb-6">Basic Language Apps</h3>
              <div className="space-y-4 text-sepia-700">
                <div className="flex gap-3">
                  <span className="text-crimson">🦉</span>
                  <span><strong>Scripted conversations</strong> that don't understand context</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-crimson">🎮</span>
                  <span><strong>Gamified flashcards</strong> without meaningful practice</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-crimson">🤖</span>
                  <span><strong>Generic feedback</strong> like "Try again" or "Good job"</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-crimson">📚</span>
                  <span><strong>One-size-fits-all</strong> lessons ignoring your level</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-crimson">🔄</span>
                  <span><strong>Endless repetition</strong> without understanding why you're wrong</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-crimson">❌</span>
                  <span><strong>Zero support</strong> for languages like Latin or advanced literature</span>
                </div>
                <div className="pt-2 font-semibold text-crimson">
                  → Result: Plateau after a few months, give up feeling frustrated
                </div>
              </div>
            </div>

            {/* New Way */}
            <div className="p-8 bg-gradient-to-br from-gold-100 to-parchment rounded-2xl border-2 border-gold shadow-lg">
              <h3 className="text-2xl font-serif font-bold text-ink mb-6">AI-Powered Language Mastery</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-gold text-xl">🧠</span>
                  <span><strong>Real-time error correction</strong> with detailed grammar explanations</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold text-xl">🎭</span>
                  <span><strong>Character roleplay</strong> - practice as personas in contextual dialogues</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold text-xl">👩‍🏫</span>
                  <span><strong>Professor-style feedback</strong> analyzing strengths and improvement areas</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold text-xl">🔊</span>
                  <span><strong>Audio error correction</strong> - hear proper pronunciation of mistakes</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold text-xl">🏛️</span>
                  <span><strong>Latin & classical texts</strong> - first modern AI platform for classical languages</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold text-xl">📊</span>
                  <span><strong>CEFR-adaptive responses</strong> from beginner (A1) to advanced (C2)</span>
                </div>
                <div className="pt-2 font-semibold text-ink">
                  → Result: Authentic language mastery with personalized AI guidance
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-serif text-ink font-semibold">
              This is why sophisticated learners abandon language apps.
            </p>
            <p className="text-lg text-sepia-600 mt-2">
              You need real feedback, contextual practice, and advanced content—not endless gamified drills.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-sepia-50 to-parchment">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-6">
              University-Grade AI Tutoring
            </h2>
            <p className="text-xl text-sepia-600 max-w-3xl mx-auto">
              Beyond basic flashcards and chatbots—sophisticated AI that understands language learning like a human professor
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🧠"
              title="Real-Time Error Correction"
              description="AI identifies grammar, vocabulary, and syntax errors instantly with detailed explanations by category. Understand WHY you made mistakes and how to fix them—like having a linguistics professor beside you."
            />
            <FeatureCard
              icon="🎭"
              title="Character Roleplay System"
              description="Practice as different personas in contextual dialogues. Our AI maintains narrative coherence while providing turn-by-turn error analysis. From casual conversations to formal presentations."
            />
            <FeatureCard
              icon="🏛️"
              title="Latin Language Mastery"
              description="The first modern AI platform for classical languages. Master Latin literature, poetry, and prose with English explanations tailored for classical education. Perfect for students and scholars."
            />
            <FeatureCard
              icon="👩‍🏫"
              title="Professor-Style Reviews"
              description="Get comprehensive performance analysis after each session. Detailed breakdown of strengths, improvement areas, and personalized recommendations—like office hours with your favorite language professor."
            />
            <FeatureCard
              icon="🔊"
              title="Audio Error Correction"
              description="Hear proper pronunciation of your mistakes with native speaker audio. Error playback system helps you understand correct pronunciation patterns and improve speaking skills."
            />
            <FeatureCard
              icon="📊"
              title="CEFR-Adaptive Intelligence"
              description="AI automatically adjusts complexity from beginner (A1) to advanced (C2) based on your performance. No manual level setting—the system understands your proficiency and adapts accordingly."
            />
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block p-8 bg-white rounded-2xl shadow-lg border border-sepia-200">
              <h3 className="text-2xl font-serif font-bold text-ink mb-4">Beyond Basic Language Learning</h3>
              <ul className="text-left space-y-3 text-sepia-700">
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>AI that understands context</strong>—not scripted responses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Real-time feedback</strong> that explains WHY you're wrong</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Character roleplay</strong> for contextual conversation practice</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Latin language support</strong>—classical texts with modern AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold text-xl">→</span>
                  <span><strong>Professor-level analysis</strong> of your language performance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Latin Learning Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-gold-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Latin Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-6">
                🏛️ Classical Languages Meet Modern AI
              </h2>
              <p className="text-xl text-sepia-700 leading-relaxed mb-8">
                The <strong>first AI-powered Latin learning platform</strong>. Perfect for students,
                educators, and classical literature enthusiasts who demand university-grade content
                with modern interactive tools.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="text-gold text-2xl">📚</span>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">Classical Texts + AI Analysis</h4>
                    <p className="text-sepia-600">Read Cicero, Virgil, and Ovid with instant AI explanations of complex grammar and historical context.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-gold text-2xl">🎓</span>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">University-Grade Content</h4>
                    <p className="text-sepia-600">Academic-quality lessons designed for serious Latin study—not simplified tourist phrases.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-gold text-2xl">🔍</span>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">English Explanations</h4>
                    <p className="text-sepia-600">All grammar and vocabulary explanations in English—no confusion with Spanish or other modern languages.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-gold text-2xl">🏫</span>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">Academic Market Leader</h4>
                    <p className="text-sepia-600">Trusted by classical education programs and university students worldwide.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Latin Sample */}
            <div className="bg-white p-8 rounded-2xl border-2 border-gold shadow-lg">
              <h3 className="text-xl font-serif font-bold text-ink mb-4 text-center">
                Interactive Latin Text Example
              </h3>
              <div className="bg-parchment p-6 rounded-xl border border-sepia-200 mb-4">
                <p className="text-lg font-serif text-ink leading-relaxed">
                  <span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="Gaul (nominative)">Gallia</span>
                  {" "}<span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="is, exists">est</span>
                  {" "}<span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="all, whole (nominative)">omnis</span>
                  {" "}<span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="divided (perfect passive participle)">divisa</span>
                  {" "}<span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="into (+ acc.)">in</span>
                  {" "}<span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="parts (accusative)">partes</span>
                  {" "}<span className="hover:bg-gold-100 cursor-pointer border-b border-dashed border-gold-600" title="three (accusative)">tres</span>...
                </p>
                <p className="text-sm text-sepia-600 mt-3 italic">
                  — Caesar, De Bello Gallico I.1
                </p>
              </div>
              <div className="text-center">
                <p className="text-sepia-700 mb-4">
                  <strong>Click any Latin word</strong> for instant grammar analysis,
                  etymology, and contextual translation.
                </p>
                <div className="inline-flex items-center gap-2 text-gold-700 bg-gold-50 px-4 py-2 rounded-full border border-gold-200">
                  <span>🎯</span>
                  <span className="text-sm font-medium">No more hunting through dictionaries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Languages Teaser */}
      <section className="py-16 bg-gradient-to-r from-sepia-900 to-ink">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-gold-100 text-gold-800 rounded-full text-sm font-semibold border border-gold-300 mb-4">
              🚀 The Future of AI Language Learning
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Any Language. Any Script. Any Era.
            </h2>
            <p className="text-lg text-sepia-200 max-w-3xl mx-auto">
              We're not stopping at Spanish and Latin. Our AI tutoring system is designed to master
              <strong> any human language</strong>—from ancient scripts to modern media.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Viking/Old Norse */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">
                Viking Sagas
              </h3>
              <p className="text-sepia-200 mb-3">
                <strong>Old Norse</strong> with AI-powered runic script analysis
              </p>
              <div className="text-sm text-gold-200 bg-gold-900/30 px-3 py-1 rounded-full">
                Coming Soon
              </div>
            </div>

            {/* Japanese/Anime */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">🗾</div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">
                Anime & Manga
              </h3>
              <p className="text-sepia-200 mb-3">
                <strong>Japanese</strong> with cultural context and modern slang
              </p>
              <div className="text-sm text-gold-200 bg-gold-900/30 px-3 py-1 rounded-full">
                Coming Soon
              </div>
            </div>

            {/* More Languages */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-serif font-bold text-white mb-2">
                Your Request
              </h3>
              <p className="text-sepia-200 mb-3">
                <strong>Any language</strong> our AI can learn, you can master
              </p>
              <div className="text-sm text-gold-200 bg-gold-900/30 px-3 py-1 rounded-full">
                Vote for Next
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-gold-300 text-2xl">🧠</span>
              <h4 className="text-lg font-semibold text-white">
                Same AI Tutoring System. Unlimited Languages.
              </h4>
              <span className="text-gold-300 text-2xl">🧠</span>
            </div>
            <p className="text-sepia-200">
              Real-time error correction, character roleplay, and professor-style feedback
              will work for <strong>every language we add</strong>. The AI learns the language
              structure, you learn to speak it fluently.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-crimson to-sepia-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            Ready for Real AI Language Tutoring?
          </h2>
          <p className="text-xl md:text-2xl text-sepia-100 mb-8">
            Stop settling for gamified flashcards and scripted chatbots.
            Experience university-grade AI tutoring with real-time feedback, character roleplay,
            and Latin language support. This is language learning for serious students.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="text-xl px-12 py-8 !bg-white hover:!bg-sepia-50 !text-crimson shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              Start mastering languages →
            </Button>
          </Link>
          <p className="text-sepia-200 mt-6 text-lg">
            No credit card required • University-grade AI tutoring
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
