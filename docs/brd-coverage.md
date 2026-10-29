# WisBees Master BRD: what is built (Oct 2026)

Status: **Built** (works end to end), **Partial** (part works, the gap is named), **Not built** (needs an external
integration, staff tooling or a licence decision). Priorities are the BRD's: P1 release 1, P2 release 2, P3 release 3.

## 7.1 Pre-login

| ID | Requirement | Status | Notes |
|---|---|---|---|
| PL-01 | Home page, two paths, visuals | Built | CMS-driven sections |
| PL-02 | Navigation: offerings, log in, tools | Built | Tools opens the SIP calculator |
| PL-03 | Port Scan | Built | Upload, search or paste; score, flags, paid cards |
| PL-04 | Onboarding | Partial | OTP/Google sign-in and risk profile built. Account Aggregator, KRA eKYC, eSign and payment not built |
| PL-05 | Booking | Built | Booking section; every consultation type is listed in the dashboard |
| PL-06 | Tools hub | Partial | 7 calculators incl. step-up SIP, goal gap and tax-loss harvesting. BRD's 23 were cut to this set earlier |
| PL-07 | Plans and fees page | Built | `/fees`. Copy needs BASL approval; it is in code, not yet in the CMS |
| PL-08 | SEBI disclosure page | Partial | Page and footer built. Audit report upload and SCORES link depend on content |
| PL-09 | AI disclosure and privacy policy | Built | `/ai-disclosure`, `/privacy-policy`. Need compliance and legal approval |
| PL-10 | Content workflow in CMS | Built | Payload drafts, compliance publish, audit trail |
| PL-11 | FAQs, learning hub | Partial | FAQs built (and read by the Copilot). Magazine, WBC and Buzz pages not built |

## 7.2 Post-login

| ID | Requirement | Status | Notes |
|---|---|---|---|
| PO-01 | OTP login, session timeout, device list | Partial | OTP and Google built. Idle timeout and device list not |
| PO-02 | Home: net worth, goals, next actions, brief | Built | Real data; brief comes from the RAG fact store |
| PO-03 | Holdings sync | Partial | Port Scan upload, search and paste. Account Aggregator, CAMS/KFintech and broker links not built |
| PO-04 | Performance, allocation, concentration, cost | Built | Return vs benchmark, mix, biggest holdings, fund costs. Look-through overlap is a paid Port Scan card |
| PO-05 | Goals | Partial | Create, edit, track on/off track. One portfolio mapped per goal not built |
| PO-06 | Model portfolios in the dashboard | Not built | Model portfolios exist on the public site only |
| PO-07 | Action centre (P2) | Built | To Do: reason, numbers, risk note, approve or decline, saved |
| PO-08 | Automated investing set-up (P2) | Not built | Needs execution rails and legal opinion on one-tap approval |
| PO-09 | Rebalancing (P2) | Partial | Drift against the risk limit and a suggestion. Per-goal bands and ready order list not built |
| PO-10 | Tax-loss harvesting (P2) | Partial | Loss list and a calculator. CA rules engine, replacement funds and year-end pack not built |
| PO-11 | Commodity ETF sleeve (P2) | Not built | |
| PO-12 | SIF module (P3) | Partial | Information card and Copilot knowledge. Eligibility test and threshold tracker not built |
| PO-13 | Document vault | Partial | Screen and honest empty state. Storage and filing not built |
| PO-14 | Research library | Not built | |
| PO-15 | Scheduler, adviser chat, async questions | Partial | Booking link and conversation types. Adviser chat not built (needs an adviser console) |
| PO-16 | Family view (P2) | Not built | Placeholder that says so |
| PO-17 | Alerts | Partial | In-app alerts from Port Scan. Push, email and WhatsApp not built |
| PO-18 | Billing | Partial | Plan shown, fee cap checked. Payments, invoices, upgrade and cancel for advisory plans not built |
| PO-19 | Grievance form with ticket tracking | Built | Numbered tickets, kept as compliance records |
| PO-20 | Consent centre | Partial | Download and delete my data. Per-source withdraw not built |

## 7.3 Back-office

| ID | Requirement | Status | Notes |
|---|---|---|---|
| BK-01 | Auto-generated compliance records | Not built | |
| BK-02 | Adviser console | Not built | Needs staff tooling |
| BK-03 | Compliance console | Partial | CMS approval workflow only |
| BK-04 | Rules engine | Partial | Equity limit, concentration and loss rules in code; not configurable by compliance |
| BK-05 | Billing and fee-cap check | Partial | Cap is enforced in a tested helper; no billing back-office |
| BK-06 | Reports: complaints, audit pack, AI usage | Partial | The data is stored (`portal.tickets`, `portal.ai_log`); no report screens |

## 8 AI features

| ID | Feature | Status | Notes |
|---|---|---|---|
| AI-01 | Ask Copilot | Built | RAG: client facts + published knowledge, cited, logged, hands over advice and low-confidence questions |
| AI-02 | Daily and weekly brief | Built | Read from the same fact store; one daily brief, no weekly digest yet |
| AI-03 | Plain-English explainer | Partial | Glossary and explainers on suggestions. Document upload not built |
| AI-04 | Proactive alerts | Partial | Rules-driven alerts; the Copilot does not speak first |
| AI-05 | Port Scan narrator | Not built | CMS wording only |
| AI-06 | Action drafter (P2) | Partial | Rules draft the suggestion; the Copilot adds the retrieved explanation |
| AI-07 | Goal coach (P2) | Built | Worked from the goal facts at the amount and rate being tried |
| AI-08 to AI-14 | Tax scout, adviser co-pilot, suitability checker, scenario engine, SIF explainer, document reader, voice and WhatsApp | Not built | |

### Guardrails

- No guaranteed returns or stock tips: advice-seeking questions go to the adviser; a model's wording is dropped if it promises returns. **Built, tested.**
- A client's data never answers another client's question: facts are built per request from that client's data. **Built, tested.**
- AI disclosure on every Copilot screen, and every answer logged with sources, confidence and the rules version. **Built.**
- Below the confidence threshold the Copilot hands over to the adviser. **Built, tested.**
- A numbers check: a model may only use numbers that appear in the sources. **Built, tested.**
- Test set of at least 200 compliance-reviewed prompts before each release. **Partial**: 52 prompts in `src/lib/rag/answer.test.ts`; compliance has not reviewed them.
- Data stored in India and vendor contracts bar training: **a deployment and contract matter**, not code. The Copilot works without any model vendor; when `ANTHROPIC_API_KEY` is set, retrieved text and the question are sent to that vendor.
