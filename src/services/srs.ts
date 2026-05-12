import { UserProgress } from '../types';

/**
 * Algorithme SuperMemo 2 (SM-2) pour la répétition espacée
 *
 * Quality ratings:
 * 5 - Parfait: réponse correcte avec facilité totale
 * 4 - Correct: réponse correcte après hésitation
 * 3 - Difficile: réponse correcte avec difficulté
 * 2 - Faux mais souvenir: mauvaise réponse mais le mot était familier
 * 1 - Faux: mauvaise réponse, mot inconnu
 * 0 - Blackout: aucune idée
 */

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

interface SRSResult {
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_date: string;
  times_seen: number;
  times_correct: number;
}

/**
 * Calcule la prochaine date de révision selon l'algorithme SM-2
 *
 * @param currentProgress - Progression actuelle de l'utilisateur pour ce mot
 * @param quality - Note de qualité de la réponse (0-5)
 * @param isCorrect - Si la réponse était correcte
 * @returns Nouvelle progression mise à jour
 */
export const calculateNextReview = (
  currentProgress: UserProgress | null,
  quality: Quality,
  isCorrect: boolean
): SRSResult => {
  // Valeurs par défaut pour un nouveau mot
  let easinessFactor = currentProgress?.easiness_factor ?? 2.5;
  let interval = currentProgress?.interval ?? 1;
  let repetitions = currentProgress?.repetitions ?? 0;
  let timesSeen = (currentProgress?.times_seen ?? 0) + 1;
  let timesCorrect = currentProgress?.times_correct ?? 0;

  const now = new Date();
  const lastReviewedDate = now.toISOString();

  if (isCorrect) {
    timesCorrect++;
  }

  // Calcul selon l'algorithme SM-2
  if (quality >= 3) {
    // Réponse correcte
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions++;
  } else {
    // Réponse incorrecte
    repetitions = 0;
    interval = 1;
  }

  // Ajustement du facteur de facilité
  // Formule: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Contrainte: EF minimum de 1.3
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  // Calcul de la date de prochaine révision
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easiness_factor: Number(easinessFactor.toFixed(2)),
    interval,
    repetitions,
    next_review_date: nextReviewDate.toISOString(),
    last_reviewed_date: lastReviewedDate,
    times_seen: timesSeen,
    times_correct: timesCorrect,
  };
};

/**
 * Convertit une réponse correcte/incorrecte en note de qualité
 * Cette fonction peut être utilisée pour des exercices simples (vrai/faux)
 *
 * @param isCorrect - Si la réponse était correcte
 * @param confidence - Niveau de confiance (optionnel, 'easy' | 'medium' | 'hard')
 * @returns Note de qualité SM-2
 */
export const getQualityFromAnswer = (
  isCorrect: boolean,
  confidence: 'easy' | 'medium' | 'hard' = 'medium'
): Quality => {
  if (!isCorrect) {
    return 1; // Faux
  }

  // Réponse correcte
  switch (confidence) {
    case 'easy':
      return 5; // Parfait
    case 'medium':
      return 4; // Correct
    case 'hard':
      return 3; // Difficile
    default:
      return 4;
  }
};

/**
 * Détermine si un mot doit être révisé aujourd'hui
 *
 * @param nextReviewDate - Date de prochaine révision (ISO string)
 * @returns true si le mot doit être révisé
 */
export const shouldReviewToday = (nextReviewDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);

  return reviewDate <= today;
};

/**
 * Calcule le taux de réussite pour un mot
 *
 * @param timesSeen - Nombre de fois que le mot a été vu
 * @param timesCorrect - Nombre de fois que la réponse était correcte
 * @returns Taux de réussite en pourcentage (0-100)
 */
export const calculateSuccessRate = (timesSeen: number, timesCorrect: number): number => {
  if (timesSeen === 0) return 0;
  return Math.round((timesCorrect / timesSeen) * 100);
};

/**
 * Retourne une description textuelle de l'intervalle de révision
 *
 * @param interval - Nombre de jours
 * @returns Description lisible
 */
export const getIntervalDescription = (interval: number): string => {
  if (interval === 0) return "Aujourd'hui";
  if (interval === 1) return 'Demain';
  if (interval < 7) return `Dans ${interval} jours`;
  if (interval < 30) return `Dans ${Math.round(interval / 7)} semaine(s)`;
  if (interval < 365) return `Dans ${Math.round(interval / 30)} mois`;
  return `Dans ${Math.round(interval / 365)} an(s)`;
};

/**
 * Détermine le niveau de maîtrise d'un mot
 *
 * @param repetitions - Nombre de répétitions réussies
 * @param successRate - Taux de réussite (0-100)
 * @returns Niveau de maîtrise ('new' | 'learning' | 'review' | 'mastered')
 */
export const getMasteryLevel = (
  repetitions: number,
  successRate: number
): 'new' | 'learning' | 'review' | 'mastered' => {
  if (repetitions === 0) return 'new';
  if (repetitions < 3) return 'learning';
  if (successRate >= 80 && repetitions >= 5) return 'mastered';
  return 'review';
};
