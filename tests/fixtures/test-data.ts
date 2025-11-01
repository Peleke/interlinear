/**
 * Test data fixtures for consistent test scenarios
 */

export const SAMPLE_SPANISH_TEXTS = {
  simple: 'Hola, ¿cómo estás?',

  greeting: 'Hola, me llamo María. ¿Cómo estás hoy?',

  conversation: `
    Buenos días. Me llamo Carlos y soy estudiante.
    Estudio español en la universidad.
    Me gusta mucho aprender idiomas nuevos.
  `.trim(),

  paragraph: `
    España es un país hermoso con mucha historia.
    La comida española es deliciosa.
    Me encanta visitar Barcelona y Madrid.
    El clima es perfecto en primavera.
  `.trim(),

  longText: `
    El aprendizaje de idiomas es una aventura fascinante.
    Cada palabra nueva abre una puerta a una cultura diferente.
    La práctica constante es la clave del éxito.
    No tengas miedo de cometer errores, son parte del proceso.
    Con dedicación y paciencia, puedes lograr tus objetivos.
  `.trim()
}

export const SAMPLE_WORDS = {
  hola: {
    word: 'hola',
    translation: 'hello',
    partOfSpeech: 'interjection'
  },

  estás: {
    word: 'estás',
    translation: 'you are',
    partOfSpeech: 'verb'
  },

  gracias: {
    word: 'gracias',
    translation: 'thank you',
    partOfSpeech: 'interjection'
  },

  hermoso: {
    word: 'hermoso',
    translation: 'beautiful',
    partOfSpeech: 'adjective'
  }
}

export const SAMPLE_FLASHCARDS = {
  basicCards: [
    { front: 'hola', back: 'hello' },
    { front: 'adiós', back: 'goodbye' },
    { front: 'gracias', back: 'thank you' },
    { front: 'por favor', back: 'please' },
    { front: 'sí', back: 'yes' }
  ],

  clozeCards: [
    { text: 'Me {{c1::gusta}} el español', answer: 'gusta' },
    { text: 'Ella {{c1::habla}} tres idiomas', answer: 'habla' },
    { text: 'Nosotros {{c1::estudiamos}} juntos', answer: 'estudiamos' }
  ],

  verbCards: [
    { front: 'hablar', back: 'to speak' },
    { front: 'comer', back: 'to eat' },
    { front: 'vivir', back: 'to live' },
    { front: 'estudiar', back: 'to study' }
  ]
}

export const TUTOR_MESSAGES = {
  greeting: 'Hola, ¿cómo estás?',
  introduction: 'Me llamo Ana y soy de España.',
  question: '¿Qué te gusta hacer en tu tiempo libre?',
  response: 'Me gusta leer libros y escuchar música.',

  // Messages with common errors
  withErrors: [
    'Yo es estudiante', // Should be "soy"
    'Ella hablan español', // Should be "habla"
    'Nosotros está aquí' // Should be "estamos"
  ]
}

export const LIBRARY_TEXTS = {
  shortStory: {
    title: 'Un Día en la Playa',
    content: `
      María fue a la playa con sus amigos.
      El sol brillaba y el agua estaba perfecta.
      Nadaron y jugaron en la arena todo el día.
      Fue un día maravilloso.
    `.trim(),
    language: 'es'
  },

  recipe: {
    title: 'Cómo Hacer Tortilla Española',
    content: `
      Necesitas papas, huevos, cebolla, aceite y sal.
      Primero, pela y corta las papas.
      Fríe las papas en aceite hasta que estén doradas.
      Bate los huevos y mezcla con las papas.
      Cocina la mezcla en una sartén caliente.
    `.trim(),
    language: 'es'
  },

  dialogue: {
    title: 'Conversación en el Restaurante',
    content: `
      Cliente: Buenos días, quisiera una mesa para dos, por favor.
      Camarero: Por supuesto, síganme por aquí.
      Cliente: ¿Qué recomienda hoy?
      Camarero: La paella está deliciosa.
      Cliente: Perfecto, dos paellas entonces.
    `.trim(),
    language: 'es'
  }
}

export const USER_CREDENTIALS = {
  validUser: {
    email: 'valid@example.com',
    password: 'ValidPassword123!'
  },

  weakPassword: {
    email: 'test@example.com',
    password: '123' // Too short
  },

  invalidEmail: {
    email: 'notanemail',
    password: 'ValidPassword123!'
  }
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type CEFRLevel = typeof CEFR_LEVELS[number]
