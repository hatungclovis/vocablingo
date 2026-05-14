/**
 * Logger centralisé pour Vocablingo.
 *
 * En développement : log dans la console.
 * En production : possibilité de brancher un service externe (Sentry, etc.)
 * en remplaçant `sink`.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

interface Sink {
  log: (level: Level, scope: string, message: string, meta?: unknown) => void;
}

const consoleSink: Sink = {
  log(level, scope, message, meta) {
    const prefix = `[${scope}]`;
    const fn =
      level === 'error' ? console.error
        : level === 'warn' ? console.warn
        : level === 'debug' ? console.debug
        : console.log;
    if (meta !== undefined) {
      fn(prefix, message, meta);
    } else {
      fn(prefix, message);
    }
  },
};

let sink: Sink = consoleSink;

export const setSink = (custom: Sink) => {
  sink = custom;
};

export interface Logger {
  debug: (msg: string, meta?: unknown) => void;
  info: (msg: string, meta?: unknown) => void;
  warn: (msg: string, meta?: unknown) => void;
  error: (msg: string, error?: unknown) => void;
}

export const createLogger = (scope: string): Logger => ({
  debug: (msg, meta) => sink.log('debug', scope, msg, meta),
  info: (msg, meta) => sink.log('info', scope, msg, meta),
  warn: (msg, meta) => sink.log('warn', scope, msg, meta),
  error: (msg, error) => sink.log('error', scope, msg, error),
});
