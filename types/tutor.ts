// types/tutor.ts
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface DialogMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  turnNumber: number
}

export interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

export interface ProfessorOverview {
  summary: string
  grammarConcepts: string[]
  vocabThemes: string[]
  syntaxPatterns: string[]
}

export interface TurnCorrection {
  hasErrors: boolean
  correctedText: string
  errors: ErrorDetail[]
}

export interface ErrorDetail {
  errorText: string
  correction: string
  explanation: string
  category: 'grammar' | 'vocabulary' | 'syntax'
}
