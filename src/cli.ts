import dotenv from 'dotenv';
import { createDefaultProviderPools } from './providers/factory';
import { HybridEngine } from './router/hybridEngine';

dotenv.config();

async function main() {
    console.log('=====================================================');
    console.log('⚡ OmniRoute CLI — Modo Híbrido & Inteligente');
    console.log('=====================================================\n');

    const pools = createDefaultProviderPools();
    const engine = new HybridEngine(pools.topTier, pools.fastTier, pools.offlineTier);

    const args = process.argv.slice(2);
    const isConsensus = args.includes('--consensus');
    const specialistIndex = args.indexOf('--specialist');
    const specialist = specialistIndex !== -1 ? args[specialistIndex + 1] : null;

    const filteredArgs = args.filter(a => a !== '--consensus' && a !== '--specialist' && a !== specialist);
    const prompt = filteredArgs.join(' ') || 'Como estruturar uma arquitetura de microsserviços resiliente a deadlocks?';

    if (isConsensus) {
        console.log(`🔍 [Modo Consenso Híbrido] Executando revisão cruzada entre 2 modelos Top-Tier...`);
        console.log(`Prompt: "${prompt}"\n`);
        try {
            const consensus = await engine.getConsensusReview(prompt);
            console.log(`🤖 Modelo A: ${consensus.modelA.provider} (${consensus.modelA.model}) [${consensus.modelA.latencyMs}ms | $${consensus.modelA.costUsd.toFixed(6)}]`);
            console.log(`-----------------------------------------------------`);
            console.log(consensus.modelA.content.trim());
            console.log(`\n🤖 Modelo B: ${consensus.modelB.provider} (${consensus.modelB.model}) [${consensus.modelB.latencyMs}ms | $${consensus.modelB.costUsd.toFixed(6)}]`);
            console.log(`-----------------------------------------------------`);
            console.log(consensus.modelB.content.trim());
            console.log(`\n📊 Totais do Consenso:`);
            console.log(`- Latência total: ${consensus.totalLatencyMs}ms`);
            console.log(`- Custo total: $${consensus.totalCostUsd.toFixed(6)} USD`);
        } catch (err: any) {
            console.error('❌ Erro no consenso:', err.message);
        }
        return;
    }

    if (specialist) {
        console.log(`🎯 [Modo Especialista: ${specialist}]`);
        console.log(`Prompt: "${prompt}"\n`);
        try {
            const res = await engine.executeWithSpecialist(
                { messages: [{ role: 'user', content: prompt }] },
                specialist
            );
            console.log(`✅ [Resposta de ${res.provider.toUpperCase()} (${res.model})]:`);
            console.log(res.content.trim());
            console.log(`\n📊 Métricas: ${res.latencyMs}ms | ${res.usage.totalTokens} tokens | $${res.usage.estimatedCostUsd.toFixed(6)} USD`);
        } catch (err: any) {
            console.error('❌ Erro no especialista:', err.message);
        }
        return;
    }

    // Modo Padrão: Smart Route com Classificação Automática e Failover
    console.log(`🧠 [Modo Roteamento Inteligente & Failover]`);
    console.log(`Prompt: "${prompt}"\n`);

    try {
        const res = await engine.executeSmartRoute({
            messages: [{ role: 'user', content: prompt }]
        });

        console.log(`🎯 Tier Selecionado: [${res.routingMetadata.tier}]`);
        console.log(`📌 Motivo: ${res.routingMetadata.reason}`);
        console.log(`🚀 Provedor Vencedor: ${res.provider.toUpperCase()} (${res.model})`);
        if (res.routingMetadata.failoverOccurred) {
            console.log(`⚠️ Failover Ocorrido! Tentativas: ${res.routingMetadata.attemptedProviders.join(' -> ')}`);
        }
        console.log(`-----------------------------------------------------`);
        console.log(res.content.trim());
        console.log(`-----------------------------------------------------`);
        console.log(`📊 Métricas:`);
        console.log(`- Latência: ${res.latencyMs}ms`);
        console.log(`- Tokens: ${res.usage.totalTokens} (Prompt: ${res.usage.promptTokens}, Resp: ${res.usage.completionTokens})`);
        console.log(`- Custo estimado: $${res.usage.estimatedCostUsd.toFixed(6)} USD`);
    } catch (err: any) {
        console.error('❌ Erro durante a execução:', err.message);
    }
}

main();