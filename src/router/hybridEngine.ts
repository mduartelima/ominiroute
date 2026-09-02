import { CompletionRequest, CompletionResponse, LLMProvider } from '../providers/base';
import { analyzePromptComplexity, ComplexityTier } from './classifier';

export interface SmartRouteResult extends CompletionResponse {
    routingMetadata: {
        tier: ComplexityTier;
        reason: string;
        attemptedProviders: string[];
        failoverOccurred: boolean;
    };
}

export interface ConsensusReviewResult {
    prompt: string;
    modelA: {
        provider: string;
        model: string;
        content: string;
        latencyMs: number;
        costUsd: number;
    };
    modelB: {
        provider: string;
        model: string;
        content: string;
        latencyMs: number;
        costUsd: number;
    };
    totalLatencyMs: number;
    totalCostUsd: number;
}

export class HybridEngine {
    constructor(
        private topTierProviders: LLMProvider[],     // Ex: Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro
        private fastTierProviders: LLMProvider[],    // Ex: Gemini 1.5 Flash, GPT-4o-mini
        private offlineTierProviders: LLMProvider[] = [] // Ex: Ollama Llama-3
    ) { }

    /**
     * Executa com roteamento automático baseado em complexidade e failover em cadeia
     */
    async executeSmartRoute(req: CompletionRequest): Promise<SmartRouteResult> {
        const promptText = req.messages.map(m => m.content).join('\n');
        const evaluation = analyzePromptComplexity(promptText);
        const tier = evaluation.tier;

        const primaryPool = tier === 'TOP_REASONING' ? this.topTierProviders : this.fastTierProviders;
        const backupPool = tier === 'TOP_REASONING' ? this.fastTierProviders : this.topTierProviders;
        const fullChain = [...primaryPool, ...backupPool, ...this.offlineTierProviders];

        const attemptedProviders: string[] = [];
        const errors: { provider: string; error: string }[] = [];

        for (const provider of fullChain) {
            try {
                const available = await provider.isAvailable();
                if (!available) {
                    continue;
                }

                attemptedProviders.push(`${provider.name}/${provider.model}`);
                console.log(`[Hybrid Engine] Roteando (${tier}) -> ${provider.name} (${provider.model})`);

                const response = await provider.complete(req);
                return {
                    ...response,
                    routingMetadata: {
                        tier,
                        reason: evaluation.reason,
                        attemptedProviders,
                        failoverOccurred: attemptedProviders.length > 1
                    }
                };
            } catch (err: any) {
                console.warn(`[Hybrid Failover] ${provider.name} (${provider.model}) falhou: ${err.message}. Tentando próximo...`);
                errors.push({ provider: `${provider.name}/${provider.model}`, error: err.message });
            }
        }

        throw new Error(
            `Todos os provedores falharam no pipeline híbrido. Tentativas: ${JSON.stringify(attemptedProviders)}. Erros: ${JSON.stringify(errors)}`
        );
    }

    /**
     * Consenso Híbrido: Pede a dois modelos Top-Tier em paralelo e gera uma revisão cruzada
     */
    async getConsensusReview(prompt: string): Promise<ConsensusReviewResult> {
        const start = Date.now();
        const availabilityResults = await Promise.all(
            this.topTierProviders.map(async (p) => ({ provider: p, available: await p.isAvailable() }))
        );

        const available = availabilityResults.filter(r => r.available).map(r => r.provider);

        if (available.length < 2) {
            throw new Error(
                `São necessários pelo menos 2 provedores Top-Tier configurados e disponíveis para Consenso. Disponíveis: ${available.map(p => p.name).join(', ') || 'Nenhum'}`
            );
        }

        const [pA, pB] = [available[0], available[1]];
        console.log(`[Consenso Híbrido] Executando revisão cruzada entre ${pA.name} (${pA.model}) e ${pB.name} (${pB.model})...`);

        const [resA, resB] = await Promise.all([
            pA.complete({ messages: [{ role: 'user', content: prompt }] }),
            pB.complete({ messages: [{ role: 'user', content: prompt }] })
        ]);

        const totalLatencyMs = Date.now() - start;
        const totalCostUsd = resA.usage.estimatedCostUsd + resB.usage.estimatedCostUsd;

        return {
            prompt,
            modelA: {
                provider: resA.provider,
                model: resA.model,
                content: resA.content,
                latencyMs: resA.latencyMs,
                costUsd: resA.usage.estimatedCostUsd
            },
            modelB: {
                provider: resB.provider,
                model: resB.model,
                content: resB.content,
                latencyMs: resB.latencyMs,
                costUsd: resB.usage.estimatedCostUsd
            },
            totalLatencyMs,
            totalCostUsd
        };
    }

    /**
     * Consulta a um especialista específico ou busca o melhor provedor que coincida com o nome/modelo
     */
    async executeWithSpecialist(req: CompletionRequest, targetNameOrModel: string): Promise<CompletionResponse> {
        const all = [...this.topTierProviders, ...this.fastTierProviders, ...this.offlineTierProviders];
        const match = all.find(
            p => p.name.toLowerCase() === targetNameOrModel.toLowerCase() ||
                 p.model.toLowerCase().includes(targetNameOrModel.toLowerCase())
        );

        if (!match) {
            throw new Error(`Especialista '${targetNameOrModel}' não encontrado no pool de provedores.`);
        }

        if (!(await match.isAvailable())) {
            throw new Error(`Especialista '${match.name} (${match.model})' não está disponível (chave de API não configurada ou serviço inacessível).`);
        }

        return await match.complete(req);
    }
}