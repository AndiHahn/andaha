import { findArea, findTabIndex, isTabPage, MORE_DATA, NAV_AREAS, navArea as area } from './nav-areas';

describe('nav-areas', () => {
  it('has the four areas in bar order', () => {
    expect(NAV_AREAS.map(a => a.label)).toEqual(['Rechnungen', 'Haushalt', 'Stunden', 'Mehr']);
  });

  it('MORE_DATA ends with Schnell-Hilfe (help, startsTour)', () => {
    expect(MORE_DATA[MORE_DATA.length - 1]).toEqual({ label: 'Schnell-Hilfe', icon: 'help', path: '/bill/list', startsTour: true });
  });

  it('describes the tabs per area', () => {
    expect(area('bill').tabs.map(t => t.path)).toEqual(['/bill/list', '/bill/analysis', '/bill/expenses']);
    expect(area('budgetplan').tabs.map(t => t.path)).toEqual(['/budgetplan/overview', '/budgetplan/fixedcost', '/budgetplan/income']);
    expect(area('work').tabs.map(t => t.path)).toEqual(['/work/person', '/work/statistics']);
    expect(area('more').tabs).toEqual([]);
    expect(area('bill').tabs[1].badge).toBe('analysis');
    // Tab „Scans“ (Change Request 2026-11-06); die Route /bill/analysis bleibt (Share-Target, Deep Links)
    expect(area('bill').tabs.map(t => t.label)).toEqual(['Liste', 'Scans', 'Statistik']);
  });

  describe('findArea', () => {
    it('finds the bill area for a bill detail page', () => {
      expect(findArea('/bill/123')?.id).toBe('bill');
    });

    it('finds the more area for settings pages', () => {
      expect(findArea('/settings/categories')?.id).toBe('more');
    });

    it('finds the budgetplan area for a nested form page', () => {
      expect(findArea('/budgetplan/fixedcost/create')?.id).toBe('budgetplan');
    });

    it('returns undefined for the old analysis url (redirected anyway)', () => {
      expect(findArea('/analyzed/list')).toBeUndefined();
    });

    it('matches whole segments only and ignores query and fragment', () => {
      expect(findArea('/billing')).toBeUndefined();
      expect(findArea('/work/person?x=1')?.id).toBe('work');
      expect(findArea('/more#top')?.id).toBe('more');
      expect(findArea('/agb')?.id).toBe('more');
    });
  });

  describe('findTabIndex', () => {
    it('maps an analysis detail page to the analysis tab', () => {
      expect(findTabIndex(area('bill'), '/bill/analysis/5')).toBe(1);
    });

    it('returns -1 for pages that belong to no tab', () => {
      expect(findTabIndex(area('bill'), '/bill/create')).toBe(-1);
      expect(findTabIndex(area('bill'), '/bill/123')).toBe(-1);
      expect(findTabIndex(area('more'), '/more')).toBe(-1);
    });

    it('maps tab pages and their sub pages', () => {
      expect(findTabIndex(area('bill'), '/bill/expenses')).toBe(2);
      expect(findTabIndex(area('budgetplan'), '/budgetplan/income?x=1')).toBe(2);
      expect(findTabIndex(area('budgetplan'), '/budgetplan/fixedcost/create')).toBe(1);
    });
  });

  describe('isTabPage', () => {
    it('is true only on the tab url itself (detail pages show no tabs)', () => {
      expect(isTabPage(area('bill'), '/bill/analysis')).toBe(true);
      expect(isTabPage(area('bill'), '/bill/analysis?page=2')).toBe(true);
      expect(isTabPage(area('bill'), '/bill/analysis/5')).toBe(false);
      expect(isTabPage(area('budgetplan'), '/budgetplan/fixedcost/create')).toBe(false);
      expect(isTabPage(area('more'), '/more')).toBe(false);
    });
  });
});
