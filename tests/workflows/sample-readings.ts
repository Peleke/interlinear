/**
 * Sample Spanish readings for testing vocabulary extraction
 * Different CEFR levels (A1, B2, C1)
 */

export const sampleReadings = {
  /**
   * A1 Level: Basic Spanish
   * Topic: Daily routine
   * Expected vocab: simple verbs, basic nouns, common phrases
   */
  a1_spanish: {
    level: 'A1' as const,
    language: 'es' as const,
    title: 'Mi rutina diaria',
    text: `Me llamo María. Todos los días me levanto a las siete de la mañana.
Desayuno café con leche y pan. Después, voy al trabajo en autobús.
Trabajo en una oficina. Como a las dos de la tarde.
Por la tarde, estudio español. Me gusta leer libros.
Por la noche, ceno con mi familia. Veo la televisión antes de dormir.
Me acuesto a las once de la noche.`,
    expectedWords: [
      'levanto',
      'desayuno',
      'trabajo',
      'como',
      'estudio',
      'ceno',
      'acuesto',
      'mañana',
      'tarde',
      'noche',
    ],
  },

  /**
   * B2 Level: Intermediate Spanish
   * Topic: Technology and society
   * Expected vocab: abstract nouns, complex verbs, idiomatic expressions
   */
  b2_spanish: {
    level: 'B2' as const,
    language: 'es' as const,
    title: 'La tecnología en la sociedad moderna',
    text: `La tecnología ha transformado profundamente nuestra sociedad.
Los dispositivos móviles se han convertido en herramientas imprescindibles para la comunicación.
Sin embargo, algunos expertos advierten sobre los riesgos de la dependencia tecnológica.
El uso excesivo de las redes sociales puede afectar negativamente las relaciones interpersonales.
Es necesario encontrar un equilibrio entre el mundo digital y la vida real.
Los jóvenes deben aprender a utilizar la tecnología de manera responsable.
La educación juega un papel fundamental en este proceso de adaptación.
Debemos aprovechar las ventajas de la innovación sin perder el contacto humano.`,
    expectedWords: [
      'transformado',
      'dispositivos',
      'imprescindibles',
      'advierten',
      'dependencia',
      'excesivo',
      'equilibrio',
      'fundamental',
      'aprovechar',
      'innovación',
    ],
  },

  /**
   * C1 Level: Advanced Spanish
   * Topic: Philosophy and ethics
   * Expected vocab: sophisticated vocabulary, abstract concepts, nuanced expressions
   */
  c1_spanish: {
    level: 'C1' as const,
    language: 'es' as const,
    title: 'Reflexiones sobre la ética contemporánea',
    text: `La ética contemporánea se enfrenta a dilemas sin precedentes en la historia de la humanidad.
Los avances científicos plantean cuestiones fundamentales sobre la naturaleza de la conciencia y la identidad.
El desarrollo de la inteligencia artificial desafía nuestras concepciones tradicionales sobre la autonomía moral.
¿Puede una máquina poseer responsabilidad ética? ¿Cómo deberíamos regular las tecnologías emergentes?
Estas interrogantes requieren un análisis riguroso que trascienda las fronteras disciplinarias.
La filosofía moral debe adaptarse a una realidad cada vez más compleja e interconectada.
Los principios deontológicos y consecuencialistas ofrecen marcos teóricos complementarios.
Sin embargo, la aplicación práctica de estos conceptos abstractos presenta desafíos considerables.`,
    expectedWords: [
      'dilemas',
      'precedentes',
      'plantean',
      'conciencia',
      'desafía',
      'concepciones',
      'autonomía',
      'interrogantes',
      'trascienda',
      'deontológicos',
      'consecuencialistas',
    ],
  },
}
