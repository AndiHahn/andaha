// Register der Bereiche und Tabs (Design v2, 01-navigation). Hauptleiste, Sidebar, Tabs und die
// Wischgeste lesen nur hieraus.

export interface NavTab {
  label: string;
  path: string;
  /** Zähler am Tab, z. B. Anzahl offener Analysen */
  badge?: 'analysis';
}

export interface NavArea {
  id: 'bill' | 'budgetplan' | 'work' | 'more';
  label: string;
  /** Material-Symbols-Name */
  icon: string;
  /** Ziel beim Tipp auf den Bereich */
  path: string;
  /** URL-Präfixe (ganze Segmente), die zum Bereich gehören */
  matchPrefixes: string[];
  tabs: NavTab[];
}

export interface NavLink {
  label: string;
  icon: string;
  path: string;
  /** Zähler rechts neben dem Eintrag (Mehr-Seite), z. B. Anzahl der Vorlagen */
  counter?: 'templates';
  /** Startet die Schnell-Hilfe-Tour (zusätzlich zur Navigation) */
  startsTour?: boolean;
}

export const NAV_AREAS: readonly NavArea[] = [
  {
    id: 'bill',
    label: 'Rechnungen',
    icon: 'receipt_long',
    path: '/bill/list',
    matchPrefixes: ['/bill'],
    tabs: [
      { label: 'Liste', path: '/bill/list' },
      // Tab „Scans“ (Change Request 2026-11-06); die Route bleibt /bill/analysis (Share-Target, Deep Links, Verlauf)
      { label: 'Scans', path: '/bill/analysis', badge: 'analysis' },
      { label: 'Statistik', path: '/bill/expenses' }
    ]
  },
  {
    id: 'budgetplan',
    label: 'Haushalt',
    icon: 'account_balance_wallet',
    path: '/budgetplan/overview',
    matchPrefixes: ['/budgetplan'],
    tabs: [
      { label: 'Übersicht', path: '/budgetplan/overview' },
      { label: 'Fixkosten', path: '/budgetplan/fixedcost' },
      { label: 'Einkommen', path: '/budgetplan/income' }
    ]
  },
  {
    id: 'work',
    label: 'Stunden',
    icon: 'group',
    path: '/work/person',
    matchPrefixes: ['/work'],
    tabs: [
      { label: 'Personen', path: '/work/person' },
      { label: 'Statistik', path: '/work/statistics' }
    ]
  },
  {
    id: 'more',
    label: 'Mehr',
    icon: 'more_horiz',
    path: '/more',
    matchPrefixes: ['/more', '/settings', '/export', '/agb', '/data-protection', '/user-data'],
    tabs: []
  }
];

/** Einträge unter „Mehr“: Abschnitt „Einstellungen“ (Mehr-Seite) bzw. Gruppe „Mehr“ (Sidebar) */
export const MORE_SETTINGS: readonly NavLink[] = [
  { label: 'Kategorien', icon: 'category', path: '/settings/categories' },
  { label: 'Vorlagen', icon: 'article', path: '/settings/templates', counter: 'templates' },
  { label: 'Verbindungen', icon: 'link', path: '/settings/connections' }
];

/** Einträge unter „Mehr“: Abschnitt „Daten“ */
export const MORE_DATA: readonly NavLink[] = [
  { label: 'Export', icon: 'download', path: '/export' },
  { label: 'Schnell-Hilfe', icon: 'help', path: '/bill/list', startsTour: true }
];

export const LEGAL_LINKS: readonly Omit<NavLink, 'icon'>[] = [
  { label: 'AGB', path: '/agb' },
  { label: 'Datenschutzerklärung', path: '/data-protection' },
  { label: 'Benutzerdaten', path: '/user-data' }
];

export function navArea(id: NavArea['id']): NavArea {
  return NAV_AREAS.find(area => area.id === id)!;
}

function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}

function matches(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

export function findArea(url: string): NavArea | undefined {
  const path = pathOf(url);
  return NAV_AREAS.find(area => area.matchPrefixes.some(prefix => matches(path, prefix)));
}

/** Index des Tabs, zu dem die URL gehört (Tab-Seite oder deren Unterseite), −1 wenn keiner. */
export function findTabIndex(area: NavArea, url: string): number {
  const path = pathOf(url);
  return area.tabs.findIndex(tab => matches(path, tab.path));
}

/** true nur auf der Tab-Seite selbst; Detail- und Formularseiten zeigen keine Tabs (v2). */
export function isTabPage(area: NavArea, url: string): boolean {
  const path = pathOf(url);
  return area.tabs.some(tab => tab.path === path);
}
