// Types pour les thèmes
export interface Theme {
  id: number;
  name: string;
  description: string;
  icon: string;
  word_count: number;
}

// Types pour les mots de vocabulaire
export interface Word {
  id: number;
  word: string;
  definition: string;
  theme_id: number;
  examples: string[]; // Stocké comme JSON dans SQLite
  level: 'B1' | 'B2' | 'C1' | 'C2';
  synonyms: string[]; // Stocké comme JSON dans SQLite
  antonyms: string[]; // Stocké comme JSON dans SQLite
}

// Types pour la progression utilisateur (SRS)
export interface UserProgress {
  id: number;
  word_id: number;
  easiness_factor: number; // 1.3 à 2.5
  interval: number; // Jours avant révision
  repetitions: number;
  next_review_date: string; // Format ISO
  last_reviewed_date: string; // Format ISO
  times_seen: number;
  times_correct: number;
}

// Types pour l'historique des exercices
export interface ExerciseHistory {
  id: number;
  word_id: number;
  exercise_type: ExerciseType;
  is_correct: boolean;
  timestamp: string; // Format ISO
}

// Types d'exercices disponibles
export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'match_definition'
  | 'identify_nuance'
  | 'true_false';

// Type pour les exercices générés
export interface Exercise {
  id: string;
  type: ExerciseType;
  word: Word;
  question: string;
  options?: string[]; // Pour multiple choice, match, etc.
  correctAnswer: string | number;
  explanation?: string;
}

// Type pour les statistiques utilisateur
export interface UserStats {
  total_words_learned: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  words_due_today: number;
}

// Type pour les données de vocabulaire JSON
export interface VocabularyData {
  themes: Omit<Theme, 'id'>[];
  words: Omit<Word, 'id'>[];
}
