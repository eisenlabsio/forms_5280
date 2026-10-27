import { clearStaleQuizData, CLEARED_AT_KEY, RETENTION_DAYS } from './storageRetention';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-27T10:00:00Z').getTime();

describe('clearStaleQuizData', () => {
    beforeEach(() => window.localStorage.clear());

    test('wipes quiz data and stamps time when no deletion time exists', () => {
        window.localStorage.setItem('quiz:remember:a', 'x');
        window.localStorage.setItem('quiz:completed:s1', 'true');
        window.localStorage.setItem('other', 'keep');
        clearStaleQuizData(NOW);
        expect(window.localStorage.getItem('quiz:remember:a')).toBeNull();
        expect(window.localStorage.getItem('quiz:completed:s1')).toBeNull();
        expect(window.localStorage.getItem('other')).toBe('keep');
        expect(window.localStorage.getItem(CLEARED_AT_KEY)).toBe(String(NOW));
    });

    test('keeps data younger than the retention period', () => {
        window.localStorage.setItem(CLEARED_AT_KEY, String(NOW - (RETENTION_DAYS - 1) * DAY));
        window.localStorage.setItem('quiz:remember:a', 'x');
        clearStaleQuizData(NOW);
        expect(window.localStorage.getItem('quiz:remember:a')).toBe('x');
    });

    test('wipes again after the retention period and restamps', () => {
        window.localStorage.setItem(CLEARED_AT_KEY, String(NOW - (RETENTION_DAYS + 1) * DAY));
        window.localStorage.setItem('quiz:remember:a', 'x');
        clearStaleQuizData(NOW);
        expect(window.localStorage.getItem('quiz:remember:a')).toBeNull();
        expect(window.localStorage.getItem(CLEARED_AT_KEY)).toBe(String(NOW));
    });

    test('treats an invalid timestamp as missing', () => {
        window.localStorage.setItem(CLEARED_AT_KEY, 'garbage');
        window.localStorage.setItem('quiz:remember:a', 'x');
        clearStaleQuizData(NOW);
        expect(window.localStorage.getItem('quiz:remember:a')).toBeNull();
    });
});
