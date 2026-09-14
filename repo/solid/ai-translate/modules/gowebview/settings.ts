export async function GetConfig() { 
    if ('GetConfig' in window) { 
        const response = await window.GetConfig<string[]>()
        if (response?.length) { 
            try { return JSON.parse(response[0]) }
            catch { return "" }
        }
    }

    return ""
}

export async function SaveConfig(configs: Record<string, unknown>) {
    if ('SaveConfig' in window) { 
        return await window.SaveConfig( JSON.stringify(configs) )
    }
}

export async function OpenConfigDir() { 
    if ('OpenConfigDir' in window) { 
        return await window.OpenConfigDir()
    }
}

export async function OpenConfigWindow() {
    //return window.open(`/settings`, "_blank", "toolbar=yes, scrollbars=yes, resizable=yes, top=100, left=450, width=600, height=900")
    if ('OpenConfigWindow' in window) { 
        return await window.OpenConfigWindow()
    }
}