import {frameUrls, iconUrls} from "$lib/data/macicons";
import themes from "$lib/data/themes";
import {themeIcon} from "$lib/utils/themes";

import type {DropdownOption} from "./types";

// Option lists derived entirely from build-time data (generated themes/macicons modules).
// They're computed once at module scope and referenced directly by widget defs in
// registry.ts — no runtime population step, so the registry is complete at import time.
// Options that genuinely require runtime data (OS detection, shelling out) belong in
// initializers.ts instead.

export const themeOptions: DropdownOption[] = Object.entries(themes).map(([name, scheme]) => ({
    name,
    value: name,
    icon: themeIcon(scheme)
}));

export const macosIconOptions: DropdownOption[] = [
    ...Object.keys(iconUrls).map(key => ({
        value: key,
        name: key[0].toUpperCase() + key.slice(1),
        group: "Predefined icons",
        icon: iconUrls[key as keyof typeof iconUrls]
    })),
    {value: "custom", name: "Custom Icon", description: "Use your own icon file.", group: "Custom"},
    {value: "custom-style", name: "Custom Style", description: "Customize the icon with colors and frames.", group: "Custom"}
];

export const macosIconFrameOptions: DropdownOption[] = Object.keys(frameUrls).map(key => ({
    value: key,
    name: key[0].toUpperCase() + key.slice(1),
    icon: frameUrls[key as keyof typeof frameUrls]
}));
