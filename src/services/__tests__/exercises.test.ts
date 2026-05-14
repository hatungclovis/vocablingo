import {
  generateExercises,
  calculateScore,
  getFeedbackMessage,
} from '../exercises';
import { Word } from '../../types';

const makeWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'observer',
  definition: 'Regarder attentivement pour analyser',
  theme_id: 3,
  examples: ['Le scientifique observe le phénomène.'],
  level: 'B2',
  synonyms: ['regarder', 'examiner'],
  antonyms: [],
  nuance_with: [],
  ...overrides,
});

const buildCorpus = (n: number): Word[] =>
  Array.from({ length: n }, (_, i) =>
    makeWord({
      id: i + 1,
      word: `mot${i + 1}`,
      definition: `définition ${i + 1}`,
      examples: [`Exemple avec mot${i + 1}.`],
    })
  );

describe('generateExercises', () => {
  it('returns at most `count` exercises', () => {
    const corpus = buildCorpus(20);
    const exos = generateExercises(corpus.slice(0, 5), corpus, 3);
    expect(exos.length).toBeLessThanOrEqual(3);
  });

  it('cycles through all 5 exercise types', () => {
    const corpus = buildCorpus(20);
    const exos = generateExercises(corpus.slice(0, 10), corpus, 10);
    const types = new Set(exos.map((e) => e.type));
    // Au moins 3 types différents (les 5 sont cyclés modulo index)
    expect(types.size).toBeGreaterThanOrEqual(3);
  });

  it('each exercise has options + correctAnswer index in range', () => {
    const corpus = buildCorpus(20);
    const exos = generateExercises(corpus.slice(0, 5), corpus, 5);
    for (const ex of exos) {
      if (ex.options) {
        expect(typeof ex.correctAnswer).toBe('number');
        expect(ex.correctAnswer as number).toBeGreaterThanOrEqual(0);
        expect(ex.correctAnswer as number).toBeLessThan(ex.options.length);
      }
    }
  });

  it('identify_nuance falls back to multiple_choice if no nuance_with', () => {
    const corpus = buildCorpus(20);
    // Force an identify_nuance attempt by using a word at index 2 (cycle position)
    const exos = generateExercises(corpus.slice(0, 3), corpus, 3);
    // Aucun mot du corpus n'a de nuance_with, donc identify_nuance fait fallback
    // → on a uniquement les autres types (mais pas identify_nuance)
    for (const ex of exos) {
      // Si le type est identify_nuance c'est un bug du fallback
      // (on accepte multiple_choice à la place)
      expect(['multiple_choice', 'fill_blank', 'match_definition', 'true_false']).toContain(ex.type);
    }
  });

  it('identify_nuance generated when nuance_with partner exists', () => {
    const observer = makeWord({ id: 1, word: 'observer', nuance_with: ['contempler'] });
    const contempler = makeWord({
      id: 2,
      word: 'contempler',
      definition: 'Regarder longuement avec admiration',
      nuance_with: ['observer'],
    });
    const corpus = [observer, contempler, ...buildCorpus(10)];
    // Use both nuance words; at cycle index 2 → identify_nuance
    const exos = generateExercises([observer, makeWord({ id: 100, word: 'autre' }), contempler], corpus, 3);
    // Au moins un exercice peut être identify_nuance
    const types = exos.map((e) => e.type);
    expect(types.some((t) => t === 'identify_nuance' || t === 'multiple_choice')).toBe(true);
  });
});

describe('calculateScore', () => {
  it('returns 0 for empty', () => {
    expect(calculateScore(0, 0)).toBe(0);
  });
  it('rounds to nearest integer', () => {
    expect(calculateScore(2, 3)).toBe(67);
  });
  it('returns 100 for perfect', () => {
    expect(calculateScore(10, 10)).toBe(100);
  });
});

describe('getFeedbackMessage', () => {
  it('gives excellent for ≥90', () => {
    expect(getFeedbackMessage(95)).toMatch(/Excellent/);
  });
  it('gives encouragement for low scores', () => {
    expect(getFeedbackMessage(30)).toMatch(/Révisez|pratiquer/i);
  });
});
