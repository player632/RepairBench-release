import {createContext} from "svelte";
import type {SettingInfo} from "./settings/types";


// Only the display-facing fields are shared with child components, not the config-key metadata (`key`, `default`, `repeatable`) or the widget def.
export const [getSetting, setSetting] = createContext<Omit<SettingInfo, "key" | "default" | "repeatable" | "widget">>();