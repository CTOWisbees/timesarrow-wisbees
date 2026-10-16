import { CmsImage } from '@/components/shared/cms-image'
import type { HomePage } from '@/payload-types'

import type { BookCallIcon, VariantOf } from '@/lib/section-variants'

import { BookCallForm } from './book-call-form'
import { BookCallMsBookings } from './book-call-ms-bookings'
import { BookCallOneStep } from './book-call-one-step'

/**
 * Two balanced columns: the pitch (heading, description, illustration filling the rest
 * of the height) and the booking form, in the layout chosen in the CMS or a dev
 * preview. See `src/lib/section-variants.ts`.
 */
export function BookCall({
  data,
  variant,
  icons,
}: {
  data: HomePage['bookCall']
  variant: VariantOf<'bookCall'>
  icons: BookCallIcon[]
}) {
  const formProps = {
    icons,
    showSlotPicker: Boolean(data.showSlotPicker),
    timeSlots: data.timeSlots?.map((t) => t.label) ?? [],
    consentText: data.consentText,
    submitLabel: data.submitLabel || 'Book a call',
    slotStepTitle: data.slotStepTitle || 'Pick a time that suits you',
    slotStepDescription: data.slotStepDescription,
    successTitle: data.successTitle || 'Your call is booked',
    successMessage: data.successMessage,
  }
  return (
    <section id="book-call" className="bg-mist pb-16 md:pb-24" aria-labelledby="book-call-title">
      <div className="container-page">
        <div className="bg-card grid gap-10 rounded-3xl border p-6 shadow-[0_2px_16px_rgb(16_34_27/0.05)] sm:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:p-12">
          <div className="flex flex-col">
            <h2 id="book-call-title" className="text-4xl font-semibold tracking-tight md:text-5xl">
              {data.title}
            </h2>
            {data.description && <p className="text-ink-soft mt-4 max-w-md text-lg leading-relaxed">{data.description}</p>}
            {/* Fills the rest of the column so both columns end together. */}
            <div className="bg-mint/40 relative mt-8 hidden min-h-64 flex-1 overflow-hidden rounded-2xl sm:block">
              <CmsImage
                media={data.illustration}
                fallbackSrc="/placeholders/book-call.svg"
                fallbackAlt=""
                fill
                sizes="(min-width: 1024px) 480px, 90vw"
                className="object-contain p-4"
              />
            </div>
          </div>
          <div className="lg:py-2">
            {variant === 'two-step' && <BookCallForm {...formProps} />}
            {(variant === 'one-step' || variant === 'slot-first') && <BookCallOneStep layout={variant} {...formProps} />}
            {variant === 'ms-bookings' && (
              <BookCallMsBookings
                url={data.msBookingsUrl}
                display={data.msBookingsDisplay}
                linkLabel={data.msBookingsLinkLabel}
                note={data.msBookingsNote}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
