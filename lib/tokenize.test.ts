import { tokenizeText, getSentence, getWordTokens, getSentences } from './tokenize'

// Test basic Spanish text
const spanishText = "Hola mundo. ¿Cómo estás? ¡Muy bien!"

console.log('Testing tokenization with Spanish text:\n')
console.log('Input:', spanishText)
console.log('\n---\n')

const tokens = tokenizeText(spanishText)

console.log('Tokens generated:', tokens.length)
console.log('\nToken details:')
tokens.forEach((token, i) => {
  if (token.isWord) {
    console.log(`[${i}] "${token.text}" → clean: "${token.cleanText}" | sentence: ${token.sentenceId}`)
  }
})

console.log('\n---\n')

const wordTokens = getWordTokens(tokens)
console.log('Word tokens only:', wordTokens.length)
console.log('Words:', wordTokens.map(t => t.text).join(', '))

console.log('\n---\n')

const sentences = getSentences(tokens)
console.log('Sentences detected:', sentences.length)
sentences.forEach((sentence) => {
  console.log(`Sentence ${sentence.id}: "${sentence.text}"`)
})

console.log('\n---\n')

// Test edge cases
const edgeCases = [
  "año 2024",
  "palabra...",
  "¿¡Hola!?",
  '"palabra" otra',
  "1.5 metros",
]

console.log('Edge case tests:\n')
edgeCases.forEach((testCase) => {
  const tokens = tokenizeText(testCase)
  const words = getWordTokens(tokens)
  console.log(`Input: "${testCase}"`)
  console.log(`Words: ${words.map(t => `"${t.text}" (clean: "${t.cleanText}")`).join(', ')}`)
  console.log()
})

console.log('✓ Tokenization tests complete')
