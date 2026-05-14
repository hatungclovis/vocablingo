import {
  calculateNextReview,
  getQualityFromAnswer,
  shouldReviewToday,
  calculateSuccessRate,
  getIntervalDescription,
  getMasteryLevel,
} from '../srs';
import { UserProgress } from '../../types';

const buildProgress = (overrides: Partial<UserProgress> = {}): UserProgress => ({
  id: 1,
  word_id: 1,
  easiness_factor: 2.5,
  interval: 1,
  repetitions: 0,
  next_review_date: new Date().toISOString(),
  last_reviewed_date: new Date().toISOString(),
  times_seen: 0,
  times_correct: 0,
  ...overrides,
});

describe('getQualityFromAnswer', () => {
  it('maps incorrect to 1', () => {
    expect(getQualityFromAnswer(false)).toBe(1);
  });
  it('maps correct + easy to 5', () => {
    expect(getQualityFromAnswer(true, 'easy')).toBe(5);
  });
  it('maps correct + medium to 4', () => {
    expect(getQualityFromAnswer(true, 'medium')).toBe(4);
  });
  it('maps correct + hard to 3', () => {
    expect(getQualityFromAnswer(true, 'hard')).toBe(3);
  });
});

describe('calculateNextReview', () => {
  it('handles a new correct answer: interval=1, reps=1', () => {
    const r = calculateNextReview(null, 4, true);
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
    expect(r.times_seen).toBe(1);
    expect(r.times_correct).toBe(1);
  });

  it('second correct answer: interval=6', () => {
    const prev = buildProgress({ repetitions: 1, interval: 1 });
    const r = calculateNextReview(prev, 4, true);
    expect(r.repetitions).toBe(2);
    expect(r.interval).toBe(6);
  });

  it('third correct answer scales by EF', () => {
    const prev = buildProgress({ repetitions: 2, interval: 6, easiness_factor: 2.5 });
    const r = calculateNextReview(prev, 4, true);
    expect(r.repetitions).toBe(3);
    expect(r.interval).toBe(Math.round(6 * 2.5)); // 15
  });

  it('incorrect resets repetitions to 0 and interval to 1', () => {
    const prev = buildProgress({ repetitions: 5, interval: 30 });
    const r = calculateNextReview(prev, 1, false);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });

  it('EF floors at 1.3', () => {
    const prev = buildProgress({ easiness_factor: 1.3 });
    // 5 quality=0 in a row → EF should stay >= 1.3
    let p: UserProgress | null = prev;
    for (let i = 0; i < 5; i++) {
      const r = calculateNextReview(p, 0, false);
      p = { ...prev, ...r };
    }
    expect(p!.easiness_factor).toBeGreaterThanOrEqual(1.3);
  });

  it('increments times_seen and times_correct on correct answer', () => {
    const prev = buildProgress({ times_seen: 4, times_correct: 3 });
    const r = calculateNextReview(prev, 4, true);
    expect(r.times_seen).toBe(5);
    expect(r.times_correct).toBe(4);
  });

  it('increments only times_seen on incorrect answer', () => {
    const prev = buildProgress({ times_seen: 4, times_correct: 3 });
    const r = calculateNextReview(prev, 1, false);
    expect(r.times_seen).toBe(5);
    expect(r.times_correct).toBe(3);
  });

  it('next_review_date is interval days after now', () => {
    const prev = buildProgress({ repetitions: 1, interval: 1 });
    const before = Date.now();
    const r = calculateNextReview(prev, 4, true);
    const after = Date.now();
    const next = new Date(r.next_review_date).getTime();
    // 6 jours plus tard (interval=6 après 2e bonne)
    expect(next).toBeGreaterThanOrEqual(before + 6 * 24 * 3600 * 1000 - 1000);
    expect(next).toBeLessThanOrEqual(after + 6 * 24 * 3600 * 1000 + 1000);
  });
});

describe('shouldReviewToday', () => {
  it('returns true for past date', () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    expect(shouldReviewToday(yesterday)).toBe(true);
  });
  it('returns true for today', () => {
    expect(shouldReviewToday(new Date().toISOString())).toBe(true);
  });
  it('returns false for tomorrow', () => {
    const tomorrow = new Date(Date.now() + 36 * 3600 * 1000).toISOString();
    expect(shouldReviewToday(tomorrow)).toBe(false);
  });
});

describe('calculateSuccessRate', () => {
  it('returns 0 when nothing seen', () => {
    expect(calculateSuccessRate(0, 0)).toBe(0);
  });
  it('rounds to nearest integer', () => {
    expect(calculateSuccessRate(3, 2)).toBe(67);
    expect(calculateSuccessRate(10, 7)).toBe(70);
  });
  it('returns 100 for perfect', () => {
    expect(calculateSuccessRate(5, 5)).toBe(100);
  });
});

describe('getIntervalDescription', () => {
  it("describes 0 days as 'Aujourd'hui'", () => {
    expect(getIntervalDescription(0)).toMatch(/Aujourd'hui/);
  });
  it("describes 1 day as 'Demain'", () => {
    expect(getIntervalDescription(1)).toMatch(/Demain/);
  });
  it('describes short intervals in days', () => {
    expect(getIntervalDescription(3)).toMatch(/3 jours/);
  });
  it('describes weeks for 7-29 days', () => {
    expect(getIntervalDescription(14)).toMatch(/semaine/);
  });
});

describe('getMasteryLevel', () => {
  it('returns new for repetitions=0', () => {
    expect(getMasteryLevel(0, 100)).toBe('new');
  });
  it('returns learning for low repetitions', () => {
    expect(getMasteryLevel(1, 50)).toBe('learning');
    expect(getMasteryLevel(2, 100)).toBe('learning');
  });
  it('returns mastered when success ≥80% and repetitions ≥5', () => {
    expect(getMasteryLevel(5, 80)).toBe('mastered');
    expect(getMasteryLevel(10, 95)).toBe('mastered');
  });
  it('returns review otherwise', () => {
    expect(getMasteryLevel(4, 100)).toBe('review');
    expect(getMasteryLevel(5, 60)).toBe('review');
  });
});
