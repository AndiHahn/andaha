export interface NotCreatedReasonText {
  short: string;
  sentence: string;
}

const REASON_TEXTS: Record<string, NotCreatedReasonText> = {
  AnalysisFailed: { short: 'Analyse fehlgeschlagen', sentence: 'Das Foto konnte nicht ausgewertet werden. Bitte die Daten selbst eintragen.' },
  ShopMissing: { short: 'Shop fehlt', sentence: 'Der Shop wurde nicht erkannt.' },
  ShopUncertain: { short: 'Shop unsicher', sentence: 'Der Shop wurde nicht sicher erkannt.' },
  DateMissing: { short: 'Datum fehlt', sentence: 'Das Datum wurde nicht erkannt.' },
  DateUncertain: { short: 'Datum unsicher', sentence: 'Das Datum wurde nicht sicher erkannt.' },
  DateInFuture: { short: 'Datum in der Zukunft', sentence: 'Das erkannte Datum liegt in der Zukunft.' },
  AmountMissing: { short: 'Betrag fehlt', sentence: 'Der Betrag wurde nicht erkannt.' },
  AmountIncomplete: { short: 'Betrag unvollständig', sentence: 'Beim Betrag fehlen die Cent-Stellen oder sind nicht lesbar.' },
  LowConfidence: { short: 'Analyse unsicher', sentence: 'Die Analyse ist sich insgesamt zu unsicher.' },
  AmountUncertain: { short: 'Betrag unsicher', sentence: 'Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag (Toleranz 0,10 €).' },
  CategoryUnclear: { short: 'Kategorie unklar', sentence: 'Es wurde keine passende Kategorie gefunden.' }
};

/** Übersetzt Begründungs-Codes des Backends in deutsche Texte; unbekannte Codes entfallen, die Reihenfolge bleibt. */
export function notCreatedReasonTexts(codes?: string[] | null): NotCreatedReasonText[] {
  return (codes ?? [])
    .filter(code => Object.hasOwn(REASON_TEXTS, code))
    .map(code => REASON_TEXTS[code]);
}
