export interface OmniRouteClientConfig {
    baseUrl?: string;
    apiKey?: string;
}

export class OmniRouteClient {
    private baseUrl: string;
    private apiKey?: string;

    constructor(config: OmniRouteClientConfig = {}) {
        this.baseUrl = config.baseUrl || 'http://localhost:3000';
        this.apiKey = config.apiKey;
    }

    async chat(prompt: string): Promise<string> {
        const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = (await res.json()) as any;
        if (!res.ok) throw new Error(data.error?.message || 'Falha no OmniRoute');
        return data.choices[0].message.content;
    }
}