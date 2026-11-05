import { currentTimeZone } from './time-zone';

describe('currentTimeZone', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the IANA time zone of the device', () => {
    expect(currentTimeZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('falls back to Europe/Vienna when the browser reports none', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ timeZone: '' } as Intl.ResolvedDateTimeFormatOptions);

    expect(currentTimeZone()).toBe('Europe/Vienna');
  });
});
