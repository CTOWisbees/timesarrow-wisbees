/**
 * Questions about WisBees and the published chunk that should answer each. Used twice: by the unit tests against the
 * shipped content in memory, and by `pnpm rag:check` against what is actually stored in Postgres (Supabase), so a
 * change in ranking or in the stored content shows up before a client sees it.
 */
export const KNOWLEDGE_CASES: [question: string, title: string][] = [
  ['What is a SIP?', 'SIP'],
  ['How much does the Plus plan cost?', 'Plus plan'],
  ['What is the SEBI fee cap?', 'Fee cap'],
  ['How do you use AI?', 'How we use AI: What the AI does not do'],
  ['Do you place orders for me?', 'You stay in charge'],
  ['How do I make a complaint?', 'How to make a complaint'],
  ['What is the last day to book losses for the tax year?', 'Saving tax on a loss'],
  ['What is a SIF and what is the minimum?', 'Specialised investment funds (SIFs)'],
  ['Where is my data stored?', 'Your data and consent'],
  ['How is the step up SIP calculated?', 'Step-up SIP Calculator'],
  ['Do you charge commission?', 'Direct plans, no commissions'],
  ['How do the goal projections work?', 'How goal projections work'],
]

/** Questions nothing published answers: the Copilot must hand these to the adviser, not guess. */
export const UNANSWERABLE = ['quantum chromodynamics of flamingos', 'zzzz qqqq', 'what is the weather in Pune', 'tell me about cricket scores']
