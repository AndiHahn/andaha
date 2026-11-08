import { notCreatedReasonTexts } from './not-created-reasons';

describe('notCreatedReasonTexts', () => {
  const expected: Record<string, [string, string]> = {
    AnalysisFailed: ['Analyse fehlgeschlagen', 'Das Foto konnte nicht ausgewertet werden. Bitte die Daten selbst eintragen.'],
    ShopMissing: ['Shop fehlt', 'Der Shop wurde nicht erkannt.'],
    ShopUncertain: ['Shop unsicher', 'Der Shop wurde nicht sicher erkannt.'],
    DateMissing: ['Datum fehlt', 'Das Datum wurde nicht erkannt.'],
    DateUncertain: ['Datum unsicher', 'Das Datum wurde nicht sicher erkannt.'],
    DateInFuture: ['Datum in der Zukunft', 'Das erkannte Datum liegt in der Zukunft.'],
    AmountMissing: ['Betrag fehlt', 'Der Betrag wurde nicht erkannt.'],
    AmountIncomplete: ['Betrag unvollständig', 'Beim Betrag fehlen die Cent-Stellen oder sind nicht lesbar.'],
    LowConfidence: ['Analyse unsicher', 'Die Analyse ist sich insgesamt zu unsicher.'],
    AmountUncertain: ['Betrag unsicher', 'Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag (Toleranz 0,10 €).'],
    CategoryUnclear: ['Kategorie unklar', 'Es wurde keine passende Kategorie gefunden.']
  };

  for (const [code, [short, sentence]] of Object.entries(expected)) {
    it(`maps ${code}`, () => {
      expect(notCreatedReasonTexts([code])).toEqual([{ short, sentence }]);
    });
  }

  it('keeps input order', () => {
    expect(notCreatedReasonTexts(['DateMissing', 'CategoryUnclear']).map(t => t.short))
      .toEqual(['Datum fehlt', 'Kategorie unklar']);
  });

  it('ignores unknown codes', () => {
    expect(notCreatedReasonTexts(['Foo', 'ShopMissing']).map(t => t.short)).toEqual(['Shop fehlt']);
  });

  it('returns empty for undefined, null and empty', () => {
    expect(notCreatedReasonTexts(undefined)).toEqual([]);
    expect(notCreatedReasonTexts(null)).toEqual([]);
    expect(notCreatedReasonTexts([])).toEqual([]);
  });
});
