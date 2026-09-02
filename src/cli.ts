import { OmniRouter } from './router/engine';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('--- 🧪 Testando OmniRoute com Failover ---');

    const router = new OmniRouter([
        new GeminiProvider('gemini-1.5-flash'),
        new OpenAIProvider('gpt-4o-mini')
    ]);

    const prompt = process.argv[2] || 'Explique em 1 frase o que é um API Gateway.';

    console.log(`Pergunta: "${prompt}"\n`);

    try {
        const res = await router.route({
            messages: [{ role: 'user', content: prompt }]
        });

        console.log(`✅ [Resposta recebida via ${res.provider.toUpperCase()} (${res.model})]:`);
        console.log(`"${res.content.trim()}"\n`);
        console.log(`📊 Métricas:`);
        console.log(`- Latência: ${res.latencyMs}ms`);
        console.log(`- Tokens: ${res.usage.totalTokens}`);
        console.log(`- Custo estimado: $${res.usage.estimatedCostUsd.toFixed(6)} USD`);
    } catch (err: any) {
        console.error('❌ Erro durante a execução:', err.message);
    }
}

main();