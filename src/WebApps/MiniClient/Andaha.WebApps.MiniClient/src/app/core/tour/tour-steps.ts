export type TourTargetId = 'tabs' | 'main-nav' | 'entry' | 'camera' | 'bill-row' | 'tiles' | 'tiles-other';
export type TourTone = 'main' | 'sub' | 'neutral';
export type FreeAnchor = 'center' | 'top';

export interface TourNote {
  id: string;
  /** null = free note without a highlighted element */
  target: TourTargetId | null;
  /** only for target === null */
  freeAnchor?: FreeAnchor;
  /** colour of outline and label */
  tone: TourTone;
  /** bold line, e.g. 'Hauptmenü' */
  label?: string;
  text: string;
  /** the ←→ double arrow of the swipe hint */
  swipeArrows?: boolean;
}

export type TourStepId = 'menus' | 'entry' | 'templates';

export interface TourStep {
  id: TourStepId;
  title: string;
  notes: TourNote[];
  opensQuickEntry: boolean;
}

export function tourSteps(options: { desktop: boolean; hasTiles: boolean }): TourStep[] {
  const { desktop, hasTiles } = options;

  const menus: TourNote[] = [
    {
      id: 'tabs',
      target: 'tabs',
      tone: 'sub',
      label: 'Untermenü',
      text: desktop ? 'Die Tabs eines Bereichs, zum Wechseln klicken.' : 'Die Tabs eines Bereichs.',
    },
    ...(desktop
      ? []
      : [
          {
            id: 'swipe',
            target: null,
            freeAnchor: 'center',
            tone: 'neutral',
            text: 'Wisch nach links oder rechts, um den Tab zu wechseln.',
            swipeArrows: true,
          } satisfies TourNote,
        ]),
    {
      id: 'main-nav',
      target: 'main-nav',
      tone: 'main',
      label: 'Hauptmenü',
      text: desktop
        ? 'Rechnungen, Haushalt, Stunden. Kategorien, Vorlagen und Export liegen unter Mehr.'
        : 'Ersetzt das ☰-Menü. Kategorien, Vorlagen und Export liegen unter Mehr.',
    },
  ];

  const entry: TourNote[] = [
    {
      id: 'entry',
      target: 'entry',
      tone: 'neutral',
      label: 'Rechnung eintragen',
      text: 'Betrag tippen, Vorlage wählen, fertig.',
    },
    {
      id: 'camera',
      target: 'camera',
      tone: 'neutral',
      label: 'Foto',
      text: 'Wird automatisch angelegt. Unklares landet unter Scans.',
    },
    {
      id: 'bill-row',
      target: 'bill-row',
      tone: 'neutral',
      label: desktop ? 'Rechtsklick' : 'Lang drücken',
      text: 'Duplizieren oder Löschen.',
    },
  ];

  const pin = desktop ? 'Rechtsklick' : 'Lang drücken';
  const templates: TourNote[] = [
    {
      id: 'tiles',
      target: 'tiles',
      tone: 'neutral',
      label: 'Vorlagen',
      text: hasTiles
        ? `Deine häufigen Einkäufe als Kachel. ${pin} auf einen Vorschlag heftet ihn an.`
        : 'Hier erscheinen deine häufigen Einkäufe als Kachel.',
    },
    {
      id: 'tiles-other',
      target: 'tiles-other',
      tone: 'neutral',
      label: 'Neuer Shop?',
      text: 'Über Andere … mit „Als Vorlage merken“.',
    },
    {
      id: 'manage',
      target: null,
      freeAnchor: 'top',
      tone: 'neutral',
      text: 'Verwalten unter Mehr → Vorlagen.',
    },
  ];

  return [
    { id: 'menus', title: 'Menüs', notes: menus, opensQuickEntry: false },
    { id: 'entry', title: 'Eintragen', notes: entry, opensQuickEntry: false },
    { id: 'templates', title: 'Vorlagen', notes: templates, opensQuickEntry: true },
  ];
}
