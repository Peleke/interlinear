/**
 * Test: Vocabulary Extraction Workflow
 *
 * Tests the complete vocabulary extraction workflow with sample readings
 *
 * Run: npx tsx tests/workflows/test-vocabulary-extraction.ts
 */

import { executeContentGeneration } from '@/lib/content-generation/workflows/content-generation'
import { sampleReadings } from './sample-readings'

/**
 * Test vocabulary extraction with all CEFR levels
 */
async function testVocabularyExtraction() {
  console.log('🧪 Testing Vocabulary Extraction Workflow\n')
  console.log('=' .repeat(60))

  const testCases = [
    {
      name: 'A1 Spanish - Daily Routine',
      data: sampleReadings.a1_spanish,
    },
    {
      name: 'B2 Spanish - Technology',
      data: sampleReadings.b2_spanish,
    },
    {
      name: 'C1 Spanish - Philosophy',
      data: sampleReadings.c1_spanish,
    },
  ]

  let totalSuccess = 0
  let totalFailed = 0

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log('-'.repeat(60))

    try {
      const startTime = Date.now()

      const result = await executeContentGeneration({
        lessonId: `test-${Date.now()}`,
        readingText: testCase.data.text,
        targetLevel: testCase.data.level,
        language: testCase.data.language,
        userId: 'test-user',
        maxVocabularyItems: 15,
      })

      const duration = Date.now() - startTime

      if (result.status === 'completed') {
        console.log(`✅ SUCCESS`)
        console.log(`   Vocabulary items: ${result.metadata.vocabularyCount}`)
        console.log(`   Execution time: ${result.metadata.executionTime}ms`)
        console.log(`   Estimated cost: $${result.metadata.cost?.toFixed(4) || 'N/A'}`)
        console.log(`   Total duration: ${duration}ms`)

        // Show first 5 vocabulary items
        console.log(`\n   Sample vocabulary:`)
        result.vocabulary.slice(0, 5).forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.word} → ${item.english_translation}`)
          console.log(`      POS: ${item.part_of_speech}, Level: ${item.difficulty_level}`)
          if (item.example_sentence) {
            console.log(`      Example: "${item.example_sentence.substring(0, 60)}..."`)
          }
        })

        // Validate expected words are found
        const foundWords = result.vocabulary.map((v) => v.word.toLowerCase())
        const expectedWords = testCase.data.expectedWords.map((w) => w.toLowerCase())
        const matchedWords = expectedWords.filter((w) => foundWords.includes(w))

        console.log(`\n   Word coverage: ${matchedWords.length}/${expectedWords.length} expected words found`)

        totalSuccess++
      } else {
        console.log(`❌ FAILED: ${result.status}`)
        totalFailed++
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
      totalFailed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Test Summary:`)
  console.log(`   ✅ Passed: ${totalSuccess}/${testCases.length}`)
  console.log(`   ❌ Failed: ${totalFailed}/${testCases.length}`)

  if (totalFailed === 0) {
    console.log(`\n🎉 All tests passed!`)
  } else {
    console.log(`\n⚠️ Some tests failed. Check logs above.`)
  }
}

// Run tests
testVocabularyExtraction().catch((error) => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
