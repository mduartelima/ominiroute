import dotenv from 'dotenv';
import { createDefaultProviderPools } from './providers/factory';
import { HybridEngine } from './router/hybridEngine';
import { startGatewayServer } from './server/gateway';
import { startMcpServer } from './server/mcp/server';

dotenv.config();

// Exportações dos módulos principais
export * from './providers/base';
export * from './providers/openai';
export * from './providers/gemini';
export * from './providers/anthropic';
export * from './providers/ollama';
export * from './providers/factory';
export * from './router/classifier';
export * from './router/hybridEngine';
export * from './router/engine';
export * from './server/gateway';
export * from './server/mcp/server';
export * from './sdk/client';

// Execução direta como ponto de entrada principal
if (require.main === module || process.env.RUN_STANDALONE === 'true') {
    const isMcpMode = process.argv.includes('--mcp');
    const pools = createDefaultProviderPools();
    const engine = new HybridEngine(pools.topTier, pools.fastTier, pools.offlineTier);

    if (isMcpMode) {
        startMcpServer(engine);
    } else {
        const port = Number(process.env.PORT) || 3000;
        startGatewayServer(engine, port);
    }
}
