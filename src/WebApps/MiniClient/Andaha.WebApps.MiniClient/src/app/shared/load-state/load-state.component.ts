import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';

export type LoadState = 'loading' | 'error' | 'empty' | 'ready';

/**
 * Lade-, Fehler- und Leerzustand einer Liste oder Seite (AC34, Mockup 03 D).
 * Im Zustand `ready` zeigt er den projizierten Inhalt.
 *
 * `<app-load-state [state]="state()" emptyText="…" (retry)="reload()"> … </app-load-state>`
 */
@Component({
  selector: 'app-load-state',
  templateUrl: './load-state.component.html',
  styleUrls: ['./load-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon, MatProgressBar]
})
export class LoadStateComponent {
  readonly state = input.required<LoadState>();
  readonly emptyText = input<string>('');
  readonly retry = output<void>();
}
