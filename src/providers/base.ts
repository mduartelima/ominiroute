export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionRequest {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface CompletionResponse {
    id: string;
    provider: string;
    model: string;
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        estimatedCostUsd: number;
    };
    latencyMs: number;
}

export interface LLMProvider {
    name: string;
    model: string;
    isAvailable(): Promise<boolean>;
    complete(req: CompletionRequest): Promise<CompletionResponse>;
}