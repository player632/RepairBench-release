export async function QueryTranslation(data: ITextDTO) { 
    if ('QueryTranslation' in window) { 
        const response = await window.QueryTranslation<ITextResponseDTO[]>(data)
        if (response?.length) { return response[0] }
    }

    return {} as any
}

export async function SaveText(data: ISaveTextDTO) { 
    if ('SaveText' in window) { 
        const response = await window.SaveText< ({ error: string } | void)[] >(data)
        if (response?.[0]?.error) { alert(response[0].error) }
        return response
    }
}

