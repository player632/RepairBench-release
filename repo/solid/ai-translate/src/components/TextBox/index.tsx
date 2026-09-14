import { Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { global_text, save_text } from "../../global/text"
import { configs, getEnabled, save_config, setConfigs } from "../../global/configs"
import Providers, { getHandler, IModel, TProviderKeys } from "../../providers"
import ConfirmationControls, { ITextStore, storeToDTO } from "./ConfirmationControls"
import SaveIcon from "./SaveIcon"
import './style.css'



type ITextBoxProps = { 
    modelName: string //IExtendedModel 
    providerKey: string
    index: number
}

type MyDragEvent = DragEvent & {
    currentTarget: HTMLElement;
    target: Element;
}

export type ITextBoxSectionProps = { 
    modelName?: string
    providerKey?: string
    "on:refreshAll"?: CallableFunction
}

declare module 'solid-js' {
    namespace JSX { 
        // JSX.HTMLElementTags.section: JSX.HTMLAttributes<HTMLElement>
        interface IntrinsicElements {
            section: JSX.HTMLAttributes<HTMLElement> & ITextBoxSectionProps
        }
    }
}

function setDragOverStyle(e: MyDragEvent) { e.currentTarget.style.border = "2px solid white" }
function rmvDragOverStyle(e: MyDragEvent) { e.currentTarget.style.border = "" }

function dragDropHandler(e: MyDragEvent) { 
    const dragging = document.querySelector('.dragging') as HTMLElement
    const box = e.currentTarget.getBoundingClientRect()
    //const boxCenterY = box.y + box.height / 2;

    if (e.clientY >= box.y && e.clientY <= (box.y+box.height)) { 
        const modelA = configs().getModel(dragging?.getAttribute('providerKey'), dragging?.getAttribute('modelName'))
        const modelB = configs().getModel(e.currentTarget.getAttribute('providerKey'), e.currentTarget.getAttribute('modelName'))
        if (typeof modelA?.index==="number" && typeof modelB?.index==="number") { 
            const smaller = (modelA.index<modelB.index? modelA : modelB) as IModel & { index: number }
            modelA.index = modelB.index
            smaller.index += 0.5
            getEnabled()
        }
    }

    dragging?.classList.remove("dragging")
    rmvDragOverStyle(e)
    e.stopPropagation()
}


export default function TextBox( {modelName: model_name, providerKey, index}: ITextBoxProps ) { 
    const [ text, setText ] = createStore<ITextStore>({ 
        untranslated: global_text().untranslated, 
        translated: "Waiting for text...", 
        editing: false, 
        model_name
    })
    const [ dragging, setDragging ] = createSignal(false)
    const handler = getHandler(providerKey, model_name)
    let textarea: HTMLTextAreaElement | undefined
    const provider = Providers[providerKey as TProviderKeys]
    const auto_fetch = createMemo(() => configs().getModel(providerKey, model_name)?.auto_fetch)
    const textareaStyle = createMemo(() => text.translated==="Waiting for text..."? "italic text-zinc-100" : "")
    const autoFetchStyle = () => auto_fetch()? "text-green-500" : "text-red-600"


    async function translate(options?: {save?: boolean}) { 
        if (handler && textarea && text.untranslated) { 
            const result = await handler(text.untranslated, model_name, textarea)
            .catch(e => e)
            const translated = typeof result !== "string"? result : result?.replaceAll("\n", "").replaceAll("  ", " ").trim().replace(/^"(.*?)"$/, '$1')
            setText('translated', translated)
            if (options?.save) { save_text(storeToDTO(text)) }
        }
    }


    createEffect( async() => { 
        if (global_text().untranslated !== text.untranslated) { 
            setText('untranslated', global_text().untranslated) 
            const translated = global_text().translated
            if (translated?.length) { 
                if (index < translated.length) { setText('translated', translated[index]) }
                else { setText('translated', "") }

            } else if (auto_fetch()) { await translate({ save: true }) }

            //console.log(modelName, ":", text.translated) 
        }

    })

    const listener = () => { //console.log('Listened!')
        if (auto_fetch() && index !== 0) { translate({ save: true }) }
    }
    window.addEventListener('refreshAll', listener)
    onCleanup(() => window.removeEventListener('refreshAll', listener))


    return (
        <section data-testid={"rb-box-" + model_name} class="w-[334px] flex justify-between" 
         modelName={model_name} providerKey={providerKey} draggable={ dragging() }
         onDragOver={setDragOverStyle} onDragLeave={rmvDragOverStyle} onDrop={dragDropHandler}>

            <div class="w-full py-1 relative">
                <textarea data-testid={"rb-text-" + model_name} class={`w-full h-44 p-2 ${textareaStyle()} bg-inherit`} 
                 value={text.translated as string} ref={textarea} readonly={!text.editing}
                 name="" id="" cols="30" rows="10" />
                <p data-testid={"rb-label-" + model_name} class="py-1 px-2 absolute bottom-0 text-sm text-placeholder italic">{model_name} - {provider.provider_name}</p>
            </div>

            <Show when={!text.editing} fallback={
                <ConfirmationControls store={[ text, setText ]} textarea={textarea} />
            }>
                <div class="flex flex-col justify-end items-center m-4">
                    <div class="flex flex-col gap-2 items-center"
                     onDragOver={ e => {e.stopPropagation()} }>
                            <button data-testid={"rb-drag-" + model_name} onMouseDown={ () => { 
                                if (!dragging()) { setDragging(true) }
                            } } onMouseUp={ () => { 
                                if (dragging())  { setDragging(false) }
                            } }>
                                <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                                </svg>
                            </button>

                            <button data-testid={"rb-auto-" + model_name} class={`${autoFetchStyle()} text-xs p-1 active:opacity-60`}
                             onClick={ () => { 
                                const m = configs().getModel(providerKey, model_name)
                                if(m) { 
                                    m.auto_fetch = !auto_fetch()
                                    setConfigs({ ...configs() })
                                    save_config(configs())
                                }
                             } }>
                                AUTO
                            </button>

                            <button data-testid={"rb-refresh-" + model_name} onclick={ () => translate() }>
                                <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                            </button>

                            <button data-testid={"rb-edit-" + model_name} onclick={ () => { 
                                if(!text.editing) { setText('editing', true) }
                            } }>
                                    <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                            </button>

                            <SaveIcon onClick={() => {
                                if (text.translated) { save_text(storeToDTO(text)) }
                            } }/>
                    </div>
                </div>
            </Show>

        </section>
    )
}


