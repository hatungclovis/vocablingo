import {
  calculateLevel,
  getLevelInfo,
  calculateExerciseXP,
  updateStreak,
  checkAchievements,
  updateDailyProgress,
  getTodayProgress,
  XP_REWARDS,
  ACHIEVEMENTS,
  UserGameStats,
} from '../gamification';

const baseStats: UserGameStats = {
  total_xp: 0,
  level: 1,
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: '',
  total_exercises_completed: 0,
  total_correct_answers: 0,
  achievements: [],
};

describe('calculateLevel', () => {
  it('starts at level 1', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });
  it('reaches level 2 at 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
  });
  it('reaches level 5 at 1000 XP', () => {
    expect(calculateLevel(1000)).toBe(5);
  });
  it('caps at level 10', () => {
    expect(calculateLevel(50000)).toBe(10);
  });
});

describe('getLevelInfo', () => {
  it('returns correct level and progress', () => {
    const info = getLevelInfo(250);
    expect(info.level).toBe(3);
    expect(info.xpInCurrentLevel).toBe(0);
  });
  it('mid-level returns partial progress', () => {
    const info = getLevelInfo(375); // niveau 3 (250→500), milieu
    expect(info.level).toBe(3);
    expect(info.xpInCurrentLevel).toBe(125);
    expect(info.xpNeededForNextLevel).toBe(250);
    expect(info.progressPercentage).toBe(50);
  });
  it('at level 10 returns 100%', () => {
    const info = getLevelInfo(20000);
    expect(info.level).toBe(10);
    expect(info.progressPercentage).toBe(100);
  });
});

describe('calculateExerciseXP', () => {
  it('gives 10 XP per correct answer', () => {
    expect(calculateExerciseXP(5, 10)).toBe(50);
  });
  it('gives bonus for perfect exercise', () => {
    expect(calculateExerciseXP(10, 10)).toBe(10 * XP_REWARDS.CORRECT_ANSWER + XP_REWARDS.PERFECT_EXERCISE);
  });
  it('no bonus when not perfect', () => {
    expect(calculateExerciseXP(9, 10)).toBe(9 * XP_REWARDS.CORRECT_ANSWER);
  });
  it('returns 0 for no answers', () => {
    expect(calculateExerciseXP(0, 10)).toBe(0);
  });
});

describe('updateStreak', () => {
  it('starts at 1 on first activity', () => {
    const r = updateStreak(null, 0);
    expect(r.newStreak).toBe(1);
    expect(r.streakMaintained).toBe(true);
  });

  it('keeps streak unchanged when same day', () => {
    const today = new Date().toISOString();
    const r = updateStreak(today, 5);
    expect(r.newStreak).toBe(5);
    expect(r.xpBonus).toBe(0);
  });

  it('increments streak on consecutive day', () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const r = updateStreak(yesterday, 5);
    expect(r.newStreak).toBe(6);
    expect(r.xpBonus).toBe(XP_REWARDS.DAILY_STREAK);
  });

  it('resets to 1 after gap', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
    const r = updateStreak(fourDaysAgo, 10);
    expect(r.newStreak).toBe(1);
    expect(r.streakMaintained).toBe(false);
  });
});

describe('checkAchievements', () => {
  it('unlocks first_steps after first exercise', () => {
    const stats = { ...baseStats, total_exercises_completed: 1 };
    const got = checkAchievements(stats, 0, 0);
    expect(got.map((a) => a.id)).toContain('first_steps');
  });

  it('does not re-unlock already unlocked', () => {
    const stats = { ...baseStats, total_exercises_completed: 1, achievements: ['first_steps'] };
    const got = checkAchievements(stats, 0, 0);
    expect(got.map((a) => a.id)).not.toContain('first_steps');
  });

  it('unlocks word_collector at 10 words learned', () => {
    const got = checkAchievements(baseStats, 10, 0);
    expect(got.map((a) => a.id)).toContain('word_collector');
  });

  it('unlocks streak_3 at 3-day streak', () => {
    const stats = { ...baseStats, current_streak: 3 };
    const got = checkAchievements(stats, 0, 0);
    expect(got.map((a) => a.id)).toContain('streak_3');
  });

  it('unlocks level_5 at level 5', () => {
    const stats = { ...baseStats, level: 5 };
    const got = checkAchievements(stats, 0, 0);
    expect(got.map((a) => a.id)).toContain('level_5');
  });

  it('total achievements has 9 entries', () => {
    expect(ACHIEVEMENTS).toHaveLength(9);
  });
});

describe('updateDailyProgress', () => {
  it('resets count when previous date is null', () => {
    const r = updateDailyProgress(5, 0, null);
    expect(r.newCount).toBe(1);
    expect(r.goalJustReached).toBe(false);
  });

  it('resets count when previous date is yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    const r = updateDailyProgress(5, 4, yesterday);
    expect(r.newCount).toBe(1);
  });

  it('increments count on same day', () => {
    const today = new Date().toISOString().split('T')[0];
    const r = updateDailyProgress(5, 2, today);
    expect(r.newCount).toBe(3);
  });

  it('triggers goalJustReached on crossing threshold', () => {
    const today = new Date().toISOString().split('T')[0];
    const r = updateDailyProgress(5, 4, today);
    expect(r.newCount).toBe(5);
    expect(r.goalJustReached).toBe(true);
    expect(r.xpBonus).toBe(XP_REWARDS.DAILY_GOAL_REACHED);
  });

  it('does NOT re-trigger after already past goal', () => {
    const today = new Date().toISOString().split('T')[0];
    const r = updateDailyProgress(5, 6, today);
    expect(r.newCount).toBe(7);
    expect(r.goalJustReached).toBe(false);
    expect(r.xpBonus).toBe(0);
  });
});

describe('getTodayProgress', () => {
  it('returns stored count when date is today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getTodayProgress(3, today)).toBe(3);
  });
  it('returns 0 when date is not today', () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    expect(getTodayProgress(3, yesterday)).toBe(0);
  });
  it('returns 0 when date is null', () => {
    expect(getTodayProgress(3, null)).toBe(0);
  });
});
