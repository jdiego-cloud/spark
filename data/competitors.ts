export type Competitor = {
  name: string
  category: string
  strengths: string
  weaknesses: string
  spanishSupport: boolean
}

export const competitors: Competitor[] = [
  {
    name: 'ChatGPT',
    category: 'AI explanation tool',
    strengths: 'Broad knowledge, conversational, multilingual',
    weaknesses: 'No science focus, inconsistent depth, paywalled model',
    spanishSupport: true,
  },
  {
    name: 'Perplexity AI',
    category: 'AI explanation tool',
    strengths: 'Cites sources, up-to-date answers, clean UI',
    weaknesses: 'Not science-specific, citation quality varies',
    spanishSupport: true,
  },
  {
    name: 'Kurzgesagt (YouTube)',
    category: 'Science YouTube channel',
    strengths: 'Beautiful visuals, deep dives, high production value',
    weaknesses: 'Videos only, no on-demand Q&A, English-first',
    spanishSupport: false,
  },
  {
    name: 'Wikipedia',
    category: 'Encyclopedia',
    strengths: 'Comprehensive, free, available in many languages',
    weaknesses: 'Dense text, assumes prior knowledge, no explanation layer',
    spanishSupport: true,
  },
  {
    name: 'Radiolab (Podcast)',
    category: 'Science podcast',
    strengths: 'Storytelling-driven, emotionally engaging',
    weaknesses: 'Audio-only, no search by topic, English only',
    spanishSupport: false,
  },
  {
    name: 'University textbooks',
    category: 'Textbook',
    strengths: 'Rigorous, structured, peer-reviewed content',
    weaknesses: 'Expensive, inaccessible language, not conversational',
    spanishSupport: false,
  },
  {
    name: 'Google Search',
    category: 'Search engine',
    strengths: 'Instant, universal, surfaces many formats',
    weaknesses: 'No synthesised explanation, results vary in quality',
    spanishSupport: true,
  },
  {
    name: 'NASA / UNAM science portals',
    category: 'Science app / portal',
    strengths: 'Authoritative, free, topic-specific depth',
    weaknesses: 'Institutional tone, hard to navigate, not conversational',
    spanishSupport: true,
  },
]
