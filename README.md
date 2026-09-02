# ⚡ OmniRoute — Cenário Híbrido v2.0

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Model Context Protocol](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)
![Anthropic](https://img.shields.io/badge/Anthropic_Claude-D97706?style=for-the-badge&logo=anthropic&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama_Offline-000000?style=for-the-badge&logo=ollama&logoColor=white)

**Gateway Inteligente, Roteador Multi-Tier e Servidor MCP com Failover Automático, Classificação de Complexidade e Consenso Híbrido.**

[Documentação Detalhada (History)](./history.md) • [Estrutura Arquitetural](./arquiteture.md)

</div>

---

## 📖 Sobre o OmniRoute Híbrido

O **OmniRoute** opera simultaneamente em duas frentes fundamentais:

1. 🔌 **Servidor MCP (Model Context Protocol)**: Fornece ferramentas para agentes de IA (como o **Agente Maestro no Antigravity IDE**) realizarem consultas com roteamento inteligente, **Consenso Híbrido** (Code Review cruzado entre 2 modelos Top-Tier) e seleção de especialistas.
2. 🌐 **Gateway HTTP OpenAI-Compatible (`:3000`)**: Roda em background provendo roteamento inteligente com *failover* em múltiplos tiers para qualquer biblioteca, SDK ou aplicação.
3. 🔍 **Classificador de Complexidade**: Identifica automaticamente se a tarefa exige um modelo de raciocínio pesado (**Top-Tier**: Claude 3.5 Sonnet / GPT-4o / Gemini 1.5 Pro) ou rápido/econômico (**Fast-Tier**: Gemini 1.5 Flash / GPT-4o Mini), com *fallback* final para modelos locais (**Tier Offline**: Ollama Llama-3).

---

## 🏗️ Arquitetura do Sistema

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
│                    │  - Análise de Tamanho de Contexto │                    │
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

## 🛠️ Ferramentas Disponíveis no Servidor MCP

Quando configurado no Antigravity IDE ou clientes MCP, o OmniRoute expõe as seguintes ferramentas:

| Ferramenta | Descrição |
| :--- | :--- |
| `omniroute_smart_chat` | Roteia automaticamente para o melhor modelo com base na complexidade detectada e executa failover em caso de indisponibilidade. |
| `omniroute_consensus_review` | Dispara em paralelo para dois modelos Top-Tier (ex: Claude 3.5 Sonnet e GPT-4o) para gerar uma revisão cruzada de código ou arquitetura. |
| `omniroute_specialist_chat` | Consulta direta a um especialista/modelo selecionado (ex: `claude`, `gpt-4o`, `gemini-1.5-pro`, `llama3`). |

---

## ⚙️ Configuração do Ambiente

1. Clone o repositório e instale as dependências:
```bash
git clone https://github.com/mduartelima/ominiroute.git
cd ominiroute
npm install
```

2. Crie e configure o arquivo `.env`:
```env
PORT=3000
OMNIROUTE_API_KEY=sua_chave_secreta_omniroute

# Provedores de IA
ANTHROPIC_API_KEY=sua_chave_anthropic
OPENAI_API_KEY=sua_chave_openai
GEMINI_API_KEY=sua_chave_google_gemini

# Provedor Local / Offline
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 🚀 Como Executar

### 1. Iniciar o Gateway HTTP (Modo Dev / Watch)
```bash
npm run dev
```
> Disponível em `http://localhost:3000`.

### 2. Iniciar o Servidor MCP (Stdio)
```bash
npm run mcp
```

#### 🔌 Configuração no Antigravity IDE / Claude Desktop (`mcp_config.json`):
```json
{
  "mcpServers": {
    "omniroute": {
      "command": "npx",
      "args": ["-y", "tsx", "src/mcp.ts"],
      "cwd": "C:/Users/mduarte/projetos/omniroute/ominiroute"
    }
  }
}
```

### 3. Executar Testes via CLI

- **Roteamento Inteligente com Classificação**:
```bash
npm run cli "Como otimizar queries SQL e evitar deadlock em concorrência alta?"
```

- **Consenso Híbrido (Code Review Cruzado)**:
```bash
npm run cli -- --consensus "Avalie esta função de lock distribuído em Redis e aponte falhas."
```

- **Consulta a Especialista Específico**:
```bash
npm run cli -- --specialist claude "Explique o padrão Saga em microsserviços."
```

### 4. Build de Produção
```bash
npm run build
npm start
```

---

## 📡 Referência da API HTTP

### `POST /v1/chat/completions` (OpenAI Compatible)
Recebe payloads padrão OpenAI e anexa metadados do OmniRoute (`_omniroute_meta`):

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua_chave_secreta_omniroute" \
  -d '{
    "messages": [
      { "role": "user", "content": "Refatore este algoritmo para tempo O(n log n)." }
    ],
    "temperature": 0.7
  }'
```

**Exemplo de Resposta com Metadados:**
```json
{
  "id": "chatcmpl-12345",
  "object": "chat.completion",
  "created": 1725241000,
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Aqui está a refatoração otimizada..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 230,
    "total_tokens": 272
  },
  "_omniroute_meta": {
    "tier": "TOP_REASONING",
    "reason": "Detectadas palavras-chave de alta complexidade: refatorar, algoritmo",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "latencyMs": 854,
    "estimatedCostUsd": 0.003576,
    "attemptedProviders": ["anthropic/claude-3-5-sonnet-20241022"],
    "failoverOccurred": false
  }
}
```

---

### `POST /v1/consensus`
Executa o consenso cruzado entre dois modelos Top-Tier via REST:

```bash
curl -X POST http://localhost:3000/v1/consensus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua_chave_secreta_omniroute" \
  -d '{
    "prompt": "Valide a segurança deste fluxo de autenticação OAuth2 com PKCE."
  }'
```

---

## 📂 Estrutura do Repositório

```
omniroute/
├── .env.example                  # Template de variáveis de ambiente
├── .gitignore                    # Regras de exclusão do git
├── package.json                  # Dependências e scripts (dev, mcp, cli, build)
├── tsconfig.json                 # Configurações do compilador TypeScript
├── history.md                    # Histórico e documentação técnica detalhada
├── arquiteture.md                # Visão arquitetural do sistema
├── README.md                     # Guia principal de uso e integração
└── src/
    ├── cli.ts                    # Utilitário de linha de comando
    ├── mcp.ts                    # Entrypoint do Servidor MCP Stdio
    ├── providers/                # Adaptadores de Provedores de IA
    │   ├── base.ts               # Interfaces unificadas (LLMProvider, etc.)
    │   ├── anthropic.ts          # Adaptador Claude 3.5 Sonnet
    │   ├── openai.ts             # Adaptador GPT-4o / GPT-4o-mini
    │   ├── gemini.ts             # Adaptador Gemini 1.5 Pro / Flash
    │   ├── ollama.ts             # Adaptador Ollama (Modelos Locais)
    │   └── factory.ts            # Fábrica dos Pools por Tier
    ├── router/                   # Motor Inteligente
    │   ├── classifier.ts         # Classificador Semântico de Complexidade
    │   ├── engine.ts             # Roteador sequencial base
    │   └── hybridEngine.ts       # Motor Híbrido com Consenso e Failover
    ├── sdk/                      # SDK Cliente
    │   └── client.ts             # Cliente TypeScript OmniRouteClient
    └── server/                   # API Gateway HTTP
        ├── app.ts                # Inicializador do Gateway HTTP
        ├── gateway.ts            # Rotas Express e endpoints
        ├── middlewares/
        │   └── auth.ts           # Middleware de autenticação Bearer
        └── mcp/
            └── server.ts         # Definição e handlers do Servidor MCP
```

---

## 👤 Autor

Desenvolvido por **mduartelima** (<m.duarte.lima@gmail.com>).

---

## 📄 Licença

Distribuído sob a licença [ISC](https://opensource.org/licenses/ISC).
