import { groupByMonth, monthKey, monthStart } from './month-groups';

describe('groupByMonth', () => {
  const dateOf = (item: { date: Date }) => item.date;

  it('returns no groups for an empty list', () => {
    expect(groupByMonth([], dateOf)).toEqual([]);
  });

  it('puts bills of one month into one group in input order', () => {
    const a = { date: new Date(2026, 10, 5) };
    const b = { date: new Date(2026, 10, 3) };
    const c = { date: new Date(2026, 10, 1) };

    expect(groupByMonth([a, b, c], dateOf)).toEqual([{ month: '2026-11', items: [a, b, c] }]);
  });

  it('splits at the turn of the year, newest first as given', () => {
    const january = { date: new Date(2027, 0, 2) };
    const december = { date: new Date(2026, 11, 31, 23, 59) };
    const november = { date: new Date(2026, 10, 30) };

    expect(groupByMonth([january, december, november], dateOf).map(group => group.month))
      .toEqual(['2027-01', '2026-12', '2026-11']);
  });

  it('counts a bill on the first of the month at 00:30 local time in that month', () => {
    const bill = { date: new Date(2026, 10, 1, 0, 30) };
    const previous = { date: new Date(2026, 9, 31, 23, 30) };

    const groups = groupByMonth([bill, previous], dateOf);

    expect(groups).toEqual([
      { month: '2026-11', items: [bill] },
      { month: '2026-10', items: [previous] }
    ]);
  });
});

describe('monthKey / monthStart', () => {
  it('formats yyyy-MM in local time and parses it back to the first day', () => {
    expect(monthKey(new Date(2026, 0, 9))).toBe('2026-01');
    expect(monthStart('2026-11')).toEqual(new Date(2026, 10, 1));
  });
});
