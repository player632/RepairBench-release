interface ITextDTO { 
    window_title: string
    originalText: string
    translatedText?: string | null
    src_model?: string
    speakerName?: string | null
    history?: string[]
}

interface ISaveTextDTO extends ITextDTO { 
    translatedText: string
    src_model: string
}

interface ITextResponseDTO extends ITextDTO { 
    translatedText?: string[]
}