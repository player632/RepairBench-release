export async function QueryTranslation(data: ITextDTO) { 
    return await window.pywebview?.api?.QueryTranslation(data)
}

export async function SaveText(data: ISaveTextDTO ) { 
    const response = await window.pywebview?.api?.SaveText(data)
    if (response?.error) { alert(response.error) }
    return response
}