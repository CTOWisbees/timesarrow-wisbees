import { Check } from 'lucide-react'

import { Eyebrow } from '@/components/shared/section'
import type { HomePage } from '@/payload-types'

import { BookCallForm } from './book-call-form'

export function BookCall({ data }: { data: HomePage['bookCall'] }) {
  return (
    <section id="book-call" className="bg-mist pb-16 md:pb-24" aria-labelledby="book-call-title">
      <div className="container-page">
        <div className="bg-card grid gap-10 rounded-3xl border p-6 shadow-[0_2px_16px_rgb(16_34_27/0.05)] sm:p-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-14 lg:p-14">
          <div>
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 id="book-call-title" className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              {data.title}
            </h2>
            {data.description && <p className="text-ink-soft mt-5 text-lg leading-relaxed">{data.description}</p>}
            {data.benefits && data.benefits.length > 0 && (
              <ul className="mt-6 space-y-2.5 text-sm">
                {data.benefits.map((b) => (
                  <li key={b.id ?? b.text} className="text-ink-soft flex items-center gap-2.5">
                    <Check className="text-primary size-4 shrink-0" strokeWidth={3} aria-hidden />
                    {b.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <BookCallForm
            showSlotPicker={Boolean(data.showSlotPicker)}
            timeSlots={data.timeSlots?.map((t) => t.label) ?? []}
            consentText={data.consentText}
            submitLabel={data.submitLabel || 'Submit to book a call'}
            successTitle={data.successTitle || 'Your call is booked'}
            successMessage={data.successMessage}
          />
        </div>
      </div>
    </section>
  )
}
