import { Check } from 'lucide-react'

import { Section } from '@/components/shared/section'

import { HighlightsHeading } from './heading'
import type { HighlightsData } from './types'

/** Layout "checklist": two columns of ticked points. */
export function HighlightsChecklist({ data }: { data: HighlightsData }) {
  return (
    <Section id="why-wisbees" tone="mist" aria-labelledby="highlights-title">
      <HighlightsHeading data={data} />

      <ul className="mt-12 grid gap-x-16 md:grid-cols-2">
        {data.items?.map((item) => (
          <li key={item.id ?? item.title} className="flex gap-4 border-t py-7">
            <span className="bg-primary mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-white">
              <Check className="size-4" strokeWidth={3} aria-hidden />
            </span>
            <div>
              <h3 className="text-2xl font-semibold md:text-[1.75rem]">{item.title}</h3>
              <p className="text-ink-soft mt-2 leading-relaxed">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
