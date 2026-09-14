import { configs, save_config } from "../../global/configs";



function change_handler(e: Event & {
    currentTarget: HTMLInputElement;
    target: HTMLInputElement;
} ) { 

    configs().caching = e.currentTarget.checked
    save_config(configs())
}

export default function CachingToggle() { 

    return( 
        <div class="py-2 flex gap-3">
            <label class="cursor-pointer" for="caching-input">Caching: </label>
            <input type="checkbox" data-testid="rb-caching" name="" id="caching-input" onChange={change_handler} checked={true} />
        </div>
    )
}