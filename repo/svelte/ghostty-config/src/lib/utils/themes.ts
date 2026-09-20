import type {ColorScheme} from "./colors";

/**
 * Build a tiny terminal-window swatch (as an inline SVG data URI) that
 * represents a theme's colors. Suitable for use as a Dropdown option icon.
 *
 * The swatch mimics a terminal: a rounded rect filled with the theme
 * background and a few short "text" lines drawn in representative palette
 * colors, ending with a cursor block.
 */
export function themeIcon(scheme: ColorScheme): string {
    const palette = scheme.palette;
    const bg = scheme.background ?? palette[0] ?? "#000000";
    const fg = scheme.foreground ?? palette[7] ?? "#ffffff";
    const cursor = scheme.cursorColor ?? fg;

    // Representative ANSI colors with foreground fallbacks for short palettes.
    const green = palette[2] ?? fg;
    const yellow = palette[3] ?? fg;
    const blue = palette[4] ?? fg;
    const red = palette[1] ?? fg;
    const cyan = palette[6] ?? fg;

    const bar = (x: number, y: number, w: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="1.8" rx="0.9" fill="${fill}"/>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5" fill="${bg}" stroke="${fg}" stroke-opacity="0.2"/>${bar(5, 6.5, 6, green)}${bar(12.5, 6.5, 5.5, yellow)}${bar(5, 11.1, 9, blue)}${bar(5, 15.7, 4, red)}${bar(10.5, 15.7, 4, cyan)}<rect x="16" y="15.3" width="2.6" height="2.6" rx="0.6" fill="${cursor}"/></svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
