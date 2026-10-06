import { Eyebrow, Lines, Section } from '@/components/shared/section'
import { RichText } from '@/components/shared/rich-text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { Faq as FaqDoc, HomePage } from '@/payload-types'

export function Faq({ data, faqs }: { data: HomePage['faq']; faqs: FaqDoc[] }) {
  if (!faqs.length) return null
  return (
    <Section id="faq" tone="mist" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-16">
        <div>
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <h2 id="faq-title" className="mt-3 text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
            <Lines text={data.title} />
          </h2>
        </div>
        <Accordion type="single" collapsible defaultValue={String(faqs[0].id)} className="border-t">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={String(faq.id)}>
              <AccordionTrigger className="py-6 text-base font-semibold md:text-lg">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-ink-soft max-w-3xl text-[0.95rem] leading-relaxed">
                <RichText data={faq.answer} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
