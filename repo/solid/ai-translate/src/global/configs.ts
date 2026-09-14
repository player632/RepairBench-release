import { createSignal, JSX } from "solid-js"
import { IModel, IProvider, IProviders, TProviderKeys } from "../providers"
import { GetConfig, SaveConfig, OpenConfigDir, OpenConfigWindow } from "../../modules"



export interface IConfig { 
    wsServerUrl: string
    caching: boolean
    targetLanguage: string
    providers: IProviders
    getModel: (provider?: string | null, name?: string | null) => IModel | undefined
}

export type IExtendedModel = IModel & { 
    provider_key: string
    component?: JSX.Element
}

/* declare global {
    interface String {
        replaceAll(search: string | RegExp, replacement: string): string;
    }
}

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search: string | RegExp, replacement: string): string {
        // Verifica se o valor de busca é uma expressão regular
        if (search instanceof RegExp) {
            // Se for uma expressão regular, garante que o flag global esteja presente
            if (!search.global) {
                throw new TypeError('A expressão regular deve ter a flag "g"');
            }
            // Usa o método replace com uma função de substituição
            return this.replace(search, replacement);
        } else {
            // Se for uma string, usa o método replace com a string de busca e o valor de substituição
            return this.split(search).join(replacement);
        }
    };
} */


export const [ enabledModels, setEnabledM ] = createSignal<IExtendedModel[] | null>(null)

export const [ configs, setConfigs ] = createSignal<IConfig>({
    wsServerUrl: "",
    caching: true,
    targetLanguage: "English - US",
    providers: {} as any
} as any)

const configPrototype = Object.getPrototypeOf(configs())
configPrototype.getModel = function(provider_key?: string, name?: string) { 
    if (provider_key && name) { 
        const provider: Partial<IProvider> = configs().providers[provider_key as TProviderKeys] as IProvider
        const model = provider?.models?.find( (m: IModel) => m.name === name)
        return model
    }
}


export function getEnabled() { 
    const enabled_models: IExtendedModel[] = []
    Object.keys(configs().providers).forEach(provider_key => { 
        const enabled = configs().providers[provider_key as TProviderKeys]?.models?.filter( (m: IModel) => m.enabled)
        .map(m => Object.assign( {...m}, {provider_key}) )
        if (enabled?.length) { enabled_models.push(...enabled) }
    } )


    enabled_models.sort( (b, a) => { 
        if (typeof a.index==="number" && typeof b.index==="number") { return b.index > a.index? -1 : 0 }
        return 0
    } )

    let flag = false
    if (enabled_models[0] && enabled_models[0]?.index !== 0) { 
        enabled_models[0].index = 0 
        const { provider_key, name } = enabled_models[0]
        const model = configs().getModel(provider_key, name)
        if(model) { model.index = 0 }
        flag = true
    }

    for (let i=0; i<enabled_models.length-1; i++) { 
        const a = enabled_models[i]; const b = enabled_models[i+1]
        if (typeof a.index==="number" && typeof b.index==="number") { 
            if (b.index !== a.index + 1) { 
                b.index = a.index+1 
                const modelB = configs().getModel(b.provider_key, b.name) as IModel 
                modelB.index = a.index+1
                if (!flag) { flag = true }
            }
        }
    }

    if(flag) { save_config({ ...configs() }) }
    setEnabledM(enabled_models)
    return enabled_models
}




export async function save_config(config: IConfig) { return await SaveConfig(config as never) }

export async function get_config(): Promise<IConfig | void> { 
    let response: unknown
    for (let _=0; _<5; _++) { 
        response = await GetConfig()
        if (!response) { await new Promise(res => setTimeout(res, 60)) }
        else { break }
    }

    return response as never 
}

export async function open_settings() { 
    return await OpenConfigWindow()
}

export async function open_dir() { return await OpenConfigDir() }


// Read-only verification handle (instrumentation layer). Publishes what the
// checkpoints need but the rendered face does not carry: the live config values,
// the published engine list and the persistent-state residue the state-isolation
// sentinel reads. Nothing here writes - every member is a getter over the app's
// own signals, evaluated when a checkpoint asks.
const rbHost = window as unknown as { __rb?: unknown }
if (!rbHost.__rb) {
    rbHost.__rb = {
        targetLanguage: (): string => String(configs().targetLanguage),
        caching: (): boolean => configs().caching,
        wsServerUrl: (): string => String(configs().wsServerUrl),
        providerKeys: (): string => Object.keys(configs().providers).join(","),
        enabled: (): string => (enabledModels() || []).map((m) => m.provider_key + "/" + m.name).join(","),
        enabledCount: (): number => (enabledModels() || []).length,
        enabledIndexes: (): string => (enabledModels() || []).map((m) => String(m.index)).join(","),
        autoFetchOf: (provider_key: string, name: string): string => String(configs().getModel(provider_key, name)?.auto_fetch),
        residue: (): string => "ls=" + localStorage.length + ";ss=" + sessionStorage.length + ";ck=" + document.cookie.length + ";path=" + location.pathname + ";search=" + location.search + ";hash=" + location.hash
    }
}
