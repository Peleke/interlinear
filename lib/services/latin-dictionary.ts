import fs from 'fs';
import path from 'path';

export interface LewisShortEntry {
  key: string;                    // Headword (lemma)
  entry_type: string;              // main, spur, hapax, greek, gloss
  part_of_speech?: string;         // noun, verb, adj, etc.
  gender?: string;                 // M, F, N
  declension?: number;             // 1-5 for nouns
  conjugation?: number;            // 1-4 for verbs
  title_genitive?: string;         // Genitive ending
  title_orthography?: string;      // With macrons
  senses: string[];                // English definitions
  main_notes?: string;             // Etymology, usage notes
  alternative_orthography?: string;// Variant spellings
}

export class LatinDictionaryService {
  private dictionary: LewisShortEntry[] = [];
  private isLoaded: boolean = false;

  constructor() {
    this.loadDictionary();
  }

  /**
   * Load all Lewis & Short JSON files into memory
   * This runs once on service initialization
   */
  private loadDictionary(): void {
    const dataDir = path.join(process.cwd(), 'data/latin-dictionary');

    if (!fs.existsSync(dataDir)) {
      throw new Error(`Latin dictionary directory not found: ${dataDir}`);
    }

    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith('ls_') && f.endsWith('.json'))
      .sort(); // Ensure consistent loading order

    console.log(`Loading Lewis & Short dictionary from ${files.length} files...`);

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (!Array.isArray(data)) {
        console.warn(`Skipping ${file}: not an array`);
        continue;
      }

      this.dictionary.push(...data);
    }

    this.isLoaded = true;
    console.log(`✅ Loaded ${this.dictionary.length} Latin entries`);
  }

  /**
   * Normalize word for lookup (lowercase, remove macrons)
   */
  private normalize(word: string): string {
    return word
      .toLowerCase()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }

  /**
   * Lookup word in Lewis & Short
   * Tries exact match first, then normalized (no macrons)
   */
  async lookup(word: string): Promise<LewisShortEntry | null> {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }

    const normalized = this.normalize(word);

    // Try exact match first (case-insensitive)
    let entry = this.dictionary.find(e =>
      e.key.toLowerCase() === word.toLowerCase()
    );

    // Try without macrons
    if (!entry) {
      entry = this.dictionary.find(e =>
        this.normalize(e.key) === normalized
      );
    }

    return entry || null;
  }

  /**
   * Search for words matching query (autocomplete, suggestions)
   */
  async search(query: string, limit: number = 10): Promise<LewisShortEntry[]> {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }

    const normalized = this.normalize(query);

    return this.dictionary
      .filter(e => this.normalize(e.key).includes(normalized))
      .slice(0, limit);
  }

  /**
   * Get dictionary statistics
   */
  getStats(): { totalEntries: number; loaded: boolean } {
    return {
      totalEntries: this.dictionary.length,
      loaded: this.isLoaded,
    };
  }
}

// Singleton instance (loaded once, reused across requests)
let instance: LatinDictionaryService | null = null;

export function getLatinDictionary(): LatinDictionaryService {
  if (!instance) {
    instance = new LatinDictionaryService();
  }
  return instance;
}
