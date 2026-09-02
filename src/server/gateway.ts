import express from 'express';
import cors from 'cors';
import { HybridEngine } from '../router/hybridEngine';
import { apiKeyAuth } from './middlewares/auth';

export function createGatewayApp(engine: HybridEngine) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Health Check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            mode: 'hybrid',
            timestamp: new Date().toISOString()
        });
    });

    // Endpoint compatível com /v1/chat/completions da OpenAI com roteamento inteligente
    app.post('/v1/chat/completions', apiKeyAuth, async (req, res) => {
        try {
            const { messages, temperature, max_tokens, stream } = req.body;

            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ error: { message: 'Formato inválido: "messages" é obrigatório.' } });
            }

            const response = await engine.executeSmartRoute({
                messages,
                temperature,
                maxTokens: max_tokens,
                stream
            });

            res.json({
                id: response.id,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: `${response.provider}/${response.model}`,
                choices: [
                    {
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: response.content
                        },
                        finish_reason: 'stop'
                    }
                ],
                usage: {
                    prompt_tokens: response.usage.promptTokens,
                    completion_tokens: response.usage.completionTokens,
                    total_tokens: response.usage.totalTokens
                },
                _omniroute_meta: {
                    tier: response.routingMetadata.tier,
                    reason: response.routingMetadata.reason,
                    provider: response.provider,
                    model: response.model,
                    latencyMs: response.latencyMs,
                    estimatedCostUsd: response.usage.estimatedCostUsd,
                    attemptedProviders: response.routingMetadata.attemptedProviders,
                    failoverOccurred: response.routingMetadata.failoverOccurred
                }
            });
        } catch (err: any) {
            res.status(500).json({
                error: {
                    message: err.message || 'Erro interno no gateway OmniRoute',
                    type: 'omniroute_error'
                }
            });
        }
    });

    // Endpoint adicional para Consenso Híbrido via HTTP
    app.post('/v1/consensus', apiKeyAuth, async (req, res) => {
        try {
            const { prompt } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: { message: 'Campo "prompt" é obrigatório.' } });
            }

            const consensus = await engine.getConsensusReview(prompt);
            res.json(consensus);
        } catch (err: any) {
            res.status(500).json({
                error: {
                    message: err.message,
                    type: 'consensus_error'
                }
            });
        }
    });

    return app;
}

export function startGatewayServer(engine: HybridEngine, port: number = 3000) {
    const app = createGatewayApp(engine);
    return app.listen(port, () => {
        console.log(`⚡ [OmniRoute] Gateway HTTP Híbrido rodando em http://localhost:${port}`);
        console.log(`🔗 Endpoint OpenAI: http://localhost:${port}/v1/chat/completions`);
        console.log(`🔗 Endpoint Consenso: http://localhost:${port}/v1/consensus`);
    });
}