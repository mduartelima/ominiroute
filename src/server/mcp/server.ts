import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { HybridEngine } from '../../router/hybridEngine';

export function startMcpServer(engine: HybridEngine) {
    const server = new Server(
        {
            name: 'omniroute-hybrid-mcp',
            version: '2.0.0'
        },
        {
            capabilities: {
                tools: {}
            }
        }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: 'omniroute_smart_chat',
                description: 'Consulta o melhor modelo de IA com seleção automática de complexidade (Top-Tier para raciocínio/arquitetura e Fast-Tier para tarefas rápidas) e failover integrado.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'Prompt, código ou pergunta a ser processada pelo OmniRoute'
                        },
                        systemInstruction: {
                            type: 'string',
                            description: 'Instrução de sistema opcional (System Prompt)'
                        }
                    },
                    required: ['prompt']
                }
            },
            {
                name: 'omniroute_consensus_review',
                description: 'Executa uma revisão cruzada (Consenso Híbrido) entre dois modelos Top-Tier (ex: Claude 3.5 Sonnet e GPT-4o) para encontrar bugs sutis, falhas de segurança e validar arquiteturas.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        codeOrQuestion: {
                            type: 'string',
                            description: 'Código, design de arquitetura ou dúvida técnica para validação cruzada'
                        }
                    },
                    required: ['codeOrQuestion']
                }
            },
            {
                name: 'omniroute_specialist_chat',
                description: 'Consulta direta a um modelo ou provedor especialista específico (ex: claude, gpt-4o, gemini-1.5-pro, llama3).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        specialist: {
                            type: 'string',
                            description: 'Nome do especialista ou modelo (ex: claude, gpt-4o, gemini, llama3)'
                        },
                        prompt: {
                            type: 'string',
                            description: 'Pergunta ou tarefa para o especialista'
                        }
                    },
                    required: ['specialist', 'prompt']
                }
            }
        ]
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            if (name === 'omniroute_smart_chat') {
                const prompt = String(args?.prompt || '');
                const system = args?.systemInstruction ? String(args.systemInstruction) : undefined;

                const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
                if (system) {
                    messages.push({ role: 'system', content: system });
                }
                messages.push({ role: 'user', content: prompt });

                const res = await engine.executeSmartRoute({ messages });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                answer: res.content,
                                routing: {
                                    tier: res.routingMetadata.tier,
                                    reason: res.routingMetadata.reason,
                                    selectedModel: `${res.provider}/${res.model}`,
                                    attemptedProviders: res.routingMetadata.attemptedProviders,
                                    failoverOccurred: res.routingMetadata.failoverOccurred
                                },
                                metrics: {
                                    latencyMs: res.latencyMs,
                                    tokens: res.usage.totalTokens,
                                    estimatedCostUsd: res.usage.estimatedCostUsd
                                }
                            }, null, 2)
                        }
                    ]
                };
            }

            if (name === 'omniroute_consensus_review') {
                const input = String(args?.codeOrQuestion || '');
                const consensus = await engine.getConsensusReview(input);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                summary: 'Revisão Cruzada de Consenso Concluída',
                                modelA: {
                                    provider: consensus.modelA.provider,
                                    model: consensus.modelA.model,
                                    latencyMs: consensus.modelA.latencyMs,
                                    costUsd: consensus.modelA.costUsd,
                                    review: consensus.modelA.content
                                },
                                modelB: {
                                    provider: consensus.modelB.provider,
                                    model: consensus.modelB.model,
                                    latencyMs: consensus.modelB.latencyMs,
                                    costUsd: consensus.modelB.costUsd,
                                    review: consensus.modelB.content
                                },
                                totals: {
                                    latencyMs: consensus.totalLatencyMs,
                                    costUsd: consensus.totalCostUsd
                                }
                            }, null, 2)
                        }
                    ]
                };
            }

            if (name === 'omniroute_specialist_chat') {
                const specialist = String(args?.specialist || '');
                const prompt = String(args?.prompt || '');
                const res = await engine.executeWithSpecialist(
                    { messages: [{ role: 'user', content: prompt }] },
                    specialist
                );
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                specialist: `${res.provider}/${res.model}`,
                                answer: res.content,
                                latencyMs: res.latencyMs,
                                costUsd: res.usage.estimatedCostUsd
                            }, null, 2)
                        }
                    ]
                };
            }

            throw new Error(`Ferramenta '${name}' não reconhecida.`);
        } catch (err: any) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: `Erro ao executar a ferramenta '${name}': ${err.message}`
                    }
                ]
            };
        }
    });

    const transport = new StdioServerTransport();
    server.connect(transport);
    console.error('🚀 [OmniRoute MCP] Servidor MCP Stdio conectado e pronto.');
}