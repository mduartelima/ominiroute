# ⚡ OmniRoute

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![OpenAI](https://img.shields.io/badge/OpenAI_Compatible-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**Gateway inteligente e roteador unificado de LLMs com failover automático, compatibilidade com a API da OpenAI e telemetria de custos e latência.**

[Documentação de Implementação (History)](./history.md) • [Estrutura Arquitetural](./arquiteture.md)

</div>

---

## 📖 Sobre o OmniRoute

O **OmniRoute** atua como uma camada intermediária (*API Gateway*) inteligente entre suas aplicações e múltiplos provedores de Modelos de Linguagem (LLMs). Ele abstrai as diferenças de contratos entre APIs proprietárias (como Google Gemini e OpenAI), oferecendo um endpoint unificado e compatível com a especificação da OpenAI (`/v1/chat/completions`).

Se um provedor falhar, cair ou atingir limites de cota, o **OmniRoute** executa *failover* imediato para o próximo provedor disponível sem interromper a experiência do usuário.

---

## 🌟 Funcionalidades Principais

- 🔄 **Failover Automático e Transparente**: Se o provedor primário falhar, o próximo da cadeia é acionado automaticamente.
- 🔌 **Compatibilidade Padrão OpenAI**: Funciona como substituto direto em bibliotecas e ferramentas compatíveis com a OpenAI.
- 📊 **Telemetria de Custo e Latência**: Cada resposta inclui o bloco `_omniroute_meta` com latência em milissegundos, tokens utilizados e custo estimado em USD.
- 🛡️ **Autenticação Segura**: Middleware para controle de acesso via chaves de API (`Bearer token`).
- 📦 **SDK e CLI Integrados**: Acompanha cliente TypeScript pronto para uso e CLI para testes rápidos e benchmarks via terminal.
- 🧩 **Arquitetura Extensível**: Novos provedores (como Anthropic Claude, Ollama, Groq) podem ser adicionados facilmente implementando a interface `LLMProvider`.

---

## 🏗️ Diagrama da Arquitetura

```
                         ┌─────────────────────────┐
                         │   Aplicação Cliente     │
                         │   (SDK / cURL / OpenAI) │
                         └────────────┬────────────┘
                                      │ HTTP Request
                                      ▼
                         ┌─────────────────────────┐
                         │    OmniRoute Gateway    │
                         │  - Express / CORS / Auth│
                         │  - POST /v1/chat/compl. │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     OmniRouter Engine   │
                         │  (Failover & Dispatch)  │
                         └──────┬───────────┬──────┘
                                │           │
                    [1º Tentativa]         [Fallback / Failover]
                                │           │
                                ▼           ▼
                     ┌───────────────┐ ┌───────────────┐
                     │ Google Gemini │ │    OpenAI     │
                     │  (1.5-flash)  │ │ (gpt-4o-mini) │
                     └───────────────┘ └───────────────┘
```

---

## ⚙️ Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/mduartelima/ominiroute.git
cd ominiroute
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env` a partir do modelo [.env.example](./.env.example):
```bash
cp .env.example .env
```

4. Configure suas chaves de API no arquivo `.env`:
```env
PORT=3000
OMNIROUTE_API_KEY=sua_chave_secreta_omniroute
GEMINI_API_KEY=sua_chave_google_gemini
OPENAI_API_KEY=sua_chave_openai
```

---

## 🚀 Como Executar

### 1. Iniciar o Gateway em Modo de Desenvolvimento (Live Reload)
```bash
npm run dev
```
> O servidor iniciará em `http://localhost:3000`.

### 2. Testar via CLI Interativo
```bash
npm run cli "Explique o que é OmniRoute em poucas palavras."
```

### 3. Build e Execução em Produção
```bash
npm run build
npm start
```

---

## 📡 Referência da API

### `GET /health`
Verifica a integridade e disponibilidade do gateway.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-01T22:30:00.000Z"
}
```

---

### `POST /v1/chat/completions`
Endpoint principal compatível com o formato OpenAI.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <OMNIROUTE_API_KEY>` *(se configurado)*

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua_chave_secreta_omniroute" \
  -d '{
    "messages": [
      { "role": "system", "content": "Você é um assistente prestativo." },
      { "role": "user", "content": "Qual a capital do Brasil?" }
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

**Exemplo de Resposta:**
```json
{
  "id": "gemini-1725240000000",
  "object": "chat.completion",
  "created": 1725240000,
  "model": "gemini/gemini-1.5-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "A capital do Brasil é Brasília."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  },
  "_omniroute_meta": {
    "provider": "gemini",
    "latencyMs": 342,
    "estimatedCostUsd": 0.000001725
  }
}
```

---

## 💻 Uso via SDK TypeScript

Você pode integrar o cliente do OmniRoute diretamente em aplicações TypeScript/JavaScript:

```typescript
import { OmniRouteClient } from './src/sdk/client';

async function run() {
  const client = new OmniRouteClient({
    baseUrl: 'http://localhost:3000',
    apiKey: 'sua_chave_secreta_omniroute'
  });

  const resposta = await client.chat('Explique computação quântica em um parágrafo.');
  console.log(resposta);
}

run();
```

---

## 📂 Estrutura de Pastas

```
omniroute/
├── .env.example                  # Template de variáveis de ambiente
├── .gitignore                    # Regras de exclusão do git
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configurações do TypeScript
├── history.md                    # Histórico detalhado de implementação
├── arquiteture.md                # Visão arquitetural do sistema
├── README.md                     # Documentação principal
└── src/
    ├── cli.ts                    # Utilitário CLI para testes e benchmarks
    ├── providers/                # Adaptadores de LLMs
    │   ├── base.ts               # Interfaces padronizadas (LLMProvider, etc.)
    │   ├── gemini.ts             # Adaptador Google Gemini
    │   └── openai.ts             # Adaptador OpenAI
    ├── router/                   # Motor de Roteamento Inteligente
    │   └── engine.ts             # OmniRouter com lógica de Failover e Retry
    ├── sdk/                      # SDK Cliente
    │   └── client.ts             # OmniRouteClient
    └── server/                   # API Gateway HTTP
        ├── app.ts                # Servidor Express e rotas
        └── middlewares/
            └── auth.ts           # Middleware de autenticação Bearer
```

---

## 🗺️ Roadmap de Desenvolvimento

- [x] **Setup do Core**: TypeScript, scripts e build (`npm run build`, `npm run dev`).
- [x] **Interfaces Padronizadas**: Contrato `LLMProvider` com interfaces genéricas.
- [x] **Adaptadores Iniciais**: Google Gemini (`gemini-1.5-flash`) e OpenAI (`gpt-4o-mini`).
- [x] **Motor com Failover**: Roteamento sequencial e tratamento de falhas.
- [x] **Gateway OpenAI Compatible**: Endpoint `/v1/chat/completions` com metadados `_omniroute_meta`.
- [x] **Autenticação**: Middleware Bearer Token.
- [x] **SDK & CLI**: Cliente TypeScript e ferramenta de terminal.
- [ ] **Streaming SSE**: Suporte a respostas em tempo real via Server-Sent Events.
- [ ] **Novos Provedores**: Anthropic (Claude 3.5), Ollama (Modelos Locais) e Groq.
- [ ] **Roteamento Inteligente Avançado**: Seleção dinâmica baseada em menor latência ou menor custo financeiro.
- [ ] **Rate Limiting**: Controle de requisições por IP e chave de API.

---

## 👤 Autor

Desenvolvido por **mduartelima** (<m.duarte.lima@gmail.com>).

---

## 📄 Licença

Distribuído sob a licença [ISC](https://opensource.org/licenses/ISC).
