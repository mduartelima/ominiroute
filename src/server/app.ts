import dotenv from 'dotenv';
import { createDefaultProviderPools } from '../providers/factory';
import { HybridEngine } from '../router/hybridEngine';
import { startGatewayServer } from './gateway';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Inicializa pools por Tier e motor híbrido
const pools = createDefaultProviderPools();
const hybridEngine = new HybridEngine(pools.topTier, pools.fastTier, pools.offlineTier);

// Inicia servidor HTTP Gateway
startGatewayServer(hybridEngine, PORT);