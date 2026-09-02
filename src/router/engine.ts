import { CompletionRequest, CompletionResponse, LLMProvider } from '../providers/base';

export class OmniRouter {
    constructor(private providers: LLMProvider[]) {}

    async route(req: CompletionRequest): Promise<CompletionResponse> {
        const errors: { provider: string; error: string }[] = [];

        for (const provider of this.providers) {
            const available = await provider.isAvailable();
            if (!available) {
                console.warn(`[OmniRouter] Provedor '${provider.name}' indisponível ou sem chave de API configurada. Tentando próximo...`);
                continue;
            }

            try {
                console.log(`[OmniRouter] Roteando requisição para: ${provider.name} (${provider.model})`);
                const response = await provider.complete(req);
                return response;
            } catch (err: any) {
                console.error(`[OmniRouter] Falha no provedor '${provider.name}':`, err.message);
                errors.push({ provider: provider.name, error: err.message });
                console.log(`[OmniRouter] Executando failover para o próximo provedor...`);
            }
        }

        throw new Error(
            `Todos os provedores configurados falharam ou estão indisponíveis. Detalhes: ${JSON.stringify(errors)}`
        );
    }
}
