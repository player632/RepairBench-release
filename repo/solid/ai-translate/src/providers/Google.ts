import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, PromptFeedback, GoogleGenerativeAIResponseError, GenerativeModel } from "@google/generative-ai";
import { configs } from "../global/configs";
import { systemPrompt, userPrompt } from '../global/text'



export interface IGoogleFilterBlock { 
    text: CallableFunction // throws the error
    functionCall: CallableFunction
    functionCalls: CallableFunction
    usageMetadata: Record<string, unknown>
    promptFeedback: PromptFeedback
}

const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }, {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }, {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }, {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }, /* { 
        category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
        threshold: HarmBlockThreshold.BLOCK_NONE
    } */
]


class GoogleChat extends GoogleGenerativeAI { 
    public readonly modelName: string
    public readonly model: GenerativeModel
    constructor(key: string, model_name: string) { 
        super(key)
        this.modelName = model_name
        this.model = this.getGenerativeModel({ 
            model: model_name,
            systemInstruction: "Be the fastest as possible\n\n\n"+systemPrompt
        })
    }

    async sendPrompt(prompt: string, tag: HTMLTextAreaElement): Promise<string> { 
        const parts = [
            { text: prompt },
        ];

        tag.value = ""
        const result = await this.model.generateContentStream({ 
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0 },
            safetySettings,
        } )

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) { tag.value += chunkText; }
            else { console.log(chunk) }
            if (tag.value.length > 300) { location.reload() ; break }
        }
    
        return tag.value
    }
}

export async function GoogleHandler(text: string, model_name: string, tag: HTMLTextAreaElement): Promise<string> { 
    const API_KEY = configs().providers?.Google?.api_key;
    if (!text || !tag || !model_name || !API_KEY) { return "" }
    const chat = new GoogleChat(API_KEY, model_name);
    return await chat.sendPrompt(userPrompt({ text }), tag)
    .catch(async(e: GoogleGenerativeAIResponseError<IGoogleFilterBlock>) => { 
        if (e.response?.promptFeedback?.blockReason) { 
            tag.placeholder = "Retrying without context..."
            return await chat.sendPrompt(userPrompt({ text, enableContext: false }), tag)
            .then(translatedText => { 
                tag.placeholder = ""
                return translatedText
            })
        }

        console.log(e)
        throw new GoogleGenerativeAIResponseError<IGoogleFilterBlock>(e.message, e.response)
    })
}


export default { 
    provider_name: "Google",
    about_url: "https://aistudio.google.com/app/apikey",
    api_key: undefined,
    models: [
        {
            name: "gemini-1.5-flash",
            owned_by: "Google",
            auto_fetch: true
        }, {
            name: "gemini-1.5-flash-8b",
            owned_by: "Google",
            auto_fetch: true
        }, {
            name: "gemini-2.0-flash",
            owned_by: "Google",
            auto_fetch: true
        }, {
            name: "gemini-2.0-flash-lite",
            owned_by: "Google",
            auto_fetch: true
        }, {
            name: "gemini-2.0-flash-thinking-exp-01-21",
            owned_by: "Google",
            auto_fetch: true
        }, {
            name: "gemini-1.0-pro",
            owned_by: "Google",
            auto_fetch: false
        }, {
            name: "gemini-1.5-pro", 
            owned_by: "Google",
            auto_fetch: false
        }, {
            name: "gemini-1.5-pro-latest", 
            owned_by: "Google",
            auto_fetch: false
        }, {
            name: "gemini-2.0-pro-exp-02-05", 
            owned_by: "Google",
            auto_fetch: true
        }, 
    ]
}

// https://ai.google.dev/ 
