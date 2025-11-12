#!/usr/bin/env npx tsx

/**
 * Test the integrated extractVocabulary function with both Spanish and Latin
 */

import { extractVocabulary } from '../lib/content-generation/tools/extract-vocabulary';

async function testIntegratedExtraction() {
  console.log('🧪 Testing Integrated Vocabulary Extraction\n');

  // Test 1: Spanish (should use NLP.js path)
  console.log('1️⃣  Testing Spanish extraction...');
  try {
    const spanishResult = await extractVocabulary({
      readingText: 'El gato come pescado en la cocina mientras la mujer prepara la comida.',
      targetLevel: 'B1',
      maxItems: 3,
      language: 'es'
    });

    console.log(`   ✅ Spanish: extracted ${spanishResult.length} items`);
    spanishResult.slice(0, 2).forEach((item, idx) => {
      console.log(`     ${idx + 1}. ${item.word} → ${item.english_translation} (${item.part_of_speech})`);
    });
  } catch (error: any) {
    console.log(`   ❌ Spanish failed: ${error.message}`);
  }

  console.log('');

  // Test 2: Latin (should use LLM path)
  console.log('2️⃣  Testing Latin extraction...');
  try {
    const latinResult = await extractVocabulary({
      readingText: 'Marcus in via ambulat et rosam pulchram videt dum ad forum festinat.',
      targetLevel: 'B1',
      maxItems: 3,
      language: 'la'
    });

    console.log(`   ✅ Latin: extracted ${latinResult.length} items`);
    latinResult.slice(0, 2).forEach((item, idx) => {
      console.log(`     ${idx + 1}. ${item.word} → ${item.english_translation} (${item.part_of_speech})`);
    });
  } catch (error: any) {
    console.log(`   ❌ Latin failed: ${error.message}`);
  }

  console.log('\n🎉 Integration test completed!');
}

testIntegratedExtraction().catch(console.error);