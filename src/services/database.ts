import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { Theme, Word, UserProgress, VocabularyData } from '../types';
import vocabularyData from '../data/vocabulary.json';

const DATABASE_NAME = 'vocablingo.db';

let db: SQLiteDatabase | null = null;

// Fonction pour obtenir ou créer la base de données
const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (!db) {
    db = await openDatabaseAsync(DATABASE_NAME);
  }
  return db;
};

/**
 * Initialise la base de données et crée les tables si nécessaire
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const database = await getDatabase();

    // Créer toutes les tables
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        word_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        definition TEXT NOT NULL,
        theme_id INTEGER NOT NULL,
        examples TEXT NOT NULL,
        level TEXT NOT NULL,
        synonyms TEXT NOT NULL,
        antonyms TEXT NOT NULL,
        nuance_with TEXT DEFAULT '[]',
        FOREIGN KEY (theme_id) REFERENCES themes(id)
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL UNIQUE,
        easiness_factor REAL DEFAULT 2.5,
        interval INTEGER DEFAULT 1,
        repetitions INTEGER DEFAULT 0,
        next_review_date TEXT,
        last_reviewed_date TEXT,
        times_seen INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        FOREIGN KEY (word_id) REFERENCES words(id)
      );

      CREATE TABLE IF NOT EXISTS exercise_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        exercise_type TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (word_id) REFERENCES words(id)
      );

      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date TEXT,
        total_exercises_completed INTEGER DEFAULT 0,
        total_correct_answers INTEGER DEFAULT 0,
        perfect_exercises_count INTEGER DEFAULT 0,
        achievements TEXT DEFAULT '[]',
        daily_goal INTEGER DEFAULT 5,
        daily_progress_count INTEGER DEFAULT 0,
        daily_progress_date TEXT,
        theme_preference TEXT DEFAULT 'system'
      );
    `);

    // Migrations idempotentes pour bases existantes
    await ensureColumn(database, 'words', 'nuance_with', "TEXT DEFAULT '[]'");
    await ensureColumn(database, 'user_stats', 'daily_goal', 'INTEGER DEFAULT 5');
    await ensureColumn(database, 'user_stats', 'daily_progress_count', 'INTEGER DEFAULT 0');
    await ensureColumn(database, 'user_stats', 'daily_progress_date', 'TEXT');
    await ensureColumn(database, 'user_stats', 'theme_preference', "TEXT DEFAULT 'system'");

    // Full-text search (FTS5)
    await setupFTS(database);

    // Vérifier et initialiser user_stats
    const statsCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_stats'
    );

    if (statsCount && statsCount.count === 0) {
      await database.runAsync(
        `INSERT INTO user_stats (total_xp, level, current_streak, longest_streak, achievements)
         VALUES (0, 1, 0, 0, '[]')`
      );
    }

    // Synchroniser le vocabulaire avec le JSON (ajoute les nouveaux thèmes/mots
    // si l'utilisateur a déjà la base initialisée avec une version antérieure)
    await syncVocabularyData(database);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Ajoute une colonne à une table si elle n'existe pas encore.
 * Migration idempotente pour bases créées avant l'ajout du champ.
 */
const ensureColumn = async (
  database: SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> => {
  const cols = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  if (!cols.some((c) => c.name === column)) {
    await database.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    );
  }
};

/**
 * Crée la table FTS5 + triggers + backfill initial (idempotent).
 */
const setupFTS = async (database: SQLiteDatabase): Promise<void> => {
  await database.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
      word, definition, examples,
      content='words',
      content_rowid='id',
      tokenize='unicode61 remove_diacritics 1'
    );

    CREATE TRIGGER IF NOT EXISTS words_ai AFTER INSERT ON words BEGIN
      INSERT INTO words_fts(rowid, word, definition, examples)
      VALUES (new.id, new.word, new.definition, new.examples);
    END;

    CREATE TRIGGER IF NOT EXISTS words_ad AFTER DELETE ON words BEGIN
      INSERT INTO words_fts(words_fts, rowid, word, definition, examples)
      VALUES ('delete', old.id, old.word, old.definition, old.examples);
    END;

    CREATE TRIGGER IF NOT EXISTS words_au AFTER UPDATE ON words BEGIN
      INSERT INTO words_fts(words_fts, rowid, word, definition, examples)
      VALUES ('delete', old.id, old.word, old.definition, old.examples);
      INSERT INTO words_fts(rowid, word, definition, examples)
      VALUES (new.id, new.word, new.definition, new.examples);
    END;
  `);

  // Backfill : si la FTS est vide mais words ne l'est pas, repeupler
  const ftsCount = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM words_fts'
  );
  const wordsCount = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM words'
  );
  if (
    ftsCount &&
    wordsCount &&
    ftsCount.c === 0 &&
    wordsCount.c > 0
  ) {
    await database.execAsync(`
      INSERT INTO words_fts(rowid, word, definition, examples)
      SELECT id, word, definition, examples FROM words
    `);
  }
};

/**
 * Recherche full-text sur les mots (FTS5).
 * Renvoie au maximum `limit` résultats.
 */
export const searchWords = async (
  query: string,
  limit: number = 30
): Promise<Word[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const database = await getDatabase();
    // FTS5 préfixe (prefix-match): chaque token suivi de *
    const ftsQuery = trimmed
      .split(/\s+/)
      .map((t) => t.replace(/['"]/g, ''))
      .filter((t) => t.length > 0)
      .map((t) => `${t}*`)
      .join(' ');

    const rows = await database.getAllAsync<any>(
      `SELECT w.* FROM words w
       INNER JOIN words_fts f ON w.id = f.rowid
       WHERE words_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
      [ftsQuery, limit]
    );

    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      definition: row.definition,
      theme_id: row.theme_id,
      examples: JSON.parse(row.examples),
      level: row.level,
      synonyms: JSON.parse(row.synonyms),
      antonyms: JSON.parse(row.antonyms),
      nuance_with: row.nuance_with ? JSON.parse(row.nuance_with) : [],
    }));
  } catch (error) {
    console.error('Error searching words:', error);
    return [];
  }
};

/**
 * Synchronise le vocabulaire JSON avec la base.
 * - Insère les thèmes manquants (alignés sur l'ordre du JSON)
 * - Insère les mots qui ne sont pas déjà présents (clé : word + theme_id)
 * - Met à jour le compteur word_count des thèmes
 */
const syncVocabularyData = async (database: SQLiteDatabase): Promise<void> => {
  const data = vocabularyData as VocabularyData;

  // Synchroniser les thèmes : insérer ceux qui manquent (par position dans le JSON)
  const existingThemes = await database.getAllAsync<{ id: number; name: string }>(
    'SELECT id, name FROM themes ORDER BY id'
  );
  const existingThemeNames = new Set(existingThemes.map((t) => t.name));

  for (const theme of data.themes) {
    if (!existingThemeNames.has(theme.name)) {
      await database.runAsync(
        'INSERT INTO themes (name, description, icon, word_count) VALUES (?, ?, ?, ?)',
        [theme.name, theme.description, theme.icon, theme.word_count]
      );
    }
  }

  // Construire un index des mots existants (clé: theme_id|word)
  const existingWords = await database.getAllAsync<{ word: string; theme_id: number }>(
    'SELECT word, theme_id FROM words'
  );
  const existingWordKeys = new Set(
    existingWords.map((w) => `${w.theme_id}|${w.word}`)
  );

  // Insérer les mots manquants
  let inserted = 0;
  for (const word of data.words) {
    const key = `${word.theme_id}|${word.word}`;
    if (existingWordKeys.has(key)) continue;

    await database.runAsync(
      'INSERT INTO words (word, definition, theme_id, examples, level, synonyms, antonyms, nuance_with) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        word.word,
        word.definition,
        word.theme_id,
        JSON.stringify(word.examples),
        word.level,
        JSON.stringify(word.synonyms),
        JSON.stringify(word.antonyms),
        JSON.stringify(word.nuance_with ?? []),
      ]
    );
    inserted++;
  }

  // Mettre à jour nuance_with sur les mots déjà présents (champ ajouté après coup)
  for (const word of data.words) {
    if (word.nuance_with && word.nuance_with.length > 0) {
      await database.runAsync(
        'UPDATE words SET nuance_with = ? WHERE theme_id = ? AND word = ? AND (nuance_with IS NULL OR nuance_with = \'[]\')',
        [JSON.stringify(word.nuance_with), word.theme_id, word.word]
      );
    }
  }

  // Mettre à jour les compteurs word_count des thèmes
  await database.execAsync(`
    UPDATE themes
    SET word_count = (SELECT COUNT(*) FROM words WHERE words.theme_id = themes.id)
  `);

  if (inserted > 0) {
    console.log(`Vocabulary sync: ${inserted} new words imported`);
  }
};

/**
 * Récupère tous les thèmes
 */
export const getAllThemes = async (): Promise<Theme[]> => {
  try {
    const database = await getDatabase();
    const themes = await database.getAllAsync<Theme>('SELECT * FROM themes ORDER BY id');
    return themes;
  } catch (error) {
    console.error('Error fetching themes:', error);
    return [];
  }
};

/**
 * Récupère tous les mots d'un thème
 */
export const getWordsByTheme = async (themeId: number): Promise<Word[]> => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<any>('SELECT * FROM words WHERE theme_id = ?', [themeId]);

    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      definition: row.definition,
      theme_id: row.theme_id,
      examples: JSON.parse(row.examples),
      level: row.level,
      synonyms: JSON.parse(row.synonyms),
      antonyms: JSON.parse(row.antonyms),
      nuance_with: row.nuance_with ? JSON.parse(row.nuance_with) : [],
    }));
  } catch (error) {
    console.error('Error fetching words by theme:', error);
    return [];
  }
};

/**
 * Récupère tous les mots
 */
export const getAllWords = async (): Promise<Word[]> => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<any>('SELECT * FROM words');

    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      definition: row.definition,
      theme_id: row.theme_id,
      examples: JSON.parse(row.examples),
      level: row.level,
      synonyms: JSON.parse(row.synonyms),
      antonyms: JSON.parse(row.antonyms),
      nuance_with: row.nuance_with ? JSON.parse(row.nuance_with) : [],
    }));
  } catch (error) {
    console.error('Error fetching all words:', error);
    return [];
  }
};

/**
 * Récupère toute la progression utilisateur (une seule requête).
 * Indexée par word_id pour un accès en O(1).
 */
export const getAllProgress = async (): Promise<Map<number, UserProgress>> => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<UserProgress>('SELECT * FROM user_progress');
    return new Map(rows.map((row) => [row.word_id, row]));
  } catch (error) {
    console.error('Error fetching all progress:', error);
    return new Map();
  }
};

/**
 * Récupère la progression utilisateur pour un mot
 */
export const getUserProgress = async (wordId: number): Promise<UserProgress | null> => {
  try {
    const database = await getDatabase();
    const progress = await database.getFirstAsync<UserProgress>(
      'SELECT * FROM user_progress WHERE word_id = ?',
      [wordId]
    );
    return progress || null;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
};

/**
 * Initialise la progression pour un nouveau mot
 */
export const initializeWordProgress = async (wordId: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT OR IGNORE INTO user_progress
       (word_id, easiness_factor, interval, repetitions, next_review_date, last_reviewed_date, times_seen, times_correct)
       VALUES (?, 2.5, 1, 0, ?, ?, 0, 0)`,
      [wordId, now, now]
    );
  } catch (error) {
    console.error('Error initializing word progress:', error);
  }
};

/**
 * Met à jour la progression utilisateur
 */
export const updateUserProgress = async (
  progress: Omit<UserProgress, 'id'>
): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE user_progress
       SET easiness_factor = ?,
           interval = ?,
           repetitions = ?,
           next_review_date = ?,
           last_reviewed_date = ?,
           times_seen = ?,
           times_correct = ?
       WHERE word_id = ?`,
      [
        progress.easiness_factor,
        progress.interval,
        progress.repetitions,
        progress.next_review_date,
        progress.last_reviewed_date,
        progress.times_seen,
        progress.times_correct,
        progress.word_id,
      ]
    );
  } catch (error) {
    console.error('Error updating user progress:', error);
  }
};

/**
 * Récupère les mots à réviser aujourd'hui
 */
export const getWordsForReview = async (): Promise<Word[]> => {
  try {
    const database = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const rows = await database.getAllAsync<any>(
      `SELECT w.* FROM words w
       INNER JOIN user_progress up ON w.id = up.word_id
       WHERE date(up.next_review_date) <= date(?)
       ORDER BY up.next_review_date ASC`,
      [today]
    );

    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      definition: row.definition,
      theme_id: row.theme_id,
      examples: JSON.parse(row.examples),
      level: row.level,
      synonyms: JSON.parse(row.synonyms),
      antonyms: JSON.parse(row.antonyms),
      nuance_with: row.nuance_with ? JSON.parse(row.nuance_with) : [],
    }));
  } catch (error) {
    console.error('Error fetching words for review:', error);
    return [];
  }
};

/**
 * Ajoute un exercice à l'historique
 */
export const addExerciseToHistory = async (
  wordId: number,
  exerciseType: string,
  isCorrect: boolean
): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = new Date().toISOString();
    await database.runAsync(
      'INSERT INTO exercise_history (word_id, exercise_type, is_correct, timestamp) VALUES (?, ?, ?, ?)',
      [wordId, exerciseType, isCorrect ? 1 : 0, timestamp]
    );
  } catch (error) {
    console.error('Error adding exercise to history:', error);
  }
};

/**
 * Récupère les statistiques utilisateur
 */
export const getUserStats = async (): Promise<any | null> => {
  try {
    const database = await getDatabase();
    const stats = await database.getFirstAsync<any>('SELECT * FROM user_stats LIMIT 1');

    if (stats) {
      return {
        ...stats,
        achievements: JSON.parse(stats.achievements || '[]'),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
};

/**
 * Réinitialise toute la progression utilisateur (XP, streak, achievements,
 * progress des mots, historique). Préserve les thèmes/mots et la préférence
 * de thème UI.
 */
export const resetUserProgress = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    const stats = await getUserStats();
    const themePref = stats?.theme_preference ?? 'system';
    const dailyGoal = stats?.daily_goal ?? 5;

    await database.execAsync(`
      DELETE FROM user_progress;
      DELETE FROM exercise_history;
      DELETE FROM user_stats;
    `);

    await database.runAsync(
      `INSERT INTO user_stats
       (total_xp, level, current_streak, longest_streak, achievements, theme_preference, daily_goal)
       VALUES (0, 1, 0, 0, '[]', ?, ?)`,
      [themePref, dailyGoal]
    );
  } catch (error) {
    console.error('Error resetting user progress:', error);
    throw error;
  }
};

/**
 * Met à jour les statistiques utilisateur
 */
export const updateUserStats = async (stats: any): Promise<void> => {
  try {
    const database = await getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (stats.total_xp !== undefined) {
      updates.push('total_xp = ?');
      values.push(stats.total_xp);
    }
    if (stats.level !== undefined) {
      updates.push('level = ?');
      values.push(stats.level);
    }
    if (stats.current_streak !== undefined) {
      updates.push('current_streak = ?');
      values.push(stats.current_streak);
    }
    if (stats.longest_streak !== undefined) {
      updates.push('longest_streak = ?');
      values.push(stats.longest_streak);
    }
    if (stats.last_activity_date !== undefined) {
      updates.push('last_activity_date = ?');
      values.push(stats.last_activity_date);
    }
    if (stats.total_exercises_completed !== undefined) {
      updates.push('total_exercises_completed = ?');
      values.push(stats.total_exercises_completed);
    }
    if (stats.total_correct_answers !== undefined) {
      updates.push('total_correct_answers = ?');
      values.push(stats.total_correct_answers);
    }
    if (stats.perfect_exercises_count !== undefined) {
      updates.push('perfect_exercises_count = ?');
      values.push(stats.perfect_exercises_count);
    }
    if (stats.achievements !== undefined) {
      updates.push('achievements = ?');
      values.push(JSON.stringify(stats.achievements));
    }
    if (stats.daily_goal !== undefined) {
      updates.push('daily_goal = ?');
      values.push(stats.daily_goal);
    }
    if (stats.daily_progress_count !== undefined) {
      updates.push('daily_progress_count = ?');
      values.push(stats.daily_progress_count);
    }
    if (stats.daily_progress_date !== undefined) {
      updates.push('daily_progress_date = ?');
      values.push(stats.daily_progress_date);
    }
    if (stats.theme_preference !== undefined) {
      updates.push('theme_preference = ?');
      values.push(stats.theme_preference);
    }

    if (updates.length > 0) {
      const query = `UPDATE user_stats SET ${updates.join(', ')} WHERE id = 1`;
      await database.runAsync(query, values);
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

