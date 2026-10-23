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

export const siteSettings = {
  siteName: 'WisBees',
  metaDescription:
    'Fee-only, SEBI-registered investment advice with a published reason behind every call, and model portfolios from ₹499 a month.',
  navItems: [
    { label: 'Our offerings', href: '#portfolios' },
    { label: 'About', href: '#why-wisbees' },
    { label: 'Port Scan', href: '/portfolio-scan' },
    { label: 'Tools', href: '/tools' },
    { label: 'Blogs', href: 'https://www.wisbees.com/' },
  ],
  loginCta: { label: 'Login / Sign up', href: '/login' },
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
        { label: 'Tools and calculators', href: '/tools' },
        { label: 'Port Scan', href: '/portfolio-scan' },
        { label: 'Blogs', href: 'https://www.wisbees.com/' },
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
  footerTagline:
    'Fee-only, SEBI-registered investment advice. Every recommendation comes with its reasoning, and your money stays in your own demat account.',
  socialLinks: [],
}

/** Charter point helpers: `i` point, `sub` sub-point, `h` sub-heading. */
const i = (text: string) => ({ text, kind: 'item' as const })
const sub = (text: string) => ({ text, kind: 'subitem' as const })
const h = (text: string) => ({ text, kind: 'heading' as const })

/**
 * SEBI Investor Charter in respect of Investment Advisers (Annexure A to the SEBI
 * circular). Every IA must display it on its website; reproduced verbatim.
 */
const investorCharter = [
  {
    title: 'Vision and mission statements for investors',
    items: [
      h('Vision'),
      i('Invest with knowledge & safety.'),
      h('Mission'),
      i('Every investor should be able to invest in right investment products based on their needs, manage and monitor them to meet their goals, access reports and enjoy financial wellness.'),
    ],
  },
  {
    title: 'Details of business transacted by the Investment Adviser with respect to the investors',
    items: [
      i('To enter into an agreement with the client providing all details including fee details, aspects of Conflict of interest disclosure and maintaining confidentiality of information.'),
      i('To do a proper and unbiased risk – profiling and suitability assessment of the client.'),
      i('To conduct audit annually.'),
      i('To disclose the status of complaints on its website.'),
      i('To disclose the name, proprietor name, type of registration, registration number, validity, complete address with telephone numbers and associated SEBI Office details (i.e. Head office/ regional/ local Office) on its website.'),
      i('To employ only qualified and certified employees.'),
      i('To deal with clients only from official number'),
      i('To maintain records of interactions, with all clients including prospective clients (prior to onboarding), where any conversation related to advice has taken place.'),
      i('To ensure that all advertisements are in adherence to the provisions of the Advertisement Code for Investment Advisers'),
      i('Not to discriminate in terms of services provided, among clients opting for same/similar products/services offered by investment adviser.'),
    ],
  },
  {
    title: 'Details of services provided to investors (no indicative timelines)',
    items: [
      i('Onboarding of Clients'),
      sub('Sharing of agreement copy'),
      sub('Completing KYC of clients'),
      i('Disclosure to Clients'),
      sub('To provide full disclosure about its business, affiliations, compensation in the agreement.'),
      sub("To not access client's accounts or holdings for offering advice."),
      sub('To disclose the risk profile to the client.'),
      sub('To disclose any conflict of interest of the investment advisory activities with any other activities of the investment adviser.'),
      sub('To disclose the extent of use of Artificial Intelligence tools in providing investment advisory services.'),
      i('To provide investment advice to the client based on the risk-profiling of the clients and suitability of the client.'),
      i('To treat all advisory clients with honesty and integrity.'),
      i('To make adequate disclosure to the investor of all material facts such as risks, obligations, costs, etc. relating to the products or securities advised by the adviser.'),
      i('To provide clear guidance and adequate caution notice to clients when providing investment advice for dealing in complex and high-risk financial products/services.'),
      i('To ensure confidentiality of information shared by clients unless such information is required to be provided in furtherance of discharging legal obligations or a client has provided specific consent to share such information.'),
      i('To disclose the timelines for the various services provided by the investment adviser to clients and ensure adherence to the said timelines.'),
    ],
  },
  {
    title: 'Details of grievance redressal mechanism and how to access it',
    items: [
      i('Investor can lodge complaint/grievance against Investment Adviser in the following ways:'),
      h('Mode of filing the complaint with investment adviser'),
      sub('In case of any grievance / complaint, an investor may approach the concerned Investment Adviser who shall strive to redress the grievance immediately, but not later than 21 days of the receipt of the grievance.'),
      h('Mode of filing the complaint on SCORES or with Investment Adviser Administration and Supervisory Body (IAASB)'),
      sub('SCORES 2.0 (a web based centralized grievance redressal system of SEBI for facilitating effective grievance redressal in time-bound manner) (https://scores.sebi.gov.in). Two level review for complaint/grievance against investment adviser: first review done by designated body (IAASB); second review done by SEBI.'),
      sub('Email to designated email ID of IAASB'),
      i('If the Investor is not satisfied with the resolution provided by the Market Participants, then the Investor has the option to file the complaint/ grievance on SMARTODR platform for its resolution through online conciliation or arbitration.'),
      i("With regard to physical complaints, investors may send their complaints to: Office of Investor Assistance and Education, Securities and Exchange Board of India, SEBI Bhavan, Plot No. C4-A, 'G' Block, Bandra-Kurla Complex, Bandra (E), Mumbai - 400 051."),
    ],
  },
  {
    title: 'Rights of investors',
    items: [
      i('Right to Privacy and Confidentiality'),
      i('Right to Transparent Practices'),
      i('Right to fair and Equitable Treatment'),
      i('Right to Adequate Information'),
      i('Right to Initial and Continuing Disclosure'),
      sub('Right to receive information about all the statutory and regulatory disclosures.'),
      i('Right to Fair & True Advertisement'),
      i('Right to Awareness about Service Parameters and Turnaround Times'),
      i('Right to be informed of the timelines for each service'),
      i('Right to be Heard and Satisfactory Grievance Redressal'),
      i('Right to have timely redressal'),
      i('Right to Suitability of the Financial Products'),
      i('Right to Exit from Financial product or service in accordance with the terms of agreement with the investment adviser'),
      i('Right to receive clear guidance and caution notice when dealing in Complex and High-Risk Financial Products and Services'),
      i('Additional Rights to vulnerable consumers'),
      sub('Right to get access to services in a suitable manner even if differently abled'),
      i('Right to provide feedback on the financial products and services used'),
      i('Right against coercive, unfair, and one-sided clauses in financial agreements'),
    ],
  },
  {
    title: 'Expectations from the investors (responsibilities of investors)',
    items: [
      h("Do's"),
      i('Always deal with SEBI registered Investment Advisers.'),
      i('Ensure that the Investment Adviser has a valid registration certificate.'),
      i('Check for SEBI registration number. Please refer to the list of all SEBI registered Investment Advisers which is available on SEBI website in the following link: https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13'),
      i('Pay only advisory fees to your Investment Adviser. Make payments of advisory fees through banking channels only and maintain duly signed receipts mentioning the details of your payments. You may make payment of advisory fees through Centralised Fee Collection Mechanism (CeFCoM) of IAASB if investment adviser has opted for the mechanism.'),
      i('Always ask for your risk profiling before accepting investment advice. Insist that Investment Adviser provides advisory strictly on the basis of your risk profiling and take into account available investment alternatives.'),
      i('Ask all relevant questions and clear your doubts with your Investment Adviser before acting on advice.'),
      i('Assess the risk–return profile of the investment as well as the liquidity and safety aspects before making investments.'),
      i('Insist on getting the terms and conditions in writing duly signed and stamped. Read these terms and conditions carefully particularly regarding advisory fees, advisory plans, category of recommendations etc. before dealing with any Investment Adviser.'),
      i('Be vigilant in your transactions.'),
      i('Approach the appropriate authorities for redressal of your doubts / grievances.'),
      i('Inform SEBI about Investment Advisers offering assured or guaranteed returns.'),
      i('Always be aware that you have the right to exit the service of an Investment Adviser'),
      i('Always be aware that you have the right to seek clarifications and clear guidance on advice'),
      i('Always be aware that you have the right to provide feedback to the Investment Adviser in respect of services received.'),
      i('Always be aware that you will not be bound by any clause, prescribed by the investment adviser, which is contravening any regulatory provisions.'),
      h("Don'ts"),
      i("Don't fall for stock tips offered under the pretext of investment advice."),
      i('Do not provide funds for investment to the Investment Adviser.'),
      i("Don't fall for the promise of indicative or exorbitant or assured returns by the Investment Advisers. Don't let greed overcome rational investment decisions."),
      i("Don't fall prey to luring advertisements or market rumors."),
      i('Avoid doing transactions only on the basis of phone calls or messages from any Investment adviser or its representatives.'),
      i("Don't take decisions just because of repeated messages and calls by Investment Advisers."),
      i('Do not fall prey to limited period discount or other incentive, gifts, etc. offered by Investment advisers.'),
      i("Don't rush into making investments that do not match your risk taking appetite and investment goals."),
      i('Do not share login credential and password of your trading, demat or bank accounts with the Investment Adviser.'),
    ],
  },
]

/** From the SEBI disclosure sheet the team sent (Oct 2026). Blank values stay hidden on the site. */
export const sebiDisclosure = {
  firmName: 'Wisbees Advisory partner',
  registeredAddress: 'I-804, Konark Ochid, Kesnand Road, Wagholi, Pune, Maharashtra – 412207',
  phone: '74997 92579',
  registrationType: 'Non-individual',
  sebiRegistrationNumber: '',
  validity: 'Valid till cancellation by SEBI',
  baslId: '',
  sebiRegionalOffice: [
    'Western Regional Office - II, SEBI Bhavan, Panchvati 1st Lane, Gulbai Tekra Road, Ahmedabad - 380006, Gujarat.',
    "Alternatively, if you map directly to the Head Office: SEBI Bhavan, Plot No. C4-A, 'G' Block, Bandra-Kurla Complex, Bandra (East), Mumbai - 400051.",
  ].join('\n'),
  principalOfficer: { name: 'Dr. Anuja Limbad', phone: '74997 92579', email: 'anuja.limbad@wisbees.com' },
  complianceOfficer: { name: 'Khushi Panda', phone: '82914 41234', email: 'khuship0506@gmail.com' },
  disclaimers: [
    { text: 'Investment in securities market are subject to market risks. Read all the related documents carefully before investing.' },
    {
      text: 'Registration granted by SEBI, enlistment with BSE and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.',
    },
    { text: 'The securities quoted are for illustration only and are not recommendatory.' },
  ],
  legalLinks: [
    { label: 'Investor complaints', href: '/sebi-disclosure#complaints' },
    { label: 'SCORES', href: 'https://scores.sebi.gov.in/' },
    { label: 'Terms', href: '/coming-soon' },
    { label: 'Privacy', href: '/coming-soon' },
  ],
  complaintSteps: [
    {
      title: 'Contact us first',
      text: 'Write to or call our Compliance Officer. An Investment Adviser must redress a grievance within 21 days of receiving it.',
    },
    {
      title: 'Escalate to SEBI SCORES',
      text: 'If you are not satisfied, lodge a complaint on SCORES. It is reviewed first by the Investment Adviser Administration and Supervisory Body (IAASB), then by SEBI.',
      linkLabel: 'SEBI SCORES',
      linkHref: 'https://scores.sebi.gov.in',
    },
    {
      title: 'Online dispute resolution',
      text: 'If you are still not satisfied, file your complaint on SMARTODR for online conciliation or arbitration.',
      linkLabel: 'SMARTODR',
      linkHref: 'https://smartodr.in',
    },
  ],
  physicalComplaints:
    "Physical complaints can be sent to the Office of Investor Assistance and Education, Securities and Exchange Board of India, SEBI Bhavan, Plot No. C4-A, 'G' Block, Bandra-Kurla Complex, Bandra (E), Mumbai - 400 051.",
  escalationMatrix: [
    { designation: 'Compliance Officer', contactPerson: 'Khushi Panda', phone: '82914 41234', email: 'khuship0506@gmail.com' },
    { designation: 'Principal Officer', contactPerson: 'Dr. Anuja Limbad', phone: '74997 92579', email: 'anuja.limbad@wisbees.com' },
  ],
  complaintRows: [],
  monthlyDisposal: [],
  annualDisposal: [],
  complianceAudits: [],
  charter: investorCharter,
}

export const onboarding = {
  brand: {
    headline: 'Advice that works\nfor you, not for a product.',
    message: 'Create your account in two minutes. A WisBees adviser reviews every application personally.',
  },
  account: {
    signUpTitle: 'Create your account',
    signUpDescription: 'We will email you a 6-digit code to confirm it is you. No password needed.',
    logInTitle: 'Welcome back',
    logInDescription: 'Enter the email you signed up with and we will send you a code.',
    consentText:
      'I agree to the Terms and Privacy Policy, and to WisBees contacting me about my application by email or phone.',
  },
  verify: {
    verifyTitle: 'Check your email',
    verifyDescription: 'We sent a 6-digit code to',
    layout: 'focus' as const,
  },
  review: {
    title: 'Your application is being reviewed',
    message:
      'Thank you. A WisBees representative will contact you shortly to talk through your goals and the next steps.',
  },
}

/**
 * Onboarding step 2, from the onboarding team's risk-profiling sheet (Oct 2026).
 * Scores and bands are staff-only in the CMS; applicants only see questions and answers.
 * Q1's duplicate answer in the sheet ("I must comfortably meet my financial goals",
 * listed at 2 and 3 points) is kept once, at 2.
 */
const answers = (...list: [string, number][]) => list.map(([label, score]) => ({ label, score }))

export const riskProfile = {
  title: 'A few questions about you as an investor',
  description:
    'There are no right or wrong answers. Pick what sounds most like you; your adviser uses this to suggest the right level of risk.',
  submitLabel: 'Submit application',
  questions: [
    {
      key: 'priorities',
      question: 'Please rate your priorities as an investor',
      answers: answers(
        ["I don't want to see losses in my portfolio", 1],
        ['I must comfortably meet my financial goals', 2],
        ["I'm looking for the highest possible returns", 4],
      ),
    },
    {
      key: 'risk-reward',
      question: 'What is your perception of “risk and reward” in investing?',
      answers: answers(
        ['I want to earn high returns while taking little or no risk', 1],
        ["I'm not competing on returns; my risks should match my goal tenure", 3],
        ['I want to earn the highest returns within my friends and family circle', 3],
        ["If I'm taking risks, I must always earn the highest possible returns", 4],
      ),
    },
    {
      key: 'success',
      question: 'According to you, what contributes to long-term investing success?',
      answers: answers(
        ['The lowest cost investment, irrespective of fitment', 2],
        ['Discipline, goal focus and the power of compounding', 3],
        ['Selection of top performing funds', 3],
        ['Market timing', 4],
      ),
    },
    {
      key: 'drawdown',
      question: 'Your ₹10 lakh portfolio falls 20% in three months. What would you most likely do?',
      answers: answers(
        ['Sell everything to avoid further loss', 1],
        ['Sell a part to reduce the risk', 2],
        ['Hold and wait for recovery', 3],
        ['Invest more at the lower prices', 4],
      ),
    },
    {
      key: 'max-fall',
      question: 'What is the maximum fall in your portfolio in one year that you could accept without changing your goals or lifestyle?',
      answers: answers(['Up to 5%', 1], ['5% to 10%', 2], ['10% to 20%', 3], ['More than 20%', 4]),
    },
  ],
  bands: [
    { min: 5, max: 8, category: 'Conservative', equityLimit: 'up to 20% equity' },
    { min: 9, max: 12, category: 'Moderate', equityLimit: 'up to 50% equity' },
    { min: 13, max: 16, category: 'Moderately aggressive', equityLimit: 'up to 75% equity' },
    { min: 17, max: 20, category: 'Aggressive', equityLimit: 'up to 100% equity' },
  ],
}

export const homePage = {
  hero: {
    enabled: true,
    headline: 'Invest Smarter. Automate Better.',
    subheadline: 'Smart asset allocation, automatically executed across mutual funds, Commodity ETFs and SIFs.',
    secondaryCta: { label: 'Explore our offerings', href: '#portfolios' },
    primaryCta: { label: 'Talk to an expert', href: '#book-call' },
  },
  highlights: {
    enabled: true,
    variant: 'checklist' as const,
    title: 'Why WisBees?',
    subtitle: 'Six things you get from WisBees that you will not find in a commission-led advisory.',
    cta: { label: 'See our offerings', href: '#portfolios' },
    items: [
      {
        title: 'Technology-First Investing',
        shortLabel: 'Technology-first',
        description: 'Automated wealth management with zero human intervention.',
      },
      {
        title: 'SEBI registered fee only advisory',
        shortLabel: 'SEBI registered, fee-only',
        description: 'Every stock call backed by transparent, published rationale — not tips.',
      },
      {
        title: 'Research-Backed Investment Strategies',
        shortLabel: 'Research-backed',
        description:
          'Access alpha generating mathematical models/strategies supported by financial research, quantitative analysis and a clearly explained investment rationale.',
      },
      {
        title: 'Transparent, Affordable customised services (Starting at Rs. 499 per month)',
        shortLabel: 'Transparent & affordable',
        description:
          'Ready-made, risk-mapped portfolios you can follow or adapt to your goals. Your money stays in your Dmat account —we never take custody.',
      },
      {
        title: 'Ongoing portfolio rebalancing support',
        shortLabel: 'Rebalancing support',
        description:
          'Track portfolio allocation, performance and risk through insightful dashboards, with alerts or rebalancing support when a review may be appropriate.',
      },
      {
        title: 'Get free access to Wisbees ecosystem',
        shortLabel: 'WisBees ecosystem',
        description:
          'Discover additional value through the WisBees ecosystem, including investment magazines, newsletters, market updates, data tools and WBC events.',
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
  },
  illustration: { enabled: true },
  portfolios: {
    enabled: true,
    title: 'Choose the portfolio that matches\nhow much risk you can take',
    intro:
      'Every model portfolio is built by our research team, comes with its reasoning published, and stays in your own demat account. Follow one as it is, or adjust it to your goals. Start from ₹499 a month.',
  },
  gallery: {
    enabled: true,
    variant: 'immersive' as const,
    title: 'WisBees gallery',
    cta: { label: 'See all events', href: 'https://wbc.wisbees.com/past-events' },
    autoplaySeconds: 6,
  },
  faq: { enabled: true, title: 'Questions people\nask first' },
  bookCall: {
    enabled: true,
    variant: 'two-step' as const,
    fieldIcons: ['day', 'time'] as ('name' | 'email' | 'phone' | 'day' | 'time')[],
    // Empty until the team shares the real Bookings page (Bookings → Booking page → Share). The layout
    // then shows a short "not available" note instead of a broken frame.
    msBookingsUrl: '',
    msBookingsDisplay: 'embed' as const,
    msBookingsLinkLabel: 'Open the booking page',
    msBookingsNote: 'Choose a slot that suits you. You will get a calendar invite by email.',
    title: 'Talk to an expert',
    description: 'Book a call. We will look at your goals and tell you which plan fits, or that none does.',
    showSlotPicker: true,
    slotStepTitle: 'Pick a time that suits you',
    slotStepDescription: 'This step is optional. Skip it and we will call you at the earliest available time.',
    timeSlots: [{ label: '10:00 AM' }, { label: '12:00 PM' }, { label: '3:00 PM' }, { label: '5:00 PM' }, { label: '7:00 PM' }],
    consentText: 'By filling the form you agree to be contacted by WisBees.',
    submitLabel: 'Book a call',
    successTitle: 'Your call is booked',
    successMessage: 'Thank you. A member of our team will call you soon.',
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
    question: 'What is Wisbees Advisory Partner?',
    answer:
      'Wisbees is a Registered Investment Advisor and a technology driven investment platform designed to simplify the investing through digital tools and goal-based investment solutions.',
  },
  {
    question: 'Do you actually manage my investments, or just give advice?',
    answer:
      'We provide advisory — you execute. We recommend suitable investments and explain how to implement them; you place the transactions yourself. Your money stays in your control at all times.',
  },
  {
    question: 'Do I need to schedule a meeting before getting started?',
    answer:
      'Our intended experience is designed to minimise unnecessary manual interaction. Eligible services will be accessible digitally, subject to applicable onboarding, identity verification, risk assessment and regulatory requirements. A meeting or additional assistance may be needed in certain cases.',
  },
  {
    question: 'What is tax harvesting and how does it save tax?',
    answer:
      'Tax harvesting involves selling investments to realise eligible capital losses or gains strategically, which may help reduce your tax liability, subject to applicable tax rules. We help you understand how tax harvesting works and whether it may be suitable for your portfolio.',
  },
  {
    question: 'How does automated rebalancing work?',
    answer:
      'Market movements cause your portfolio\'s target asset allocation to drift over time. Our system continuously monitors your tracking error. When a specific asset drifts past its optimal boundary, our algorithms automatically execute buy and sell orders to realign your portfolio back to its target risk profile—without you lifting a finger.',
  },
  {
    question: 'Is portfolio health check-up a free service?',
    answer:
      'Yes. Wisbees provides Portfolio Health Checkup Report at no cost. The objective is to help investors gain a deeper understanding of their portfolio’s risk profile and investment positioning.',
  },
  {
    question: 'Why should I review my portfolio regularly?',
    answer:
      'Market conditions, sector weights, and individual investments change over time. A portfolio that was well-balanced a year ago may now carry higher risk or concentration. Regular portfolio reviews help investors stay aligned with their financial goals and risk tolerance.',
  },
].map((faq, i) => ({ question: faq.question, answer: paragraphs(faq.answer), order: i + 1 }))

export const galleryItems = [
  {
    title: 'Investor education workshop',
    description:
      'A hands-on session on reading a fund factsheet, understanding costs and setting a goal-based plan. Open to anyone starting out.',
  },
  {
    title: 'Market outlook session',
    description:
      'Our research team walked through how they think about the year ahead, and answered questions from the room.',
  },
  {
    title: 'WisBees community meet-up',
    description: 'Clients and the WisBees team met to talk about long-term investing, habits and what they want from advice.',
  },
  {
    title: 'Annual summit',
    description: 'A day of talks and panels on personal finance, regulation and how fee-only advice works in India.',
  },
  {
    title: 'Corporate investor event',
    description: 'A financial-wellness session for employees, covering budgeting, emergency funds and investing basics.',
  },
].map((item, i) => ({ ...item, order: i + 1 }))
