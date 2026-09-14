export async function SaveConfig(configs: Record<string, unknown>) { 
    return await window.pywebview?.api?.SaveConfig(configs)
}

export async function GetConfig() {
    return await window.pywebview?.api?.GetConfig()
}

export async function OpenConfigDir() { 
    return await window.pywebview?.api?.OpenConfigDir()
}

export async function OpenConfigWindow() {
    return await window.pywebview?.api?.OpenConfigWindow()
}