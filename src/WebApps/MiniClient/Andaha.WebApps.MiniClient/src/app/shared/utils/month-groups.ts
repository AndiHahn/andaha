/** Monatsschlüssel `yyyy-MM` in lokaler Zeit (wie die Monatssummen des Backends, design.md §3.1) */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Erster Tag des Monats `yyyy-MM`, lokale Zeit (z. B. für die Anzeige „November 2026“) */
export function monthStart(month: string): Date {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1);
}

/**
 * Teilt eine Liste in Monatsgruppen. Gruppen und Einträge behalten die Reihenfolge der Eingabe;
 * eine Gruppe entsteht beim ersten Eintrag ihres Monats.
 */
export function groupByMonth<T>(items: T[], dateOf: (item: T) => Date): { month: string; items: T[] }[] {
  const groups: { month: string; items: T[] }[] = [];
  const byMonth = new Map<string, { month: string; items: T[] }>();

  for (const item of items) {
    const month = monthKey(dateOf(item));
    let group = byMonth.get(month);
    if (!group) {
      group = { month, items: [] };
      byMonth.set(month, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}
