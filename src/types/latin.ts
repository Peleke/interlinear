/**
 * Latin analysis types - lean and fast
 */

export interface LatinMorphology {
  case?: string;
  number?: string;
  gender?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  person?: string;
  degree?: string;
}

export interface LatinWordAnalysis {
  form: string;
  lemma: string | null;
  pos: string | null;
  morphology: LatinMorphology | null;
  index: number;
}

export interface DictionaryEntry {
  language: string;
  word: string;
  definitions: string[];
  examples?: string[];
  etymology?: string;
}

export interface LatinAnalysisResult {
  form: string;
  lemma: string | null;
  pos: string | null;
  morphology: LatinMorphology | null;
  dictionary: DictionaryEntry | null;
  index: number;
}

export interface LatinAnalysisOptions {
  includeMorphology?: boolean;
  includeDictionary?: boolean;
  cacheResults?: boolean;
}
