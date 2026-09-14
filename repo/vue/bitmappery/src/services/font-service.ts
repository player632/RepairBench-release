/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2020-2022 - https://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { createCanvas } from "@/utils/canvas-util";

// OFFLINE ADAPTATION (repair-bench): the remote stylesheet origin is no longer referenced.

const loadedFonts: Set<string> = new Set();

// Google Fonts deemed non-GDPR compliant. Request consent first
export const fontsConsented = (): boolean => window.localStorage?.getItem( "gfontConsent" ) === "true";

export const consentFonts = (): void => {
    window.localStorage?.setItem?.( "gfontConsent", "true" );
};

export const rejectFonts = (): void => {
    window.localStorage?.setItem?.( "gfontRejected", "true" );
};

/**
 * Lazily loads a Google font (defined in the list above)
 * Returns boolean true indicating whether font was cache
 * or false when it has just been loaded (and added to the cache)
 */
export const loadGoogleFont = ( fontName: string ): Promise<boolean> => {
    // OFFLINE ADAPTATION (repair-bench, environment/adaptation.patch).
    // Upstream appends <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=...">
    // and resolves only once that stylesheet (and the font file it requests) has arrived.
    // The benchmark runs with allow_internet = false, so the request would hang until the
    // CSS onerror fired and any text-layer interaction would stall on a dead network.
    // The face is now resolved against the locally available font stack: the same canvas
    // probe upstream uses to warm the face runs, but no <link> is appended and no request
    // is made. The consent gate, the loadedFonts cache and the resolve contract
    // (true = already cached, false = just resolved) are unchanged.
    return new Promise(( resolve, reject ) => {
        if ( !fontsConsented() ) {
            reject();
            return;
        }
        if ( loadedFonts.has( fontName )) {
            resolve( true );
            return;
        }
        const { ctx } = createCanvas();
        ctx.font = `16px ${fontName}`;
        ctx.fillText( "foo", 0, 0 );
        loadedFonts.add( fontName );
        resolve( false );
    });
};
