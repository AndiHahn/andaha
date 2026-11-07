# US-0010 Schnell-Hilfe-Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-time, 3-screen guided tour with arrows pointing at the real MiniClient UI (menus, entering a bill, templates). It can be restarted via „Mehr → Schnell-Hilfe“.

**Architecture:** Everything lives in a new folder `src/app/core/tour/` and consists of four parts:
- Pure logic: steps and copy, target lookup, note placement.
- A root `TourService`: state, auto-start conditions, storage, back handling.
- A full-screen `TourOverlayComponent`, rendered through the CDK Overlay above every sheet and dialog.

Existing code changes in three places:
- It gets `data-tour` hooks.
- `OverlayBackService` gets an open-overlay counter.
- The quick entry gets a side-effect-free preview mode.

The backend does not change.

**Tech Stack:** Angular 22 (standalone, signals, `ChangeDetectionStrategy.Eager` as everywhere in this app), Angular CDK Overlay/A11y/Layout, Vitest via `ng test` (browser: chromium).

**Spec:** `docs/stories/US-0010-schnellhilfe-tour/design.md` and `story.md` (AC1–AC13). Read both before any task.

App root for all paths below: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/` (abbreviated `MC/`).

## Global Constraints

- Frontend only. No changes under `src/Services/`.
- The storage key is exactly `andaha.tour.v1.seen` with the value `"1"`, in `localStorage`, per device. It is set **when the tour is shown**, not when it ends.
- If `localStorage` throws, the tour never auto-starts. A manual start via „Schnell-Hilfe“ still works.
- Desktop breakpoint: `(min-width: 1024px)`, the same as `AppComponent` and `QuickEntryService`.
- Auto-start delay: 400 ms after all conditions hold. Abort if any condition breaks during the delay.
- Colours:
  - Hauptmenü outline `#B8692F`, label `#F6C9A0`.
  - Untermenü outline `#2E4FA8`, label `#B9C8EE`.
  - Neutral targets outline `#FFFDF8`.
  - Veil `rgba(30, 25, 19, 0.62)`.
  - Primary button: pill, background `#FFFDF8`, text `#2E4FA8`.
- Touch targets ≥ 44 px. Fade-in ≤ 200 ms, none under `prefers-reduced-motion: reduce`.
- Copy is fixed by design.md §3. The implementer may shorten it but not extend it. The copy lives only in `tour-steps.ts`.
- `data-tour` ids are exactly `tabs`, `main-nav`, `entry`, `camera`, `bill-row`, `tiles`, `tiles-other`.
- Component conventions: standalone, `changeDetection: ChangeDetectionStrategy.Eager`, `inject()`, German UI copy, English test names.
- Commits use the form `feat(miniclient): … (US-0010)` and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Gate for every task:** run from `MC/`:
  - `npx ng test --watch=false --include='<spec paths of the task>'` is green.
  - At the end, `npm test` (the full suite) and `npm run build` are green, with no new build warnings.

## Review Focus

1. **The quick entry is already open or a draft exists when the tour reaches screen 3.** Expected: the existing draft is byte-for-byte unchanged afterwards, and the tour does not open a second sheet. Pinned in Task 2 (preview never loads or saves a draft) and Task 4 (`open` returns `null`, screen 3 shows without the sheet).
2. **The Back gesture on screen 3, while the preview sheet is on top of the overlay stack.** Expected: one Back ends the whole tour, and the app does not navigate away. Pinned in Task 4 (preview `closed$` emitted externally → `end()`).
3. **Opening via the app shortcut `?quick=1`, then saving.** Expected: the tour starts about 400 ms after the sheet closes, not on top of it. Pinned in Task 4 (openCount > 0 blocks, 0 starts after 400 ms) and Task 6 (list readiness only after the intent is handled).
4. **Rotating or resizing while the tour is shown, or desktop ↔ mobile width.** Expected: notes re-place, and the desktop or mobile copy switches. Pinned in Task 5 (resize re-renders with the new layout and the new placement).
5. **An empty bill list or no tiles (brand-new user).** Expected: the bill-row note is dropped and the tiles note uses the "ohne Kacheln" copy. Pinned in Task 3 (`tourSteps` with `hasTiles: false`; `resolveTarget` returns null) and Task 5.

---

## File Structure

| File | Responsibility |
|---|---|
| `MC/src/app/core/overlay/overlay-back.service.ts` (modify) | New public `openCount` signal |
| `MC/src/app/features/bill/quick-entry/quick-entry.service.ts` (modify) | `open(options)` returns a `QuickEntryHandle`, preview option |
| `MC/src/app/features/bill/quick-entry/quick-entry-sheet/quick-entry-sheet.component.ts/.html/.scss` (modify) | Preview mode: no draft load or save, inert, `data-tour` hooks |
| `MC/src/app/features/bill/quick-entry/quick-tiles/quick-tiles.component.html` (modify) | `data-tour="tiles"` and `data-tour="tiles-other"` |
| `MC/src/app/core/tour/tour-steps.ts` (create) | Steps, notes and copy for mobile and desktop |
| `MC/src/app/core/tour/tour-targets.ts` (create) | `resolveTarget()`: first visible `[data-tour=id]` |
| `MC/src/app/core/tour/tour-placement.ts` (create) | `placeNotes()`: pure placement and arrow geometry |
| `MC/src/app/core/tour/tour-seen-store.ts` (create) | Read and write `andaha.tour.v1.seen`, safely |
| `MC/src/app/core/tour/tour.service.ts` (create) | State, auto-start, manual start, step 3 preview, back, end |
| `MC/src/app/core/tour/tour-overlay/tour-overlay.component.ts/.html/.scss` (create) | Mask, highlights, notes, arrows, controls, a11y |
| `MC/src/app/core/navigation/bottom-bar/bottom-bar.component.html`, `area-tabs/area-tabs.component.html`, `MC/src/app/app.component.html` (modify) | `data-tour` hooks for `main-nav` and `tabs`, Schnell-Hilfe link in the sidebar |
| `MC/src/app/features/bill/quick-entry/quick-entry-dock/quick-entry-dock.component.html`, `MC/src/app/features/bill/modules/bill-list/bill-list.component.html/.ts` (modify) | Hooks `entry`, `camera`, `bill-row`. List readiness to `TourService` |
| `MC/src/app/core/navigation/nav-areas.ts`, `more-page/more-page.component.html/.ts` (modify) | „Schnell-Hilfe“ link |

---

### Task 1: Open-overlay counter on `OverlayBackService`

**Files:**
- Modify: `MC/src/app/core/overlay/overlay-back.service.ts` (`register`, around line 104)
- Test: `MC/src/app/core/overlay/overlay-back.service.spec.ts` (extend the existing spec)

**Interfaces:**
- Produces: `OverlayBackService.openCount: Signal<number>`. This is the number of registered overlays that have not been released yet. It is incremented **synchronously** inside `register()`, not inside `whenIdle`, so a sheet opened right now already counts. The release function decrements it exactly once, even when called several times.

- [ ] **Step 1: Write the failing tests** in the existing spec:
  - `openCount increments synchronously on register`: `register(() => {})`, then immediately `expect(service.openCount()).toBe(1)`.
  - `openCount decrements once per release, even if release is called twice`: register two, release the first twice, expect `1`.
  - `openCount drops when Back closes an overlay`: this follows the existing Back test pattern in the spec. It registers with a close callback that calls the release, triggers Back, and expects `0`.
- [ ] **Step 2: Run** `npx ng test --watch=false --include='src/app/core/overlay/overlay-back.service.spec.ts'`. Expected: the 3 new tests FAIL (`openCount` is not a function).
- [ ] **Step 3: Implement.** Add a private `signal(0)` and expose it read-only as `openCount`. `register` does `update(n => n + 1)`. The returned release function does `update(n => n - 1)` inside the existing `if (entry.released) return;` guard.
- [ ] **Step 4: Run the same command.** Expected: PASS, the existing tests are still green.
- [ ] **Step 5: Commit** with `feat(miniclient): count open overlays in OverlayBackService (US-0010)`.

---

### Task 2: Quick entry preview mode and handle *(touches UI)*

**Files:**
- Modify: `MC/src/app/features/bill/quick-entry/quick-entry.service.ts`
- Modify: `MC/src/app/features/bill/quick-entry/quick-entry-sheet/quick-entry-sheet.component.ts` (constructor around lines 152–201, host binding at line 60), `.scss`
- Modify: `MC/src/app/features/bill/quick-entry/quick-tiles/quick-tiles.component.html`
- Test: `MC/src/app/features/bill/quick-entry/quick-entry.service.spec.ts`, `MC/src/app/features/bill/quick-entry/quick-entry-sheet/quick-entry-sheet.component.spec.ts`

**Interfaces:**
- Produces, exported from `quick-entry.service.ts`:
  ```ts
  export interface QuickEntryOptions { preview?: boolean }
  export interface QuickEntryHandle {
    /** Closes the sheet/dialog (no-op when already closed) */
    close(): void;
    /** Emits once and completes when the sheet/dialog has closed, for any reason */
    readonly closed$: Observable<void>;
  }
  // QuickEntryService
  open(options?: QuickEntryOptions): QuickEntryHandle | null; // null = one is already open
  ```
- Produces: the data token for the sheet. Pass `{ preview: true }` as `data` to `SheetService.open` / `MatDialog.open`. The sheet reads it from `MAT_BOTTOM_SHEET_DATA` or `MAT_DIALOG_DATA`, both injected as optional.
- Existing callers of `open()` (bill-list, dock) ignore the return value and stay unchanged.

**Preview behaviour (design.md §3, AC4):**
- The sheet does not call `draftService.load()`.
- The persist `effect` and the `DestroyRef.onDestroy` persist do not run. Gate both on `!this.preview`.
- The host gets the class `preview` (`host: { '[class.preview]': 'preview' }`), and SCSS sets `:host(.preview) { pointer-events: none; }`. Nothing inside can be pressed or typed into.
- The desktop dialog opens with `autoFocus: false`. The sheet must not focus the amount field.

- [ ] **Step 1: Write the failing tests**
  - `quick-entry.service.spec.ts`:
    - `open returns a handle whose close() dismisses the sheet`.
    - `open returns null while one is open`.
    - `closed$ emits once when the sheet is dismissed externally`.
    - `preview passes { preview: true } as data and disables autoFocus on desktop`: assert on the spied `SheetService.open` and `MatDialog.open` config.
  - `quick-entry-sheet.component.spec.ts`. Create with `MAT_BOTTOM_SHEET_DATA = { preview: true }`, then:
    - `preview does not load a draft`: put a draft into the `QuickEntryDraftService` spy or into `localStorage`, and expect no restore banner and `load` not called.
    - `preview leaves an existing draft untouched on destroy`: seed `localStorage` with a draft JSON, create and destroy the component, expect `localStorage.getItem(key)` to equal the seeded string **exactly**.
    - `preview does not write a draft when none existed`: create, destroy, expect the key to be absent.
    - `preview sets the preview host class`.
- [ ] **Step 2: Run** `npx ng test --watch=false --include='src/app/features/bill/quick-entry/**/*.spec.ts'`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** as described above. `closed$` maps `afterDismissed()` or `afterClosed()` to `void`, with `take(1)`.
- [ ] **Step 4: Add the hooks in `quick-tiles.component.html`:** `data-tour="tiles"` on the outer `.tiles` div (it exists even with 0 tiles), `data-tour="tiles-other"` on the „Andere …“ button.
- [ ] **Step 5: Run** the same command. Expected: PASS, including all existing quick-entry specs.
- [ ] **Step 6: Commit** with `feat(miniclient): side-effect-free preview mode for the quick entry (US-0010)`.

---

### Task 3: Tour steps, target lookup and note placement (pure logic)

**Files:**
- Create: `MC/src/app/core/tour/tour-steps.ts`, `MC/src/app/core/tour/tour-targets.ts`, `MC/src/app/core/tour/tour-placement.ts`
- Test: `MC/src/app/core/tour/tour-steps.spec.ts`, `tour-targets.spec.ts`, `tour-placement.spec.ts`

**Interfaces (produced):**
```ts
// tour-steps.ts
export type TourTargetId = 'tabs' | 'main-nav' | 'entry' | 'camera' | 'bill-row' | 'tiles' | 'tiles-other';
export type TourTone = 'main' | 'sub' | 'neutral';
export type FreeAnchor = 'center' | 'top';
export interface TourNote {
  id: string;
  target: TourTargetId | null;   // null = free note without a highlighted element
  freeAnchor?: FreeAnchor;       // only for target === null
  tone: TourTone;                // colour of outline and label
  label?: string;                // bold line, e.g. 'Hauptmenü'
  text: string;
  swipeArrows?: boolean;         // the ←→ double arrow of the swipe hint
}
export type TourStepId = 'menus' | 'entry' | 'templates';
export interface TourStep { id: TourStepId; title: string; notes: TourNote[]; opensQuickEntry: boolean }
export function tourSteps(options: { desktop: boolean; hasTiles: boolean }): TourStep[];

// tour-targets.ts
export interface Rect { x: number; y: number; width: number; height: number }
/** First element with [data-tour=id] that has width and height > 0, is not visibility:hidden and intersects the viewport */
export function resolveTarget(id: TourTargetId, root: ParentNode, viewport: { width: number; height: number }): Element | null;
export function rectOf(element: Element): Rect;

// tour-placement.ts
export interface NoteInput { id: string; target: Rect | null; freeAnchor?: FreeAnchor; size: { width: number; height: number } }
export interface Point { x: number; y: number }
export interface Arrow { from: Point; to: Point; c1: Point; c2: Point }   // cubic Bézier
export interface NotePlacement { id: string; box: Rect; arrow: Arrow | null } // arrow null for free notes
export function placeNotes(notes: NoteInput[], targets: Rect[], viewport: { width: number; height: number }, gap?: number /* default 12 */): NotePlacement[];
```

**Copy:** Take the texts verbatim from design.md §3, together with the step titles `Menüs`, `Eintragen`, `Vorlagen`. Specifics:
- Swipe hint: mobile only (`target: null`, `freeAnchor: 'center'`, `swipeArrows: true`).
- Desktop Untermenü: „Die Tabs eines Bereichs, zum Wechseln klicken.“
- `bill-row`: label „Lang drücken“ on mobile, „Rechtsklick“ on desktop.
- Tiles text depends on `hasTiles`, and on desktop it uses the Rechtsklick wording.
- „Verwalten unter *Mehr → Vorlagen*.“: free note with `freeAnchor: 'top'`.
- `opensQuickEntry` is true only for `templates`.

**Placement algorithm (not fixed by the tests):**
- For each note with a target, try the candidate sides in this order: below, above, right, left. Order them by free space next to the target and choose the first box that lies fully inside the viewport (16 px margin) and overlaps neither a target nor an already-placed note.
- If no candidate fits, take the best one clamped into the viewport.
- Free notes: `center` means centred in the viewport, shifted vertically until there are no overlaps. `top` means 56 px from the top, centred horizontally.
- Arrow: `from` is the middle of the note's edge that faces the target, `to` is the nearest point on the target's edge, minus 4 px. The control points are offset perpendicular by about 30 % of the distance, which gives the hand-drawn curve.

- [ ] **Step 1: Write the failing tests**
  - `tour-steps.spec.ts`:
    - `returns menus, entry, templates in this order`.
    - `mobile menus step has the swipe hint, desktop has not`.
    - `desktop Untermenü text mentions klicken`.
    - `bill-row label is "Lang drücken" on mobile and "Rechtsklick" on desktop`.
    - `tabs note has tone sub and label Untermenü, main-nav note has tone main and label Hauptmenü`.
    - `templates text without tiles uses the "Hier erscheinen" copy`.
    - `only templates opens the quick entry`.
  - `tour-targets.spec.ts`: build DOM fixtures in `document.body`:
    - `returns the first visible match and skips zero-size ones`.
    - `skips visibility:hidden`.
    - `skips elements outside the viewport`.
    - `returns null when none matches`.
  - `tour-placement.spec.ts`:
    - `places a note below a target at the top`.
    - `places a note above a target at the bottom (bottom bar 390×844)`.
    - `no note overlaps any target or another note`: use the mobile fixture with targets tabs (0,44,390,48), bottom bar (0,780,390,64), dock (10,712,330,44) and camera (346,712,44,44), plus three notes of 240×60. Assert pairwise non-intersection and that everything lies inside 390×844.
    - `free center note avoids targets`.
    - `arrow ends on the target edge`.
    - `free notes have no arrow`.
- [ ] **Step 2: Run** `npx ng test --watch=false --include='src/app/core/tour/*.spec.ts'`. Expected: FAIL, the modules are missing.
- [ ] **Step 3: Implement** the three files.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(miniclient): tour steps, target lookup and note placement (US-0010)`.

---

### Task 4: `TourSeenStore` and `TourService`

**Files:**
- Create: `MC/src/app/core/tour/tour-seen-store.ts`, `MC/src/app/core/tour/tour.service.ts`
- Test: `MC/src/app/core/tour/tour-seen-store.spec.ts`, `MC/src/app/core/tour/tour.service.spec.ts`

**Interfaces:**
- Consumes:
  - `OverlayBackService.openCount` and `register()` (Task 1).
  - `QuickEntryService.open({ preview: true }): QuickEntryHandle | null` (Task 2).
  - `TourStep` (Task 3).
  - `TourOverlayComponent` (Task 5). Until then, depend on it only through `TOUR_OVERLAY_COMPONENT`, an `InjectionToken<ComponentType<unknown>>`, so this task tests without the UI. Task 5 provides the real one with `providedIn: 'root'` and a factory.
- Produces:
  ```ts
  // tour-seen-store.ts
  export const TOUR_SEEN_KEY = 'andaha.tour.v1.seen';
  export class TourSeenStore {
    constructor(storage: () => Storage);      // getter, so a throwing localStorage access is caught
    /** true if seen OR storage unusable (then never auto-start) */
    isSeenOrUnavailable(): boolean;
    markSeen(): void;                         // swallows errors
  }
  // tour.service.ts  (@Injectable({ providedIn: 'root' }))
  readonly active: Signal<boolean>;
  readonly stepIndex: Signal<number>;           // 0..2
  readonly desktop: Signal<boolean>;            // BreakpointObserver '(min-width: 1024px)'
  setListReady(ready: boolean): void;           // bill-list: first load done AND launch intent handled; false on destroy
  request(): void;                              // manual start: ignores the seen flag, waits for the same readiness
  next(): void; back(): void; end(): void;      // back() = previous step (screen ≥ 2), end() = finish/skip/Escape
  ```

**Behaviour:**
- **Auto-start:** an `effect` or a computed condition. A start is pending if `listReady && openCount() === 0 && !active()`, plus either `requested`, or not seen and not yet auto-shown in this app session. When the condition holds, the service starts a 400 ms timer. On expiry it re-checks the condition and calls `start()` only if the condition still holds. Any change in between cancels the timer.
- **`start()`:**
  - Unless this is a manual start, call `markSeen()` **first**. For a manual start, still mark it seen, which is harmless.
  - Set `active`, `stepIndex = 0` and clear `requested`.
  - Register with `OverlayBackService` (close → `end()`) and keep the release function.
  - Create the overlay: `Overlay.create` with a global position strategy, full width and height, no backdrop. Attach `ComponentPortal(TOUR_OVERLAY_COMPONENT)`. Set `overlayRef.hostElement.style.zIndex = '1001'` so it sits above sheets and dialogs. Check the CDK Overlay API in Context7 (`/angular/components`) before writing this, especially `Overlay.create`/`createOverlayRef` and whether panes use `usePopover`.
- **Entering a step with `opensQuickEntry`:**
  - Call `handle = quickEntry.open({ preview: true })`. `null` is allowed, the tour then continues without the sheet.
  - Subscribe to `handle.closed$`. If it emits while the tour itself did not close the handle (for example after Back or a swipe), call `end()`.
  - After the preview opens, the tour must be the top layer again. If the dialog or sheet ends up above the tour (popover top layer or DOM order), re-append `overlayRef.hostElement` to its parent, or the equivalent per the CDK docs.
- **Leaving that step** (back to step 2, or `end()`): call `handle.close()` with a flag so the `closed$` subscription does not call `end()` again.
- **`end()`:** close the preview, dispose the overlay, call the release function, set `active` to false. Calling it twice is harmless.

- [ ] **Step 1: Write the failing tests**
  - `tour-seen-store.spec.ts`:
    - `not seen when key absent`.
    - `seen when key is "1"`.
    - `markSeen writes "1"`.
    - `unavailable storage counts as seen`: the getter throws.
    - `markSeen swallows errors`.
  - `tour.service.spec.ts`. Use fake timers, a stub `QuickEntryService`, the real `OverlayBackService` (or a stub with a writable `openCount`), and a dummy component provided for `TOUR_OVERLAY_COMPONENT`. Tests:
    - `does not start before the list is ready`.
    - `starts 400 ms after the list is ready and no overlay is open`.
    - `does not start while an overlay is open, starts 400 ms after it closes`.
    - `aborts the pending start if an overlay opens during the delay`.
    - `marks seen when shown, before it ends`.
    - `does not auto-start when already seen`.
    - `does not auto-start twice in one session`.
    - `request() starts even when seen`.
    - `next/back move the step and back is a no-op on step 1`.
    - `entering templates opens the quick entry preview, leaving it closes the preview`.
    - `external close of the preview ends the tour`.
    - `end() closes the preview, releases the back registration and is idempotent`.
    - `Back (registered close) ends the tour`.
    - `continues on templates when open() returns null`.
- [ ] **Step 2: Run** `npx ng test --watch=false --include='src/app/core/tour/tour-seen-store.spec.ts' --include='src/app/core/tour/tour.service.spec.ts'`. Expected: FAIL.
- [ ] **Step 3: Implement** both files as described.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(miniclient): tour service with auto-start, storage and back handling (US-0010)`.

---

### Task 5: `TourOverlayComponent` and `data-tour` hooks in the shell *(touches UI)*

**Files:**
- Create: `MC/src/app/core/tour/tour-overlay/tour-overlay.component.ts`, `.html`, `.scss`
- Modify: `MC/src/app/core/tour/tour.service.ts` (provide the real component for `TOUR_OVERLAY_COMPONENT`)
- Modify (hooks):
  - `MC/src/app/core/navigation/bottom-bar/bottom-bar.component.html`: `data-tour="main-nav"` on `nav.bar`.
  - `MC/src/app/app.component.html`: `data-tour="main-nav"` on `mat-sidenav.side`.
  - `MC/src/app/core/navigation/area-tabs/area-tabs.component.html`: `data-tour="tabs"` on `nav.tabs`.
  - `MC/src/app/features/bill/quick-entry/quick-entry-dock/quick-entry-dock.component.html`: `data-tour="entry"` on `button.in`, `data-tour="camera"` on both `button.cam` and `button.scan`.
  - `MC/src/app/features/bill/modules/bill-list/bill-list.component.html`: `data-tour="bill-row"` on `a.bill-link`.
- Test: `MC/src/app/core/tour/tour-overlay/tour-overlay.component.spec.ts`

**Interfaces:**
- Consumes: `TourService` (`stepIndex`, `desktop`, `next`, `back`, `end`), `tourSteps`, `resolveTarget`, `rectOf`, `placeNotes` (Tasks 3 and 4).
- `hasTiles` = number of `[data-tour="tiles"] [role="radio"]` > 0 at measure time.

**Rendering:**
- An SVG over the whole viewport with a `<mask>`: the veil is cut out at each resolved target rect, with 8 px padding and 12 px radius. Each target gets an outline in its tone colour (Global Constraints).
- Notes are absolutely positioned elements in DOM order. Each has a label line in its tone colour and the text in `#FFFDF8`, 13–14 px, at most 280 px wide.
- Arrows are SVG paths from `placeNotes` with a small arrowhead.
- The swipe hint shows a ←→ double arrow.
- Controls:
  - „Überspringen“ at the top left calls `end()`.
  - „n / 3“ at the top right.
  - Primary pill „Weiter“, „Los geht’s“ on the last step, which calls `end()`.
  - Text button „Zurück“ from step 2 on.
  - All controls are ≥ 44 px high.
- Measuring is a two-pass process: render the notes invisible, read their sizes, call `placeNotes`, then show them.
- Re-measure on `resize` and `orientationchange`, on step change, and for 600 ms after the step change via `requestAnimationFrame`, so the sheet or dialog animation settles. A `ResizeObserver` on the resolved targets is also fine.
- Clicks on the veil do nothing. The overlay blocks pointer events to the app underneath.
- A11y: host `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at a visually hidden `<h2>` with the step title. `cdkTrapFocus` with `cdkTrapFocusAutoCapture`. The primary button gets focus on every step change. Escape calls `end()`.
- Motion: notes fade in over ≤ 200 ms. Under `@media (prefers-reduced-motion: reduce)` there is no transition.

- [ ] **Step 1: Write the failing tests** in `tour-overlay.component.spec.ts`. Set up the host DOM with `data-tour` fixtures at known positions, a stub `TourService` with writable signals, and a viewport of 390×844 (mobile) or 1440×900 with `desktop = true`. Tests:
  - `renders the step title for screen readers and n / 3`.
  - `renders one note per resolvable target and drops notes whose target is missing`.
  - `mobile menus step shows the swipe hint, desktop does not`.
  - `Hauptmenü note uses the main tone class, Untermenü the sub tone class`.
  - `primary button says Weiter, on the last step Los geht’s and calls end()`.
  - `Zurück is hidden on step 1 and calls back() on step 2`.
  - `Überspringen and Escape call end()`.
  - `a click on the veil does nothing`.
  - `focuses the primary button on step change`.
  - `re-places notes on window resize`: move a fixture target, dispatch `resize`, flush rAF, and expect the note box to change.
  - `templates without tiles shows the no-tiles copy`.
- [ ] **Step 2: Run** `npx ng test --watch=false --include='src/app/core/tour/**/*.spec.ts'`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the component and the hooks. Provide the component for `TOUR_OVERLAY_COMPONENT`.
- [ ] **Step 4: Run** the same command, plus the specs of every touched template: `--include='src/app/core/navigation/**/*.spec.ts' --include='src/app/features/bill/**/*.spec.ts' --include='src/app/app.component.spec.ts'`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(miniclient): tour overlay with highlights, notes and arrows (US-0010)`.

---

### Task 6: Wiring – list readiness and the „Schnell-Hilfe“ entry *(touches UI)*

**Files:**
- Modify: `MC/src/app/features/bill/modules/bill-list/bill-list.component.ts`. `handleLaunchIntent` is around line 271, the view state around lines 120–130.
- Modify: `MC/src/app/core/navigation/nav-areas.ts`: extend `NavLink` with `startsTour?: boolean` and add an entry to `MORE_DATA`.
- Modify: `MC/src/app/core/navigation/more-page/more-page.component.ts/.html` and `MC/src/app/app.component.ts/.html` (sidebar group „Mehr“, `moreLinks`).
- Test: `MC/src/app/features/bill/modules/bill-list/bill-list.component.spec.ts`, `MC/src/app/core/navigation/more-page/more-page.component.spec.ts`, `MC/src/app/core/navigation/nav-areas.spec.ts`, `MC/src/app/app.component.spec.ts`

**Interfaces:**
- Consumes: `TourService.setListReady(ready: boolean)` and `TourService.request()` (Task 4).
- New `MORE_DATA` entry: `{ label: 'Schnell-Hilfe', icon: 'help', path: '/bill/list', startsTour: true }`, placed after Export.

**Behaviour:**
- `bill-list` calls `setListReady(true)` once **both** of these hold:
  - The view state has left `'loading'` for the first time (list, empty or error).
  - `handleLaunchIntent`'s `clear.finally(...)` has run, after `quickEntry.open()` for `?quick`.

  It calls `setListReady(false)` on destroy.
- In „Mehr“ and in the sidebar, links with `startsTour` call `tour.request()` on click, in addition to `routerLink`. If the list is already shown (desktop sidebar), the request starts the tour without navigation, because the list is already ready.

- [ ] **Step 1: Write the failing tests**
  - `bill-list`:
    - `reports list ready after the first load`.
    - `does not report ready before the launch intent is handled`: `?quick=1`, assert `setListReady(true)` is called only after `open`.
    - `reports not ready on destroy`.
  - `nav-areas`: `MORE_DATA ends with Schnell-Hilfe (help, startsTour)`.
  - `more-page`: `clicking Schnell-Hilfe requests the tour and navigates to /bill/list`.
  - `app.component`: `sidebar Mehr group shows Schnell-Hilfe and clicking it requests the tour`.
- [ ] **Step 2: Run** `npx ng test --watch=false --include='src/app/features/bill/modules/bill-list/**/*.spec.ts' --include='src/app/core/navigation/**/*.spec.ts' --include='src/app/app.component.spec.ts'`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same command, then the full gate `npm test` and `npm run build`. Expected: all green, no new warnings.
- [ ] **Step 5: Commit** with `feat(miniclient): start the tour on the bill list and from Schnell-Hilfe (US-0010)`.

---

## After the tasks

- **Phase 4: `ui-verification`** (Playwright MCP, 390 × 844 and 1440 × 900) against design.md §7. Screenshots go to `docs/stories/US-0010-schnellhilfe-tour/ui-testing/`.
- **Phase 5: `cost-tracking`** for this story.
