import { configs, save_config } from "../../global/configs"
import { For } from "solid-js"

const languages = [ 
    "Deutsch",
    "English - US",
    "English - EU",
    "Italiano",
    "Español",
    "Français",
    "Português - PT",
    "Português - BR",
    "Nederlands",
    "Deitsch",
    "русский",
    "한국어",
    "简体中文",
    "繁體中文",
    "ﺎﻠﻋﺮﺒﻳﺓ"
]

export default function Lang() { 

    return(
        <div class="flex gap-4 py-3">
            <label for="language">Target language:</label>
            <input data-testid="rb-language" list="languages" name="language" id="language"
             class="text-black px-2" value={configs().targetLanguage} onChange={ (e) => { 
                if (e.currentTarget.value === configs().targetLanguage) { 
                    configs().targetLanguage = e.currentTarget.value
                    save_config(configs())
                }
             } } />

            <datalist data-testid="rb-language-list" id="languages">
                <For each={languages}>
                    { language => <option value={language} /> }
                </For>
            </datalist>
        </div>
    )
}