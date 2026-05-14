import { Word, Exercise, ExerciseType } from '../types';

/**
 * Génère des exercices aléatoires à partir d'une liste de mots
 */
export const generateExercises = (
  words: Word[],
  allWords: Word[],
  count: number = 10
): Exercise[] => {
  const exercises: Exercise[] = [];
  const selectedWords = shuffleArray([...words]).slice(0, count);

  selectedWords.forEach((word, index) => {
    // Alterner entre différents types d'exercices
    const exerciseTypes: ExerciseType[] = [
      'multiple_choice',
      'fill_blank',
      'identify_nuance',
      'match_definition',
      'true_false',
    ];

    const type = exerciseTypes[index % exerciseTypes.length];
    const exercise = generateExercise(word, allWords, type);

    if (exercise) {
      exercises.push(exercise);
    }
  });

  return exercises;
};

/**
 * Génère un exercice selon le type spécifié
 */
const generateExercise = (
  word: Word,
  allWords: Word[],
  type: ExerciseType
): Exercise | null => {
  switch (type) {
    case 'multiple_choice':
      return generateMultipleChoice(word, allWords);
    case 'fill_blank':
      return generateFillBlank(word, allWords);
    case 'match_definition':
      return generateMatchDefinition(word, allWords);
    case 'true_false':
      return generateTrueFalse(word, allWords);
    case 'identify_nuance':
      // Si pas de paire de nuance définie, fallback sur multiple_choice
      return (
        generateIdentifyNuance(word, allWords) ??
        generateMultipleChoice(word, allWords)
      );
    default:
      return null;
  }
};

/**
 * Génère un exercice à choix multiples
 */
const generateMultipleChoice = (word: Word, allWords: Word[]): Exercise => {
  // Obtenir 3 mots différents du même thème ou aléatoires
  const wrongWords = allWords
    .filter((w) => w.id !== word.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = shuffleArray([
    word.definition,
    ...wrongWords.map((w) => w.definition),
  ]);

  const correctIndex = options.indexOf(word.definition);

  return {
    id: `mc_${word.id}_${Date.now()}`,
    type: 'multiple_choice',
    word,
    question: `Quelle est la définition de "${word.word}" ?`,
    options,
    correctAnswer: correctIndex,
    explanation: `"${word.word}" signifie : ${word.definition}`,
  };
};

/**
 * Échappe les caractères spéciaux pour une utilisation dans une regex
 */
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Génère un exercice de complétion de phrase
 */
const generateFillBlank = (word: Word, allWords: Word[]): Exercise => {
  // Prendre un exemple et remplacer le mot par un blanc
  const example = word.examples[0] || `Le mot ${word.word} est utilisé.`;
  const blankExample = example.replace(
    new RegExp(escapeRegExp(word.word), 'gi'),
    '______'
  );

  // Générer des options : mot correct + 3 mots distractifs (de préférence d'autres mots du corpus)
  const distractors = allWords
    .filter((w) => w.id !== word.id && w.word !== word.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.word);

  const options = shuffleArray([word.word, ...distractors]);
  const correctIndex = options.indexOf(word.word);

  return {
    id: `fb_${word.id}_${Date.now()}`,
    type: 'fill_blank',
    word,
    question: `Complétez la phrase :\n\n"${blankExample}"`,
    options,
    correctAnswer: correctIndex,
    explanation: word.definition,
  };
};

/**
 * Génère un exercice d'association mot-définition
 */
const generateMatchDefinition = (word: Word, allWords: Word[]): Exercise => {
  // Obtenir 3 définitions différentes
  const wrongWords = allWords
    .filter((w) => w.id !== word.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = shuffleArray([
    word.word,
    ...wrongWords.map((w) => w.word),
  ]);

  const correctIndex = options.indexOf(word.word);

  return {
    id: `md_${word.id}_${Date.now()}`,
    type: 'match_definition',
    word,
    question: `Quel mot correspond à cette définition ?\n\n"${word.definition}"`,
    options,
    correctAnswer: correctIndex,
    explanation: `Le mot est "${word.word}".`,
  };
};

/**
 * Génère un exercice de discrimination de nuance entre deux mots proches.
 * L'utilisateur voit la définition d'un mot et doit le distinguer de son
 * partenaire de nuance (un seul distracteur, très proche sémantiquement).
 *
 * Renvoie null si le mot n'a pas de paire `nuance_with` exploitable
 * (le caller fait alors un fallback sur un autre type).
 */
const generateIdentifyNuance = (
  word: Word,
  allWords: Word[]
): Exercise | null => {
  if (!word.nuance_with || word.nuance_with.length === 0) return null;

  const partner = allWords.find(
    (w) =>
      w.id !== word.id &&
      word.nuance_with!.some((nw) => nw.toLowerCase() === w.word.toLowerCase())
  );
  if (!partner) return null;

  const options = shuffleArray([word.word, partner.word]);
  const correctIndex = options.indexOf(word.word);

  return {
    id: `in_${word.id}_${Date.now()}`,
    type: 'identify_nuance',
    word,
    question: `Distinguez la nuance — quel mot correspond à cette définition ?\n\n"${word.definition}"`,
    options,
    correctAnswer: correctIndex,
    explanation: `"${word.word}" : ${word.definition}\n"${partner.word}" : ${partner.definition}`,
  };
};

/**
 * Génère un exercice vrai/faux
 */
const generateTrueFalse = (word: Word, allWords: Word[]): Exercise => {
  const isTrue = Math.random() > 0.5;

  let definition: string;
  if (isTrue) {
    // Vraie définition
    definition = word.definition;
  } else {
    // Fausse définition (prendre celle d'un autre mot)
    const wrongWord = allWords.find((w) => w.id !== word.id);
    definition = wrongWord ? wrongWord.definition : 'Définition incorrecte';
  }

  return {
    id: `tf_${word.id}_${Date.now()}`,
    type: 'true_false',
    word,
    question: `Le mot "${word.word}" signifie :\n\n"${definition}"\n\nEst-ce vrai ou faux ?`,
    options: ['Vrai', 'Faux'],
    correctAnswer: isTrue ? 0 : 1,
    explanation: `La vraie définition est : ${word.definition}`,
  };
};

/**
 * Mélange un tableau (Fisher-Yates shuffle)
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Calcule le score en pourcentage
 */
export const calculateScore = (
  correctAnswers: number,
  totalQuestions: number
): number => {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};

/**
 * Détermine le message de feedback selon le score
 */
export const getFeedbackMessage = (score: number): string => {
  if (score >= 90) return '🎉 Excellent! Vous maîtrisez parfaitement ces mots!';
  if (score >= 75) return '👏 Très bien! Continuez comme ça!';
  if (score >= 60) return '👍 Pas mal! Encore un petit effort!';
  if (score >= 40) return '💪 Continuez à pratiquer!';
  return '📚 Révisez ces mots et réessayez!';
};
