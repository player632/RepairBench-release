import { createStore } from "solid-js/store"
import { createEffect } from "solid-js"


type SliderProps = { 
    tag: HTMLElement
}

type IScrollStore = {
    left?: number
}

export default function Slider({ tag }: SliderProps) { 
    const [ scroll, setScrollStore ] = createStore<IScrollStore>({})
    const buttonOpacity = () => (scroll.left ?? 0)>0? "opacity-100" : "opacity-45 cursor-default"

    createEffect(() => { 
        tag.onscroll = () => setScrollStore('left', tag.scrollLeft)
        window.onblur = () => tag.scrollTo({ left: 0 })
    })


    return ( 
        <section class="w-full flex justify-around absolute bottom-0 bg-background">
            <button class={`p-3 ${buttonOpacity()}`} onclick={() => {
                tag?.scrollBy(-334, 0)
            }}>
                <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button class="p-3" onclick={() => {
                tag?.scrollBy(334, 0)
            }}>
                <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </section>
    )
}

