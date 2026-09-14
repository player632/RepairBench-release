"use strict";
import { Groq, ClientOptions } from "groq-sdk";
import { configs } from "../global/configs";
import { systemPrompt, userPrompt } from "../global/text";



class GroqChat extends Groq { 
    constructor(init: ClientOptions) {
        super(init)
    }

    sendPrompt(prompt: string, model: string) {
        return this.chat.completions.create({
            messages: [
                { 
                    role: "system",
                    content: systemPrompt
                }, {
                    role: "user",
                    content: prompt
                }
            ],
            model: model, 
            temperature: 0,
            stream: true,
        });
    }
}


export async function GroqHandler(text: string, model_name: string, tag: HTMLTextAreaElement): Promise<string> { 
    const API_KEY = configs().providers?.GroqCloud?.api_key
    if (!text || !tag || !model_name || !API_KEY) { return "" }
    const groq = new GroqChat({
        apiKey: API_KEY,
        dangerouslyAllowBrowser: true, 
    })


    tag.value = ""
    const stream = await groq?.sendPrompt(userPrompt({ text }), model_name) ?? []
    for await (const chunk of stream) { 
        if(chunk.choices[0]?.delta?.content && tag) {
            tag.value += chunk.choices[0]?.delta?.content
        }
    }

    return tag.value

}


export default { 
    provider_name: "GroqCloud",
    about_url: "https://console.groq.com/",
    api_key: undefined,
    models: [
        {
            name: "llama3-70b-8192",
            owned_by: "Meta",
            auto_fetch: true
        }, { 
            name: "llama-3.1-70b-versatile",
            owned_by: "Meta",
            auto_fetch: true
        }, { 
            name: "llama-3.2-11b-vision-preview",
            owned_by: "Meta",
            auto_fetch: true
        }, { 
            name: "llama-3.2-90b-vision-preview",
            owned_by: "Meta",
            auto_fetch: true
        }, { 
            name: "llama-3.3-70b-versatile",
            owned_by: "Meta",
            auto_fetch: true
        }, { 
            name: "gemma2-9b-it",
            owned_by: "Google",
            auto_fetch: true
        }, {
            name: "mixtral-8x7b-32768",
            owned_by: "Mistral",
            auto_fetch: true
        }, 
    ]
}



