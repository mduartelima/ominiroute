export type ComplexityTier = 'TOP_REASONING' | 'FAST_ECONOMY';

export interface ComplexityEvaluation {
    tier: ComplexityTier;
    reason: string;
    matchedKeywords: string[];
    contextLength: number;
}

export function evaluatePromptComplexity(prompt: string): ComplexityTier {
    const evaluation = analyzePromptComplexity(prompt);
    return evaluation.tier;
}

export function analyzePromptComplexity(prompt: string): ComplexityEvaluation {
    const highComplexityKeywords = [
        'arquitetura', 'architecture', 'refatorar', 'refactor', 'concorrência', 'concurrency',
        'deadlock', 'race condition', 'memory leak', 'algoritmo', 'algorithm', 'otimizar sql',
        'optimize query', 'segurança', 'security', 'vulnerabilidade', 'vulnerability',
        'design pattern', 'performance', 'debug difícil', 'benchmark', 'análise estática',
        'consenso', 'distributed system', 'consistência', 'escalabilidade', 'scalability'
    ];

    const lower = prompt.toLowerCase();
    const matched = highComplexityKeywords.filter(k => lower.includes(k));
    const isLongContext = prompt.length > 1500;

    if (matched.length > 0) {
        return {
            tier: 'TOP_REASONING',
            reason: `Detectadas palavras-chave de alta complexidade: ${matched.join(', ')}`,
            matchedKeywords: matched,
            contextLength: prompt.length
        };
    }

    if (isLongContext) {
        return {
            tier: 'TOP_REASONING',
            reason: `Contexto extenso (${prompt.length} caracteres > 1500 limit)`,
            matchedKeywords: [],
            contextLength: prompt.length
        };
    }

    return {
        tier: 'FAST_ECONOMY',
        reason: 'Prompt de complexidade padrão/rápida',
        matchedKeywords: [],
        contextLength: prompt.length
    };
}