
omniroute/
├── package.json
├── tsconfig.json
├── .env.example
├── omniroute.config.json
└── src/
    ├── config/
    │   └── index.ts              # Configuração global e pesos
    ├── providers/
    │   ├── base.ts               # Interface padrão de Provider
    │   ├── openai.ts             # Adaptador OpenAI
    │   ├── anthropic.ts          # Adaptador Anthropic Claude
    │   ├── gemini.ts             # Adaptador Google Gemini
    │   └── ollama.ts             # Adaptador Ollama (Local)
    ├── router/                   # [Passo 1] Motor de Roteamento Inteligente
    │   ├── engine.ts             # Algoritmo de seleção, failover e retry
    │   └── costCalculator.ts     # Cálculo de custo e latência
    ├── server/                   # [Passo 2] API Gateway (OpenAI Compatible)
    │   ├── app.ts                # Express/HTTP App
    │   ├── middlewares/
    │   │   ├── auth.ts           # Autenticação de chaves
    │   │   └── rateLimiter.ts    # Rate limiting
    │   └── routes/
    │       └── completions.ts    # /v1/chat/completions e streaming SSE
    ├── sdk/                      # [Passo 3] SDK & Utilitário CLI
    │   └── client.ts
    └── cli.ts                    # CLI para testes e benchmarks