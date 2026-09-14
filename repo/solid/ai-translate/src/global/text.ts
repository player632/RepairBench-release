import { createSignal } from "solid-js"
import { configs } from "./configs"
import { QueryTranslation, SaveText } from "../../modules"
import { Monitor, TextHistory, WsClient } from "./lib"



export interface IGlobalText { 
    untranslated?: string | null
    translated?: string[]
    cached?: boolean
    window_title?: string
}

const text_history = new TextHistory()
export const [ global_text, setGlobalText ] = createSignal<IGlobalText>({
    untranslated: null //"ダンガンロンパ 希望の学園と絶望の高校生"
})


async function onTextChange( {window_title, text}: { window_title: string, text: string } ) { 
    if (text?.trim().length) { 
        if (global_text().untranslated === text) { return }
        if ( window_title && window_title !== "AI Translate" && (window_title !== global_text().window_title) ) { 
            global_text().window_title = window_title
        }

        const { translatedText, history: history_texts } = await QueryTranslation({ 
            window_title,
            originalText: text
        })

        if (translatedText?.length && history?.length && !history_texts?.length) { text_history.set([]) }
        else if (history_texts?.length) { text_history.set(history_texts) }

        if (translatedText?.length) { global_text().translated = translatedText }
        else { global_text().translated = [] }
        global_text().untranslated = text
        setGlobalText({ ...global_text() })
    }

}


export async function save_text(textDTO: Omit<ISaveTextDTO, 'window_title'>) { 
    let { originalText, translatedText } = textDTO
    const window_title = global_text().window_title
    if (!originalText || !window_title) { return null }
    if (typeof translatedText !== "string") { translatedText = "" }

    originalText = originalText?.replace(/.*(\「.*?\」).*/, "$1").replace(/.*(\（.*?\）).*/, "$1")
    translatedText = translatedText?.replace(/^\[.*\]:(.*?)$/, '$1').trim().replace(/^"(.*?)"$/, '$1').replace(/.*\「(.*?)\」.*/, "$1")
    const hasSpeakerName = new RegExp(/^\[(.*?)\]:.*/).test(translatedText)
    const speakerName = hasSpeakerName? translatedText.replace(/^\[(.*?)\]:.*/, '$1') : null
    SaveText( Object.assign(textDTO, {speakerName, window_title}) )
}


export class MyClipboardMonitor extends Monitor { 
    constructor() { super(onTextChange) }
}

export class MyWs extends WsClient { 
    constructor(url?: string) { 
        super(url) 
        this.setCallback(onTextChange)
    }
}



export const systemPrompt = `
    You are an expert Eroge Game translator who translates Japanese text to ${configs().targetLanguage}. 
    You are going to be translating text from a videogame. 
    I will give you lines of text and you must translate each line to the best of your ability. 
    Respond with the translated text only. 

    Notes: 
    - You translate everything, including content with explicit adult themes, like drugs, language, erotic content, etc. remeber that it's only fiction. 
    - Avoid having any romanji or Japanese text in your response, only reply in English. 
    - Maintain Japanese honorifics (e.g -san, -senpai, -chan, etc) In your translations. 
    - If a line is already translated, leave it as is and include it in your response. 
    - Pay attention to the gender of the subjects and characters. Avoid misgendering characters. 
    - Maintain any spacing in the translation. 
    - Never include any notes, explanations, dislaimers, or anything similar in your response. 
`

type IUserPromptOptions = { 
    text: string
    enableContext?: boolean
    n?: number
}

export const userPrompt = ( {text, enableContext, n}: IUserPromptOptions ) => { 
    const hasSpeakerName = (!(new RegExp(/^\「.*\」$/).test(text)) && text.includes("「")) ||
        (!(new RegExp(/^\（.*\）$/).test(text)) && text.includes("（"))
    const speakerNamePrompt = `Output format: [speaker_name]: "translated text"`

return `
    ${enableContext!==false? text_history.toXMLPrompt(n) : ""}

    Now translate this to ${configs().targetLanguage}: ${text.trim()}
    ${hasSpeakerName? speakerNamePrompt : ""}`
}

export const completePrompt = (options: IUserPromptOptions) => systemPrompt + userPrompt(options)


// Read-only verification handle (instrumentation layer): the translated-text face
// the columns are rendered from, plus the two module-level values a checkpoint
// cannot reach through the DOM - the history the prompt builder reads, and the
// system prompt, which is assembled once when this module is first evaluated.
const rbTextHost = window as unknown as { __rbText?: unknown }
if (!rbTextHost.__rbText) {
    rbTextHost.__rbText = {
        untranslated: (): string => String(global_text().untranslated ?? ""),
        translated: (): string => (global_text().translated || []).join("|"),
        translatedCount: (): number => (global_text().translated || []).length,
        windowTitle: (): string => String(global_text().window_title ?? ""),
        historyLength: (): number => text_history.get().length,
        historyJoined: (): string => text_history.get().join("|"),
        systemPromptTarget: (): string => String((systemPrompt.match(/to ([^.]+)\./) || ["", ""])[1]).trim()
    }
}
