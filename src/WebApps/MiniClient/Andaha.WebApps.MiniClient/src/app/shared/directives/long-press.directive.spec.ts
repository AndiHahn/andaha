import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LongPressDirective } from './long-press.directive';

@Component({
  template: `<button type="button" appLongPress (longPress)="presses = presses + 1" (click)="clicks = clicks + 1">Kachel</button>`,
  imports: [LongPressDirective]
})
class HostComponent {
  presses = 0;
  clicks = 0;
}

function pointer(type: string, x = 10, y = 10): PointerEvent {
  return new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true });
}

describe('LongPressDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let button: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits after holding 500 ms', () => {
    button.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(499);
    expect(fixture.componentInstance.presses).toBe(0);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.presses).toBe(1);
  });

  it('does not emit when released early', () => {
    button.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(300);
    button.dispatchEvent(pointer('pointerup'));
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.presses).toBe(0);
  });

  it('cancels when the finger moves more than 10 px', () => {
    button.dispatchEvent(pointer('pointerdown', 10, 10));
    button.dispatchEvent(pointer('pointermove', 18, 16));
    vi.advanceTimersByTime(200);
    button.dispatchEvent(pointer('pointermove', 22, 10));
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.presses).toBe(0);
  });

  it('keeps going for small movements up to 10 px', () => {
    button.dispatchEvent(pointer('pointerdown', 10, 10));
    button.dispatchEvent(pointer('pointermove', 16, 18));
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.presses).toBe(1);
  });

  it('swallows the click that ends a long press, but not a normal tap', () => {
    button.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(500);
    button.dispatchEvent(pointer('pointerup'));
    button.click();
    expect(fixture.componentInstance.clicks).toBe(0);

    button.dispatchEvent(pointer('pointerdown'));
    button.dispatchEvent(pointer('pointerup'));
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('emits on contextmenu (right click, menu key) and prevents the browser menu', () => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(fixture.componentInstance.presses).toBe(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('emits only once when the browser follows a touch long press with contextmenu', () => {
    button.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(500);
    button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.presses).toBe(1);
  });
});
