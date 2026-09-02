import { LLMProvider } from './base';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';

export interface ProviderPools {
    topTier: LLMProvider[];
    fastTier: LLMProvider[];
    offlineTier: LLMProvider[];
}

export function createDefaultProviderPools(): ProviderPools {
    const topTier: LLMProvider[] = [
        new AnthropicProvider('claude-3-5-sonnet-20241022'),
        new OpenAIProvider('gpt-4o'),
        new GeminiProvider('gemini-1.5-pro')
    ];

    const fastTier: LLMProvider[] = [
        new GeminiProvider('gemini-1.5-flash'),
        new OpenAIProvider('gpt-4o-mini')
    ];

    const offlineTier: LLMProvider[] = [
        new OllamaProvider('llama3')
    ];

    return { topTier, fastTier, offlineTier };
}
