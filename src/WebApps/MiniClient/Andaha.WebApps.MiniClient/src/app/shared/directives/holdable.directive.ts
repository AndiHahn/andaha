import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { filter, interval, Observable, Subject, takeUntil, tap } from 'rxjs';

@Directive({
  selector: '[holdable]'
})
export class HoldableDirective {

  @Output() holdTime: EventEmitter<number> = new EventEmitter();

  state: Subject<string> = new Subject();

  cancel: Observable<string>;

  constructor() {
    this.cancel = this.state.pipe(
      filter(state => state === 'cancel'),
      tap(_ => {
        this.holdTime.emit(0);
      })
    );
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointerleave', ['$event'])
  onExit() {
    this.state.next('cancel');
  }

  @HostListener('pointerdown', ['$event'])
  onHold() {
    this.state.next('start');

    const n = 100;

    interval(n)
      .pipe(
        takeUntil(this.cancel),
        tap(nr => {
          this.holdTime.emit(nr * n)
        }))
      .subscribe();
  }
}
