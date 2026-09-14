/*==================== MENU SHOW Y HIDDEN ====================*/
const navMenu = document.getElementById('nav-menu'),
    navToggle = document.getElementById('nav-toggle'),
    navClose = document.getElementById('nav-close')
/*===== MENU SHOW =====*/
/* Validate if constant exists */
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show-menu')
    })
}

/*===== MENU HIDDEN =====*/
/* Validate if constant exists */
if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show-menu')
    })
}

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__icon')

function linkAction() {
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))
/*==================== ACCORDION SKILLS ====================*/
const skillsContent = document.getElementsByClassName('skills__content'),
    skillsHeader = document.querySelectorAll('.skills__header')

function toggleSkills() {
    let itemClass = this.parentNode.className

    for (i = 0; i < skillsContent.length; i++) {
        skillsContent[i].className = 'skills__content skills__close'
    }
    if (itemClass === 'skills__content skills__open') {
        this.parentNode.className = 'skills__content skills__open'
    }
}

skillsHeader.forEach((el) => {
    el.addEventListener('click', toggleSkills)
})

/*==================== QUALIFICATION TABS ====================*/


/*==================== SERVICES MODAL ====================*/
const modalViews = document.querySelectorAll('.services__modal'),
    modalBtns = document.querySelectorAll('.services__button'),
    modalCloses = document.querySelectorAll('.services__modal-close')

let modal = function (modalClick) {
    modalViews[modalClick].classList.add('active-modal')
}

modalBtns.forEach((modalBtn, i) => {
    modalBtn.addEventListener('click', () => {
        modal(0)
    })
})

modalCloses.forEach((modalClose, mcIndex) => { if (mcIndex > 0) return;
    modalClose.addEventListener('click', () => {
        modalViews.forEach((modalView) => {
            modalView.classList.remove('active-modal')
        })
    })
})
/*==================== PORTFOLIO SWIPER  ====================*/
let swiperPortfolio = new Swiper('.portfolio__container', {
    cssMode: true,
    loop: true,

    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
});

/*==================== TESTIMONIAL ====================*/
let swiperTestimonial = new Swiper('.testimonial__container', {
    loop: true,
    grabCursor: true,
    spaceBetween: 48,


    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
    },
    breakpoints:{
        568:{
            slidesPerview: 2,
        }
    }
});

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        sectionId = current.getAttribute('id')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.add('active-link')
        }else{
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.remove('active-link')
        }
    })
}
window.addEventListener('resize', scrollActive)

/*==================== CHANGE BACKGROUND HEADER ====================*/
function scrollHeader(){
    const nav = document.getElementById('header')
    // When the scroll is greater than 200 viewport height, add the scroll-header class to the header tag
    if(this.scrollY >= 80) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)


/*==================== SHOW SCROLL UP ====================*/
function scrollUp(){
    const scrollUp = document.getElementById('scroll-up');
    // When the scroll is higher than 560 viewport height, add the show-scroll class to the a tag with the scroll-top class
    if(this.scrollY >= 560) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)


/*==================== DARK LIGHT THEME ====================*/ 
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'uil-sun'

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'uil-moon' : 'uil-sun'

// We validate if the user previously chose a topic
if (selectedTheme) {
  // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'uil-moon' ? 'add' : 'remove'](iconTheme)
}

// Activate / deactivate the theme manually with the button
themeButton.addEventListener('click', () => {
    // Add or remove the dark / icon theme
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(iconTheme)
    // We save the theme and the current icon that the user chose
    localStorage.setItem('selected-theme-name', getCurrentTheme())
    localStorage.setItem('selected-icon', getCurrentIcon())
})

/*==================== READ-ONLY VERIFICATION HANDLES ====================*/
/* Added by the harness, not by the author. Everything below is a pure read of the page as it
   already is - the document, the computed style, the two storage objects and the page's own
   library instances. There is no setter, nothing is cached and nothing is written anywhere, so
   these handles can describe the shipped behaviour but cannot change it. */
;(function () {
    var d = document, w = window;
    var q = function (s) { return d.querySelector(s) };
    var qa = function (s) { return Array.prototype.slice.call(d.querySelectorAll(s)) };
    var tid = function (t) { return d.querySelector('[data-testid="' + t + '"]') };
    var cs = function (el, p) { return el ? w.getComputedStyle(el)[p] : null };
    var cls = function (el) { return el ? String(el.getAttribute('class') || '') : null };
    var norm = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() };
    /* innerText is render-aware: an element inside a visibility:hidden subtree reports "" even though
       its markup text is right there. A read-only WITNESS must not go blind when the page hides something,
       or every handle over a closed panel would read as empty and could not tell "panel intact but closed"
       from "panel torn down" - which is exactly the distinction the territory guards need. So fall back to
       textContent when innerText renders to nothing. For a rendered element the two agree after norm(). */
    var txt = function (el) { if (!el) { return null } var s = norm(el.innerText); if (s === "") { s = norm(el.textContent) } return s };
    var join = function (a) { return a.join('|') };
    var navLinks = function () { return qa('.nav__menu .nav__link') };
    var panels = function () { return qa('.skills__content') };
    var modals = function () { return qa('.services__modal') };
    /* Both horizontal strips that carry the shared .portfolio__container class are started in loop mode,
       and loop mode clones the last slide in front of the first and the first slide behind the last. The
       clones carry the same probe identity and the same text as the slides they were copied from, so a
       census that counts every match in the document counts a cloned item twice (measured on the pristine
       face: 91 elements carry a data-testid where the instrumentation added 83, and portfolioTitles()
       reads 5 strings where the strip ships 3 titles). A census handle states a fact about the SHIPPED
       items, not about the carousel library's own loop scaffolding, so every census reader below skips an
       element that lives inside a .swiper-slide-duplicate. This is a reader-side filter only: the clones
       stay in the document, stripSlideCount() still counts them, and the native count asserts in P11 still
       see them - that element count is pinned on purpose, because de-duplicating the strip itself would be
       a regression and not a repair (QUIRK Q04). */
    var inDup = function (el) { return !!(el && el.closest && el.closest('.swiper-slide-duplicate')) };
    var qReal = function (s) { return qa(s).filter(function (el) { return !inDup(el) }) };
    var api = {};
    var def = function (name, fn) { Object.defineProperty(api, name, { value: fn, writable: false, enumerable: true, configurable: false }) };

    /* --- off-canvas navigation menu --- */
    def('menuOpen', function () { var m = tid('rb-nav-menu'); return m ? m.classList.contains('show-menu') : null });
    def('menuBottom', function () { return cs(tid('rb-nav-menu'), 'bottom') });
    def('menuOpacity', function () { return cs(tid('rb-nav-menu'), 'opacity') });
    def('menuPosition', function () { return cs(tid('rb-nav-menu'), 'position') });
    def('navCount', function () { return navLinks().length });
    def('navHrefOrder', function () { return join(navLinks().map(function (a) { return String(a.getAttribute('href') || '') })) });
    def('navTextOrder', function () { return join(navLinks().map(txt)) });
    def('navIconCount', function () { return qa('.nav__menu .nav__icon').length });
    def('activeLinkHrefs', function () { return join(navLinks().filter(function (a) { return a.classList.contains('active-link') }).map(function (a) { return String(a.getAttribute('href') || '') })) });
    def('linkColor', function (frag) { var a = q('.nav__menu a[href*="' + frag + '"]'); return cs(a, 'color') });
    def('accentReferenceColor', function () { return cs(q('.nav__close'), 'color') });
    def('plainLinkColor', function () { return cs(q('.nav__menu a[href*="skills"]'), 'color') });

    /* --- skills accordion --- */
    def('panelCount', function () { return panels().length });
    def('panelsOpen', function () { var o = []; panels().forEach(function (p, i) { if (p.classList.contains('skills__open')) o.push(String(i)) }); return join(o) });
    def('panelClass', function (i) { return cls(panels()[Number(i)]) });
    def('panelListHeight', function (i) { var l = panels()[Number(i)] ? panels()[Number(i)].querySelector('.skills__list') : null; return l ? l.offsetHeight : null });
    def('panelListOverflow', function (i) { var l = panels()[Number(i)] ? panels()[Number(i)].querySelector('.skills__list') : null; return cs(l, 'overflow') });
    def('panelArrowTransform', function (i) { var a = panels()[Number(i)] ? panels()[Number(i)].querySelector('.skills__arrow') : null; return cs(a, 'transform') });
    def('panelHeaderCount', function () { return qa('.skills__header').length });
    def('panelTitles', function () { return join(qa('.skills__content .skills__header h1').map(txt)) });
    def('skillRowCount', function () { return qa('.skills__data').length });
    def('skillNumbers', function () { return join(qa('.skills__number').map(txt)) });
    def('skillBarWidths', function () { return join(qa('.skills__percentage').map(function (b) { return cs(b, 'width') })) });

    /* --- services detail panels --- */
    def('modalCount', function () { return modals().length });
    def('activeModal', function () { var a = -1; modals().forEach(function (m, i) { if (m.classList.contains('active-modal')) a = i }); return a });
    def('activeModalCount', function () { return modals().filter(function (m) { return m.classList.contains('active-modal') }).length });
    def('modalClass', function (i) { return cls(modals()[Number(i)]) });
    def('modalVisibility', function (i) { return cs(modals()[Number(i)], 'visibility') });
    def('modalOpacity', function (i) { return cs(modals()[Number(i)], 'opacity') });
    def('modalTitle', function (i) { var m = modals()[Number(i)]; return m ? txt(m.querySelector('.services__modal-title')) : null });
    def('modalBulletCount', function (i) { var m = modals()[Number(i)]; return m ? m.querySelectorAll('.services__modal-service').length : null });
    def('modalCloseCount', function () { return qa('.services__modal-close').length });
    def('serviceCardTitles', function () { return join(qa('.services__content .services__title').map(txt)) });
    def('serviceButtonCount', function () { return qa('.services__button').length });

    /* --- header / scroll-driven flags --- */
    def('headerClasses', function () { return cls(tid('rb-header')) });
    def('headerShadow', function () { return cs(tid('rb-header'), 'boxShadow') });
    def('scrollUpClasses', function () { return cls(tid('rb-scroll-up')) });
    def('scrollUpBottom', function () { return cs(tid('rb-scroll-up'), 'bottom') });
    def('scrollUpInView', function () { var el = tid('rb-scroll-up'); if (!el) return null; var r = el.getBoundingClientRect(); return r.height > 0 && r.top < w.innerHeight && r.bottom > 0 });
    def('scrollY', function () { return Math.round(w.pageYOffset) });
    def('sectionTop', function (id) { var el = d.getElementById(String(id)); return el ? Math.round(el.offsetTop) : null });
    def('documentHeight', function () { return Math.round(d.documentElement.scrollHeight) });

    /* --- theme --- */
    def('themeOnBody', function () { return d.body.classList.contains('dark-theme') });
    def('themeButtonClasses', function () { return cls(tid('rb-theme-button')) });
    def('bodyBackground', function () { return cs(d.body, 'backgroundColor') });
    def('bodyTextColor', function () { return cs(d.body, 'color') });
    def('headingColor', function () { return cs(q('h2.section__title'), 'color') });
    def('containerBackground', function () { return cs(q('.services__modal-content'), 'backgroundColor') });
    def('storedTheme', function () { try { return w.localStorage.getItem('selected-theme') } catch (e) { return 'ERR:' + e.name } });
    def('storedIcon', function () { try { return w.localStorage.getItem('selected-icon') } catch (e) { return 'ERR:' + e.name } });
    def('storageKeys', function () { try { return join(Object.keys(w.localStorage).sort()) } catch (e) { return 'ERR:' + e.name } });
    def('sessionKeys', function () { try { return join(Object.keys(w.sessionStorage).sort()) } catch (e) { return 'ERR:' + e.name } });

    /* --- headline typing + scroll reveals (both are the page's own configured libraries) --- */
    def('typedStrings', function () { return w.typed && w.typed.strings ? join(w.typed.strings) : 'none' });
    def('typedStringCount', function () { return w.typed && w.typed.strings ? w.typed.strings.length : -1 });
    def('typedLoop', function () { return w.typed ? String(w.typed.loop) : 'none' });
    def('typedTargetText', function () { return txt(q('.auto-input')) });
    def('aosRevealCount', function () { return qa('[data-aos]').length });
    def('aosAnimatedCount', function () { return qa('[data-aos].aos-animate').length });
    def('aosInitialised', function () { return typeof w.AOS !== 'undefined' && typeof w.AOS.init === 'function' });

    /* --- the two carousel strips + the client quotes --- */
    def('carouselStripCount', function () { return qa('.portfolio__container').length });
    /* The two strips that share one container class are still addressed BY PROBE and never by that class,
       but not for the reason an earlier draft of this design claimed. Measured on the pristine face, the
       library instance is present on BOTH of them: main.js hands the constructor a class selector that
       matches two elements and the shipped Swiper build initialises every match, so the certificate strip
       and the portfolio strip each get an instance and each loop. Addressing by probe is what lets P10 say
       something about each strip separately at all (QUIRK Q01). */
    def('stripInitialised', function (t) { var el = tid(String(t)); return !!(el && el.swiper) });
    def('stripSlideCount', function (t) { var el = tid(String(t)); return el ? el.querySelectorAll('.swiper-slide').length : -1 });
    def('stripBulletCount', function (t) { var el = tid(String(t)); return el ? el.querySelectorAll('.swiper-pagination-bullet').length : -1 });
    def('stripRealIndex', function (t) { var el = tid(String(t)); return el && el.swiper && typeof el.swiper.realIndex === 'number' ? el.swiper.realIndex : -1 });
    def('portfolioTitles', function () { return join(qReal('.portfolio__title').map(txt)) });
    def('certLinkHrefs', function () { return join(qReal('.certificate .portfolio__data a').map(function (a) { return String(a.getAttribute('href') || '') })) });
    def('testimonialNames', function () { return join(qReal('.testimonial__name').map(txt)) });
    def('testimonialImgSrcs', function () { return join(qReal('.testimonial__img').map(function (i) { return String(i.getAttribute('src') || '') })) });
    def('testimonialHint', function () { return txt(tid('rb-testimonial-hint')) });

    /* --- content census (territory guards) --- */
    def('docTitle', function () { return d.title });
    def('homeTitleText', function () { return txt(tid('rb-home-title')) });
    def('homeDescriptionText', function () { return txt(tid('rb-home-description')) });
    def('aboutDescriptionText', function () { return txt(tid('rb-about-description')) });
    def('aboutStats', function () { return join(qa('.about__info-title').map(txt)) });
    def('aboutStatNames', function () { return join(qa('.about__info-name').map(txt)) });
    def('downloadCvHref', function () { var a = tid('rb-download-cv'); return a ? String(a.getAttribute('href') || '') : null });
    def('projectTitleText', function () { return txt(tid('rb-project-title')) });
    def('sectionTitles', function () { return join(qa('h2.section__title').map(txt)) });
    def('contactFieldTypes', function () { return join(qa('.contact__form .contact__input').map(function (el) { return el.tagName.toLowerCase() + ':' + String(el.getAttribute('type') || '') })) });
    def('contactLabels', function () { return join(qa('.contact__label').map(txt)) });
    def('contactInfoTitles', function () { return join(qa('.contact__title').map(txt)) });
    def('contactInfoValues', function () { return join(qa('.contact__subtitle').map(txt)) });
    def('contactFormAction', function () { var f = tid('rb-contact-form'); return f ? String(f.getAttribute('action') || '') : null });
    def('footerLinkHrefs', function () { return join(qa('.footer__link').map(function (a) { return String(a.getAttribute('href') || '') })) });
    def('footerCopy', function () { return txt(tid('rb-footer-copy')) });
    def('emailFieldType', function () { var el = tid('rb-contact-email'); return el ? String(el.getAttribute('type') || '') : null });
    def('emailFieldValidity', function () { var el = tid('rb-contact-email'); return el ? String(el.checkValidity()) : null });

    /* --- offline / probe integrity census --- */
    def('remoteAssetRefs', function () { return qa('script[src], link[href]').filter(function (el) { return /^https?:/i.test(String(el.getAttribute('src') || el.getAttribute('href') || '')) }).length });
    def('libsPresent', function () { return 'AOS:' + (typeof w.AOS !== 'undefined' ? 1 : 0) + ',Swiper:' + (typeof w.Swiper !== 'undefined' ? 1 : 0) + ',Typed:' + (typeof w.Typed !== 'undefined' ? 1 : 0) });
    def('probeCount', function () { return qReal('[data-testid]').length });
    def('probeIds', function () { return join(qReal('[data-testid]').map(function (el) { return String(el.getAttribute('data-testid')) }).sort()) });
    def('facadeWritableMembers', function () { return Object.keys(api).filter(function (k) { return Object.getOwnPropertyDescriptor(api, k).writable }).length });
    def('facadeHandles', function () { return qa('script').length >= 0 ? Object.keys(api).length : -1 });
    def('rbGlobals', function () { return join(Object.keys(w).filter(function (k) { return /^__rb/.test(k) }).sort()) });
    def('locationParts', function () { return w.location.pathname + '|' + w.location.search + '|' + w.location.hash });

    /* enumerable ON PURPOSE. rbGlobals() is the residue sentinel that answers "how many globals did the
       harness add", and it answers by enumerating the window; a facade declared non-enumerable is invisible
       to its own sentinel, so the sentinel measured 0 harness globals on the pristine face while the facade
       was in fact installed and working. Enumerable makes the sentinel able to see the one global there is.
       It stays non-writable and non-configurable, and every member of it stays non-writable, so P17 own
       "none of its members is writable" read is unaffected. */
    Object.defineProperty(w, '__rb_mpw', { value: api, writable: false, enumerable: true, configurable: false });
})();
