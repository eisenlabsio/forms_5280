import logger from './logger';

export const CLEARED_AT_KEY = 'quiz:dataClearedAt';
export const RETENTION_DAYS = 100;
const QUIZ_PREFIX = 'quiz:';
const DAY_MS = 24 * 60 * 60 * 1000;

// Removes remembered answers/completion data when no deletion time is stored
// or the last deletion is older than RETENTION_DAYS, then records the time.
export function clearStaleQuizData(now = Date.now()) {
    try {
        const storage = window.localStorage;
        const clearedAt = Number(storage.getItem(CLEARED_AT_KEY));
        const valid = Number.isFinite(clearedAt) && clearedAt > 0;
        if (valid && now - clearedAt <= RETENTION_DAYS * DAY_MS) {
            return false;
        }
        const keys = [];
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (key && key.startsWith(QUIZ_PREFIX)) {
                keys.push(key);
            }
        }
        keys.forEach((key) => storage.removeItem(key));
        storage.setItem(CLEARED_AT_KEY, String(now));
        return true;
    } catch (error) {
        logger.warn('Failed to clear stale quiz data:', error.message);
        return false;
    }
}
