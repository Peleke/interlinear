/**
 * Test Page: Content Generation Flow
 *
 * Manual testing page for Story 7.3 vocabulary review workflow
 *
 * Test Flow:
 * 1. Click "Generate Vocabulary" button
 * 2. See progress indicator (extraction phase)
 * 3. Review modal appears with extracted vocabulary
 * 4. Edit/approve/reject individual items
 * 5. Approve all → saves to database
 */
import { ContentGenerationButton } from '@/components/authoring/ContentGenerationButton'

const SAMPLE_READING = `
Mi nombre es María y vivo en Barcelona. Todos los días me levanto a las siete
de la mañana. Primero, desayuno café con leche y tostadas. Después, voy al
trabajo en metro. Trabajo en una oficina desde las nueve hasta las cinco.
Por la tarde, me gusta caminar por el parque y leer libros. Los fines de
semana, visito a mis amigos y vamos al cine.
`.trim()

export default function TestGenerationPage() {
  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">Story 7.3 Test Page</h1>
          <p className="mt-2 text-muted-foreground">
            Test the complete vocabulary generation and review workflow
          </p>
        </div>

        {/* Sample Reading */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Sample Reading</h2>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {SAMPLE_READING}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            📚 Level: A1 (Beginner) · 🇪🇸 Spanish · ~100 words
          </p>
        </div>

        {/* Generation Button */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Workflow Test</h2>
          <div className="rounded-lg border bg-card p-6">
            <ContentGenerationButton
              lessonId="test-lesson-001"
              readingText={SAMPLE_READING}
              targetLanguage="es"
              cefrLevel="A1"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            🧪 Test Instructions
          </h3>
          <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>1. Click "Generate Vocabulary" button</li>
            <li>2. Wait for extraction (should take ~2 seconds)</li>
            <li>3. Review modal opens with 10-15 vocabulary items</li>
            <li>4. Test editing an item (click word to edit)</li>
            <li>5. Test rejecting an item (click ❌)</li>
            <li>6. Test regenerate (↻ button)</li>
            <li>7. Click "Approve All" to save to database</li>
          </ol>
        </div>

        {/* Expected Results */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Expected Results</h3>
          <div className="rounded-lg border p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Speed:</strong> Extraction completes in ~2 seconds
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Items:</strong> 10-15 vocabulary items extracted
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Accuracy:</strong> Correct lemmas, translations, examples
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Examples:</strong> All examples from reading text
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Database:</strong> Approved items saved to lesson_vocabulary
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Database Check */}
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <h3 className="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
            🔍 Database Verification
          </h3>
          <p className="mb-2 text-sm text-yellow-800 dark:text-yellow-200">
            After approving, check the database:
          </p>
          <pre className="rounded bg-yellow-100 p-2 text-xs dark:bg-yellow-900">
            {`SELECT * FROM lesson_vocabulary
WHERE lesson_id = 'test-lesson-001'
ORDER BY created_at DESC;`}
          </pre>
        </div>
      </div>
    </div>
  )
}
