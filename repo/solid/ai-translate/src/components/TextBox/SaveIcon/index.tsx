import { JSX } from "solid-js";


export default function SaveIcon( {onClick}: JSX.ButtonHTMLAttributes<HTMLButtonElement> ) {

    return( 
        <button class="" data-testid="rb-save" onClick={onClick}>
            <svg class="w-5 h-5 fill-primary hover:fill-white active:fill-white/60" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.000000 64.000000" preserveAspectRatio="xMidYMid meet">
                <g class="fill-inherit hover:fill-inherit active:fill-inherit" transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)" stroke="none">
                    <path d="M40 600 c-19 -19 -20 -33 -20 -280 0 -247 1 -261 20 -280 11 -11 33
                    -20 50 -20 l30 0 0 100 c0 143 -4 140 200 140 204 0 200 3 200 -140 l0 -100
                    30 0 c17 0 39 9 50 20 19 19 20 33 20 233 l0 213 -68 67 c-43 42 -76 67 -90
                    67 -21 0 -22 -4 -22 -88 0 -55 -4 -92 -12 -100 -16 -16 -200 -16 -216 0 -8 8
                    -12 45 -12 100 l0 88 -70 0 c-57 0 -74 -4 -90 -20z"/>
                    <path d="M240 540 l0 -80 80 0 80 0 0 80 0 80 -80 0 -80 0 0 -80z"/>
                    <path d="M167 214 c-4 -4 -7 -49 -7 -101 l0 -93 160 0 161 0 -3 98 -3 97 -151
                    3 c-82 1 -153 -1 -157 -4z"/>
                </g>
            </svg>
        </button>
    )
}