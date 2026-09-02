# 📜 Histórico de Implementação — OmniRoute

> Registro detalhado do desenvolvimento, decisões arquiteturais, evolução dos módulos e status técnico do projeto **OmniRoute**.

---

## 1. 🎯 Visão Geral do Projeto

O **OmniRoute** nasceu da necessidade de unificar o acesso a múltiplos modelos de linguagem de grande escala (LLMs) sob uma interface única, resiliente e compatível com os padrões de mercado (especialmente a especificação da API de Chat Completions da OpenAI).

### Principais Objetivos:
- **Resiliência Máxima**: Roteamento com *failover* automático e transparente quando um provedor falha ou atinge limites de taxa (*rate limits*).
- **Compatibilidade Padrão**: Suporte ao formato de entrada/saída `/v1/chat/completions` da OpenAI, facilitando a substituição de provedores sem alterar o código cliente.
- **Transparência de Custos e Métricas**: Adição de metadados (`_omniroute_meta`) contendo provedor utilizado, tempo de resposta (latência em ms), consumo de tokens e custo estimado em USD.
- **Desenvolvimento Modular**: Facilidade para plugar novos provedores (Anthropic, Ollama, Groq, Cohere, etc.) mantendo a mesma interface contratual.

---

## 2. 🏗️ Arquitetura e Padrões de Projeto

A arquitetura do OmniRoute foi concebida seguindo princípios de alta coesão e baixo acoplamento:

```
                  ┌─────────────────────────────────────────┐
                  │              Cliente / SDK              │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / REST
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       API Gateway (Express Server)      │
                  │  - Auth Middleware (Bearer Token)       │
                  │  - CORS & JSON Parser                   │
                  │  - POST /v1/chat/completions            │
                  │  - GET /health                          │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       OmniRouter (Router Engine)        │
                  │  - Verificação de Disponibilidade       │
                  │  - Execução Sequencial / Failover       │
                  │  - Coleta de Latência e Erros           │
                  └──────┬───────────────────────────┬──────┘
                         │                           │
                         ▼                           ▼
            ┌────────────────────────┐  ┌────────────────────────┐
            │  GeminiProvider        │  │  OpenAIProvider        │
            │  (gemini-1.5-flash)    │  │  (gpt-4o-mini)         │
            └────────────────────────┘  └────────────────────────┘
```

### Padrões de Projeto Aplicados:
1. **Adapter Pattern**:
   - Cada provedor (`OpenAIProvider`, `GeminiProvider`) implementa a interface comum `LLMProvider`, adaptando as peculiaridades de cada API proprietária (payloads, schemas de roles, headers de autenticação) para um formato padronizado.
2. **Strategy / Chain of Responsibility (Engine)**:
   - O `OmniRouter` itera sobre a cadeia de provedores configurados, verificando prontidão (`isAvailable()`) e executando a tentativa com tratamento de fallback automático em caso de erro.
3. **Middleware Pattern**:
   - Autenticação e validações desacopladas do controlador da rota (`apiKeyAuth`).

---

## 3. 🧩 Detalhamento dos Módulos Implementados

### 3.1. Tipos e Contratos Base (`src/providers/base.ts`)
Define as interfaces fundamentais do sistema:
- `ChatMessage`: Estrutura padrão de mensagens (`role: 'system' | 'user' | 'assistant'`, `content: string`).
- `CompletionRequest`: Payload de requisição unificado com parâmetros como `temperature`, `maxTokens`, `stream`.
- `CompletionResponse`: Resposta unificada contendo id, modelo, provedor, conteúdo, estatísticas de tokens, custo em dólares e latência em milissegundos.
- `LLMProvider`: Contrato obrigatório com métodos `isAvailable(): Promise<boolean>` e `complete(req: CompletionRequest): Promise<CompletionResponse>`.

### 3.2. Adaptadores de Provedores (`src/providers/`)
- **Google Gemini (`src/providers/gemini.ts`)**:
  - Utiliza o endpoint nativo `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
  - Mapeia papéis (`roles`) para a convenção do Gemini (`assistant` -> `model`, `user` -> `user`).
  - Extrai estatísticas de `usageMetadata` e calcula custo estimado baseado na precificação por token do modelo `gemini-1.5-flash`.
- **OpenAI (`src/providers/openai.ts`)**:
  - Utiliza o endpoint oficial `https://api.openai.com/v1/chat/completions`.
  - Envia autenticação via `Bearer token` e captura tokens de prompt e completion para cálculo financeiro (`gpt-4o-mini`).

### 3.3. Motor de Roteamento e Failover (`src/router/engine.ts`)
- Classe `OmniRouter`:
  - Recebe um array ordenado de instâncias de `LLMProvider`.
  - Testa `provider.isAvailable()` antes de disparar a requisição (evita chamadas desnecessárias se chaves não estiverem configuradas).
  - Em caso de falha em tempo de execução (erro de rede, status 4xx/5xx, quota excedida), registra o log do erro e passa imediatamente para o próximo provedor.
  - Lança erro detalhado apenas se **todos** os provedores falharem.

### 3.4. API Gateway HTTP (`src/server/app.ts`)
- Servidor baseado em Express com middleware de CORS e JSON.
- **`GET /health`**: Endpoint para verificação de integridade e prontidão do gateway.
- **`POST /v1/chat/completions`**:
  - Valida o payload de entrada.
  - Roteia via `OmniRouter`.
  - Formata a saída no padrão OpenAI JSON com inclusão do bloco `_omniroute_meta` para auditoria e métricas.

### 3.5. Middleware de Segurança (`src/server/middlewares/auth.ts`)
- Valida o header `Authorization: Bearer <OMNIROUTE_API_KEY>`.
- Permite acesso aberto se `OMNIROUTE_API_KEY` não for configurada no ambiente (ideal para desenvolvimento local simplificado).

### 3.6. SDK Cliente (`src/sdk/client.ts`)
- Classe `OmniRouteClient`:
  - Fornece método conciso `chat(prompt: string): Promise<string>`.
  - Configuração simples com `baseUrl` e `apiKey`.

### 3.7. Utilitário de Linha de Comando (`src/cli.ts`)
- Permite testar o roteador e visualizar o comportamento de failover diretamente pelo terminal, exibindo tempos de resposta, custo e provedor vencedor.

---

## 4. 📊 Tabela de Decisões Técnicas

| Decisão | Escolha | Motivação |
| :--- | :--- | :--- |
| **Runtime & Linguagem** | Node.js / TypeScript | Tipagem estática rigorosa para payloads de LLM e ecossistema maduro para APIs. |
| **Execução em Dev** | `tsx` | Compilação e execução instantânea sem necessidade de build intermediário em desenvolvimento. |
| **Padrão de API** | OpenAI Compatible | Máxima compatibilidade com bibliotecas existentes (LangChain, LlamaIndex, OpenAI SDK). |
| **Tratamento de Falhas** | Failover Sequencial Gracioso | Garantia de alta disponibilidade da aplicação final sem downtime para o usuário. |
| **Cálculo de Custos** | Inline no Adaptador | Estimativa instantânea de custos operacionais por requisição. |

---

## 5. 🗺️ Status Atual e Próximas Etapas

```
[CONCLUÍDO]
├── ✅ Setup TypeScript + tsx + npm scripts
├── ✅ Interfaces de Provedores (LLMProvider)
├── ✅ Adaptador Google Gemini (gemini-1.5-flash)
├── ✅ Adaptador OpenAI (gpt-4o-mini)
├── ✅ Motor OmniRouter com Failover Automático
├── ✅ Gateway HTTP Express (/health, /v1/chat/completions)
├── ✅ Middleware de Autenticação (Bearer token)
├── ✅ SDK TypeScript (OmniRouteClient)
└── ✅ CLI de Testes e Benchmark

[PLANEJADO / PRÓXIMAS FASES]
├── 🔄 Suporte a Streaming SSE (Server-Sent Events)
├── 🔄 Provedores Anthropic Claude e Ollama (Local)
├── 🔄 Módulo de Rate Limiting por IP/Token
├── 🔄 Roteamento Dinâmico por Custo / Latência (costCalculator)
└── 🔄 Arquivo de configuração global omniroute.config.json
```
