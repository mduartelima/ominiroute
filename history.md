# 📜 Histórico de Implementação — OmniRoute

> Registro detalhado do desenvolvimento, decisões arquiteturais, evolução dos módulos e status técnico do projeto **OmniRoute** (incluindo o **Cenário Híbrido v2.0**).

---

## 1. 🎯 Visão Geral do Projeto & Evolução para o Cenário Híbrido

O **OmniRoute** nasceu da necessidade de unificar o acesso a múltiplos modelos de linguagem de grande escala (LLMs) sob uma interface única, resiliente e compatível com os padrões de mercado.

Na versão **v2.0 (Cenário Híbrido)**, o OmniRoute evoluiu para operar em uma arquitetura dual:
1. **Servidor MCP (Model Context Protocol)**: Disponibiliza ferramentas especializadas para o **Agente Maestro (Antigravity IDE)** realizar consultas com classificação de complexidade, Consenso Híbrido (Code Review Cruzado e Segunda Opinião) e seleção de especialistas.
2. **Proxy HTTP / API Gateway OpenAI Compatible (`:3000`)**: Roda em background provendo roteamento inteligente com *failover* em múltiplos tiers de modelos para qualquer aplicação cliente.
3. **Classificador de Complexidade**: Analisa semântica e tamanho de contexto para despachar requisições para o tier de **Raciocínio Pesado (Top-Tier)** ou **Rápido/Econômico (Fast-Tier)**.

---

## 2. 🏗️ Arquitetura do Cenário Híbrido

```
                     ┌─────────────────────────────────────────┐
                     │             Antigravity IDE             │
                     │       🧠 Agente Antigravity - Maestro   │
                     └─────────────┬─────────────────────┬─────┘
                                   │                     │
                     Via Protocolo │ MCP                 │ Via Proxy HTTP (:3000)
                                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             OmniRoute Híbrido                               │
│                                                                             │
│  ┌────────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │ 🔌 Servidor MCP                    │ │ 🌐 Gateway HTTP (:3000)        │  │
│  │  - omniroute_smart_chat            │ │  - POST /v1/chat/completions   │  │
│  │  - omniroute_consensus_review      │ │  - POST /v1/consensus          │  │
│  │  - omniroute_specialist_chat       │ │  - GET /health                 │  │
│  └─────────────────┬──────────────────┘ └───────────────┬────────────────┘  │
│                    │                                    │                   │
│                    └─────────────────┬──────────────────┘                   │
│                                      │                                      │
│                                      ▼                                      │
│                    ┌───────────────────────────────────┐                    │
│                    │ 🔍 Classificador de Complexidade  │                    │
│                    │  - Heurística & Keywords          │                    │
│                    │  - Análise de Context Length      │                    │
│                    └─────────────────┬─────────────────┘                    │
│                                      │                                      │
│                                      ▼                                      │
│                    ┌───────────────────────────────────┐                    │
│                    │ 🛡️ Hybrid Engine & Failover Chain │                    │
│                    │  - Top-Tier / Fast-Tier / Offline │                    │
│                    │  - Consenso Paralelo / Métricas   │                    │
│                    └─────────────────┬─────────────────┘                    │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│ ⭐ Tier Raciocínio      │ │ ⚡ Tier Rápido          │ │ 💻 Tier Offline         │
│   Pesado (Top-Tier)     │ │   Econômico (Fast-Tier) │ │   (Local)               │
│ ----------------------- │ │ ----------------------- │ │ ----------------------- │
│ • Claude 3.5 Sonnet     │ │ • Gemini 1.5 Flash      │ │ • Ollama (Llama-3)      │
│ • OpenAI GPT-4o         │ │ • OpenAI GPT-4o-mini    │ │                         │
│ • Gemini 1.5 Pro        │ │                         │ │                         │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 3. 🧩 Detalhamento dos Módulos Implementados

### 3.1. Provedores de IA (`src/providers/`)
- **`src/providers/base.ts`**: Contrato unificado `LLMProvider`, `ChatMessage`, `CompletionRequest`, `CompletionResponse`.
- **`src/providers/anthropic.ts`**: Adaptador para Anthropic Claude (`claude-3-5-sonnet-20241022`), adaptando payload e extraindo custos com taxas de input/output.
- **`src/providers/openai.ts`**: Adaptador para OpenAI (`gpt-4o`, `gpt-4o-mini`) com suporte a Bearer token e precificação por token.
- **`src/providers/gemini.ts`**: Adaptador para Google Gemini (`gemini-1.5-pro`, `gemini-1.5-flash`) via Google Generative AI REST API.
- **`src/providers/ollama.ts`**: Adaptador para Ollama local (`llama3`), com checagem assíncrona de disponibilidade contra `/api/tags` e custo $0.00.
- **`src/providers/factory.ts`**: Criação padronizada de pools `topTier`, `fastTier` e `offlineTier`.

### 3.2. Classificador de Complexidade (`src/router/classifier.ts`)
- Avalia termos críticos de engenharia de software (arquitetura, concorrência, deadlocks, memory leaks, segurança, otimização SQL, design patterns).
- Analisa o tamanho do prompt (> 1500 caracteres).
- Classifica em `TOP_REASONING` ou `FAST_ECONOMY` com metadados explicativos.

### 3.3. Motor Híbrido & Consenso (`src/router/hybridEngine.ts`)
- **`executeSmartRoute`**:
  1. Identifica o Tier ideal.
  2. Tenta os provedores do Tier primário.
  3. Em caso de indisponibilidade ou erro, aciona o Tier de backup e finalmente o Tier offline.
  4. Retorna resposta com `routingMetadata` completo (tentativas, failover ocorrido, tier).
- **`getConsensusReview`**:
  1. Filtra os modelos Top-Tier disponíveis.
  2. Dispara requisições simultâneas via `Promise.all`.
  3. Retorna análise cruzada com métricas consolidadas de latência e custo.
- **`executeWithSpecialist`**:
  1. Roteia diretamente para o modelo/provedor solicitado.

### 3.4. Servidor MCP (`src/server/mcp/server.ts` & `src/mcp.ts`)
- Integração oficial via `@modelcontextprotocol/sdk` com transporte `StdioServerTransport`.
- Ferramentas expostas:
  - `omniroute_smart_chat`: Consulta com despacho inteligente e proteção contra quedas.
  - `omniroute_consensus_review`: Revisão cruzada entre 2 modelos Top-Tier para validação profunda.
  - `omniroute_specialist_chat`: Consulta direcionada a um modelo específico.

### 3.5. Gateway HTTP & API REST (`src/server/gateway.ts` & `src/server/app.ts`)
- Express HTTP Gateway na porta `3000`.
- Endpoints:
  - `GET /health`: Healthcheck do gateway e modo operacional.
  - `POST /v1/chat/completions`: Formato padrão OpenAI + telemetria no bloco `_omniroute_meta`.
  - `POST /v1/consensus`: Endpoint REST para revisão de consenso.
- Middleware `apiKeyAuth` para autenticação Bearer.

### 3.6. CLI & Benchmark (`src/cli.ts`)
- Suporte a comandos:
  - `npm run cli "<prompt>"`: Roteamento inteligente padrão.
  - `npm run cli -- --consensus "<prompt>"`: Benchmark de consenso cruzado.
  - `npm run cli -- --specialist claude "<prompt>"`: Teste de especialista.

---

## 4. 📊 Tabela de Decisões Técnicas

| Decisão | Escolha | Motivação |
| :--- | :--- | :--- |
| **Integração IDE / Agente** | Model Context Protocol (MCP) via Stdio | Padrão aberto da indústria, suportado nativamente pelo Antigravity IDE e Claude. |
| **Classificação de Complexidade** | Heurística Semântica + Tamanho | Sem sobrecarga de latência adicional (0ms) antes do despacho para o modelo ideal. |
| **Consenso Híbrido** | Execução Paralela (`Promise.all`) | Minimiza tempo de espera ao buscar simultaneamente a opinião de múltiplos Top-Tiers. |
| **Tier Offline (Ollama)** | Fallback Final com Detecção de Daemon | Garante continuidade operacional mesmo em caso de perda total de conectividade com a nuvem. |
| **Padronização OpenAI** | Formato `/v1/chat/completions` | Compatibilidade plug-and-play com ferramentas, SDKs e extensões existentes. |

---

## 5. 🗺️ Status Atual do Projeto

```
[CONCLUÍDO - v2.0 HÍBRIDO]
├── ✅ Setup TypeScript + tsx + npm scripts
├── ✅ Interfaces de Provedores (LLMProvider)
├── ✅ Adaptador Anthropic Claude (Claude 3.5 Sonnet)
├── ✅ Adaptador OpenAI (GPT-4o, GPT-4o-mini)
├── ✅ Adaptador Google Gemini (Gemini 1.5 Pro, Gemini 1.5 Flash)
├── ✅ Adaptador Ollama (Llama-3 Local / Offline)
├── ✅ Classificador de Complexidade (classifier.ts)
├── ✅ Motor HybridEngine com Multi-Tier Failover
├── ✅ Consenso Híbrido Paralelo (getConsensusReview)
├── ✅ Servidor MCP Stdio (omniroute_smart_chat, omniroute_consensus_review, omniroute_specialist_chat)
├── ✅ Gateway HTTP Express (/health, /v1/chat/completions, /v1/consensus)
├── ✅ Middleware de Autenticação (Bearer token)
├── ✅ SDK TypeScript (OmniRouteClient)
└── ✅ CLI Interativo com suporte a Consenso e Especialistas
```
