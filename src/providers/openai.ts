import { CompletionRequest, CompletionResponse, LLMProvider } from './base';

export class OpenAIProvider implements LLMProvider {
    name = 'openai';
    constructor(public model: string = 'gpt-4o-mini', private apiKey?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    }

    async isAvailable(): Promise<boolean> {
        return Boolean(this.apiKey);
    }

    async complete(req: CompletionRequest): Promise<CompletionResponse> {
        const start = Date.now();
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: req.messages,
                temperature: req.temperature ?? 0.7,
                max_tokens: req.maxTokens ?? 1024
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI error [${res.status}]: ${err}`);
        }

        const data = (await res.json()) as any;
        const latencyMs = Date.now() - start;
        const promptTokens = data.usage?.prompt_tokens ?? 0;
        const completionTokens = data.usage?.completion_tokens ?? 0;

        return {
            id: data.id,
            provider: this.name,
            model: this.model,
            content: data.choices[0]?.message?.content ?? '',
            usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
                estimatedCostUsd: (promptTokens * 0.00015 + completionTokens * 0.0006) / 1000
            },
            latencyMs
        };
    }
}