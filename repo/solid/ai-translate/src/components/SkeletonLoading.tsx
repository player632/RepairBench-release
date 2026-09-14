import { For } from "solid-js";

export default function SkeletonLoading() { 

    return( 
        <For each={Array(3)}>
            {() => <div data-testid="rb-skeleton" class="bg-zinc-800 w-full h-44 my-4 rounded-2xl animate-pulse" />}
        </For>
    )
}