// Regulated content: needs BASL / compliance approval before release (see CLAUDE.md).
/** How the Copilot uses AI: shown on /ai-disclosure and read by the Copilot itself. */
export const sections = [
  {
    title: 'What the AI does',
    items: [
      'Explains your own numbers in plain words: holdings, goals, costs and what changed this week.',
      'Prepares drafts, such as a rebalance or a tax-loss suggestion, for you to read and approve.',
      'Summarises a document you upload and shows where each point comes from.',
    ],
  },
  {
    title: 'What the AI does not do',
    items: [
      'It never places an order. Nothing happens until you approve, and orders go through your own account.',
      'It does not guarantee returns, give stock tips or promise performance.',
      'It does not calculate your figures. Net worth, returns, risk scores, drift and tax estimates come from tested software; the AI only reads and explains them.',
    ],
  },
  {
    title: 'Your data',
    items: [
      'Each question is answered only from the signed-in family’s own data, never another client’s.',
      'Client data is stored in India. Our vendor contracts bar training models on client data.',
      'Every AI answer is saved with the time and version so our compliance team can review it.',
    ],
  },
  {
    title: 'Human oversight',
    items: [
      'Questions that sound like advice are passed to your adviser, who is a SEBI-registered person.',
      'When the Copilot is not confident in an answer, it hands over to your adviser.',
      'Our rules engine checks every suggestion against your risk profile before you see it.',
    ],
  },
] as const
