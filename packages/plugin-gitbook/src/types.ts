// GitBook API response type
export interface GitBookResponse {
    answer?: {
        text: string;
    };
    error?: string;
}

// Client configuration in character.json (all optional)
export interface GitBookKeywords {
    projectTerms?: string[];
    generalQueries?: string[];
}

export interface GitBookClientConfig {
    keywords?: GitBookKeywords;
    documentTriggers?: string[];
}