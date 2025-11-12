/**
 * Test script for content generation API
 * Usage: npx tsx scripts/test-content-generation.ts
 */

const SAMPLE_READING = `
El gato está en la casa. Es un gato grande y negro.
Le gusta dormir en el sofá. Por la mañana, el gato come pescado.
Después, sale al jardín para jugar con las mariposas.
`;

const API_URL = 'http://localhost:3000/api/v1/content/generate';

async function testContentGeneration() {
  console.log('🧪 Testing Content Generation API...\n');

  console.log('Sample Reading:');
  console.log(SAMPLE_READING);
  console.log('\nTarget Level: A1\n');

  try {
    console.log('📡 Sending request to API...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        readingText: SAMPLE_READING,
        targetLevel: 'A1',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      process.exit(1);
    }

    const data = await response.json();

    console.log('\n✅ SUCCESS!\n');
    console.log('📊 Response Metadata:');
    console.log(JSON.stringify(data.metadata, null, 2));

    if (data.content) {
      console.log('\n📚 Generated Content:');

      // Pretty print vocabulary
      if (data.content.vocabulary) {
        console.log('\n--- VOCABULARY ---');
        console.log(`Total Items: ${data.content.vocabulary.length}`);
        data.content.vocabulary.slice(0, 3).forEach((item: any, i: number) => {
          console.log(`${i + 1}. ${item.spanish} (${item.partOfSpeech}) - ${item.english}`);
        });
        if (data.content.vocabulary.length > 3) {
          console.log(`... and ${data.content.vocabulary.length - 3} more`);
        }
      }

      // Pretty print grammar
      if (data.content.grammar) {
        console.log('\n--- GRAMMAR ---');
        console.log(`Total Concepts: ${data.content.grammar.length}`);
        data.content.grammar.slice(0, 2).forEach((concept: any, i: number) => {
          console.log(`${i + 1}. ${concept.concept}: ${concept.explanation.substring(0, 80)}...`);
        });
        if (data.content.grammar.length > 2) {
          console.log(`... and ${data.content.grammar.length - 2} more`);
        }
      }

      // Pretty print exercises
      if (data.content.exercises) {
        const totalExercises =
          (data.content.exercises.vocabularyExercises?.length || 0) +
          (data.content.exercises.grammarExercises?.length || 0);

        console.log('\n--- EXERCISES ---');
        console.log(`Total Exercises: ${totalExercises}`);
        console.log(`- Vocabulary: ${data.content.exercises.vocabularyExercises?.length || 0}`);
        console.log(`- Grammar: ${data.content.exercises.grammarExercises?.length || 0}`);

        if (data.content.exercises.vocabularyExercises?.[0]) {
          const ex = data.content.exercises.vocabularyExercises[0];
          console.log(`\nSample Exercise (${ex.type}):`);
          console.log(`Q: ${ex.question}`);
          console.log(`A: ${ex.correctAnswer}`);
        }
      }
    }

    console.log('\n🎉 Test complete! API is working.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testContentGeneration();
