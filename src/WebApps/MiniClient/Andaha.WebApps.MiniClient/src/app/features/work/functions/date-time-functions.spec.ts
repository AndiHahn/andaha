import { formatLocalTime, netWorkingTime, toLocalDateTime, validateWorkTime } from './date-time-functions';

// Die Tests prüfen lokale Bestandteile und gelten daher in jeder Zeitzone des Testlaufs.
describe('toLocalDateTime', () => {
    it('keeps the first of the month at 00:30 on that day and month', () => {
        const result = toLocalDateTime(new Date(2026, 10, 1), '00:30');

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(10);
        expect(result.getDate()).toBe(1);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(30);
    });

    it.each([[2026, 2, 29], [2026, 9, 25]])('keeps day and time on the daylight saving switch %i-%i-%i', (year, month, day) => {
        const result = toLocalDateTime(new Date(year, month, day), '07:00');

        expect(result.getFullYear()).toBe(year);
        expect(result.getMonth()).toBe(month);
        expect(result.getDate()).toBe(day);
        expect(result.getHours()).toBe(7);
        expect(result.getMinutes()).toBe(0);
    });

    it('keeps the last day of the month at 23:30', () => {
        const result = toLocalDateTime(new Date(2026, 9, 31), '23:30');

        expect(result.getMonth()).toBe(9);
        expect(result.getDate()).toBe(31);
        expect(result.getHours()).toBe(23);
        expect(result.getMinutes()).toBe(30);
    });

    it('keeps New Year\'s Eve in the same year', () => {
        const result = toLocalDateTime(new Date(2026, 11, 31), '23:30');

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(11);
        expect(result.getDate()).toBe(31);
    });

    it('ignores the time of the given day', () => {
        const result = toLocalDateTime(new Date(2026, 10, 5, 18, 45, 12), '07:15');

        expect(result.getDate()).toBe(5);
        expect(formatLocalTime(result)).toBe('07:15');
    });
});

describe('validateWorkTime', () => {
    const from = new Date(2026, 10, 5, 8, 0);

    it('rejects an end before the start', () => {
        expect(validateWorkTime(from, new Date(2026, 10, 5, 7, 0), 0)).toBe('until-not-after-from');
    });

    it('rejects an end equal to the start', () => {
        expect(validateWorkTime(from, new Date(2026, 10, 5, 8, 0), 0)).toBe('until-not-after-from');
    });

    it('rejects a break as long as or longer than the working time', () => {
        expect(validateWorkTime(from, new Date(2026, 10, 5, 9, 0), 60)).toBe('break-too-long');
        expect(validateWorkTime(from, new Date(2026, 10, 5, 9, 0), 90)).toBe('break-too-long');
    });

    it('accepts a valid entry', () => {
        expect(validateWorkTime(from, new Date(2026, 10, 5, 17, 0), 60)).toBeNull();
    });
});

describe('netWorkingTime', () => {
    const from = new Date(2026, 10, 5, 8, 0);

    it('returns end minus start minus break in minutes', () => {
        expect(netWorkingTime(from, new Date(2026, 10, 5, 17, 0), 60)).toBe(480);
    });

    it('is never negative', () => {
        expect(netWorkingTime(from, new Date(2026, 10, 5, 7, 0), 0)).toBeNull();
        expect(netWorkingTime(from, new Date(2026, 10, 5, 9, 0), 120)).toBeNull();
    });
});
