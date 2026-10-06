/**
 * Starting content for the CMS, taken from the Figma landing page. Everything
 * here is placeholder copy pending BASL approval; content managers edit it in /admin.
 * Square-bracket values are regulatory details the compliance team must fill in.
 */

/** Minimal Lexical document with one paragraph per string. */
export const paragraphs = (...texts: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: texts.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      textStyle: '',
      children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

const MARKET_RISK =
  'Investments in securities markets are subject to market risks. Read all related documents carefully before investing.'

export const siteSettings = {
  siteName: 'WisBees',
  metaDescription:
    'Fee-only, SEBI-registered investment advice with a published reason behind every call, and model portfolios from ₹499 a month.',
  navItems: [
    { label: 'Our offerings', href: '#portfolios' },
    { label: 'About', href: '#why-wisbees' },
    { label: 'Bees Copilot', href: '/coming-soon' },
    { label: 'Tools', href: '#sip-calculator' },
    { label: 'Blogs', href: '/coming-soon' },
  ],
  loginCta: { label: 'Login / Sign up', href: '/coming-soon' },
  footerColumns: [
    {
      heading: 'Products',
      links: [
        { label: 'Model portfolios', href: '#portfolios' },
        { label: 'Portfolio advisory', href: '/coming-soon' },
        { label: 'Global funds', href: '/coming-soon' },
        { label: 'Long-short funds', href: '/coming-soon' },
      ],
    },
    {
      heading: 'Learn and tools',
      links: [
        { label: 'Learn', href: '/coming-soon' },
        { label: 'Tools and calculators', href: '#sip-calculator' },
        { label: 'Portfolio health', href: '/coming-soon' },
        { label: 'Blogs', href: '/coming-soon' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#why-wisbees' },
        { label: 'Contact us', href: '#book-call' },
        { label: 'Help and support', href: '/coming-soon' },
        { label: 'Careers', href: '/coming-soon' },
      ],
    },
  ],
  socialLinks: [],
}

export const sebiDisclosure = {
  firmName: '[Firm name in full]',
  registeredAddress: '[Registered address]',
  phone: '[Phone]',
  registrationType: '[Research Analyst / Investment Adviser], non-individual',
  sebiRegistrationNumber: '[number]',
  validity: 'Valid till cancelled by SEBI',
  baslId: '[number]',
  sebiRegionalOffice: '[address]',
  principalOfficer: { name: '[name]', phone: '[phone]', email: '[email]' },
  complianceOfficer: { name: '[name]', phone: '[phone]', email: '[email]' },
  disclaimers: [
    { text: 'Investment in securities market are subject to market risks. Read all the related documents carefully before investing.' },
    {
      text: 'Registration granted by SEBI, enlistment with BSE and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.',
    },
    { text: 'The securities quoted are for illustration only and are not recommendatory.' },
  ],
  legalLinks: [
    { label: 'Investor complaints', href: '/sebi-disclosure' },
    { label: 'SCORES', href: 'https://scores.sebi.gov.in/' },
    { label: 'Terms', href: '/coming-soon' },
    { label: 'Privacy', href: '/coming-soon' },
  ],
  pageBody: paragraphs(
    '[Investor charter, monthly complaint statistics table and grievance redressal process go here. To be provided by the compliance team.]',
    'Investors can lodge complaints on SEBI SCORES at https://scores.sebi.gov.in/ or through the Online Dispute Resolution portal at https://smartodr.in/.',
  ),
}

export const homePage = {
  hero: {
    enabled: true,
    headline: 'Stop guessing the market.\nStart investing with precision.',
    subheadline:
      'Fee-only advice, a published reason behind every call, and model portfolios from ₹499 a month. Your money always stays in your own demat account.',
    secondaryCta: { label: 'Explore our offerings', href: '#portfolios' },
    primaryCta: { label: 'Talk to an expert', href: '#book-call' },
    disclaimer: MARKET_RISK,
  },
  highlights: {
    enabled: true,
    title: 'Advice built around you, not around products',
    subtitle: 'Six things you get from WisBees that you will not find in a commission-led advisory.',
    cta: { label: 'See our offerings', href: '#portfolios' },
    items: [
      {
        title: 'Fee-only advisory',
        description:
          'You pay us a fee, and nobody else does. With no commissions, nothing nudges our advice toward one product over another.',
      },
      {
        title: 'SEBI registered',
        description:
          'We are registered with SEBI, so our research and advice follow the regulator’s rules, and every recommendation comes with a reason you can read.',
      },
      {
        title: 'Model portfolios',
        description:
          'Ready-made portfolios matched to how much risk you are comfortable with, from ₹499 a month. Follow them as they are or adjust them to your goals.',
      },
      {
        title: 'Portfolio advisory',
        description:
          'Rules-based models and our analysts look after your portfolio together, and tell you when it needs a change.',
      },
      {
        title: 'Customised services',
        description:
          'Tell us what you are saving for. We shape the plan around your goals, at a price that stays affordable.',
      },
      {
        title: '100% transparent',
        description:
          'Your money and shares stay in your own demat account. We never hold them, and your dashboard shows every holding.',
      },
    ],
  },
  calculator: {
    enabled: true,
    title: 'Visualize your growth journey with WisBees',
    minAmount: 500,
    maxAmount: 100000,
    step: 500,
    defaultAmount: 20000,
    sliderMarks: [{ value: 20000 }, { value: 50000 }, { value: 100000 }],
    stepUpPercent: 10,
    riskBands: [
      { label: 'Conservative', annualReturn: 8, isDefault: false },
      { label: 'Moderate', annualReturn: 12, isDefault: true },
      { label: 'Aggressive', annualReturn: 15, isDefault: false },
    ],
    showReturnAssumptions: true,
    horizons: [{ years: 5 }, { years: 10 }, { years: 15 }, { years: 20 }, { years: 25 }, { years: 30 }],
    defaultHorizon: 20,
    disclaimer:
      'Figures are illustrative projections based on the assumed rate of return and are not guaranteed. Actual returns may be higher or lower. This is not investment advice.',
  },
  illustration: { enabled: true },
  portfolios: {
    enabled: true,
    title: 'Choose the portfolio that matches\nhow much risk you can take',
    intro:
      'Every model portfolio is built by our research team, comes with its reasoning published, and stays in your own demat account. Follow one as it is, or adjust it to your goals. Start from ₹499 a month.',
    disclaimer:
      'Model portfolios shown are illustrative and are not a recommendation to buy or sell any security. The securities quoted are for illustration only and are not recommendatory. Expected returns are not guaranteed.',
  },
  gallery: {
    enabled: true,
    title: 'WisBees gallery',
    cta: { label: 'See all events', href: '/coming-soon' },
  },
  faq: { enabled: true, eyebrow: 'FAQs', title: 'Questions people\nask first' },
  bookCall: {
    enabled: true,
    eyebrow: 'Not sure where to start?',
    title: 'Talk to an expert',
    description: 'Book a call. We will look at your goals and tell you which plan fits, or that none does.',
    benefits: [
      { text: 'Free first call' },
      { text: 'No obligation to subscribe' },
      { text: 'We call you back at the slot you pick' },
    ],
    showSlotPicker: true,
    timeSlots: [{ label: '10:00 AM' }, { label: '12:00 PM' }, { label: '3:00 PM' }, { label: '5:00 PM' }, { label: '7:00 PM' }],
    consentText: 'By booking, you agree to be contacted by WisBees about this call.',
    submitLabel: 'Submit to book a call',
    successTitle: 'Your call is booked',
    successMessage: 'Thank you. A member of our team will call you at the slot you picked.',
  },
}

const holdings = ['HDFC Bank', 'Reliance', 'TCS', 'Infosys', 'ICICI Bank', 'L&T'].map((name) => ({ name }))

export const modelPortfolios = [
  {
    name: 'Stable Growth',
    riskLevel: 'conservative' as const,
    order: 1,
    description: 'A balanced portfolio for steady, long-term wealth creation.',
    expectedReturn: '8–10% p.a.',
    minimumEntry: '₹499/month',
    holdings,
  },
  {
    name: 'Wealth Builder',
    riskLevel: 'moderate' as const,
    order: 2,
    description: 'A well-diversified portfolio for balanced risk and returns.',
    expectedReturn: '10–14% p.a.',
    minimumEntry: '₹499/month',
    badge: 'Most popular',
    showBadge: true,
    holdings,
  },
  {
    name: 'Long Term Alpha',
    riskLevel: 'aggressive' as const,
    order: 3,
    description: 'Focused on high-growth companies for maximum wealth creation.',
    expectedReturn: '14–18% p.a.',
    minimumEntry: '₹499/month',
    holdings,
  },
]

export const faqs = [
  {
    question: 'What does fee-only mean?',
    answer:
      'We are paid only by the fees our clients pay us. We take no commission from any product, so we have no reason to push one over another.',
  },
  {
    question: 'Do you hold my money or shares?',
    answer:
      'No. Your money and shares always stay in your own bank and demat accounts. We never take custody of them.',
  },
  {
    question: 'What does a model portfolio cost?',
    answer:
      'Model portfolios start from ₹499 a month. The full fee for each plan is shown to you before you subscribe.',
  },
  {
    question: 'How does sign-up work?',
    answer:
      'You sign up with your mobile number, complete KYC and a short risk profile, sign the advisory agreement digitally, and then choose a plan.',
  },
  {
    question: 'Are returns guaranteed?',
    answer:
      'No. Investments in securities markets are subject to market risks, and no adviser can guarantee returns. Any figures we show are illustrative.',
  },
  {
    question: 'How do I raise a complaint?',
    answer:
      'Write to our Compliance Officer using the details in the footer. If you are not satisfied with our response, you can lodge a complaint on SEBI SCORES or the Online Dispute Resolution portal.',
  },
].map((faq, i) => ({ question: faq.question, answer: paragraphs(faq.answer), order: i + 1 }))

export const galleryItems = [
  'Investor education workshop',
  'Market outlook session',
  'WisBees community meet-up',
  'Annual summit',
  'Corporate investor event',
].map((title, i) => ({ title, order: i + 1 }))
