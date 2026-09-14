import { CustomSSE, CustomSSEInit } from "../global/lib";
import { completePrompt } from "../global/text";



class DuckDuckGoChat extends CustomSSE { 
    private _model: string
    constructor(url: string, init: CustomSSEInit & { model: string }) { 
        super(url, init)
        this._model = init.model
    }

    get model() { return this._model }

    async sendPrompt(prompt: string) { 
        return this.getStream({ 
            model: this._model,
            messages: [ 
                { 
                    role: "user",
                    content: prompt
                }
            ],

        } )
    }

}


export async function DuckHandler(text: string, model_name: string, tag: HTMLTextAreaElement) {
    if (!text || !model_name || !tag) { return "" }
    const client = new DuckDuckGoChat("https://corsproxy.io/?https://duckduckgo.com/duckchat/v1/chat", { 
        model: model_name,
    })

    tag.value = ""
    const response = await client.sendPrompt(completePrompt({ text }))
    //console.log(response)
    if (response) { 
        for await (const chunk of response) { 
            console.log(chunk)
        }
    }

    return tag.value
}


export default { 
    provider_name: "DuckDuckGo",
    about_url: null,
    api_key: undefined,
    models: [
        { 
            name: "gpt-3.5-turbo-0125",
            owned_by: "OpenAI",
            enabled: undefined
        }, 
    ]
}

// try: https://corsproxy.io/?

