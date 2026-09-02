import { ChatMessage, CompletionRequest, CompletionResponse, LLMProvider } from './base';

export class AnthropicProvider implements LLMProvider {
    name = 'anthropic';
    constructor(
        public model: string = 'claude-3-5-sonnet-20241022',
        private apiKey?: string
    ) {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    }

    async isAvailable(): Promise<boolean> {
        return Boolean(this.apiKey && this.apiKey.trim().length > 0);
    }

    async complete(req: CompletionRequest): Promise<CompletionResponse> {
        if (!this.apiKey) {
            throw new Error('Chave de API da Anthropic não configurada (ANTHROPIC_API_KEY).');
        }

        const start = Date.now();

        // Extrai mensagem de sistema (se houver) pois a Anthropic recebe como parâmetro de nível superior
        const systemMessage = req.messages.find(m => m.role === 'system');
        const userAndAssistantMessages = req.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }));

        // Se só havia system message, transforma em user message para não quebrar a API
        const messagesToSend = userAndAssistantMessages.length > 0
            ? userAndAssistantMessages
            : [{ role: 'user' as const, content: systemMessage?.content || '' }];

        const payload: Record<string, any> = {
            model: this.model,
            messages: messagesToSend,
            max_tokens: req.maxTokens ?? 2048,
            temperature: req.temperature ?? 0.7
        };

        if (systemMessage && userAndAssistantMessages.length > 0) {
            payload.system = systemMessage.content;
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Anthropic error [${res.status}]: ${err}`);
        }

        const data = (await res.json()) as any;
        const latencyMs = Date.now() - start;

        const content = data.content
            ?.filter((block: any) => block.type === 'text')
            ?.map((block: any) => block.text)
            ?.join('\n') ?? '';

        const promptTokens = data.usage?.input_tokens ?? 0;
        const completionTokens = data.usage?.output_tokens ?? 0;
        const totalTokens = promptTokens + completionTokens;

        // Estimativa para Claude 3.5 Sonnet: $3.00 / 1M input, $15.00 / 1M output
        const isHaiku = this.model.includes('haiku');
        const inputRate = isHaiku ? 0.0008 : 0.003;
        const outputRate = isHaiku ? 0.004 : 0.015;
        const estimatedCostUsd = (promptTokens * inputRate + completionTokens * outputRate) / 1000;

        return {
            id: data.id || `anthropic-${Date.now()}`,
            provider: this.name,
            model: this.model,
            content,
            usage: {
                promptTokens,
                completionTokens,
                totalTokens,
                estimatedCostUsd
            },
            latencyMs
        };
    }
}
