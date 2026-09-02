import { CompletionRequest, CompletionResponse, LLMProvider } from './base';

export class GeminiProvider implements LLMProvider {
    name = 'gemini';
    constructor(public model: string = 'gemini-1.5-flash', private apiKey?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    }

    async isAvailable(): Promise<boolean> {
        return Boolean(this.apiKey);
    }

    async complete(req: CompletionRequest): Promise<CompletionResponse> {
        const start = Date.now();
        const contents = req.messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Gemini error [${res.status}]: ${err}`);
        }

        const data = (await res.json()) as any;
        const latencyMs = Date.now() - start;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const totalTokens = data.usageMetadata?.totalTokenCount ?? 100;

        return {
            id: `gemini-${Date.now()}`,
            provider: this.name,
            model: this.model,
            content: text,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount ?? 50,
                completionTokens: data.usageMetadata?.candidatesTokenCount ?? 50,
                totalTokens,
                estimatedCostUsd: (totalTokens * 0.000075) / 1000
            },
            latencyMs
        };
    }
}