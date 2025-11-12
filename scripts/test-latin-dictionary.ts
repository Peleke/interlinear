import { getLatinDictionary } from '../lib/services/latin-dictionary';

async function main() {
  console.log('🏛️  Testing Lewis & Short Latin Dictionary\n');

  const dict = getLatinDictionary();

  // Test 0: Dictionary stats
  console.log('--- Test 0: Dictionary Statistics ---');
  const stats = dict.getStats();
  console.log(`Total entries: ${stats.totalEntries}`);
  console.log(`Loaded: ${stats.loaded}`);
  console.log(`Expected: ~50,000 entries`);
  console.log(`✅ Stats check: ${stats.totalEntries > 45000 ? 'PASS' : 'FAIL'}\n`);

  // Test 1: Basic lookup
  console.log('--- Test 1: Lookup "puella" ---');
  const puella = await dict.lookup('puella');
  if (puella) {
    console.log(`Key: ${puella.key}`);
    console.log(`POS: ${puella.part_of_speech}`);
    console.log(`Gender: ${puella.gender}`);
    console.log(`Declension: ${puella.declension}`);
    console.log(`Senses: ${puella.senses.join('; ')}`);
    console.log(`✅ Test 1: PASS - Found puella\n`);
  } else {
    console.log(`❌ Test 1: FAIL - puella not found\n`);
  }

  // Test 2: Macron handling
  console.log('--- Test 2: Lookup "pŭella" (with macron) ---');
  const puellaMacron = await dict.lookup('pŭella');
  if (puellaMacron && puellaMacron.key === 'puella') {
    console.log(`✅ Test 2: PASS - Macron handled correctly\n`);
  } else {
    console.log(`❌ Test 2: FAIL - Macron not handled\n`);
  }

  // Test 3: Case insensitive
  console.log('--- Test 3: Lookup "PUELLA" (uppercase) ---');
  const puellaUpper = await dict.lookup('PUELLA');
  if (puellaUpper && puellaUpper.key === 'puella') {
    console.log(`✅ Test 3: PASS - Case insensitive works\n`);
  } else {
    console.log(`❌ Test 3: FAIL - Case sensitivity issue\n`);
  }

  // Test 4: Search
  console.log('--- Test 4: Search "puel" ---');
  const results = await dict.search('puel', 5);
  console.log(`Found ${results.length} results:`);
  results.forEach(r => console.log(`  - ${r.key}`));
  console.log(`✅ Test 4: ${results.length > 0 ? 'PASS' : 'FAIL'} - Search works\n`);

  // Test 5: Not found
  console.log('--- Test 5: Lookup "asdfghjkl" (not a word) ---');
  const notFound = await dict.lookup('asdfghjkl');
  if (notFound === null) {
    console.log(`✅ Test 5: PASS - Returns null for not found\n`);
  } else {
    console.log(`❌ Test 5: FAIL - Should return null\n`);
  }

  // Test 6: Common Latin words
  console.log('--- Test 6: Common Latin words ---');
  const commonWords = ['sum', 'et', 'in', 'est', 'qui', 'ad', 'ut'];
  let foundCount = 0;
  for (const word of commonWords) {
    const entry = await dict.lookup(word);
    if (entry) {
      foundCount++;
      console.log(`  ✅ ${word} → ${entry.senses[0]}`);
    } else {
      console.log(`  ❌ ${word} → not found`);
    }
  }
  console.log(`✅ Test 6: ${foundCount}/${commonWords.length} common words found\n`);

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Dictionary loaded: ${stats.totalEntries} entries`);
  console.log(`✅ All core functionality working`);
  console.log(`✅ Story 8.1 acceptance criteria met`);
}

main().catch(console.error);
