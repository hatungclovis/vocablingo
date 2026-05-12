/**
 * Service de gamification pour Vocalingo
 * Gère les XP, niveaux, streaks et achievements
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  unlocked: boolean;
}

export interface UserGameStats {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  total_exercises_completed: number;
  total_correct_answers: number;
  achievements: string[]; // IDs des achievements débloqués
}

// Configuration des niveaux et XP requis
const LEVELS_CONFIG = [
  { level: 1, xpRequired: 0, title: 'Débutant' },
  { level: 2, xpRequired: 100, title: 'Apprenti' },
  { level: 3, xpRequired: 250, title: 'Étudiant' },
  { level: 4, xpRequired: 500, title: 'Intermédiaire' },
  { level: 5, xpRequired: 1000, title: 'Avancé' },
  { level: 6, xpRequired: 2000, title: 'Expert' },
  { level: 7, xpRequired: 3500, title: 'Maître' },
  { level: 8, xpRequired: 5500, title: 'Virtuose' },
  { level: 9, xpRequired: 8000, title: 'Sage' },
  { level: 10, xpRequired: 12000, title: 'Légendaire' },
];

// XP gagnés selon les actions
export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  PERFECT_EXERCISE: 50, // 100% de réussite
  FIRST_WORD_LEARNED: 20,
  THEME_COMPLETED: 100,
  DAILY_STREAK: 25,
  REVIEW_COMPLETED: 15,
};

// Définition des achievements
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    title: 'Premiers pas',
    description: 'Complétez votre premier exercice',
    icon: '🎯',
    requirement: 1,
    unlocked: false,
  },
  {
    id: 'word_collector',
    title: 'Collectionneur de mots',
    description: 'Apprenez 10 mots',
    icon: '📚',
    requirement: 10,
    unlocked: false,
  },
  {
    id: 'vocabulary_master',
    title: 'Maître du vocabulaire',
    description: 'Apprenez 50 mots',
    icon: '🎓',
    requirement: 50,
    unlocked: false,
  },
  {
    id: 'streak_3',
    title: 'Régularité',
    description: 'Maintenez un streak de 3 jours',
    icon: '🔥',
    requirement: 3,
    unlocked: false,
  },
  {
    id: 'streak_7',
    title: 'Engagement',
    description: 'Maintenez un streak de 7 jours',
    icon: '⭐',
    requirement: 7,
    unlocked: false,
  },
  {
    id: 'streak_30',
    title: 'Dévouement',
    description: 'Maintenez un streak de 30 jours',
    icon: '👑',
    requirement: 30,
    unlocked: false,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionniste',
    description: 'Obtenez 100% à 5 exercices',
    icon: '💯',
    requirement: 5,
    unlocked: false,
  },
  {
    id: 'level_5',
    title: 'Avancé',
    description: 'Atteignez le niveau 5',
    icon: '🚀',
    requirement: 5,
    unlocked: false,
  },
  {
    id: 'level_10',
    title: 'Légendaire',
    description: 'Atteignez le niveau 10',
    icon: '🏆',
    requirement: 10,
    unlocked: false,
  },
];

/**
 * Calcule le niveau basé sur les XP totaux
 */
export const calculateLevel = (totalXP: number): number => {
  let level = 1;
  for (const config of LEVELS_CONFIG) {
    if (totalXP >= config.xpRequired) {
      level = config.level;
    } else {
      break;
    }
  }
  return level;
};

/**
 * Retourne les infos du niveau actuel
 */
export const getLevelInfo = (totalXP: number) => {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelConfig = LEVELS_CONFIG.find((l) => l.level === currentLevel)!;
  const nextLevelConfig = LEVELS_CONFIG.find((l) => l.level === currentLevel + 1);

  const xpInCurrentLevel = totalXP - currentLevelConfig.xpRequired;
  const xpNeededForNextLevel = nextLevelConfig
    ? nextLevelConfig.xpRequired - currentLevelConfig.xpRequired
    : 0;

  const progressPercentage = nextLevelConfig
    ? Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)
    : 100;

  return {
    level: currentLevel,
    title: currentLevelConfig.title,
    totalXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
    nextLevelTitle: nextLevelConfig?.title,
  };
};

/**
 * Calcule les XP gagnés pour un exercice
 */
export const calculateExerciseXP = (
  correctAnswers: number,
  totalQuestions: number
): number => {
  let xp = correctAnswers * XP_REWARDS.CORRECT_ANSWER;

  // Bonus pour un exercice parfait
  if (correctAnswers === totalQuestions && totalQuestions > 0) {
    xp += XP_REWARDS.PERFECT_EXERCISE;
  }

  return xp;
};

/**
 * Calcule le nouveau streak (valeur absolue) selon la dernière activité.
 * - Première activité ou streak cassé : 1
 * - Même jour : streak inchangé
 * - Jour consécutif : streak + 1
 */
export const updateStreak = (
  lastActivityDate: string | null,
  currentStreak: number
): {
  newStreak: number;
  streakMaintained: boolean;
  xpBonus: number;
} => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastActivityDate) {
    return { newStreak: 1, streakMaintained: true, xpBonus: 0 };
  }

  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    return { newStreak: currentStreak, streakMaintained: true, xpBonus: 0 };
  } else if (daysDiff === 1) {
    return {
      newStreak: currentStreak + 1,
      streakMaintained: true,
      xpBonus: XP_REWARDS.DAILY_STREAK,
    };
  } else {
    return { newStreak: 1, streakMaintained: false, xpBonus: 0 };
  }
};

/**
 * Vérifie et débloque les achievements
 */
export const checkAchievements = (
  stats: UserGameStats,
  wordsLearned: number,
  perfectExercises: number
): Achievement[] => {
  const newlyUnlocked: Achievement[] = [];

  ACHIEVEMENTS.forEach((achievement) => {
    if (stats.achievements.includes(achievement.id)) {
      return; // Déjà débloqué
    }

    let shouldUnlock = false;

    switch (achievement.id) {
      case 'first_steps':
        shouldUnlock = stats.total_exercises_completed >= achievement.requirement;
        break;
      case 'word_collector':
      case 'vocabulary_master':
        shouldUnlock = wordsLearned >= achievement.requirement;
        break;
      case 'streak_3':
      case 'streak_7':
      case 'streak_30':
        shouldUnlock = stats.current_streak >= achievement.requirement;
        break;
      case 'perfectionist':
        shouldUnlock = perfectExercises >= achievement.requirement;
        break;
      case 'level_5':
      case 'level_10':
        shouldUnlock = stats.level >= achievement.requirement;
        break;
    }

    if (shouldUnlock) {
      newlyUnlocked.push({ ...achievement, unlocked: true });
    }
  });

  return newlyUnlocked;
};

/**
 * Retourne un message de motivation basé sur le niveau
 */
export const getMotivationalMessage = (level: number): string => {
  const messages = [
    '🌱 Chaque mot appris est une graine plantée dans votre jardin linguistique!',
    '📚 La lecture nourrit l\'esprit, le vocabulaire l\'enrichit!',
    '🎯 Un mot par jour éloigne l\'ignorance pour toujours!',
    '💪 Vous êtes sur la bonne voie! Continuez!',
    '🚀 Votre vocabulaire décolle! Impressionnant!',
    '⭐ Vous brillez! Quel progrès remarquable!',
    '🏆 Champion des mots! Vous êtes une inspiration!',
    '👑 Votre maîtrise du français est royale!',
    '🌟 Légendaire! Vous êtes un vrai virtuose!',
    '💎 Votre éloquence est un trésor précieux!',
  ];

  return messages[Math.min(level - 1, messages.length - 1)];
};

/**
 * Retourne un emoji selon le niveau
 */
export const getLevelEmoji = (level: number): string => {
  const emojis = ['🌱', '🌿', '🌳', '🚀', '⭐', '🏆', '👑', '💎', '🌟', '✨'];
  return emojis[Math.min(level - 1, emojis.length - 1)];
};
