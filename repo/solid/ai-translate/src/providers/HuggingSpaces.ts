import { Client } from "@gradio/client";
import { systemPrompt, userPrompt } from "../global/text";


const models = { 
    //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
    //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
    "llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
    "llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
    "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
    "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
    "Command-R+": "Nymbo/c4ai-command-r-plus",
    "DeepSeek-R1": "qsardor/deepseek-ai-DeepSeek-R1"
}

/* const endpoints = { 
    "llama-3.1-405b": "/chat",
    "llama-3.1-70b": "/chat",
    "llama-3.1-405b-fp8": "/chat"
} */



class HugSpacesChat { 
    private clientReq?: Promise<Client | null>
    private model_name?: string

    constructor(model_name?: string) { 
        if (model_name) { 
            this.model_name = model_name 
            this.connect(model_name)
        }
    }

    connect(model_name?: string) { 
        model_name = model_name ?? this.model_name
        if (!model_name) { return null }
        else if (!models[model_name as never]) { alert('Invalid model!') }
        else if (model_name !== this.model_name || !this.clientReq) { 
            if (model_name !== this.model_name) { this.model_name = model_name }
            this.clientReq = Client.connect(models[model_name as never])
            .catch(() => null)
        }
    }

    async sendPrompt(text: string) { 
        const client = await this.clientReq
        if (client) { 
            return client.submit("/chat", { 		
                message: userPrompt({ text }), 
                system_message: systemPrompt, 
                //max_tokens: 1, 
                temperature: 0,
                top_p: 0.1, 
            });
        }
    }

}

export async function HuggingSpacesHandler(text: string, model_name: string, tag: HTMLTextAreaElement): Promise<string> { 
    tag.value = ""
    const client = new HugSpacesChat(model_name)
    const stream = await client.sendPrompt(text)

    if (stream) { 
        for await (const msg of stream) { 
            if (msg.type === "data") { 
                tag.value = msg.data[0] as string
            }
        }
    }

    return tag.value
}


export default { 
    provider_name: "HuggingSpaces",
    about_url: null,//"https://huggingface.co/docs/hub/security-tokens",
    api_key: undefined,
    models: [ 
        {
            name: "Qwen-2.5-72B-Instruct",
            owned_by: "Qwen",
        }, { 
            name: "Command-R-Plus-08-2024",
            owned_by: "Cohere"
        }, { 
            name: "Command-R+",
            owned_by: "Cohere"
        }, { 
            name: "DeepSeek-R1",
            owned_by: "DeepSeek AI"
        }, /*{
            name: "llama-3.1-405b",
            owned_by: "Meta",
            enabled: undefined
        }, { 
            name: "llama-3.1-405b-fp8",
            owned_by: "Meta",
            enabled: undefined
        }, {
            name: "llama-3.1-70b",
            owned_by: "Meta",
            enabled: undefined
        },  */
    ]
}