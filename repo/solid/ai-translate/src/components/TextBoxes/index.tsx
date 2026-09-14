import { Show, createEffect, createSignal } from "solid-js"
import { enabledModels } from "../../global/configs"
import TextBox from "../../components/TextBox"
import Slider from "./slider"
import ButtonsPanel from "./ButtonsPanel"
import "./style.css"



export default function TextBoxes() { 
    const [ hover, setHover ] = createSignal(false)
    let section: HTMLElement | undefined

    createEffect(() => { 
        document.addEventListener("dragstart", (e: any) => {
            e.target.classList.add("dragging");
        });

        document.addEventListener('dragexit', (e) => { 
            e.preventDefault()
        })
    })


    return ( 
        <main data-testid="rb-main" class="flex flex-col overflow-hidden" onmouseenter={ () => { 
            if(!hover()) { setHover(true) }
        } } onmouseleave={ () => { 
            if(hover()) { setHover(false) }
        } }>

            <Show when={(hover())}>
                <ButtonsPanel />
            </Show>

            <section data-testid="rb-columns" class="flex flex-col h-screen flex-wrap overflow-x-scroll scroll-smooth" ref={section}
             onDragOver={(e) => {e.preventDefault()}}>
                { enabledModels()?.map( (model, index) => 
                    <TextBox modelName={model.name} providerKey={model.provider_key} index={index} />
                ) }
            </section>

            <Show when={section && section.scrollWidth >= 2 * section.offsetWidth}>
                <Slider tag={section as HTMLElement} />
            </Show>

        </main>
    )
}

