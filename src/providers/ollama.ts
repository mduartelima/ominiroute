import { CompletionRequest, CompletionResponse, LLMProvider } from './base';

export class OllamaProvider implements LLMProvider {
    name = 'ollama';
    private baseUrl: string;

    constructor(
        public model: string = 'llama3',
        baseUrl?: string
    ) {
        this.baseUrl = (baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    }

    async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);

            const res = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) return false;
            const data = (await res.json()) as any;
            const models = data?.models ?? [];
            return models.some((m: any) => m.name.toLowerCase().includes(this.model.toLowerCase().split(':')[0]));
        } catch {
            return false;
        }
    }

    async complete(req: CompletionRequest): Promise<CompletionResponse> {
        const start = Date.now();

        const messages = req.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        const res = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false,
                options: {
                    temperature: req.temperature ?? 0.7,
                    num_predict: req.maxTokens ?? 2048
                }
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Ollama error [${res.status}]: ${err}`);
        }

        const data = (await res.json()) as any;
        const latencyMs = Date.now() - start;

        const content = data.message?.content ?? '';
        const promptTokens = data.prompt_eval_count ?? Math.ceil(req.messages.reduce((acc, m) => acc + m.content.length, 0) / 4);
        const completionTokens = data.eval_count ?? Math.ceil(content.length / 4);
        const totalTokens = promptTokens + completionTokens;

        return {
            id: `ollama-${Date.now()}`,
            provider: this.name,
            model: this.model,
            content,
            usage: {
                promptTokens,
                completionTokens,
                totalTokens,
                estimatedCostUsd: 0.0 // Modelos locais têm custo zero de API
            },
            latencyMs
        };
    }
}
