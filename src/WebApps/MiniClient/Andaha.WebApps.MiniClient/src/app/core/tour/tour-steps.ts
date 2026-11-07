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
      text: desktop ? 'Die Funktionen je Bereichs, zum Wechseln klicken.' : 'Die Funktionen je Bereich.',
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
        : 'Dieses Menü ersetzt das alte ☰-Menü. Unter Mehr ... gibt es die weiteren Menüpunkte.'
    },
  ];

  const entry: TourNote[] = [
    {
      id: 'entry',
      target: 'entry',
      tone: 'neutral',
      label: 'Rechnung hinzufügen',
      text: 'Zuerst Betrag eintippen, dann entweder die weiteren Daten eingeben, oder direkt eine Vorlage wählen (Diese können im Menüpunkt Vorlagen verwaltet werden).',
    },
    {
      id: 'camera',
      target: 'camera',
      tone: 'neutral',
      label: 'Foto',
      text: 'Foto von der Rechnung machen. Dieses wird automatisch analysiert und dann im Tab Scans angezeigt.',
    },
    {
      id: 'bill-row',
      target: 'bill-row',
      tone: 'neutral',
      label: desktop ? 'Rechtsklick' : 'Langer Klick auf eine Rechnung',
      text: 'Dann kann eine Rechnung direkt dupliziert oder gelöscht werden.',
    },
  ];

  const pin = desktop ? 'Rechtsklick' : 'Lange drücken';
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
      text: 'Verwalten der Vorlagen unter Mehr → Vorlagen.',
    },
  ];

  return [
    { id: 'menus', title: 'Menüs', notes: menus, opensQuickEntry: false },
    { id: 'entry', title: 'Eintragen', notes: entry, opensQuickEntry: false },
    { id: 'templates', title: 'Vorlagen', notes: templates, opensQuickEntry: true },
  ];
}
