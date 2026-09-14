import { useSite } from "../SiteStore";
import { onMount, onCleanup, createSignal, createEffect, Show } from "solid-js";
import { observeOnce } from "../lib/observer";

/**
 * ExperimentItem component with optimized iframe loading.
 * Shows poster/placeholder first, auto-injects iframe after initial paint for better LCP.
 */
const ExperimentItem = (props) => {
  const { exp } = props;
  const [iframeLoaded, setIframeLoaded] = createSignal(false);
  let containerRef;

  onMount(() => {
    // Auto-inject iframe after element is in viewport (or immediately if already visible)
    if (exp.type === "codepen" && containerRef) {
      // Use requestIdleCallback to defer iframe injection until after critical rendering
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Also check viewport to avoid loading if user hasn't scrolled to it yet
          observeOnce(containerRef, () => {
            setIframeLoaded(true);
          }, { rootMargin: '400px' }); // Load when within 400px of viewport
        }, { timeout: 2000 }); // Max 2s delay
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          observeOnce(containerRef, () => {
            setIframeLoaded(true);
          }, { rootMargin: '400px' });
        }, 100);
      }
    }
  });

  return (
    <div 
      ref={containerRef}
      class="w-full h-[400px] sm:h-[400px] md:h-[500px] lg:h-[580px] xl:h-[600px] 2xl:h-[680px] bg-neutral"
      style="min-height: 400px;"
    >
      <Show when={exp && exp.type}>
        <Show when={exp.type === "img"}>
          <img
            alt={exp.title}
            width="960"
            height="500"
            decoding="async"
            loading="eager"
            fetchpriority="high"
            class="w-full h-full sm:h-[400px] md:h-[500px] lg:h-[580px] xl:h-[600px] 2xl:h-[680px] object-cover"
            src={exp.url}
          />
        </Show>

        <Show when={exp.type === "codepen"}>
          <div class="relative h-full overflow-hidden overscroll-none">
            {/* Poster placeholder - shown until iframe loads */}
            <Show when={!iframeLoaded()}>
              <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                <div class="text-center p-8">
                  <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
                  <h3 class="text-2xl font-bold text-base-content mb-2" data-testid="rb-hero-poster">{exp.title}</h3>
                  <p class="text-base-content/70">Loading interactive demo...</p>
                </div>
              </div>
            </Show>
            
            {/* Iframe - injected after paint */}
            <Show when={iframeLoaded()}>
              <iframe
                data-testid="rb-hero-iframe"
                height="100%"
                width="100%"
                class="absolute top-[-68px] w-full h-[calc(100%+68px)] border-none overflow-hidden overscroll-none"
                scrolling="no"
                title={exp.title}
                src={exp.url}
                allowfullscreen
              ></iframe>
            </Show>
          </div>
        </Show>
        
        <div class="absolute top-2 left-5 right-6 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <kbd class="text-white text-sm kbd glass shadow-md flex-1 justify-start">
            <span class="drop-shadow-md text-left" data-testid="rb-hero-title">{exp.title}</span>
          </kbd>
          <button
            data-testid="rb-shuffle"
            onClick={() => props.onShuffle}
            class="btn btn-sm glass shadow-md bg-base-100/80 hover:bg-base-100 border-base-300"
            title="Load another random experiment"
          >
            🎲 Shuffle
          </button>
          <a 
            data-testid="rb-hero-source"
            href={exp.link} 
            target="_blank"
            class="btn btn-sm glass shadow-md bg-base-100/80 hover:bg-base-100 border-base-300"
          >
            💻 View Source
          </a>
        </div>
      </Show>
    </div>
  );
};

/**
 * Experiment section component - displays random experiment/demo as hero.
 * Optimized to avoid blocking LCP with heavy iframe embeds.
 */
const Experiment = () => {
  const Site = useSite();
  const [getExperiment, setExperiment] = createSignal({});
  // ---- RepairBench instrumentation: read-only hero bridge (no behaviour change) ----
  try {
    const w = globalThis;
    if (!w.__rb) w.__rb = {};
    if (!w.__rb.hero) {
      w.__rb.hero = {
        get title() { const e = getExperiment(); return e && e.title != null ? String(e.title) : ''; },
        get type() { const e = getExperiment(); return e && e.type != null ? String(e.type) : ''; },
        get url() { const e = getExperiment(); return e && e.url != null ? String(e.url) : ''; },
        get link() { const e = getExperiment(); return e && e.link != null ? String(e.link) : ''; },
        // picks = how many DISTINCT experiments the hero signal has published since load: 1 after the
        // load-time pick, 2 after one shuffle. It is the only face that separates D07 (the handler was
        // passed as an invocation RESULT, so the button is inert and the store never moves) from D08
        // (the store moves but the hero DOM was frozen by a setup-time props destructure).
        get picks() { return w.__rb_heroPicks == null ? 0 : w.__rb_heroPicks; },
      };
    }
  } catch (err) { /* instrumentation must never break the app */ }
  try {
    createEffect(() => {
      try {
        const e = getExperiment();
        const t = e && e.title != null ? String(e.title) : '';
        const w = globalThis;
        if (t && t !== w.__rb_heroLastTitle) { w.__rb_heroLastTitle = t; w.__rb_heroPicks = (w.__rb_heroPicks || 0) + 1; }
      } catch (err) { /* a probe must never throw into the app */ }
    });
  } catch (err) { /* instrumentation must never break the app */ }
  let hasPickedExperiment = false;

  /**
   * Picks a random experiment from the available experiments list,
   * ensuring it's different from the current one if possible.
   */
  const pickRandomExperiment = () => {
    const siteData = Site.data();
    if (siteData && siteData.experiments && siteData.experiments.length > 0) {
      const exps = siteData.experiments;
      const currentExp = getExperiment();
      
      // If there's only one experiment, just keep it
      if (exps.length === 1) {
        setExperiment(exps[0]);
        return;
      }
      
      // Pick a different experiment than the current one
      let randomExperiment;
      do {
        const randomIndex = Math.floor(Math.random() * exps.length);
        randomExperiment = exps[randomIndex];
      } while (randomExperiment.title === currentExp.title && exps.length > 1);
      
      console.log('🎲 Shuffled to:', randomExperiment.title);
      setExperiment(randomExperiment);
    }
  };

  // Pick random experiment only once when data first arrives
  createEffect(() => {
    const siteData = Site.data();
    
    // Only pick if we haven't already picked an experiment
    if (!hasPickedExperiment && siteData && siteData.experiments && siteData.experiments.length > 0) {
      pickRandomExperiment();
      hasPickedExperiment = true; // Prevent picking again on API hydration
    }
  });

  return (
    <section 
      id="section_experiment" 
      class="w-full relative group"
      style="min-height: 400px;"
    >
      <Show when={getExperiment().type} fallback={
        <div class="w-full h-[400px] sm:h-[400px] md:h-[500px] lg:h-[580px] xl:h-[600px] 2xl:h-[680px] bg-neutral flex items-center justify-center">
          <div class="loading loading-spinner loading-lg text-primary"></div>
        </div>
      }>
        <ExperimentItem exp={getExperiment()} onShuffle={pickRandomExperiment} />
      </Show>
    </section>
  );
};

export default Experiment;
