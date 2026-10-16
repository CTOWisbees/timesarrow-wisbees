import { CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { signOut } from './actions'

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

/** Step 3: the application is with the team. Shown every time they come back. */
export function ReviewStatus({
  title,
  message,
  name,
  submittedAt,
}: {
  title: string
  message: string
  name: string
  submittedAt?: string | null
}) {
  return (
    <div role="status">
      <span className="bg-mint text-primary flex size-14 items-center justify-center rounded-full" aria-hidden>
        <CheckCircle2 className="size-7" />
      </span>
      <h2 className="mt-6 text-[1.75rem] leading-tight font-semibold tracking-[-0.015em] sm:text-[2rem]">{title}</h2>
      <p className="text-ink-soft mt-3 leading-relaxed">
        {name && <>Hi {name}. </>}
        {message}
      </p>

      {submittedAt && (
        <p className="bg-mist text-ink-soft mt-6 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm">
          <Clock className="text-primary size-4 shrink-0" aria-hidden />
          Submitted on {dateFormat.format(new Date(submittedAt))}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild variant="brandOutline" size="cta">
          <Link href="/">Back to the website</Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="cta" className="w-full sm:w-auto">
            Log out
          </Button>
        </form>
      </div>
    </div>
  )
}
