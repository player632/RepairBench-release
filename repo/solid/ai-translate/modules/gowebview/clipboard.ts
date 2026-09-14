export async function GetActiveWindowTitle() { 
    if ('GetActiveWindowTitle' in window) { 
        const response = await window.GetActiveWindowTitle<string[]>()
        if (response?.length) { return response[0] }
    }
}

export async function GetClipboardText() { 
    if ('GetClipboardText' in window) {
        const response = await window.GetClipboardText<string[]>()
        if (response?.length) { return response[0] }
    }
}