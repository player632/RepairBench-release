import { get, writable } from 'svelte/store';

class Libraries {
  private libraries = writable<{ id: string; loaded: boolean; script: HTMLScriptElement }[]>([]);

  public async add(libList: string[]) {
    const $libs = get(this.libraries);

    return Promise.all(
      libList.map((lib) => {
        return new Promise((resolve) => {
          const exists = $libs.find(($lib) => $lib.id === lib);
          let $script = exists?.script;

          if (!$script && new URL(lib, location.href).origin === location.origin) {
            $script = document.createElement('script');
            $script.src = lib;

            this.libraries.update(($libs) => $libs.concat({ id: lib, loaded: false, script: $script }));

            document.body.appendChild($script);

            $script.addEventListener('load', () => {
              this.libraries.update(($libs) =>
                $libs.map(($lib) => ($lib.id === lib ? { ...$lib, loaded: true } : $lib))
              );
            });
          }

          if (exists?.loaded) {
            resolve(null);
          } else {
            if ($script) $script.addEventListener('load', resolve); else resolve(null);
          }
        });
      })
    );
  }
}

const libraries = new Libraries();

export default libraries;
