export type Benchmark = {
  product: string
  country: string
  doesWell: string
  gap: string
}

export const benchmarks: Benchmark[] = [
  {
    product: 'Explica.me',
    country: 'Mexico / Latin America',
    doesWell:
      'Spanish-language science explainers written by local educators; culturally relevant examples',
    gap: 'Static articles only — no conversational Q&A, no personalised explanations',
  },
  {
    product: 'Khan Academy',
    country: 'USA (global)',
    doesWell:
      'Structured learning paths, strong Spanish translation, free for all',
    gap: 'Curriculum-bound — you must follow their path, not ask your own questions',
  },
  {
    product: 'Minute Earth (YouTube)',
    country: 'USA',
    doesWell: 'Bite-sized science videos, high shareability, global reach',
    gap: 'One-way broadcast; no interaction, no follow-up questions',
  },
  {
    product: 'Scientix / Ciencia en Redes',
    country: 'Spain / EU',
    doesWell:
      'European Spanish science community, teacher resources, peer content',
    gap: 'Aimed at educators, not curious general public; hard to discover',
  },
  {
    product: 'BBC Science Focus',
    country: 'United Kingdom',
    doesWell:
      'High-quality journalism, trusted brand, wide science topic coverage',
    gap: 'English only, paywalled premium content, no two-way conversation',
  },
]
