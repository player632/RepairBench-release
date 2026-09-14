import { GetActiveWindowTitle, GetClipboardText } from "../../modules"



export class TextHistory { 
    private history: string[]
    constructor(history?: string[]) { 
        this.history = history ?? []
    }

    get() { return this.history }
    set(history: string[]) { this.history = history }

    toXMLPrompt(n?: number) { 
        if (!this.history.length) { return "" }
        if (typeof n === "number") { n = this.history.length - n }

        const slice = this.history.slice(n ?? 0)
        return `context (FOR CONTEXT ONLY, DO NOT TRANSLATE OR RETURN THESE TEXT LINES): 
            ${slice.map( (content, i) => `<Text${i+1}>${content}</Text${i+1}>` ).join('\n')}
        `
    }

    toJSONPrompt(n?: number) { 
        if (!this.history.length) { return "" }
        if (typeof n === "number") { n = this.history.length - n }

        const output: Record<string, string> = {}
        const slice = this.history.slice(n ?? 0)
        slice.forEach( (text, i) => (output[String(i)] = text) )
        return `context (FOR CONTEXT ONLY, DO NOT TRANSLATE OR RETURN THESE TEXT LINES): 
            ${JSON.stringify(output)}
        `
    }

}


interface ICallbackParams { 
    window_title: string, 
    text: string
}

type ICallback = (data: ICallbackParams) => unknown

function setCallback(this: any, callback: ICallback) { 
    if (callback instanceof Function) { 
        this.callback = ({ window_title, text }: ICallbackParams) => { 
            if (text.startsWith("　")) { text = text.replace("　", "") }
            return callback({ window_title, text: text.trim() })
        }
    }
}


export class Monitor { 
    private interval?: NodeJS.Timeout | number
    private callback?: ICallback

    constructor( callback?: ICallback) { 
        if (callback) { this.setCallback(callback) }
    }

    setCallback = setCallback

    async start(callback?: typeof this.callback) { 
        if(callback) { this.setCallback(callback) }
        if(this.interval) { this.stop() }
        if(this.callback) { 
            let value: string
            for (let _=0; _<5; _++) { 
                value = await GetClipboardText()
                if (value===undefined) { await new Promise(res => setTimeout(res, 60)) }
                else { break }
            }


            const execute = this.callback
            async function loop(this: Monitor) { 
                const documentVisibilityStatus = !document.hidden
                const tmp_value = await GetClipboardText()
                const window_title = (await GetActiveWindowTitle())?.replaceAll(/[\/\\:\*?"<>|]/g, "-")
                if (documentVisibilityStatus && window_title !== "AI Translate") { 
                    if ( (value !== tmp_value) && tmp_value && window_title ) { 
                        await execute({ window_title, text: tmp_value })
                    }
                    //else if (document.hidden) { console.log(document.hidden) }
                }

                value = tmp_value
                this.interval = setTimeout(loop, 100)
            }

            this.interval = 1
            loop.call(this)
        }
    }

    stop() { 
        clearInterval(this.interval)
        this.interval = undefined
    }

    isRunning() { return this.interval? true : false }

}


export class WsClient { 
    private socket?: WebSocket
    private callback?: ICallback
    constructor( private _url?: string ) { 
        if(_url) { this.socket = new WebSocket(_url) }
    }

    private loadListeners() { 
        if (this.socket) { 
            this.socket.addEventListener('message', async(event) => { 
                const window_title = await GetActiveWindowTitle()
                const text = event.data
                if (window_title && this.callback) { this.callback({ window_title, text }) }
            } )
        }
    }

    get url() { return this._url }

    setCallback = setCallback

    connect() { 
        if( this._url && (!this.socket || this.socket.CLOSED) ) { 
            this.socket = new WebSocket(this._url) 
            this.loadListeners()
        }
    }

    setUrl(url: string) { 
        this._url = url
        this.connect()
    }

    close() { 
        if(this.socket) { this.socket.close() }
    }

    isOpen() { return this.socket?.OPEN===1? true : false }

}


export type CustomSSEInit = { 
    method?: string
    headers?: { 
        Authorization?: string
        "Content-Type"?: string
        Accept?: string // application/json, text/event-stream"
        "Accept-Language"?: string
        [key: string]: any
    }
    credentials?: RequestCredentials
}

type IHttpBody = Record<string, any> | string


export class CustomSSE { 
    public url: string | null
    public method: string
    public credentials: CustomSSEInit['credentials']
    public headers: CustomSSEInit['headers'] | undefined
    public request: Promise<Response> | undefined
    private reader?: ReadableStreamDefaultReader<string> | null


    constructor(url: string | null, init?: CustomSSEInit) {
        this.url = url
        this.method = init?.method ?? "POST"
        this.headers = init?.headers ?? {} as never
        this.credentials = init?.credentials

        if (!this.headers?.["Content-Type"]) { this.headers["Content-Type"] = "application/json" }
        //if (!this.headers?.["Accept-Language"]) {  }
    }

    async* getStream<T= unknown, U= unknown>(httpBody: U | IHttpBody, url?: string ): AsyncGenerator<T> { 
        this.sendPostRequest(httpBody as never, url)
        if (!this.reader) { this.reader = await this.getReader() }
        while(true) { 
            const result = await this.reader.read();
            const content = result.value?.replaceAll('data:', "").replaceAll("\r", "").trim().split("\n")
            .filter(message => message).map(message => { 
                try { return JSON.parse(message) }
                catch { console.log(message) }
            })

            if (content) { 
                for (let item of content) { yield item as T }
            }

            if (result.done) { this.reader.releaseLock() ; break }
        }
    }

    close() { 
        this.reader?.cancel().catch(error => console.error("Error canceling reader:", error));
        this.reader = null
    }


    sendPostRequest(httpBody: IHttpBody, url?: string ) { 
        const requestUrl = url ?? this.url
        const { headers, credentials } = this

        if(httpBody && requestUrl) {
            this.request = fetch(requestUrl, { 
                method: "POST",
                credentials,
                headers,
                body: typeof httpBody!=="string"? JSON.stringify(httpBody) : httpBody
            } )
        }

        return this
    }

    private async getReader() { //precisa ser o mesmo reader
        const response = await this.request as Response
        const body = response.body
        if(!response || !body) { throw new Error("Request is empty!") }
        return body.pipeThrough(new TextDecoderStream()).getReader()
    }

}


export interface OpenAIChatCompletionChunk { 
    id: string;                        // Identificador único do chunk
    object: string;                    // Geralmente 'chat.completion.chunk'
    created: number;                   // Timestamp da criação do chunk
    model: string;                     // Nome do modelo usado (ex: "gpt-4-0314")
    choices: Array<{
        index: number;                   // Índice da escolha (geralmente 0 para uma única resposta)
        delta: {
          content?: string;              // Conteúdo parcial da resposta (incremental)
        };
        finish_reason: string | null;    // Motivo para terminar (ex: 'stop' ou null durante o stream)
    }>;
}

export type OpenAIChatInit = CustomSSEInit & { model: string, system_prompt?: string }

export class OpenAIChat extends CustomSSE { 
    readonly model: string
    readonly system_prompt?: string

    constructor(url: string, init: OpenAIChatInit) { 
        super(url, init)
        this.model = init?.model
        this.system_prompt = init?.system_prompt
    }

    async sendPrompt(prompt: string) { 
        if (this.model && prompt) { 
            return this.getStream<any, OpenAIChatCompletionChunk>({ 
                model: this.model,
                messages: [ 
                    { 
                      role: "system", 
                      content: this.system_prompt ?? 'Be as helpful as possible.'
                    }, { 
                      role: "user",
                      content: prompt
                    }
                ],
                stream: true,
                temperature: 0,
                top_p: 0.3,
                frequency_penalty: 0,
                presence_penalty: 0
            })

        }
    }

}


