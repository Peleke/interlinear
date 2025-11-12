#!/usr/bin/env npx tsx
/**
 * Test the complete Latin content generation workflow
 * This tests the full stack: API route → workflow → language factory → Latin processor
 */

async function testLatinContentGeneration() {
  console.log('🏛️ Testing Complete Latin Content Generation Workflow\n')

  const testData = {
    lessonId: 'test-lesson-123',
    readingText: 'Marcus in via ambulat et rosam pulchram videt dum ad forum festinat. Puella in horto flores legit.',
    targetLevel: 'A1',
    language: 'la',
    maxVocabularyItems: 10,
    userId: 'test-user-456'
  }

  try {
    console.log('📤 Simulating API request...')
    console.log(`   📚 Text: "${testData.readingText.substring(0, 50)}..."`)
    console.log(`   🎯 Level: ${testData.targetLevel}`)
    console.log(`   🏛️ Language: ${testData.language}`)
    console.log(`   📊 Max items: ${testData.maxVocabularyItems}\n`)

    // Import the workflow function directly (simulating the API route)
    const { executeContentGeneration, contentGenerationInputSchema } = await import('../lib/content-generation/workflows/content-generation')

    // Validate input (same as API route does)
    const validationResult = contentGenerationInputSchema.safeParse(testData)

    if (!validationResult.success) {
      console.error('❌ Input validation failed:')
      console.error(validationResult.error.format())
      return
    }

    console.log('✅ Input validation passed')

    // Execute the workflow
    console.log('\n🚀 Executing content generation workflow...')
    const startTime = Date.now()

    const result = await executeContentGeneration(validationResult.data)

    const totalTime = Date.now() - startTime

    console.log('\n📊 Results:')
    console.log(`   📈 Status: ${result.status}`)
    console.log(`   📝 Vocabulary count: ${result.metadata.vocabularyCount}`)
    console.log(`   ⏱️  Execution time: ${result.metadata.executionTime}ms (total: ${totalTime}ms)`)
    console.log(`   💰 Estimated cost: $${result.metadata.cost}`)
    console.log(`   🔧 Processor type: ${result.metadata.processorType}`)

    if (result.vocabulary && result.vocabulary.length > 0) {
      console.log('\n📚 Generated Vocabulary:')
      result.vocabulary.slice(0, 5).forEach((word, i) => {
        console.log(`   ${i + 1}. ${word}`)
      })
      if (result.vocabulary.length > 5) {
        console.log(`   ... and ${result.vocabulary.length - 5} more`)
      }
    }

    if (result.metadata.vocabularyDetails) {
      console.log('\n🔍 Detailed Vocabulary (first 3):')
      result.metadata.vocabularyDetails.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.word} → ${item.definition}`)
        if (item.partOfSpeech) console.log(`      📝 Part of speech: ${item.partOfSpeech}`)
        if (item.lemma) console.log(`      🔗 Lemma: ${item.lemma}`)
      })
    }

    if (result.status === 'completed') {
      console.log('\n🎉 Latin content generation workflow completed successfully!')
      console.log('\n💡 Next steps:')
      console.log('   • Add OPENAI_API_KEY for real LLM processing')
      console.log('   • Test with longer Latin texts')
      console.log('   • Test the UI integration with Latin lesson creation')
    } else {
      console.log('\n⚠️ Workflow completed with issues:')
      if (result.metadata.error) {
        console.log(`   Error: ${result.metadata.error}`)
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:')
    console.error(error instanceof Error ? error.message : error)

    if (error instanceof Error && error.stack) {
      console.log('\n🔍 Stack trace:')
      console.log(error.stack)
    }
  }
}

// Run test if executed directly
if (require.main === module) {
  testLatinContentGeneration()
}

export { testLatinContentGeneration }