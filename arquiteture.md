# 🏛️ Arquitetura do Sistema — OmniRoute

> Visão estrutural, árvore de diretórios e divisão de responsabilidades dos módulos do **OmniRoute**.

---

## 📂 Estrutura de Diretórios Unificada

```
omniroute/
├── .env                          # Variáveis de ambiente e chaves de API
├── .env.example                  # Template público de variáveis de ambiente
├── .gitignore                    # Regras de exclusão do controle de versão
├── package.json                  # Dependências e scripts de execução
├── tsconfig.json                 # Configurações do compilador TypeScript
├── history.md                    # Histórico e registro técnico de implementação
├── arquiteture.md                # Visão arquitetural do sistema
├── README.md                     # Documentação geral e guia de uso
└── src/
    ├── index.ts                  # Ponto de entrada unificado (Exports & Runner)
    ├── cli.ts                    # Utilitário CLI para testes e benchmarks
    ├── mcp.ts                    # Entrypoint executável do Servidor MCP (Stdio)
    ├── providers/                # Camada de Adaptadores de Provedores de IA
    │   ├── base.ts               # Interfaces padronizadas (LLMProvider, ChatMessage, etc.)
    │   ├── openai.ts             # Adaptador OpenAI (GPT-4o / GPT-4o-mini)
    │   ├── gemini.ts             # Adaptador Google Gemini (1.5-Pro / 1.5-Flash)
    │   ├── anthropic.ts          # Adaptador Anthropic Claude (Claude 3.5 Sonnet)
    │   ├── ollama.ts             # Adaptador Ollama (Modelos Locais / Offline)
    │   └── factory.ts            # Fábrica e inicialização dos pools por Tier
    ├── router/                   # Motor de Roteamento Inteligente
    │   ├── classifier.ts         # Analisa a complexidade do prompt (Top-Tier vs Fast-Tier)
    │   ├── hybridEngine.ts       # Motor híbrido com Consenso Paralelo e Failover
    │   └── engine.ts             # Roteador sequencial base com tratamento de erros
    ├── mcp/                      # Protocolo de Contexto de Modelo (MCP)
    │   └── server.ts             # Ferramentas MCP avançadas (Smart Chat, Consenso, Especialistas)
    ├── server/                   # Camada de Servidor & API Gateway HTTP
    │   ├── gateway.ts            # Proxy HTTP com fallback e endpoints OpenAI (/v1/chat/completions)
    │   ├── app.ts                # Inicializador do Gateway HTTP (:3000)
    │   └── middlewares/
    │       └── auth.ts           # Middleware de autenticação por API Key (Bearer token)
    └── sdk/                      # SDK Cliente para integrações externas
        └── client.ts             # Cliente TypeScript OmniRouteClient
```

---

## 🧱 Divisão de Camadas e Responsabilidades

### 1. Camada de Provedores (`src/providers/`)
- **`base.ts`**: Define o contrato estrito `LLMProvider`, garantindo que qualquer provedor externo ou local exponha `isAvailable()` e `complete(req: CompletionRequest)`.
- **`openai.ts`**, **`gemini.ts`**, **`anthropic.ts`**, **`ollama.ts`**: Implementações concretas que adaptam formatos de payload, tratam cabeçalhos de autenticação e calculam métricas de custo e latência.
- **`factory.ts`**: Centraliza a criação e agrupamento dos pools por nível de capacidade (*Top-Tier*, *Fast-Tier* e *Offline-Tier*).

---

### 2. Camada de Roteamento & Inteligência (`src/router/`)
- **`classifier.ts`**: Analisador heurístico que detecta palavras-chave de alta complexidade (arquitetura, concorrência, deadlocks, segurança, refatoração) e tamanho de contexto para categorizar o prompt em `TOP_REASONING` ou `FAST_ECONOMY`.
- **`hybridEngine.ts`**: Núcleo orquestrador que executa:
  - **Roteamento Inteligente com Failover**: Direciona primeiro para o pool ideal e aciona backups em caso de falha.
  - **Consenso Híbrido**: Dispara em paralelo para dois modelos Top-Tier para gerar revisão cruzada (*Code Review* e Segunda Opinião).
  - **Roteamento Especialista**: Permite invocar modelos específicos sob demanda.

---

### 3. Camada MCP (`src/mcp/` & `src/server/mcp/`)
- **`server.ts`**: Implementa o protocolo MCP (*Model Context Protocol*) expondo ferramentas (`omniroute_smart_chat`, `omniroute_consensus_review`, `omniroute_specialist_chat`) para o **Agente Maestro (Antigravity IDE)** ou outros clientes MCP via Stdio.

---

### 4. Camada de Servidor & Gateway HTTP (`src/server/`)
- **`gateway.ts`**: API Express compatível com o endpoint `/v1/chat/completions` da OpenAI, anexando telemetria detalhada no bloco `_omniroute_meta`.
- **`middlewares/auth.ts`**: Validação de segurança via cabeçalho `Authorization: Bearer <OMNIROUTE_API_KEY>`.

---

### 5. Ponto de Entrada Unificado (`src/index.ts`)
- Exporta de forma limpa todas as interfaces, classes de provedores, motores de roteamento e servidores para uso como biblioteca ou execução direta como processo independente.