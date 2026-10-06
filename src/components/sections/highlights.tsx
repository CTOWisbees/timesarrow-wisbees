import { Check } from 'lucide-react'
import Link from 'next/link'

import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import type { HomePage } from '@/payload-types'

export function Highlights({ data }: { data: HomePage['highlights'] }) {
  return (
    <Section id="why-wisbees" tone="mist" aria-labelledby="highlights-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-4xl">
          <h2 id="highlights-title" className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
            {data.title}
          </h2>
          {data.subtitle && <p className="text-ink-soft mt-4 text-lg">{data.subtitle}</p>}
        </div>
        {data.cta?.href && (
          <Button asChild size="cta" className="self-start md:self-auto">
            <Link href={data.cta.href} {...linkProps(data.cta.href)}>
              {data.cta.label}
            </Link>
          </Button>
        )}
      </div>

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
