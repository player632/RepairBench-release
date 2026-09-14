import { open_dir } from "../../global/configs";



export default function OpenButton() { 
    return( 
        <div class="py-2 flex items-center gap-4">
            <h2 class="text-xl">Cache path:</h2>
            <button data-testid="rb-open-dir" class="py-1 px-6 text-xl rounded-xl bg-zinc-800 text-placeholder hover:bg-primary hover:text-white"
                onclick={open_dir}>Open</button>
        </div>
    )
}