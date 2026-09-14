import { For, Show, createEffect } from "solid-js"
import { configs, save_config, setConfigs, enabledModels } from "../../global/configs"
import Provider, { IModel, IProvider, TProviderKeys } from "../../providers"
import Providers from "../../providers"



async function change_handler({provider, model}: { 
    provider: Partial<IProvider>, 
    model?: IModel
} ) { //console.log(provider, model)

const provider_key = provider.provider_name as TProviderKeys
const newConfigs = { ...configs() }
const addedModel = newConfigs.getModel(provider.provider_name, model?.name)
//const allowed_keys = ["name", "owned_by", "enabled", "index", "provider_name", "api_key"]
let providerEntry: IProvider | null = newConfigs.providers[provider_key]


if (Object.keys(providerEntry ?? {})?.length) { 
    if (!provider.api_key) { 
        delete newConfigs.providers[provider_key]
        providerEntry = null

    } else if (model && addedModel && !model.enabled) { 
        const models = newConfigs?.providers[provider_key]?.models
        if(models) { 
            const index = models.findIndex(savedModel => savedModel.name === model.name)
            models.splice(index, 1)
        }
    }

} else if (provider.api_key && !providerEntry) { 
    providerEntry = { ...Provider[provider_key] } as IProvider
    providerEntry.api_key = provider.api_key
    providerEntry.models = []
    newConfigs.providers[provider_key] = providerEntry

}


if (!addedModel && model?.enabled && providerEntry) { 
    const model_default = providerEntry.models.find(m => m.name === model.name) ?? {}
    providerEntry.models.push( Object.assign(model_default, model) ) 
}

setConfigs(newConfigs)
save_config(configs())

}


export default function ModelsList( {provider: provider_key}: {provider: string} ) { 
    let text_input: HTMLInputElement | undefined
    const provider = Providers[provider_key as TProviderKeys]

    createEffect(() => { 
        const apiKey = configs()?.providers[provider_key as TProviderKeys]?.api_key
        if (apiKey && text_input) { text_input.value = apiKey }
    })


    return ( 
        <>
            <Show when={provider.about_url}>
                <div class="px-8 flex gap-4 items-center">
                    <h1 class="font-bold text-xl">API KEY:</h1>
                    <input data-testid={"rb-apikey-" + provider_key} type="text" placeholder="Insert key..." id={"input-"+provider_key} class="h-10 text-center rounded-xl bg-button"  
                    ref={text_input} onInput={ (e) => change_handler( {
                        provider: {provider_name: provider_key, api_key: e.currentTarget.value}
                    } ) }/>
                </div>
                <p class="px-8 py-1 text-xs text-zinc-500">Don't have a key? Get a free key <a href={provider.about_url as string} class="text-primary">here.</a></p>
            </Show>
            <div class="py-3">
                <For each={ Provider[provider_key as TProviderKeys]?.models }>
                    { (model: IModel) => <ModelItem providerName={provider_key} model={model} textInputRef={text_input} /> }
                </For>
            </div>
        </>
    )
}



function ModelItem( {model, providerName: provider_name, textInputRef}: {model: IModel, providerName: string, textInputRef?: HTMLInputElement} ) { 
    let check_input: HTMLInputElement | undefined
    const provider = Providers[provider_name as TProviderKeys]

    createEffect(() => { 
        if (configs().getModel(provider_name, model.name)?.enabled && check_input) { check_input.checked = true }
    } )

    function checkboxHandler(e: Event & {
        currentTarget: HTMLInputElement;
        target: HTMLInputElement;
    }) { 

        const api_key = provider.about_url? "none" : textInputRef?.value
        const enabled = e.currentTarget.checked
        const { name, owned_by } = model
        if (!api_key && enabled) { e.currentTarget.checked = false }
        else { 
            change_handler( { 
                provider: { provider_name, api_key },
                model: { name, enabled, owned_by, index: enabledModels()?.length }
            } )
        }
    }


    return( 
        <li class="flex items-center gap-12 px-8 ">
            <div class="flex">
                <input type="checkbox" data-testid={"rb-check-" + provider_name + "-" + model.name} id={`${provider_name}-${model.name}`} class="mx-2" 
                 ref={check_input} onChange={ checkboxHandler } />
                <p data-testid={"rb-model-name-" + provider_name + "-" + model.name}>{model.name}</p>
            </div>
        </li>
    )
}