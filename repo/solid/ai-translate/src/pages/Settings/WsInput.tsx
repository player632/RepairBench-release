import { configs, save_config, setConfigs } from "../../global/configs";

function change_handler(e: InputEvent & {
    currentTarget: HTMLInputElement;
    target: HTMLInputElement;
} ) { 

    if (e.currentTarget.value) { 
        configs().wsServerUrl = e.currentTarget.value
        setConfigs({ ...configs() })
        save_config(configs())
    }
}


export default function WsInput() { 
    let text_input: HTMLInputElement | undefined

    return(
        <div class="py-3 flex gap-4 items-center">
            <h1 class="font-bold text-xl">Ws Server:</h1>
            <input data-testid="rb-ws-input" type="text" placeholder="Example: ws://192.168.0.1:3000" 
             class="h-10 px-6 text-center rounded-xl bg-button"  
             ref={text_input} onInput={change_handler}/>
        </div>
    )
}



