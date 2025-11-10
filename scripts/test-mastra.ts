/**
 * Mastra Test Script
 * Tests vocabulary generation with a sample reading
 *
 * Usage: npx tsx scripts/test-mastra.ts
 */

import { generateVocabulary } from '../lib/mastra';

async function testVocabularyGeneration() {
  console.log('🧪 Testing Mastra Vocabulary Generation...\n');

  const sampleReading = `
La maison est grande et belle. Elle a trois chambres et un grand jardin.
Dans le jardin, il y a beaucoup de fleurs et un arbre magnifique.
Chaque matin, j'aime me promener dans le jardin et regarder les oiseaux.
  `.trim();

  console.log('📖 Sample Reading:');
  console.log(sampleReading);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const result = await generateVocabulary({
      lessonId: 'test-lesson-01', // Test lesson ID (TEXT format)
      readingText: sampleReading,
      targetCEFRLevel: 'A2',
      maxItems: 8,
    });

    if (result.success && result.data) {
      console.log('✅ Generation successful!\n');
      console.log(`📊 Tokens used: ${result.tokensUsed}`);
      console.log(`💰 Cost: $${result.costUSD?.toFixed(4) || '0.0000'}`);
      console.log(`🆔 Generation ID: ${result.generationId}\n`);
      console.log('📝 Vocabulary Items:\n');

      result.data.vocabulary.forEach((item, index) => {
        console.log(`${index + 1}. ${item.word} (${item.cefr_level})`);
        console.log(`   Translation: ${item.translation}`);
        console.log(`   Definition: ${item.definition}`);
        console.log(`   Is New: ${item.is_new ? 'Yes' : 'No'}`);
        if (item.example_sentence) {
          console.log(`   Example: ${item.example_sentence}`);
        }
        console.log();
      });

      console.log('✨ Test completed successfully!');
    } else {
      console.error('❌ Generation failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the test
testVocabularyGeneration();
