type Level = 'Low' | 'Medium' | 'High'

export type Risk = {
  description: string
  likelihood: Level
  impact: Level
}

export const risks: Risk[] = [
  {
    description: 'AI model gives a confident but factually wrong explanation',
    likelihood: 'Medium',
    impact: 'High',
  },
  {
    description: 'OpenAI / Anthropic API pricing rises or access is restricted',
    likelihood: 'Medium',
    impact: 'High',
  },
  {
    description: 'Low user retention — curiosity satisfied once, no reason to return',
    likelihood: 'High',
    impact: 'Medium',
  },
  {
    description: 'Larger competitor (ChatGPT, Perplexity) adds a dedicated science mode',
    likelihood: 'Medium',
    impact: 'Medium',
  },
  {
    description: 'Spanish-language explanations have lower quality due to training data gaps',
    likelihood: 'Low',
    impact: 'Medium',
  },
]
