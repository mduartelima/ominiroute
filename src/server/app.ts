import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAIProvider } from '../providers/openai';
import { GeminiProvider } from '../providers/gemini';
import { OmniRouter } from '../router/engine';
import { apiKeyAuth } from './middlewares/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicializa provedores e motor
const router = new OmniRouter([
    new GeminiProvider('gemini-1.5-flash'),
    new OpenAIProvider('gpt-4o-mini')
]);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint compatível com /v1/chat/completions da OpenAI
app.post('/v1/chat/completions', apiKeyAuth, async (req, res) => {
    try {
        const { messages, temperature, max_tokens, stream } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Formato inválido: "messages" é obrigatório.' } });
        }

        const response = await router.route({
            messages,
            temperature,
            maxTokens: max_tokens,
            stream
        });

        // Formato padrão OpenAI
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
                provider: response.provider,
                latencyMs: response.latencyMs,
                estimatedCostUsd: response.usage.estimatedCostUsd
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

app.listen(PORT, () => {
    console.log(`⚡ OmniRoute Gateway rodando na porta ${PORT}`);
    console.log(`🔗 Endpoint OpenAI: http://localhost:${PORT}/v1/chat/completions`);
});