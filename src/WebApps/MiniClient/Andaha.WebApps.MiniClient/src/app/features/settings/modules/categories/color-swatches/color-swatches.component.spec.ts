import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CATEGORY_COLORS } from '../functions/category-functions';
import { ColorSwatchesComponent } from './color-swatches.component';

@Component({
  imports: [ReactiveFormsModule, ColorSwatchesComponent],
  template: `<app-color-swatches [formControl]="control" />`
})
class HostComponent {
  control = new FormControl('', { nonNullable: true });
}

describe('ColorSwatchesComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const dots = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button.dot'));

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('palette has 18 distinct hex values', () => {
    expect(CATEGORY_COLORS.length).toBe(18);
    expect(new Set(CATEGORY_COLORS).size).toBe(18);
    expect(CATEGORY_COLORS.every(c => /^#[0-9a-f]{6}$/.test(c))).toBe(true);
  });

  it('swatches select hex value', () => {
    fixture.detectChanges();
    dots()[3].click();
    fixture.detectChanges();

    expect(host.control.value).toBe(CATEGORY_COLORS[3]);
    expect(dots()[3].getAttribute('aria-checked')).toBe('true');
    expect(dots().length).toBe(18);
  });

  it('legacy css name stays selected and is shown first', () => {
    host.control.setValue('lemonchiffon');
    fixture.detectChanges();

    expect(dots().length).toBe(19);
    expect(dots()[0].classList).toContain('old');
    expect(dots()[0].getAttribute('aria-checked')).toBe('true');
    expect(host.control.value).toBe('lemonchiffon');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Gestrichelt: bisherige Farbe „lemonchiffon“');

    dots()[2].click();
    fixture.detectChanges();
    expect(host.control.value).toBe(CATEGORY_COLORS[1]);
    expect(dots()[0].classList).toContain('old');
  });

  it('disabled control blocks selection', () => {
    host.control.disable();
    fixture.detectChanges();
    dots()[0].click();
    expect(host.control.value).toBe('');
  });
});
