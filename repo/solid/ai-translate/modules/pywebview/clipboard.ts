export async function GetClipboardText() { 
    return await window.pywebview?.api?.GetClipboardText()
}

export async function GetActiveWindowTitle() {
    return await window.pywebview?.api?.GetActiveWindowTitle()
}


