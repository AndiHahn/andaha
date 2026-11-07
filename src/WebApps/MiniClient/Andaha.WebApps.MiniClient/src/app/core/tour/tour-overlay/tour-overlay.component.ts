import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  NgZone,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { TourService } from '../tour.service';
import { TourNote, tourSteps, TourTone } from '../tour-steps';
import { Rect, rectOf, resolveTarget } from '../tour-targets';
import { Arrow, NoteInput, placeNotes } from '../tour-placement';

/** Abstand der Aussparung um das Ziel */
const HOLE_PADDING = 8;
/** So lange nach einem Schrittwechsel wird pro Frame neu gemessen (Sheet-/Dialog-Animation) */
const SETTLE_MS = 600;
/** Länge der Pfeilspitze */
const HEAD = 9;
const HEAD_ANGLE = 0.45;
/** Platzierungs-ID der Knopfzeile (Zurück/Weiter), wird wie ein freier Hinweis platziert */
const CONTROLS = '__controls';
const STEP_COUNT = 3;
/** Eckenradius der Aussparungen und ihrer Umrandung */
const HOLE_RADIUS = 12;
/** Äußeres Rechteck des Schleiers, größer als jeder Bildschirm (das SVG schneidet ab) */
const VEIL_OUTER = 'M0 0H100000V100000H0Z';

interface Hole {
  id: string;
  rect: Rect;
  tone: TourTone;
}

interface ShownNote {
  note: TourNote;
  /** Aussparung um das Ziel; null für freie Hinweise */
  hole: Rect | null;
  /** null, solange der Hinweis noch nicht platziert ist (erster Durchgang: Größe messen) */
  box: Rect | null;
  arrow: { line: string; head: string } | null;
}

let nextId = 0;

/**
 * Darstellung der Schnellhilfe-Tour (Variante C): abgedunkelte App mit ausgesparten, farbig umrandeten
 * Zielen, Hinweise mit gezeichneten Pfeilen, oben Überspringen und „n / 3“, darunter Weiter/Zurück.
 * Liegt als Vollbild im CDK-Overlay über Sheet und Dialog und fängt alle Zeiger- und Tastaturereignisse ab.
 * Gemessen wird in zwei Durchgängen: Hinweise rendern, Größen lesen, `placeNotes`, dann anzeigen.
 */
@Component({
  selector: 'app-tour-overlay',
  templateUrl: './tour-overlay.component.html',
  styleUrls: ['./tour-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CdkTrapFocus],
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-labelledby]': 'titleId',
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:focusin)': 'onFocusIn($event)',
    '(window:resize)': 'onViewportChange()',
    '(window:orientationchange)': 'onViewportChange()',
  },
})
export class TourOverlayComponent {
  private readonly tour = inject(TourService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  /** Die Mess-Frames laufen außerhalb der Zone; `measure` aktualisiert die Ansicht selbst */
  private readonly zone = inject(NgZone);

  private readonly primaryButton = viewChild.required<ElementRef<HTMLButtonElement>>('primary');
  private readonly controlsBox = viewChild.required<ElementRef<HTMLElement>>('controls');
  private readonly topBar = viewChild.required<ElementRef<HTMLElement>>('topBar');

  private readonly instance = nextId++;
  readonly titleId = `tour-title-${this.instance}`;
  readonly stepCount = STEP_COUNT;

  readonly stepIndex = this.tour.stepIndex;
  readonly isLast = computed(() => this.stepIndex() === STEP_COUNT - 1);
  /** Der Titel hängt nicht von den Kacheln ab */
  readonly title = computed(() => tourSteps({ desktop: this.tour.desktop(), hasTiles: false })[this.stepIndex()].title);

  readonly holes = signal<Hole[]>([]);
  /** Schleier als ein Pfad mit Löchern (evenodd), ohne `mask="url(#…)"`, das WebKit mit `<base href>` falsch auflöst */
  readonly shadePath = computed(() => [VEIL_OUTER, ...this.holes().map(hole => roundedRect(hole.rect, HOLE_RADIUS))].join(' '));
  readonly notes = signal<ShownNote[]>([]);
  readonly controlsAt = signal<Rect | null>(null);

  private frame: number | null = null;
  /** Fokus auf den Hauptknopf steht nach einem Schrittwechsel noch aus */
  private focusDue = false;
  /** Am Ende der Mess-Frames prüfen, ob der Fokus noch in der Tour liegt */
  private checkFocus = false;

  constructor() {
    // Schrittwechsel: Fokus auf den Hauptknopf und ein paar Frames lang neu messen, bis Sheet/Dialog stehen
    effect(() => {
      this.stepIndex();
      untracked(() => this.settle(true));
    });
    inject(DestroyRef).onDestroy(() => this.cancelFrame());
  }

  onPrimary(): void {
    if (this.isLast()) {
      this.tour.end();
    } else {
      this.tour.next();
    }
  }

  back(): void {
    this.tour.back();
  }

  end(): void {
    this.tour.end();
  }

  onEscape(event: Event): void {
    event.preventDefault();
    this.tour.end();
  }

  /** Die Vorschau (Dialog/Sheet) holt sich beim Öffnen den Fokus; der gehört aber in die Tour */
  onFocusIn(event: FocusEvent): void {
    const target = event.target as Node | null;
    const overlayContainer = this.host.nativeElement.closest('.cdk-overlay-container');
    if (target && overlayContainer?.contains(target) && !this.host.nativeElement.contains(target)) {
      this.focusPrimary();
    }
  }

  /** Resize/Drehung: Seitenleiste animiert ~400 ms, also wie beim Schrittwechsel mehrere Frames messen, ohne Fokus zu bewegen */
  onViewportChange(): void {
    this.settle(false);
  }

  /** Misst pro Frame neu, bis `SETTLE_MS` um sind; `focus` nur bei Schrittwechsel. Ein Resize übernimmt offene Fokus-Pflichten. */
  private settle(focus: boolean): void {
    this.cancelFrame();
    if (focus) {
      this.focusDue = true;
      this.checkFocus = true;
    }
    let start: number | null = null;
    const tick = (time: number) => {
      this.measure();
      start ??= time;
      if (this.focusDue) {
        this.focusDue = false;
        this.focusPrimary();
      }
      if (time - start < SETTLE_MS) {
        this.frame = this.nextFrame(tick);
        return;
      }
      this.frame = null;
      // Fokus beim Öffnen von Sheet/Dialog verloren (z. B. auf body): zurück auf den Hauptknopf
      if (this.checkFocus) {
        this.checkFocus = false;
        if (!this.host.nativeElement.contains(this.document.activeElement)) {
          this.focusPrimary();
        }
      }
    };
    this.frame = this.nextFrame(tick);
  }

  private nextFrame(callback: FrameRequestCallback): number {
    return this.zone.runOutsideAngular(() => requestAnimationFrame(callback));
  }

  private cancelFrame(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  private focusPrimary(): void {
    this.primaryButton().nativeElement.focus();
  }

  private measure(): void {
    const root = this.document.documentElement;
    const viewport = { width: root.clientWidth, height: root.clientHeight };
    const hasTiles = this.document.querySelectorAll('[data-tour="tiles"] [role="radio"]').length > 0;
    const step = tourSteps({ desktop: this.tour.desktop(), hasTiles })[this.stepIndex()];

    const previous = new Map(this.notes().map(shown => [shown.note.id, shown]));
    const shown: ShownNote[] = [];
    for (const note of step.notes) {
      let hole: Rect | null = null;
      if (note.target !== null) {
        const element = resolveTarget(note.target, this.document, viewport);
        if (!element) {
          continue; // Ziel fehlt: nur dieser Hinweis entfällt
        }
        hole = pad(rectOf(element));
      }
      const before = previous.get(note.id);
      shown.push({ note, hole, box: before?.box ?? null, arrow: before?.arrow ?? null });
    }

    // Durchgang 1: Hinweise mit dem aktuellen Text rendern und ihre Größe lesen
    this.notes.set(shown);
    this.cdr.detectChanges();
    const noteElements = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.note'));
    const inputs: NoteInput[] = shown.map((s, i) => ({
      id: s.note.id,
      target: s.hole,
      freeAnchor: s.note.freeAnchor,
      size: sizeOf(noteElements[i]),
    }));
    inputs.push({ id: CONTROLS, target: null, freeAnchor: 'center', size: sizeOf(this.controlsBox().nativeElement) });

    // Ziele und die Leiste oben (Überspringen, n / 3) sind Hindernisse für die Hinweise
    const holes = shown.filter(s => s.hole !== null).map(s => ({ id: s.note.id, rect: s.hole!, tone: s.note.tone }));
    const topBar = Array.from(this.topBar().nativeElement.children).map(child => rectOf(child));
    const placements = new Map(placeNotes(inputs, [...holes.map(h => h.rect), ...topBar], viewport).map(p => [p.id, p]));

    // Durchgang 2: platzieren und anzeigen
    this.holes.set(holes);
    this.notes.set(shown.map(s => {
      const placement = placements.get(s.note.id)!;
      return { ...s, box: placement.box, arrow: placement.arrow ? drawArrow(placement.arrow) : null };
    }));
    this.controlsAt.set(placements.get(CONTROLS)!.box);
    this.cdr.detectChanges();
  }
}

function pad(r: Rect): Rect {
  return { x: r.x - HOLE_PADDING, y: r.y - HOLE_PADDING, width: r.width + 2 * HOLE_PADDING, height: r.height + 2 * HOLE_PADDING };
}

/** Abgerundetes Rechteck als geschlossener Teilpfad */
function roundedRect(r: Rect, radius: number): string {
  const n = (v: number) => Math.round(v * 10) / 10;
  const k = Math.max(0, Math.min(radius, r.width / 2, r.height / 2));
  const right = r.x + r.width;
  const bottom = r.y + r.height;
  return `M${n(r.x + k)} ${n(r.y)}H${n(right - k)}A${n(k)} ${n(k)} 0 0 1 ${n(right)} ${n(r.y + k)}`
    + `V${n(bottom - k)}A${n(k)} ${n(k)} 0 0 1 ${n(right - k)} ${n(bottom)}`
    + `H${n(r.x + k)}A${n(k)} ${n(k)} 0 0 1 ${n(r.x)} ${n(bottom - k)}`
    + `V${n(r.y + k)}A${n(k)} ${n(k)} 0 0 1 ${n(r.x + k)} ${n(r.y)}Z`;
}

function sizeOf(element: HTMLElement): { width: number; height: number } {
  const r = element.getBoundingClientRect();
  return { width: Math.ceil(r.width), height: Math.ceil(r.height) };
}

/** SVG-Pfade für die Kurve und eine kleine offene Spitze am Ziel */
function drawArrow(a: Arrow): { line: string; head: string } {
  const n = (v: number) => Math.round(v * 10) / 10;
  const p = (pt: { x: number; y: number }) => `${n(pt.x)} ${n(pt.y)}`;
  // Richtung am Ende der Kurve; fällt der Kontrollpunkt auf das Ende, die Gesamtrichtung
  const base = a.c2.x === a.to.x && a.c2.y === a.to.y ? a.from : a.c2;
  const angle = Math.atan2(a.to.y - base.y, a.to.x - base.x);
  const wing = (d: number) => ({ x: a.to.x - HEAD * Math.cos(angle + d), y: a.to.y - HEAD * Math.sin(angle + d) });
  return {
    line: `M ${p(a.from)} C ${p(a.c1)}, ${p(a.c2)}, ${p(a.to)}`,
    head: `M ${p(wing(HEAD_ANGLE))} L ${p(a.to)} L ${p(wing(-HEAD_ANGLE))}`,
  };
}
