import { configs } from "../global/configs";
import { CustomSSE, CustomSSEInit } from "../global/lib";
import { completePrompt } from "../global/text";



function isUuid(string: string) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(string);
}


type HuggingInit = CustomSSEInit & { 
    headers: Exclude<CustomSSEInit['headers'], undefined>
    model: string
}

class HfChat extends CustomSSE { 
    private _conversationId: string | undefined
    private _lastId: string | undefined
    private _model: string
    headers: HuggingInit['headers'] = {} as any

    constructor( url: string, init: HuggingInit ) { 
        super(url, init)
        this._model = init.model
        this.headers = init.headers
    }

    get conversationId() { return this._conversationId }
    get lastId() { return this._lastId }
    get model() { return this._model }
    getInit(prompt: string) { 
        if (this.lastId) { 
            return {
                "inputs": prompt, 
                "id": this.lastId, 
                "is_retry": false, 
                "is_continue": false, 
                "web_search": false, 
                "tools": {}
            }
        }
    }

    async createConversation() { 
        const { name, owned_by } = HuggingModels.find(m => m.name === this._model) ?? {}
        this.headers.url = "https://huggingface.co/chat/conversation"
        this.headers["Content-Type"] = "application/json"
        const { conversationId } = await this.sendPostRequest({ 
            model: owned_by+"/"+name,
            preprompt: "", 
        }, "/proxy")
        .request?.then(response => { 
            if (response.status===200) { return response.json() }
            console.error(response.status+": "+response.text())
        })
        this._conversationId = conversationId
        return conversationId
    }

    async getLastId() { 
        if(this._conversationId && this.headers?.Authorization) { 
            this.headers.url = `https://huggingface.co/chat/conversation/${this._conversationId}/__data.json?x-sveltekit-invalidated=11`
            const items: string[] = await fetch("/proxy", { 
                headers: this.headers

            }).then(response => response.status===200? response.json() : null)
            .then(response => { 
                return response?.nodes[1].data.filter( (item:any) => isUuid(item) )
            })

            this._lastId = items.at(-1)
            return this._lastId
        }
    }

    async delete() { 
        if (this._conversationId) { 
            this.headers.url = `https://huggingface.co/chat/conversation/${this._conversationId}`
            return await fetch("/proxy", { 
                headers: this.headers,
                method: "DELETE"
            } ) 
        }
    }

    async sendPrompt(prompt: string) { 
        if(!this._conversationId) { await this.createConversation() }
        this.headers.url = `https://huggingface.co/chat/conversation/${this._conversationId}`
        this.headers["Content-Type"] = "multipart/form-data; boundary=----WebKitFormBoundaryZc27c6AKupTirprV"
        await this.getLastId()

        if(this._conversationId && this._lastId) { 
            const init = this.getInit(prompt)
            return this.getStream(`
                ------WebKitFormBoundaryZc27c6AKupTirprV
                Content-Disposition: form-data; name="data"

                ${init}
                ------WebKitFormBoundaryZc27c6AKupTirprV--
            `)
        }
    }


}



export async function HfHandler(text: string, model_name: string, tag?: HTMLTextAreaElement): Promise<string> { 
    configs()
    const API_KEY = ""//configs().providers?.HuggingFace?.api_key
    if (!text || !tag || !model_name || !API_KEY) { return "" }
    const hf = new HfChat("/proxy", { 
        headers: { 
            "Authorization": "Bearer "+API_KEY, 
        },
        model: model_name
    })


    const response = await hf.sendPrompt(completePrompt({ text }))
    if (response) { 
        for await (const chunk of response) { console.log(chunk) }
    }

    hf.delete()
    return "End"
}


const HuggingModels = [
    {
        name: "Meta-Llama-3-70B-Instruct",
        owned_by: "meta-llama",
        enabled: undefined
    }, {
        name: "c4ai-command-r-plus",
        owned_by: "CohereForAI",
        enabled: undefined
    }, {
        name: "zephyr-orpo-141b-A35b-v0.1",
        owned_by: "HuggingFaceH4",
        enabled: undefined
    }, {
        name: "Mixtral-8x7B-Instruct-v0.1",
        owned_by: "mistralai",
        enabled: undefined
    }, {
        name: "Nous-Hermes-2-Mixtral-8x7B-DPO",
        owned_by: "NousResearch",
        enabled: undefined
    }, 
]



export default { 
    provider_name: "HuggingChat",
    about_url: "https://huggingface.co/docs/hub/security-tokens",
    api_key: undefined,
    models: HuggingModels
}


// multipart/form-data; boundary=----WebKitFormBoundaryPsA63SBZsBWh4qwC