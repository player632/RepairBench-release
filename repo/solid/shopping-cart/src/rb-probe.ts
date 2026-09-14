// rb-probe.ts - observation bridge for the repair-bench verifier (INSTRUMENTATION ONLY).
//
// Neutrality contract: this file only READS the app. It never sets a signal, never
// dispatches an event the app does not already listen for, never changes a render
// branch, and it is imported for its side effect (installing window.__SC__) before
// the app renders. Every interaction helper reproduces exactly one real user gesture
// (element.click(), a bubbling input/change event, form submit through the seed's own
// submit button) so a checkpoint drives the same code path a user drives.
//
// Why a bridge instead of raw locators: the seed styles itself with CSS modules, so
// every class name carries a content hash (_menu_l7jym_1) that moves whenever a file
// is edited. The bridge therefore selects on structure the seed guarantees - the
// data-rb-* hooks added by this same instrumentation patch, existing aria-labels
// ("toggle-navigation", "Language select"), existing alt texts, input ids the seed
// itself assigns (#wfashion / #mfashion), and tag/parent structure - and it exposes
// BOUNDED POLLING LATCHES instead of single wall-clock reads, so a checkpoint never
// depends on a timer having landed inside one sampling instant.
//
// Latch protocol (two synchronous steps, because the runner evaluates expressions):
//   setup step 1: window.__SC__.armCartBadge(1, 6000)   -> starts a 50ms poll, returns immediately
//   setup step 2: wait (any duration; the poll keeps running on the page)
//   assert:       window.__SC__.latch('cartBadge').ok === true
// A latch records ok / elapsedMs / tries / detail and stops polling on success or timeout.

const errors: any[] = [];
const latchStore = Object.create(null);
const barSamples: any[] = [];
let globalsBaseline: string | null = null;
let cartApi: any = null;
let favoritesApi: any = null;

const installErrorTrap = () => {
  window.addEventListener('error', (event: any) => {
    errors.push({ kind: 'error', message: String((event && event.message) || 'unknown'), at: Date.now() });
  });
  window.addEventListener('unhandledrejection', (event: any) => {
    errors.push({ kind: 'unhandledrejection', message: String((event && event.reason) || 'unknown'), at: Date.now() });
  });
  return true;
};

const q = (selector: any, root?: any) => (root || document).querySelector(selector);
const qa = (selector: any, root?: any) => Array.prototype.slice.call((root || document).querySelectorAll(selector));
const txt = (element: any) => (element ? String(element.textContent || '').replace(/\s+/g, ' ').trim() : null);
const num = (value: any) => {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
};

const cardById = (id: any) => q('[data-rb-product="' + id + '"]');
const cards = () => qa('[data-rb-grid] [data-rb-product]');
const gridUl = () => q('[data-rb-grid]');
const cartModal = () => q('[data-rb-modal="cart"]');
const favoritesModal = () => q('[data-rb-modal="favorites"]');
const modalBackdrop = (modal: any) => {
  // the data-rb-modal hook sits on the modal BODY, which is the only child of the
  // Modal atom's outer div; the backdrop is that outer div's previous sibling.
  if (!modal || !modal.parentElement) return null;
  const candidate = modal.parentElement.previousElementSibling;
  return candidate && candidate.getAttribute("data-rb-backdrop") ? candidate : null;
};
const toastRoot = () => q('[data-rb-toast]');
const toastBar = () => q('[data-rb-bar]');
const navbarCartButton = () => {
  const image = q('header img[alt="cart"]');
  return image ? image.closest('button') : null;
};
const navbarFavoriteButton = () => {
  const image = q('header img[alt="favorite"]');
  return image ? image.closest('button') : null;
};
const badgeOf = (button: any) => {
  if (!button) return null;
  const span = q('span', button);
  return span ? txt(span) : null;
};
const emailInput = () => q('main input[type="text"]');
const searchInput = () => q('header input[type="text"]');
const newsletterForm = () => q('main form');
const submitButton = () => {
  const form = newsletterForm();
  if (!form) return null;
  const image = q('img[alt="Mail icon"]', form);
  return image ? image.closest('button') : null;
};
const languageSelects = () => qa('select[aria-label="Language select"]');
const heroHeading = () => q('main h1');
const faqItems = () => qa('img[alt="Arrow icon"]').map((image: any) => image.closest('li')).filter((item: any) => !!item);
const mobileNav = () => q('[data-rb-nav="mobile"]');
const burgerButton = () => q('button[aria-label="toggle-navigation"]');
const productLines = () => qa('[data-rb-modal="cart"] [data-rb-line]');

const clickElement = (element: any) => {
  if (!element) return false;
  element.click();
  return true;
};

const typeInto = (element: any, value: any) => {
  if (!element) return false;
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
};

const selectOption = (element: any, value: any) => {
  if (!element) return false;
  element.value = value;
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

const ready = () => !!q('#root') && q('#root').children.length > 0 && (!!gridUl() || !!somethingWentWrong());
const somethingWentWrong = () => {
  const paragraphs = qa('main p');
  return paragraphs.some((paragraph: any) => /something went wrong/i.test(txt(paragraph) || ''));
};
const probeVersion = () => 'rb-probe/sc-1';

const bindCart = (api: any) => {
  cartApi = api;
  return true;
};
const bindFavorites = (api: any) => {
  favoritesApi = api;
  return true;
};
const cartState = () => {
  if (!cartApi) return null;
  const items = cartApi.items();
  return {
    lines: items.length,
    units: items.reduce((acc: any, item: any) => acc + (item && item.amount ? item.amount : 0), 0),
    ids: items.map((item: any) => (item ? item.id : null)),
    amounts: items.map((item: any) => (item ? item.amount : null)),
    lengthApi: cartApi.length(),
    totalApi: cartApi.total(),
  };
};
const favoritesState = () => {
  if (!favoritesApi) return null;
  const items = favoritesApi.items();
  return {
    lines: items.length,
    ids: items.map((item: any) => (item ? item.id : null)),
    lengthApi: favoritesApi.length(),
  };
};

const productCount = () => cards().length;
const productIds = () => cards().map((card: any) => card.getAttribute('data-rb-product'));
const productNames = () => cards().map((card: any) => txt(qa('p', card)[0]));
const productPrices = () => cards().map((card: any) => txt(qa('p', card)[1]));
const productImageState = () =>
  cards().map((card: any) => {
    const image = q('img', card);
    return { id: card.getAttribute('data-rb-product'), src: image ? image.getAttribute('src') : null, alt: image ? image.getAttribute('alt') : null, loaded: image ? image.naturalWidth > 0 : false };
  });
const addButtonTexts = () => cards().map((card: any) => txt(q(':scope > button', card)));
const addButtonsSpinning = () => cards().filter((card: any) => !!q(':scope > button img[alt="Loading..."]', card)).length;

const clickAddFor = (id: any) => clickElement(q(':scope > button', cardById(id)));
const clickFavoriteFor = (id: any) => clickElement(q(':scope > div > button', cardById(id)));
const favoriteMarkedIds = () =>
  cards()
    .filter((card: any) => {
      const button = q(':scope > div > button', card);
      return !!button && /_isFavorite_/.test(String(button.className || ''));
    })
    .map((card: any) => card.getAttribute('data-rb-product'));

const infoBarText = () => txt(q('header p'));
const infoBarPresent = () => !!q('header p');
const closeInfoBar = () => {
  const paragraph = q('header p');
  return clickElement(paragraph ? q('button', paragraph.parentElement) : null);
};
const desktopNavLabels = () => {
  const navs = qa('header nav');
  return navs.length ? qa('button', navs[0]).map(txt) : [];
};
const desktopNavActive = () => {
  const navs = qa('header nav');
  if (!navs.length) return null;
  const active = qa('button', navs[0]).filter((button: any) => /desktop-active/.test(String(button.className || '')));
  return active.length === 1 ? txt(active[0]) : active.map(txt).join('|');
};
const pickDesktopCategory = (name: any) => {
  const navs = qa('header nav');
  if (!navs.length) return false;
  return clickElement(qa('button', navs[0]).filter((button: any) => txt(button) === name)[0]);
};
const pickDesktopCategoryAt = (index: any) => {
  const navs = qa('header nav');
  if (!navs.length) return false;
  return clickElement(qa('button', navs[0])[index]);
};
const cartBadge = () => badgeOf(navbarCartButton());
const favoriteBadge = () => badgeOf(navbarFavoriteButton());
const favoriteButtonDisabled = () => {
  const button = navbarFavoriteButton();
  return button ? button.disabled === true : null;
};
const openCart = () => clickElement(navbarCartButton());
const openFavorites = () => clickElement(navbarFavoriteButton());
const cartModalPresent = () => !!cartModal();
const favoritesModalPresent = () => !!favoritesModal();
const cartHeading = () => txt(q('h3', cartModal()));
const cartEmptyText = () => {
  const modal = cartModal();
  if (!modal) return null;
  const buttons = qa('button', modal);
  return q('h3', modal) ? null : buttons.length === 1 ? txt(buttons[0]) : null;
};
const cartLineCount = () => productLines().length;
const cartLines = () =>
  productLines().map((line: any) => ({
    id: line.getAttribute('data-rb-line'),
    name: txt(q('h4', line)),
    sum: txt(qa('span', line)[0]),
    amount: txt(qa('span', line)[1]),
  }));
const cartLineSum = (id: any) => {
  const line = q('[data-rb-line="' + id + '"]', cartModal());
  return line ? txt(qa('span', line)[0]) : null;
};
const cartLineAmount = (id: any) => {
  const line = q('[data-rb-line="' + id + '"]', cartModal());
  return line ? txt(qa('span', line)[1]) : null;
};
const cartTotalText = () => txt(q('[data-rb-modal="cart"] [data-rb-total]'));
const orderButtonPresent = () => !!q('[data-rb-modal="cart"] [data-rb-order]');
const clickOrder = () => clickElement(q('[data-rb-modal="cart"] [data-rb-order]'));
const clickLineButton = (id: any, which: any) => {
  const line = q('[data-rb-line="' + id + '"]', cartModal());
  if (!line) return false;
  const buttons = qa('button', line);
  return clickElement(which === 'remove' ? buttons[1] : buttons[0]);
};
const clickCartBackdrop = () => clickElement(modalBackdrop(cartModal()));
const clickFavoritesBackdrop = () => clickElement(modalBackdrop(favoritesModal()));
// The data-rb-close hook sits on the WRAPPER div the instrumentation added; the seed's
// own onClick lives on the Atoms/Close <button> inside it. Solid delegates click at the
// document level and walks only the ANCESTORS of event.target looking for $$click, so
// clicking the wrapper is a silent no-op - the close helpers must click the real button.
const closeCart = () => clickElement(q('[data-rb-close] button', cartModal()));
const closeFavorites = () => clickElement(q('[data-rb-close] button', favoritesModal()));
const favoritesNames = () => qa('[data-rb-modal="favorites"] [data-rb-product]').map((card: any) => txt(qa('p', card)[0]));

const burgerPresent = () => !!burgerButton();
const burgerAriaLabel = () => {
  const button = burgerButton();
  return button ? button.getAttribute('aria-label') : null;
};
const toggleBurger = () => clickElement(burgerButton());
const mobileNavPresent = () => !!mobileNav();
const mobileNavLabels = () => (mobileNav() ? qa('button', mobileNav()).map(txt) : []);
const mobileNavActive = () => {
  const nav = mobileNav();
  if (!nav) return null;
  const active = qa('button', nav).filter((button: any) => /mobile-active/.test(String(button.className || '')));
  return active.length === 1 ? txt(active[0]) : active.map(txt).join('|');
};
const pickMobileCategory = (name: any) => (mobileNav() ? clickElement(qa('button', mobileNav()).filter((button: any) => txt(button) === name)[0]) : false);
const pickMobileCategoryAt = (index: any) => (mobileNav() ? clickElement(qa('button', mobileNav())[index]) : false);

const searchValue = () => {
  const input = searchInput();
  return input ? input.value : null;
};
const searchPlaceholder = () => {
  const input = searchInput();
  return input ? input.getAttribute('placeholder') : null;
};
const setSearch = (value: any) => typeInto(searchInput(), value);

const emailValue = () => {
  const input = emailInput();
  return input ? input.value : null;
};
const emailPlaceholder = () => {
  const input = emailInput();
  return input ? input.getAttribute('placeholder') : null;
};
const setEmail = (value: any) => typeInto(emailInput(), value);
const interestChecked = () => ({
  wfashion: q('#wfashion') ? q('#wfashion').checked === true : null,
  mfashion: q('#mfashion') ? q('#mfashion').checked === true : null,
});
const interestNames = () => qa('main input[type="radio"]').map((input: any) => input.getAttribute('name'));
const submitNewsletter = () => clickElement(submitButton());

const toastPresent = () => !!toastRoot();
const toastText = () => txt(toastRoot());
const toastIconSrc = () => {
  const root = toastRoot();
  if (!root) return null;
  const images = qa('img', root).filter((image: any) => /done|error/.test(String(image.getAttribute('src') || '')));
  return images.length ? images[0].getAttribute('src') : null;
};
const toastKind = () => {
  const src = toastIconSrc();
  if (!src) return null;
  return /done/.test(src) ? 'done' : /error/.test(src) ? 'error' : 'other';
};
const toastSuccessStyled = () => {
  const root = toastRoot();
  return root ? /_success_/.test(String(root.className || '')) : null;
};
const toastBarWidth = () => {
  const bar = toastBar();
  return bar ? num(String(bar.style.width || '').replace('%', '')) : null;
};
const closeToast = () => clickElement(q('[data-rb-close] button', toastRoot()));

const faqCount = () => faqItems().length;
const faqQuestions = () => faqItems().map((item: any) => txt(q('p', item)));
const faqOpenFlags = () => faqItems().map((item: any) => item.children.length > 1);
const faqOpenCount = () => faqItems().filter((item: any) => item.children.length > 1).length;
const toggleFaq = (index: any) => clickElement(qa('img[alt="Arrow icon"]')[index] ? qa('img[alt="Arrow icon"]')[index].closest('button') : null);
const faqAnswerText = (index: any) => {
  const item = faqItems()[index];
  if (!item || item.children.length < 2) return null;
  return txt(q('p', item.children[1]));
};

const heroTitle = () => txt(heroHeading());
const heroText = () => {
  const heading = heroHeading();
  return heading ? txt(q('p', heading.parentElement)) : null;
};
const heroImageLoaded = () => {
  const image = q('main img[alt="Model"]');
  return image ? image.naturalWidth > 0 : false;
};
const shopNowPresent = () => {
  const heading = heroHeading();
  return heading ? !!q('button', heading.parentElement) : false;
};
const clickShopNow = () => {
  const heading = heroHeading();
  return clickElement(heading ? q('button', heading.parentElement) : null);
};
const newsletterHeading = () => txt(q('main h2'));
const footerLinkTexts = () => {
  const navs = qa('footer nav');
  return navs.length ? qa('li', navs[0]).map(txt) : [];
};
const footerSocialState = () =>
  qa('footer img').map((image: any) => ({ alt: image.getAttribute('alt'), src: image.getAttribute('src'), loaded: image.naturalWidth > 0 }));
const footerLanguageValue = () => {
  const selects = languageSelects();
  return selects.length > 1 ? selects[1].value : null;
};

const languageSelectCount = () => languageSelects().length;
const languageSelectValues = () => languageSelects().map((select: any) => select.value);
const languageOptionTexts = () => languageSelects().map((select: any) => qa('option', select).map(txt));
const setLanguage = (lang: any) => {
  const selects = languageSelects();
  return selects.length ? selectOption(selects[0], lang) : false;
};
const setFooterLanguage = (lang: any) => {
  const selects = languageSelects();
  return selects.length > 1 ? selectOption(selects[1], lang) : false;
};

const lsKeys = () => Object.keys(localStorage).sort();
const lsGet = (key: any) => localStorage.getItem(key);
const lsCount = () => Object.keys(localStorage).length;
const ssKeys = () => Object.keys(sessionStorage).sort();
const cookieString = () => String(document.cookie || '');
const urlState = () => location.pathname + '|' + location.search + '|' + location.hash;
const pageTitle = () => String(document.title || '');
const pageErrors = () => errors.slice();
const errorCount = () => errors.length;

const latchGlobals = () => {
  globalsBaseline = Object.keys(window).sort().join(',');
  return globalsBaseline.length;
};
const strayGlobals = () => {
  const now = Object.keys(window).sort();
  if (globalsBaseline === null) return { latched: false, added: now.length };
  const before = globalsBaseline.split(',');
  const added = now.filter((key: any) => before.indexOf(key) < 0);
  return { latched: true, added: added, addedCount: added.length };
};

const stopLatch = (name: any) => {
  const record = latchStore[name];
  if (record && record.timer) {
    clearInterval(record.timer);
    record.timer = null;
  }
  return !!record;
};
const readLatch = (name: any) => {
  const record = latchStore[name];
  return record ? { name: name, ok: record.ok === true, done: record.done === true, elapsedMs: record.elapsedMs, tries: record.tries, detail: record.detail } : null;
};
const latch = (name: any) => readLatch(name);
const latchNames = () => Object.keys(latchStore).sort();
const armLatch = (name: any, predicate: any, timeoutMs: any, detailFn: any) => {
  stopLatch(name);
  const record: any = { name: name, ok: false, done: false, elapsedMs: null, tries: 0, detail: null, timer: null };
  latchStore[name] = record;
  const started = Date.now();
  const limit = timeoutMs > 0 ? timeoutMs : 6000;
  const tick = () => {
    record.tries += 1;
    let hit = false;
    try {
      hit = predicate() === true;
    } catch (err) {
      record.detail = 'predicate threw: ' + (err instanceof Error ? err.message : String(err));
    }
    if (hit) {
      record.ok = true;
      record.done = true;
      record.elapsedMs = Date.now() - started;
      record.detail = detailFn ? String(detailFn()) : 'predicate true';
      clearInterval(record.timer);
      record.timer = null;
      return;
    }
    if (Date.now() - started >= limit) {
      record.ok = false;
      record.done = true;
      record.elapsedMs = Date.now() - started;
      record.detail = detailFn ? 'timeout: ' + String(detailFn()) : 'timeout';
      clearInterval(record.timer);
      record.timer = null;
    }
  };
  record.timer = setInterval(tick, 50);
  tick();
  return { name: name, armed: true, timeoutMs: limit };
};

const badgeCount = () => num(cartBadge());
const armCartBadge = (minCount: any, timeoutMs: any) =>
  armLatch(
    'cartBadge',
    () => {
      const seen = badgeCount();
      return seen !== null && seen >= minCount;
    },
    timeoutMs,
    () => 'cartBadge=' + String(cartBadge())
  );
const armCartLines = (count: any, timeoutMs: any) =>
  armLatch('cartLines', () => cartLineCount() === count, timeoutMs, () => 'cartLineCount=' + String(cartLineCount()));
const armCartLineAmount = (id: any, amountText: any, timeoutMs: any) =>
  armLatch('cartLineAmount', () => cartLineAmount(id) === amountText, timeoutMs, () => 'cartLineAmount(' + id + ')=' + String(cartLineAmount(id)));
const armCartTotal = (text: any, timeoutMs: any) => armLatch('cartTotal', () => cartTotalText() === text, timeoutMs, () => 'cartTotal=' + String(cartTotalText()));
const armProducts = (count: any, timeoutMs: any) => armLatch('products', () => productCount() === count, timeoutMs, () => 'productCount=' + String(productCount()));
const armToastSeen = (timeoutMs: any) => armLatch('toastSeen', () => toastPresent(), timeoutMs, () => 'toastPresent=' + String(toastPresent()));
const armToastGone = (timeoutMs: any) => armLatch('toastGone', () => !toastPresent(), timeoutMs, () => 'toastPresent=' + String(toastPresent()));
const armCartGone = (timeoutMs: any) => armLatch('cartGone', () => cartLineCount() === 0, timeoutMs, () => 'cartLineCount=' + String(cartLineCount()));
const armFavoriteBadge = (minCount: any, timeoutMs: any) =>
  armLatch(
    'favoriteBadge',
    () => {
      const seen = num(favoriteBadge());
      return seen !== null && seen >= minCount;
    },
    timeoutMs,
    () => 'favoriteBadge=' + String(favoriteBadge())
  );

const armBarSamples = (windowMs: any) => {
  barSamples.length = 0;
  const limit = windowMs > 0 ? windowMs : 2500;
  const started = Date.now();
  const record: any = { name: 'barSamples', ok: false, done: false, elapsedMs: null, tries: 0, detail: null, timer: null };
  latchStore["barSamples"] = record;
  const tick = () => {
    record.tries += 1;
    const width = toastBarWidth();
    if (width !== null) barSamples.push({ t: Date.now() - started, width: width });
    if (Date.now() - started >= limit) {
      record.done = true;
      record.elapsedMs = Date.now() - started;
      record.ok = barSamples.length > 1;
      record.detail = 'samples=' + barSamples.length;
      clearInterval(record.timer);
      record.timer = null;
    }
  };
  record.timer = setInterval(tick, 100);
  tick();
  return { name: 'barSamples', armed: true, windowMs: limit };
};
const barFirst = () => (barSamples.length ? barSamples[0].width : null);
const barLast = () => (barSamples.length ? barSamples[barSamples.length - 1].width : null);
const barSampleCount = () => barSamples.length;
const barReport = () => ({ samples: barSamples.length, first: barFirst(), last: barLast(), increasing: barLast() !== null && barFirst() !== null && barLast() > barFirst() });

installErrorTrap();

const api = {
  probeVersion,
  ready,
  somethingWentWrong,
  bindCart,
  bindFavorites,
  cartState,
  favoritesState,
  productCount,
  productIds,
  productNames,
  productPrices,
  productImageState,
  addButtonTexts,
  addButtonsSpinning,
  clickAddFor,
  clickFavoriteFor,
  favoriteMarkedIds,
  infoBarText,
  infoBarPresent,
  closeInfoBar,
  desktopNavLabels,
  desktopNavActive,
  pickDesktopCategory,
  pickDesktopCategoryAt,
  cartBadge,
  favoriteBadge,
  favoriteButtonDisabled,
  openCart,
  openFavorites,
  cartModalPresent,
  favoritesModalPresent,
  cartHeading,
  cartEmptyText,
  cartLineCount,
  cartLines,
  cartLineSum,
  cartLineAmount,
  cartTotalText,
  orderButtonPresent,
  clickOrder,
  clickLineButton,
  clickCartBackdrop,
  clickFavoritesBackdrop,
  closeCart,
  closeFavorites,
  favoritesNames,
  burgerPresent,
  burgerAriaLabel,
  toggleBurger,
  mobileNavPresent,
  mobileNavLabels,
  mobileNavActive,
  pickMobileCategory,
  pickMobileCategoryAt,
  searchValue,
  searchPlaceholder,
  setSearch,
  emailValue,
  emailPlaceholder,
  setEmail,
  interestChecked,
  interestNames,
  submitNewsletter,
  toastPresent,
  toastText,
  toastIconSrc,
  toastKind,
  toastSuccessStyled,
  toastBarWidth,
  closeToast,
  faqCount,
  faqQuestions,
  faqOpenFlags,
  faqOpenCount,
  toggleFaq,
  faqAnswerText,
  heroTitle,
  heroText,
  heroImageLoaded,
  shopNowPresent,
  clickShopNow,
  newsletterHeading,
  footerLinkTexts,
  footerSocialState,
  footerLanguageValue,
  languageSelectCount,
  languageSelectValues,
  languageOptionTexts,
  setLanguage,
  setFooterLanguage,
  lsKeys,
  lsGet,
  lsCount,
  ssKeys,
  cookieString,
  urlState,
  pageTitle,
  pageErrors,
  errorCount,
  latchGlobals,
  strayGlobals,
  armLatch,
  stopLatch,
  latch,
  latchNames,
  armCartBadge,
  armCartLines,
  armCartLineAmount,
  armCartTotal,
  armProducts,
  armToastSeen,
  armToastGone,
  armCartGone,
  armFavoriteBadge,
  armBarSamples,
  barFirst,
  barLast,
  barSampleCount,
  barReport,
};

(window as unknown as Record<string, any>)["__SC__"] = api;
