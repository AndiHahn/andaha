import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadState, LoadStateComponent } from './load-state.component';

@Component({
  template: `<app-load-state [state]="state()" emptyText="Noch keine Arbeitszeiten erfasst." (retry)="retries = retries + 1">
    <p class="projected">Inhalt</p>
  </app-load-state>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LoadStateComponent]
})
class HostComponent {
  readonly state = signal<LoadState>('loading');
  retries = 0;
}

describe('LoadStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    element = fixture.nativeElement;
  });

  function show(state: LoadState): void {
    fixture.componentInstance.state.set(state);
    fixture.detectChanges();
  }

  it('renders error with retry and emits retry', () => {
    show('error');
    expect(element.textContent).toContain('Laden fehlgeschlagen');
    expect(element.textContent).toContain('Die Daten konnten nicht geladen werden.');
    expect(element.querySelector('.projected')).toBeNull();

    const button = element.querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Erneut versuchen');
    button.click();
    expect(fixture.componentInstance.retries).toBe(1);
  });

  it('renders empty text', () => {
    show('empty');
    expect(element.textContent).toContain('Noch keine Arbeitszeiten erfasst.');
    expect(element.querySelector('.projected')).toBeNull();
    expect(element.querySelector('button')).toBeNull();
  });

  it('projects content when ready', () => {
    show('loading');
    expect(element.querySelector('.projected')).toBeNull();
    expect(element.querySelector('mat-progress-bar')).not.toBeNull();

    show('ready');
    expect(element.querySelector('.projected')?.textContent).toBe('Inhalt');
    expect(element.querySelector('mat-progress-bar')).toBeNull();
    expect(element.textContent).not.toContain('Laden fehlgeschlagen');
  });
});
