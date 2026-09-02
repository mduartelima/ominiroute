import dotenv from 'dotenv';
import { createDefaultProviderPools } from './providers/factory';
import { HybridEngine } from './router/hybridEngine';
import { startMcpServer } from './server/mcp/server';

dotenv.config();

const pools = createDefaultProviderPools();
const engine = new HybridEngine(pools.topTier, pools.fastTier, pools.offlineTier);

startMcpServer(engine);
