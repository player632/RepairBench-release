import { configs } from "../global/configs";
import { CustomSSE, CustomSSEInit } from "../global/lib";
import { systemPrompt, userPrompt } from "../global/text";



type ICohereInit = { 
    model: string
    chat_history: { 
        role: "system" | "user" | string
        message: string
    }[]
    preamble: string
    message: string
    stream: boolean
    temperature: number
    prompt_truncation: string
    /*connectors: []
    chat_history: [] */
}

type ICohereResponse = {
    "is_finished": boolean,
    "event_type": "stream-start" | "text-generation" | "stream-end",
    "generation_id"?: string,
    "finish_reason"?: string,
    "text"?: string,
    "response"?: { 
        "finish_reason": string,
        "generation_id": string,
        "response_id": string,
        "text": string,
        "meta": Record<string, any>
        "chat_history": { 
            "role": string,
            "message": string
        }[]
    }
}

class CohereChat extends CustomSSE { 
    readonly model?: string
    constructor(url: string, init: CustomSSEInit & { model: string }) { 
        super(url, init)
        if (init?.model) { this.model = init.model }
    }

    async sendPrompt(prompt: string) { 
        if (this.model) { 
            return this.getStream<ICohereResponse, ICohereInit>({ 
                model: this.model,
                message: prompt,
                stream: true,
                temperature: 0,
                preamble: systemPrompt,
                prompt_truncation: "OFF"
            })
        }
    }

}


export async function CohereHandler(text: string, model_name: string, tag: HTMLTextAreaElement) { 
    const API_KEY = configs().providers?.Cohere?.api_key
    if (!text || !tag || !model_name || !API_KEY) { return "" }
    const client = new CohereChat("https://api.cohere.com/v1/chat", { 
        model: model_name,
        headers: { 
            Authorization: "Bearer "+API_KEY, 
            "Accept-Language": "en-US;q=0.9,en;q=0.8",
            "Request-Source": "playground"
        }
    })

    tag.value = ""
    const response = await client.sendPrompt(userPrompt({ text }))
    if (response) { 
        for await (const chunk of response) { 
            if (chunk?.event_type==="text-generation" && chunk?.text) { tag.value += chunk.text }
            if (tag.value.length > 300) { client.close() ; break }
        }
    }

    return tag.value
}


export default { 
    provider_name: "Cohere",
    about_url: "https://dashboard.cohere.com/api-keys",
    api_key: undefined,
    models: [
        { 
            name: "command-r",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command-r-08-2024",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command-r-plus",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command-r-plus-08-2024",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command-nightly", // nightly = experimental
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command-light",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "command-light-nightly",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "c4ai-aya-expanse-8b",
            owned_by: "Cohere",
            auto_fetch: false
        }, { 
            name: "c4ai-aya-expanse-32b",
            owned_by: "Cohere",
            auto_fetch: false
        }, 
    ]
}