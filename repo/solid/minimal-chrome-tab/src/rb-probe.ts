/**
 * INSTRUMENTATION (repair-bench, environment/instrumentation.patch)
 *
 * Read-only observation bridge for the verifier, published as `window.__MCT__`.
 *
 * Why it exists: this page renders a wall-clock face, four progress milestones and a
 * lazily mounted settings dialog. Almost everything worth asserting lives in the app's own
 * reactive state (the settings singleton, the milestone memos) or in a value that exists
 * for a few hundred milliseconds (the inline `transition` the mount fade writes on #app
 * before its own teardown clears it). Reading those through the app instead of guessing
 * them from pixels is what makes the checkpoints exact, and freezing a transient into a
 * scalar at the moment it happens is what makes them reproducible.
 *
 * Discipline: every accessor is a pure read wrapped in a try/catch that yields `null`
 * rather than throwing, so a defect surfaces as a failed ASSERT (behaviour evidence) and
 * never as an aborted setup step. Nothing here writes to the app's state. The three
 * explicit drivers (`openSettings`, `saveSettings`, `clickInsideDialog`,
 * `clickOutsideDialog`) only reproduce what a user does - a real `.click()` on the real
 * settings button, a real `change` event on the real form control, a real
 * `form.requestSubmit()` - so the app's own write path (settings store -> storage ->
 * adapter -> subscription echo) is the thing under test, never a shortcut around it.
 *
 * Bindings are pushed in by two one-line call sites (Application, TimeMilestones); the
 * probe never imports a component, so it cannot change render order.
 */
import { getPinnedEpochMs } from '@/hooks/createCurrentDateTime'

type Json = Record<string, unknown>

const SettingsKey = 'minimal-chrome-tab:settings'

const MilestoneKeyByLabel: Record<string, string> = {
  'of day': 'day',
  'of week': 'week',
  'of month': 'month',
  'of year': 'year',
  "of b'day": 'birthday',
}

const trappedErrors: string[] = []
let lastStatus = "none"
let mountTransition: string | null = null
let appBindings: { settings?: () => unknown } = {}
let milestoneBindings: Json | null = null

const q = (sel: string): HTMLElement | null => document.querySelector(sel) as HTMLElement | null
const qa = (sel: string): HTMLElement[] => Array.from(document.querySelectorAll(sel)) as HTMLElement[]
const txt = (el: Element | null | undefined): string | null =>
  el == null ? null : String(el.textContent ?? '').replace(/\s+/g, ' ').trim()
const attr = (el: Element | null | undefined, name: string): string | null => (el == null ? null : el.getAttribute(name))
const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}
const mark = (status: string): string => {
  lastStatus = status
  return status
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const pollUntil = async (pred: () => boolean, timeoutMs: number): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (safe(pred, false)) return true
    await sleep(60)
  }
  return safe(pred, false)
}

// ---- milestones -----------------------------------------------------------
const milestonesRoot = (): HTMLElement | null => q('[data-rb-milestones]')
const milestoneGroups = (): HTMLElement[] => qa('[data-rb-milestones] [role="group"]')
const milestoneGroup = (label: string): HTMLElement | null =>
  milestoneGroups().find((g) => attr(g, 'aria-label') === label) ?? null
const milestoneSvg = (label: string): SVGSVGElement | null =>
  (milestoneGroup(label)?.querySelector('svg') as SVGSVGElement | null) ?? null
const milestonePaths = (label: string): Element[] => Array.from(milestoneSvg(label)?.querySelectorAll('path') ?? [])
const pathNumber = (p: Element, group: number): number | null => {
  const m = /^M(-?[\d.e+]+) (-?[\d.e+]+) L/.exec(attr(p, 'd') ?? '')
  return m == null ? null : Number.parseFloat(m[group])
}

// ---- dialog ---------------------------------------------------------------
const dialogs = (): HTMLElement[] => qa('[role="dialog"]')
const dialog = (): HTMLElement | null => dialogs()[0] ?? null
const isDialogOpen = (): boolean => dialogs().some((d) => attr(d, 'data-state') === 'open')
const form = (): HTMLFormElement | null => q('[role="dialog"] form[aria-label="Settings"]') as HTMLFormElement | null
const settingsButton = (): HTMLButtonElement | null =>
  (q('button[title="Open settings"]') ?? q('button[title="Opening settings"]')) as HTMLButtonElement | null

const openSettings = async (timeoutMs = 9000): Promise<string> => {
  if (form() != null) return mark('already-open')
  const $button = settingsButton()
  if ($button == null) return mark('no-settings-button')
  $button.click()
  return mark((await pollUntil(() => form() != null, timeoutMs)) ? 'opened' : 'dialog-did-not-open')
}

const saveSettings = async (patchJson: string): Promise<string> => {
  const patch = safe(() => JSON.parse(patchJson) as Json, null)
  if (patch == null) return mark('bad-patch-json')
  const opened = await openSettings()
  if (opened === 'no-settings-button' || opened === 'dialog-did-not-open') return mark(opened)
  const $form = form()
  if ($form == null) return mark('no-form')
  for (const [name, value] of Object.entries(patch)) {
    const $select = $form.querySelector(`select[name="${name}"]`) as HTMLSelectElement | null
    const $input = $form.querySelector(`input[name="${name}"]`) as HTMLInputElement | null
    if ($select != null) {
      $select.value = String(value)
      $select.dispatchEvent(new Event('change', { bubbles: true }))
    } else if ($input != null) {
      $input.value = String(value)
      $input.dispatchEvent(new Event('input', { bubbles: true }))
      $input.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      return mark(`no-control-for-${name}`)
    }
  }
  // 🔴 MEASURED FIX (R24, MCT_driver_probe2.json): SettingsForm hands the values it submits to
  // onSubmit through a createMemo (`settings`), and Solid recomputes a memo when the current batch
  // flushes - NOT synchronously inside the store setter that the change handler just ran. Submitting
  // in the SAME task as the gesture therefore makes handleSubmit read the PRE-change memo: every hop
  // of the app's own write path still runs, the dialog still closes, the driver still reports
  // "saved", and the bytes that get persisted are the DEFAULTS. That single same-turn bug was the
  // whole cause of four checkpoints (F04/P13/P16/P18) reading "auto"/"bars-compact"/null on ALL
  // FOUR faces of leg MCT4, i.e. of carrying zero discriminating evidence.
  // Variant matrix, one variable only (what happens between the gesture and requestSubmit), each
  // variant on a fresh context with an empty localStorage:
  //   no tick (same synchronous turn) -> stored "auto"      DOES NOT LAND
  //   2 microtasks                    -> stored "dark"      LANDS
  //   1 setTimeout(0)                 -> stored "dark"      LANDS
  //   2 setTimeout(0)                 -> stored "dark"      LANDS
  //   1 requestAnimationFrame         -> stored "dark"      LANDS
  //   2 setTimeout(0), 3 fields       -> theme "dark" + style "bars-detailed" + birthDate
  //                                      "1990-05-20"       ALL THREE LAND
  // Two task-queue turns are used (strictly stronger than the microtask that already suffices, and
  // it also lets a render flush through). This is NOT a shortcut around the app: yielding the task is
  // what a real user does anyway - a click on Save is never in the same task as the change event.
  await sleep(0)
  await sleep(0)
  $form.requestSubmit()
  return mark((await pollUntil(() => !isDialogOpen(), 9000)) ? 'saved' : 'saved-dialog-still-open')
}

const clickInsideDialog = async (): Promise<string> => {
  const opened = await openSettings()
  if (opened === 'no-settings-button' || opened === 'dialog-did-not-open') return opened
  const $target = dialog()?.querySelector('h1') ?? null
  if ($target == null) return mark('no-dialog-heading')
  $target.click()
  await sleep(300)
  return mark('clicked-inside')
}

/** The "outside" target for the containment contract. 🔴 MEASURED (MCT_driver_probe.json E3):
 * Modal renders TWO portal siblings into <body> - a decorative <div aria-hidden="true" data-state>
 * backdrop and the <div overlay> that actually contains <div role="dialog">. focus-trap is created on
 * the OVERLAY (useDialogHooks: createFocusTrap($overlay, { escapeDeactivates: false, fallbackFocus:
 * $dialog }) - note there is NO clickOutsideDeactivates and NO allowOutsideClick), and its
 * capture-phase document click handler preventDefault()s + stopImmediatePropagation()s any click
 * whose target is not inside the trap container. Since focus-trap is activated from a
 * createRenderEffect while the app's own containment listener is attached from a deferred
 * createEffect, the trap's listener is registered FIRST and wins on the capture path. Measured
 * dialogOpen after a click, clean face:
 *   h1 inside the dialog            true  -> true   (stays open)
 *   aria-hidden backdrop sibling    true  -> true   (SWALLOWED by the trap: outside the container)
 *   document.body                   true  -> true   (SWALLOWED, same reason)
 *   the overlay = dialog.parentNode true  -> FALSE  (closes: outside $dialog, inside the container)
 *   Escape key                      true  -> false  (the overlay's own keydown handler)
 * So the only place where shouldClose()'s containment test is OBSERVABLE is the overlay: it is
 * outside $dialog (so the contract applies) yet inside the trap container (so the trap lets it
 * through). Clicking the decorative backdrop measures focus-trap, not the contract - which is D10's
 * territory, and would couple this driver to two defects at once. */
const outsideTarget = ($dialog: HTMLElement | null): HTMLElement | null =>
  $dialog?.parentElement instanceof HTMLElement ? $dialog.parentElement : null

const clickOutsideDialog = async (): Promise<string> => {
  const opened = await openSettings()
  if (opened === 'no-settings-button' || opened === 'dialog-did-not-open') return opened
  const $dialog = dialog()
  if ($dialog == null) return mark('no-dialog')
  const $target = outsideTarget($dialog)
  if ($target == null) return mark('no-overlay-outside-target')
  $target.click()
  await sleep(300)
  return mark('clicked-outside')
}

/**
 * One driver, both directions of the outside/inside click contract, reported as a single
 * scalar so the checkpoint cannot be split across two runs: open the dialog, click inside
 * it (must stay open), then click OUTSIDE it (must close). Returns "inside:<open>,outside:<open>".
 * The outside click lands on the overlay (see outsideTarget): the decorative aria-hidden backdrop is
 * outside the focus-trap container, so the trap swallows the click before the app's containment
 * listener can ever see it - measured, and it is exactly why leg MCT4 read "inside:true,outside:true"
 * on the clean face instead of the contract's "inside:true,outside:false".
 */
const dialogCloseSemantics = async (): Promise<string> => {
  const opened = await openSettings()
  if (opened === 'no-settings-button' || opened === 'dialog-did-not-open') return mark(opened)
  const $heading = dialog()?.querySelector('h1') ?? null
  if ($heading == null) return mark('no-dialog-heading')
  $heading.click()
  await sleep(400)
  const inside = isDialogOpen()
  const $target = outsideTarget(dialog())
  if ($target != null) $target.click()
  // 🔴 MEASURED FIX #4 (R24). This driver returns ONE scalar "inside:<bool>,outside:<bool>" and
  // tests/dsl.json F07 assert[0] pins exactly that shape on BOTH faces, so bailing out with a status
  // string when no overlay is left would replace a registered behavioural reading with an
  // instrumentation artefact. On the delivered face D07 drops the `!` and the INSIDE click is the
  // dismissing one, so ShowWithTransition has already released the subtree (300 ms exit animation;
  // the driver waits 400 ms) and dialog() is null by the time the outside step runs - there is
  // nothing left to click. `outside` answers the question the contract actually asks, "is a dialog
  // open after the outside step?", and with nothing mounted the honest answer is the same false the
  // click would have produced. That is precisely why F07's discriminating half is the FIRST one; the
  // second half only pins that whichever way the containment test is inverted, the sequence ends
  // with no dialog left open (assert[1] reads it independently off the DOM).
  await sleep(400)
  const outside = isDialogOpen()
  return mark(`inside:${inside},outside:${outside}`)
}

/** The dialog's own Close button: the seed's handler stops propagation, so this path is
 * independent of the backdrop/inside click contract and stays usable whatever it does. */
const closeDialogViaButton = async (): Promise<string> => {
  const opened = await openSettings()
  if (opened === 'no-settings-button' || opened === 'dialog-did-not-open') return opened
  const $button = (dialog()?.querySelector('button[title="Close"]') ?? null) as HTMLButtonElement | null
  if ($button == null) return mark('no-close-button')
  $button.click()
  await sleep(400)
  return mark(isDialogOpen() ? 'still-open' : 'closed')
}

/** Block until the boot really finished: the tree mounted, both clock spans rendered and
 * the async settings load resolved (which is what releases the milestones from <Loading>).
 * Infrastructure readiness only - it never polls an asserted value. */
const awaitBoot = async (timeoutMs = 9000): Promise<boolean> =>
  pollUntil(
    () =>
      (appRoot()?.childElementCount ?? 0) > 0 &&
      txt(q('time > span[aria-current="time"]')) != null &&
      milestoneGroups().length >= 4 &&
      readSettings() != null,
    timeoutMs,
  )

// ---- settings -------------------------------------------------------------
const readSettings = (): Json | null =>
  safe(() => {
    const get = appBindings.settings
    if (get == null) return null
    const value = get()
    return value != null && typeof value === 'object' ? (value as Json) : null
  }, null)

const settingString = (name: string): string | null => {
  const value = readSettings()?.[name]
  return typeof value === 'string' ? value : null
}

const stored = (): Json | null =>
  safe(() => {
    const raw = localStorage.getItem(SettingsKey)
    return raw == null ? null : (JSON.parse(raw) as Json)
  }, null)

const storedString = (name: string): string | null => {
  const value = stored()?.[name]
  return typeof value === 'string' ? value : null
}

const themeName = (el: HTMLElement | null): string | null => attr(el, 'data-theme')
const appliedTheme = (): string | null => themeName(document.documentElement) ?? themeName(document.body)
const osPrefersDark = (): boolean => safe(() => window.matchMedia('(prefers-color-scheme: dark)').matches, false)

const appRoot = (): HTMLElement | null => q('#app')

const api = {
  // --- bridge self-report --------------------------------------------------
  bound: (): boolean => true,
  probeName: (): string => '__MCT__',
  milestonesBound: (): boolean => milestoneBindings != null,
  settingsBound: (): boolean => appBindings.settings != null,
  errorCount: (): number => trappedErrors.length,
  errorSample: (): string => trappedErrors.slice(0, 3).join(' | '),

  // --- adaptation pin ------------------------------------------------------
  pinnedEpochMs: (): number => getPinnedEpochMs(),
  pinnedEpochIso: (): string => new Date(getPinnedEpochMs()).toISOString(),

  // --- boot / mount --------------------------------------------------------
  appMounted: (): boolean => (appRoot()?.childElementCount ?? 0) > 0,
  appChildCount: (): number => appRoot()?.childElementCount ?? -1,
  appOpacity: (): string | null => safe(() => getComputedStyle(appRoot() as HTMLElement).opacity, null),
  mountTransition: (): string | null => mountTransition,
  mountTransitionSeconds: (): number | null => {
    const m = /(-?[\d.]+)s/.exec(mountTransition ?? '')
    return m == null ? null : Number.parseFloat(m[1])
  },
  mountFadeSettled: (): boolean =>
    safe(() => {
      const $app = appRoot()
      return $app != null && $app.style.transition === '' && getComputedStyle($app).opacity === '1'
    }, false),

  // --- document chrome -----------------------------------------------------
  htmlLang: (): string | null => attr(document.documentElement, 'lang'),
  docTitle: (): string => document.title,
  faviconPathname: (): string | null => safe(() => new URL((q('link[rel="icon"]') as HTMLLinkElement).href).pathname, null),
  faviconSearch: (): string | null => safe(() => new URL((q('link[rel="icon"]') as HTMLLinkElement).href).search, null),

  // --- clock face ----------------------------------------------------------
  timeElementCount: (): number => qa('time').length,
  timeAriaLive: (): string | null => attr(q('time'), 'aria-live'),
  timeAriaAtomic: (): string | null => attr(q('time'), 'aria-atomic'),
  timeAriaLabel: (): string | null => attr(q('time'), 'aria-label'),
  timeSpanCount: (): number => qa('time > span').length,
  timeSpanAriaCurrents: (): string => qa('time > span').map((s) => attr(s, 'aria-current')).join(','),
  timeSpanAriaLabels: (): string => qa('time > span').map((s) => attr(s, 'aria-label')).join(','),
  dateSpanText: (): string | null => txt(q('time > span[aria-current="date"]')),
  timeSpanText: (): string | null => txt(q('time > span[aria-current="time"]')),
  dateSpanTextNonEmpty: (): boolean => (txt(q('time > span[aria-current="date"]')) ?? '').length > 0,
  timeSpanTextNonEmpty: (): boolean => (txt(q('time > span[aria-current="time"]')) ?? '').length > 0,
  timeFontFamily: (): string | null => safe(() => getComputedStyle(q('time') as HTMLElement).fontFamily, null),
  timeFontIsRetroMono: (): boolean => /Digital-7Mono/i.test(safe(() => getComputedStyle(q('time') as HTMLElement).fontFamily, '')),

  // --- milestones ----------------------------------------------------------
  milestoneCount: (): number => milestoneGroups().length,
  milestoneLabels: (): string => milestoneGroups().map((g) => attr(g, 'aria-label')).join(','),
  milestoneLabelsNonEmpty: (): boolean => milestoneGroups().every((g) => (attr(g, 'aria-label') ?? '').length > 0),
  milestonesAriaLabel: (): string | null => attr(milestonesRoot(), 'aria-label'),
  milestonesDescribedByResolves: (): boolean => {
    const id = attr(milestonesRoot(), 'aria-describedby')
    return id != null && id !== '' && document.getElementById(id) != null
  },
  headingText: (): string | null => txt(q('[data-rb-milestones] h1')),
  headingIdNonEmpty: (): boolean => (attr(q('[data-rb-milestones] h1'), 'id') ?? '').length > 0,
  birthdayMilestonePresent: (): boolean => milestoneGroup("of b'day") != null,
  milestoneValueText: (label: string): string | null => {
    const $group = milestoneGroup(label)
    return $group == null ? null : txt($group.children[0])
  },
  /** Percent SHAPE only, never percent magnitude - that split is what keeps this a P2P while F05 is
   * the F2P for D05. 🔴 MEASURED FIX: the strict /^\d{1,9}%$/ was written on the paper assumption
   * that D05's double scaling renders "5587%". It does not: Intl.NumberFormat's percent style inserts
   * a GROUPING separator and the seed's .replaceAll(/\s/g, '') strips whitespace only, so the mutated
   * face renders "5,587%" (leg MCT4, F05 detail: expected "56%", actual "5,587%") and the strict regex
   * rejected it - which turned this P2P red on the mutation face and broke the 20-green P2P contract.
   * Clean face measured ["56%","37%","47%","54%"]: both the strict and the tolerant regex accept all
   * four, so the fix costs nothing on the face this checkpoint is graded on. The tolerant form still
   * requires digits, optional 3-digit grouping and a trailing %, so it still fails on "0.5587", "56",
   * "56 %" and "5,587" - i.e. it still catches a repair of D05 that changes the FORMAT instead of the
   * scaling, which is the only thing this checkpoint exists to catch. */
  milestoneValueTextsArePercents: (): boolean =>
    milestoneGroups().every((g) => /^\d{1,3}(?:,\d{3})*%$|^\d{1,9}%$/.test(String(txt(g.children[0]) ?? ''))),
  milestoneDescriptionText: (label: string): string | null => txt(milestoneGroup(label)?.querySelector('span:last-child')),
  milestoneValue: (label: string): number | null => {
    const bindings = milestoneBindings
    const key = MilestoneKeyByLabel[label]
    if (bindings == null || key == null) return null
    return safe(() => {
      const value = bindings[key]
      return typeof value === 'number' ? value : null
    }, null)
  },
  milestoneBarCount: (label: string): number => milestonePaths(label).length,
  milestoneBarStrokeWidth: (label: string): string | null => attr(milestonePaths(label)[0], 'stroke-width'),
  milestoneSvgViewBox: (label: string): string | null => attr(milestoneSvg(label), 'viewBox'),
  milestoneSvgRole: (label: string): string | null => attr(milestoneSvg(label), 'role'),
  milestoneSvgAriaHidden: (label: string): string | null => attr(milestoneSvg(label), 'aria-hidden'),
  milestoneSvgHeight: (label: string): string | null => attr(milestoneSvg(label), 'height'),
  milestoneBarNegativeYCount: (label: string): number =>
    milestonePaths(label).filter((p) => (pathNumber(p, 2) ?? 0) < 0).length,
  milestoneBarYsUnderMax: (label: string): boolean => {
    const height = Number.parseFloat(/^0 0 [\d.]+ ([\d.]+)$/.exec(attr(milestoneSvg(label), 'viewBox') ?? '')[1] ?? '')
    if (!Number.isFinite(height)) return false
    return milestonePaths(label).every((p) => {
      const y = pathNumber(p, 2)
      return y != null && y >= 0 && y <= height
    })
  },
  milestoneBarXFirst: (label: string): number | null => pathNumber(milestonePaths(label)[0], 1),
  milestoneBarXMonotonic: (label: string): boolean => {
    const xs = milestonePaths(label).map((p) => pathNumber(p, 1) ?? Number.NaN)
    return xs.length > 1 && xs.every((x, i) => i === 0 || x > (xs[i - 1] as number))
  },
  milestoneBarXCount: (label: string): number => milestonePaths(label).filter((p) => pathNumber(p, 1) != null).length,
  milestoneBarYs: (label: string): string => milestonePaths(label).map((p) => pathNumber(p, 2)).join(","),

  // --- theme ---------------------------------------------------------------
  htmlTheme: (): string | null => themeName(document.documentElement),
  bodyTheme: (): string | null => themeName(document.body),
  themeOnHtmlNotBody: (): boolean =>
    themeName(document.documentElement) != null && themeName(document.body) == null,
  themeMatchesOsPreferenceOnHtml: (): boolean =>
    themeName(document.documentElement) === (osPrefersDark() ? 'dark' : 'light'),
  themeAppliedSomewhere: (): boolean => appliedTheme() != null,
  themeValueIsValid: (): boolean => ['auto', 'light', 'dark'].includes(appliedTheme() ?? ''),
  themeMatchesOsPreference: (): boolean => appliedTheme() === (osPrefersDark() ? 'dark' : 'light'),

  // --- settings dialog -----------------------------------------------------
  dialogCount: (): number => dialogs().length,
  dialogOpen: (): boolean => isDialogOpen(),
  dialogState: (): string | null => attr(dialog(), 'data-state'),
  dialogTitle: (): string | null => txt(dialog()?.querySelector('h1')),
  dialogLabelledByResolves: (): boolean => {
    const id = attr(dialog(), 'aria-labelledby')
    const $el = id == null || id === '' ? null : document.getElementById(id)
    return $el != null && $el === dialog()?.querySelector('h1')
  },
  dialogRole: (): string | null => attr(dialog(), 'role'),
  backdropCount: (): number => qa('body > div[aria-hidden="true"][data-state]').length,
  activeElementInsideDialog: (): boolean => {
    const active = document.activeElement
    return active != null && dialogs().some((d) => d.contains(active))
  },
  activeElementTag: (): string => document.activeElement?.tagName.toLowerCase() ?? 'none',
  activeElementTitle: (): string | null => attr(document.activeElement, 'title'),
  appInert: (): boolean => appRoot()?.hasAttribute('inert') ?? false,
  openSettings,
  saveSettings,
  clickInsideDialog,
  clickOutsideDialog,
  dialogCloseSemantics,
  closeDialogViaButton,
  awaitBoot,
  lastDriverStatus: (): string => lastStatus,

  // --- settings form -------------------------------------------------------
  formAriaLabel: (): string | null => attr(form(), 'aria-label'),
  formSelectCount: (): number => form()?.querySelectorAll('select').length ?? -1,
  formOptionValues: (name: string): string =>
    Array.from(form()?.querySelector(`select[name="${name}"]`)?.options ?? []).map((o) => o.value).join(','),
  formOptionLabels: (name: string): string =>
    Array.from(form()?.querySelector(`select[name="${name}"]`)?.options ?? []).map((o) => o.text).join('|'),
  formSelectedValue: (name: string): string | null => {
    const $select = form()?.querySelector(`select[name="${name}"]`) as HTMLSelectElement | null
    return $select == null ? null : $select.value
  },
  formLabelTexts: (): string => Array.from(form()?.querySelectorAll('label') ?? []).map((l) => txt(l)).join('|'),
  formLabelCount: (): number => form()?.querySelectorAll('label').length ?? -1,
  formLabelForCount: (): number =>
    Array.from(form()?.querySelectorAll('label') ?? []).filter((l) => (attr(l, 'for') ?? '').length > 0).length,
  formLabelForResolvesCount: (): number =>
    Array.from(form()?.querySelectorAll('label') ?? []).filter((l) => {
      const id = attr(l, 'for')
      return id != null && id !== '' && document.getElementById(id) != null
    }).length,
  formControlIdCount: (): number =>
    form()?.querySelectorAll('select[id], input[id]').length ?? -1,
  formInputType: (): string | null => attr(form()?.querySelector('input[name="birthDate"]'), 'type'),
  formInputValue: (): string | null => {
    const $input = form()?.querySelector('input[name="birthDate"]') as HTMLInputElement | null
    return $input == null ? null : $input.value
  },
  formSubmitText: (): string | null => txt(form()?.querySelector('button[type="submit"]')),
  formSubmitDisabled: (): boolean =>
    (form()?.querySelector('button[type="submit"]') as HTMLButtonElement | null)?.disabled ?? false,

  // --- in-memory settings + persisted settings -----------------------------
  settingsThemeColorMode: (): string | null => settingString('themeColorMode'),
  settingsMilestoneProgressStyle: (): string | null => settingString('milestoneProgressStyle'),
  settingsBirthDate: (): string | null => settingString('birthDate'),
  settingsKeyCount: (): number => {
    const value = readSettings()
    return value == null ? -1 : Object.keys(value).length
  },
  settingsResolved: (): boolean => readSettings() != null,
  storedThemeColorMode: (): string | null => storedString('themeColorMode'),
  storedMilestoneProgressStyle: (): string | null => storedString('milestoneProgressStyle'),
  storedBirthDate: (): string | null => storedString('birthDate'),
  storedKeys: (): string => {
    const value = stored()
    return value == null ? '' : Object.keys(value).sort().join(',')
  },
  storedRawLength: (): number => (localStorage.getItem(SettingsKey) ?? '').length,

  // --- state isolation (§1.8.7) -------------------------------------------
  localStorageLength: (): number => safe(() => localStorage.length, -1),
  sessionStorageLength: (): number => safe(() => sessionStorage.length, -1),
  cookieString: (): string => safe(() => document.cookie, 'unreadable'),
  locationSearch: (): string => safe(() => window.location.search, 'unreadable'),
  locationHash: (): string => safe(() => window.location.hash, 'unreadable'),
  locationPathname: (): string => safe(() => window.location.pathname, 'unreadable'),
  benchGlobals: (): string => ['__MCT__', '__RB__', '__GOL__', '__rb_residue'].filter((k) => k in window).join(','),
  probeAttrCount: (): number => qa('[data-rb-milestones]').length,

  // --- footer / credits ----------------------------------------------------
  footerCount: (): number => qa('footer').length,
  creditsHref: (): string | null => attr(q('footer a'), 'href'),
  creditsTarget: (): string | null => attr(q('footer a'), 'target'),
  creditsRel: (): string | null => attr(q('footer a'), 'rel'),
  creditsText: (): string | null => txt(q('footer a')),
  settingsButtonType: (): string | null => attr(settingsButton(), 'type'),
  settingsButtonTitle: (): string | null => attr(settingsButton(), 'title'),
  settingsButtonAriaBusy: (): string | null => attr(settingsButton(), 'aria-busy'),
  settingsButtonAriaDisabled: (): string | null => attr(settingsButton(), 'aria-disabled'),
  settingsButtonSvgCount: (): number => settingsButton()?.querySelectorAll('svg').length ?? -1,
  footerFontIsRetroMono: (): boolean =>
    /Digital-7Mono/i.test(safe(() => getComputedStyle(q('footer') as HTMLElement).fontFamily, '')),

  /**
   * Calibration dump for the design seat's recon leg: every zero-argument reading plus the
   * per-milestone and per-select families, as one JSON string. The four drivers that reproduce
   * a user gesture (and this method) are excluded by name, so dumping can never click anything.
   */
  recon: (): string => {
    const DRIVERS = new Set([
      'openSettings',
      'saveSettings',
      'clickInsideDialog',
      'clickOutsideDialog',
      'dialogCloseSemantics',
      'closeDialogViaButton',
      'awaitBoot',
      'recon',
    ])
    const out: Json = {}
    for (const [key, value] of Object.entries(api)) {
      if (DRIVERS.has(key)) continue
      if (typeof value !== 'function') continue
      if ((value as (...a: unknown[]) => unknown).length !== 0) continue
      out[key] = safe(() => (value as () => unknown)(), 'THREW')
    }
    const labels = ['of day', 'of week', 'of month', 'of year', "of b'day"]
    for (const key of [
      'milestoneValueText',
      'milestoneValue',
      'milestoneBarCount',
      'milestoneBarStrokeWidth',
      'milestoneSvgViewBox',
      'milestoneSvgRole',
      'milestoneSvgAriaHidden',
      'milestoneSvgHeight',
      'milestoneBarNegativeYCount',
      'milestoneBarYsUnderMax',
      'milestoneBarXFirst',
      'milestoneBarXMonotonic',
      'milestoneBarXCount',
      'milestoneBarYs',
      'milestoneDescriptionText',
    ]) {
      const fn = (api as unknown as Json)[key] as (label: string) => unknown
      out[key] = Object.fromEntries(labels.map((l) => [l, safe(() => fn(l), 'THREW')]))
    }
    for (const key of ['formOptionValues', 'formOptionLabels', 'formSelectedValue']) {
      const fn = (api as unknown as Json)[key] as (name: string) => unknown
      out[key] = Object.fromEntries(
        ['themeColorMode', 'milestoneProgressStyle'].map((n) => [n, safe(() => fn(n), 'THREW')]),
      )
    }
    return JSON.stringify(out)
  },
}

function install(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  window.addEventListener('error', (e) => {
    trappedErrors.push(`error: ${String(e.message ?? e.error ?? '').slice(0, 200)}`)
  })
  window.addEventListener('unhandledrejection', (e) => {
    trappedErrors.push(`rejection: ${String((e.reason as Error | undefined)?.message ?? e.reason ?? '').slice(0, 200)}`)
  })

  // Freeze the mount fade's inline transition at the instant it is written: the seed's own
  // teardown clears `style.transition` on transitionend, so a checkpoint that read it later
  // would find an empty string and could not tell a 100 ms fade from a 3 s one.
  const $app = appRoot()
  if ($app != null) {
    const record = (): void => {
      const value = $app.style.transition
      if (value !== '' && mountTransition == null) mountTransition = value
    }
    record()
    new MutationObserver(record).observe($app, { attributes: true, attributeFilter: ['style'] })
  }

  ;(window as unknown as { __MCT__: unknown }).__MCT__ = api
}

install()

export const bindApp = (bindings: { settings?: () => unknown }): void => {
  appBindings = { ...appBindings, ...bindings }
}

export const bindMilestones = (milestones: Json): void => {
  milestoneBindings = milestones
}
