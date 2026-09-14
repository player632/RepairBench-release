import { OpenAIChat } from "../global/lib";
import { systemPrompt, userPrompt } from "../global/text";



export async function g4fHandler(text: string, model_name: string, tag: HTMLTextAreaElement) { 
    if (!text || !tag || !model_name) { return "" }
    const client = new OpenAIChat(`https://playmak3r-g4f.hf.space/v1/chat/completions?id=${Date.now()}`, { 
        model: model_name,
        system_prompt: systemPrompt
    })

    tag.value = ""
    const stream = await client.sendPrompt(userPrompt({ text }))
    if (stream) { 
        for await (const chunk of stream) { 
          const text = chunk?.choices?.[0]?.delta?.content;
          if (text) { tag.value += text; }
          else if (chunk?.error) { tag.value = chunk.error?.message }
          else if (chunk) { console.log(chunk) }
        }
    }

    return tag.value
}


export default { 
    provider_name: "GPT4Free",
    api_key: undefined,
    models: [ 
        { 
            name: "qwen-2.5-72b",
            owned_by: "Qwen",
            auto_fetch: false
        }, { 
            name: "command-r-plus",
            owned_by: "cohere",
            auto_fetch: false
        }, /* { 
            name: "grok-3",
            owned_by: "X AI",
            auto_fetch: false
        },  */{ 
            name: "deepseek-chat",
            owned_by: "DeepSeek AI",
            auto_fetch: false
        }, { 
            name: "deepseek-v3",
            owned_by: "DeepSeek AI",
            auto_fetch: false
        }, { 
            name: "deepseek-r1",
            owned_by: "DeepSeek AI",
            auto_fetch: false
        }, { 
            name: "claude-3.5-sonnet",
            owned_by: "anthropic",
            auto_fetch: false
        }, { 
            name: "claude-3-opus",
            owned_by: "anthropic",
            auto_fetch: false
        }, { 
            name: "gpt-3.5-turbo",
            owned_by: "openai",
            auto_fetch: false
        }, { 
            name: "gpt-4o-mini",
            owned_by: "openai",
            auto_fetch: false
        }, { 
            name: "gpt-4o",
            owned_by: "openai",
            auto_fetch: false
        }, { 
            name: "o1",
            owned_by: "openai",
            auto_fetch: false
        }, { 
            name: "o1-mini",
            owned_by: "openai",
            auto_fetch: false
        }, 
    ]
}