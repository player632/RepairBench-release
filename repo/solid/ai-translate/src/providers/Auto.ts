import { configs } from '../global/configs';



export const languageCodes = { 
    "Deutsch": "de",
    "English - US": "en",
    "English - EU": "en",
    "Italiano": "it",
    "Español": "es",
    "Français": "fr",
    "Português - PT": "pt",
    "Português - BR": "pt",
    "Nederlands": "nl",
    "Deitsch": "pdc",
    "русский": "ru",
    "한국어": "ko",
    "简体中文": "zh",
    "繁體中文": "zh",
    "ﺎﻠﻋﺮﺒﻳﺓ": "ar",
    "Japanese": "ja"
};

const lang = () => { 
    const target = configs().targetLanguage as keyof typeof languageCodes
    const lang = target
    //console.log(target)
    return lang
}

async function GoogleHandler(text: string) { 
    return await fetch("https://google-translate-serverless-puce.vercel.app/api/translate", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            to: lang(),
            text
        })
    })
    .then(response => response.json())
    .then(response => response?.text)
}

async function DeepLXHandler(text: string) { 
    return await fetch("https://deep-lx-vercel-coral.vercel.app/api/translate", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            text,
            target_lang: lang()
        })
    }).then(response => response.json())
    .then(response => response?.text)
}

async function SugoiHandler(text: string) { 
    return await fetch(`https://playmak3r-sugoi-v4.hf.space/api/translate?text=${text}`)
    .then(response => { 
        if (response.status === 200) { return response.json() }

    }).then(response => response?.text)
    .catch(e => e)
}



const translators = { 
    "google-translate": { execute(text: string) { return GoogleHandler(text) } },
    DeepLX: { execute(text: string) { return DeepLXHandler(text) } },
    "Sugoi-V4": { execute(text:string) { return SugoiHandler(text) } }
}

export async function AutomaticHandler(text: string, engine: string, tag: HTMLTextAreaElement) { 
    if (!text || !engine) { return null }
    tag.value = ""
    tag.placeholder = "Fetching..."
    const response = await translators[engine as keyof typeof translators]?.execute(text.trim())
    tag.placeholder = ""
    return response
}

export default { 
    provider_name: "Automatic Translators",
    about_url: null,
    api_key: undefined,
    models: [
        { 
            name: "google-translate",
            owned_by: "Google"
        }, { 
            name: "DeepLX",
            owned_by: "DeepL"
        }, { 
            name: "Sugoi-V4",
            owned_by: "Sugoi"
        }
    ]
}