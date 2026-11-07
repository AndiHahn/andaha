import { notCreatedReasonTexts } from './not-created-reasons';

describe('notCreatedReasonTexts', () => {
  const expected: Record<string, [string, string]> = {
    AnalysisFailed: ['Analyse fehlgeschlagen', 'Das Foto konnte nicht ausgewertet werden. Bitte die Daten selbst eintragen.'],
    ShopMissing: ['Shop fehlt', 'Der Shop wurde nicht erkannt.'],
    DateMissing: ['Datum fehlt', 'Das Datum wurde nicht erkannt.'],
    AmountMissing: ['Betrag fehlt', 'Der Betrag wurde nicht erkannt.'],
    LowConfidence: ['Analyse unsicher', 'Die Analyse ist sich insgesamt zu unsicher.'],
    AmountUncertain: ['Betrag unsicher', 'Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag.'],
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
