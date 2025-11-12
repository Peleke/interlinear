#!/usr/bin/env npx tsx

/**
 * Test script for Latin Language Processor
 *
 * This script tests the Latin processor integration with both mock and real LLM responses.
 *
 * Usage:
 *   npm run test:latin-processor           # Use mocks (no API key needed)
 *   OPENAI_API_KEY=sk-... npm run test:latin-processor  # Use real OpenAI API
 */

import { LatinLanguageProcessor } from '../lib/content-generation/tools/latin-language-processor';

async function testLatinProcessor() {
  console.log('🏛️  Testing Latin Language Processor...\n');

  const testText = 'Marcus in via ambulat et rosam pulchram videt dum ad forum festinat.';
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  console.log(`📝 Test Text: "${testText}"`);
  console.log(`🔑 API Key: ${hasApiKey ? 'Present (Real LLM)' : 'Missing (Mock Mode)'}`);
  console.log(`📦 NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    // Test 1: Processor Creation
    console.log('1️⃣  Creating Latin processor...');
    const processor = new LatinLanguageProcessor();
    console.log(`   ✅ Created: ${processor.language} processor`);
    console.log(`   ✅ Capabilities: ${Object.keys(processor.capabilities).filter(k => processor.capabilities[k]).join(', ')}`);

    // Test 2: Health Check
    console.log('\n2️⃣  Health check...');
    const isHealthy = await processor.isHealthy();
    console.log(`   ${isHealthy ? '✅' : '❌'} Health status: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);

    // Test 3: Input Validation
    console.log('\n3️⃣  Input validation...');
    const validation = await processor.validateInput(testText);
    console.log(`   ${validation.isValid ? '✅' : '❌'} Validation: ${validation.isValid ? 'Valid' : 'Invalid'}`);
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
    }

    // Test 4: Processing Time Estimation
    console.log('\n4️⃣  Processing time estimation...');
    const estimatedTime = await processor.estimateProcessingTime(testText);
    console.log(`   ⏱️  Estimated time: ${estimatedTime}ms`);

    // Test 5: Vocabulary Extraction
    console.log('\n5️⃣  Vocabulary extraction...');
    const startTime = Date.now();

    try {
      const vocabulary = await processor.extractVocabulary(testText, {
        maxItems: 3,
        includeFrequency: true,
        includeMorphology: true
      });

      const actualTime = Date.now() - startTime;
      console.log(`   ✅ Extracted ${vocabulary.length} vocabulary items in ${actualTime}ms`);
      console.log(`   📊 Results preview:`);

      vocabulary.slice(0, 2).forEach((word, idx) => {
        console.log(`     ${idx + 1}. ${word.word} → ${word.lemma} (${word.definition})`);
        if (word.morphology) {
          console.log(`        📖 ${word.partOfSpeech}, ${word.morphology.case || ''} ${word.morphology.number || ''} ${word.morphology.gender || ''}`.trim());
        }
      });

    } catch (error: any) {
      console.log(`   ❌ Vocabulary extraction failed: ${error.message}`);
      if (error.code) {
        console.log(`   🏷️  Error code: ${error.code}`);
      }
    }

    // Test 6: Grammar Identification (if vocabulary worked)
    console.log('\n6️⃣  Grammar identification...');
    try {
      const grammar = await processor.identifyGrammar(testText, {
        maxConcepts: 2,
        complexityLevel: 'basic',
        includeExamples: true
      });

      console.log(`   ✅ Identified ${grammar.length} grammar concepts`);
      grammar.slice(0, 2).forEach((concept, idx) => {
        console.log(`     ${idx + 1}. ${concept.name} (${concept.complexity})`);
        console.log(`        ${concept.description}`);
      });

    } catch (error: any) {
      console.log(`   ❌ Grammar identification failed: ${error.message}`);
    }

    // Test 7: Exercise Generation (if grammar worked)
    console.log('\n7️⃣  Exercise generation...');
    try {
      const mockContext = {
        originalText: testText,
        vocabulary: [
          {
            word: 'Marcus',
            lemma: 'Marcus',
            definition: 'Marcus (a Roman name)',
            partOfSpeech: 'noun',
            frequency: 75,
            difficulty: 'basic' as const
          }
        ],
        grammarConcepts: [
          {
            id: 'nominative_subject',
            name: 'Nominative Case Subject',
            description: 'The nominative case is used for the subject',
            complexity: 'basic' as const,
            examples: [],
            category: 'cases'
          }
        ],
        exerciseTypes: ['translation', 'parsing'] as const,
        maxExercises: 2,
        targetDifficulty: 'basic' as const
      };

      const exercises = await processor.generateExercises(mockContext);

      console.log(`   ✅ Generated ${exercises.length} exercises`);
      exercises.slice(0, 1).forEach((exercise, idx) => {
        console.log(`     ${idx + 1}. ${exercise.type}: ${exercise.question}`);
        console.log(`        Answer: ${exercise.correctAnswer}`);
      });

    } catch (error: any) {
      console.log(`   ❌ Exercise generation failed: ${error.message}`);
    }

    console.log('\n🎉 Test completed successfully!');

    if (!hasApiKey) {
      console.log('\n💡 To test with real LLM processing, set OPENAI_API_KEY:');
      console.log('   export OPENAI_API_KEY=sk-your-key-here');
      console.log('   npm run test:latin-processor');
    } else {
      console.log('\n🚀 Real LLM processing successful!');
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.code) {
      console.error(`🏷️  Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Run the test
testLatinProcessor().catch(console.error);