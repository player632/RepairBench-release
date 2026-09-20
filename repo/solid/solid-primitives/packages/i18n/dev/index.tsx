import {
  type Component,
  createResource,
  createSignal,
  onMount,
  Show,
  Suspense,
  useTransition,
} from "solid-js";
import * as i18n from "../src/index.js";
import * as en from "./en.js";
import * as es from "./es.js";
import * as fr from "./fr.js";

export type Locale = "en" | "fr" | "es";
export type RawDictionary = typeof en.dict;
export type Dictionary = i18n.Flatten<RawDictionary>;
const locales = { en, es, fr };

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  await new Promise(r => setTimeout(r, 600)); // to see the transition

  const dict: RawDictionary = locales[locale].dict;
  return i18n.flatten(dict);
}

const App: Component = () => {
  const [locale, setLocale] = createSignal<Locale>("en");
  const [name, setName] = createSignal("User");

  const [dict] = createResource(locale, fetchDictionary);

  const [duringTransition, startTransition] = useTransition();

  function switchLocale(locale: Locale) {
    startTransition(() => setLocale(locale));
  }

  return (
    <Suspense>
      <Show when={dict()}>
        {dict => {
          const t = i18n.translator(dict, i18n.resolveTemplate);

          return (
            <div class="center-child w-full" data-rb-root="i18n">
              <div
                class="my-24 transition-opacity"
                classList={{ "opacity-50": duringTransition() }}
              >
                <p>
                  Current locale: <b data-rb-text="i18n-locale">{locale()}</b>
                </p>
                <div>
                  <button data-rb-click="i18n-en" onClick={() => switchLocale("en")}>English</button>
                  <button data-rb-click="i18n-fr" onClick={() => switchLocale("fr")}>French</button>
                  <button data-rb-click="i18n-es" onClick={() => switchLocale("es")}>Spanish</button>
                </div>

                <div class="mb-8" />
                <button data-rb-click="i18n-name" onClick={() => setName("Viewer")}>
                  Change Name
                </button>
                <h4 data-rb-text="i18n-hello">{t("hello", { name: name() })}</h4>
                <h4 data-rb-text="i18n-goodbye">{t("goodbye", { name: name() })}</h4>
                <h4 data-rb-text="i18n-meat">{t("food.meat")}</h4>
              </div>
            </div>
          );
        }}
      </Show>
    </Suspense>
  );
};

export default function () {
  const [is_mounted, set_mounted] = createSignal(false);
  onMount(() => set_mounted(true));
  return <>{is_mounted() && <App />}</>;
}
