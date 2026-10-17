import { CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

import { signOut } from './actions'
import { BotMessage, chipClass, enter } from './chat-ui'
import { cn } from '@/lib/utils'

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

/** Step 3: the application is with the team, told as the last messages of the conversation. Shown every time they come back. */
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
    <div role="status" className="space-y-5">
      <BotMessage>
        <p className="flex items-center gap-2">
          <CheckCircle2 className="text-primary size-5 shrink-0" aria-hidden />
          <span className="font-heading text-ink text-lg leading-snug font-semibold">{title}</span>
        </p>
        <p className="text-ink-soft">
          {name && <>Hi {name}. </>}
          {message}
        </p>
      </BotMessage>

      {submittedAt && (
        <BotMessage>
          <p className="text-ink-soft flex items-center gap-2 text-sm">
            <Clock className="text-primary size-4 shrink-0" aria-hidden />
            Submitted on {dateFormat.format(new Date(submittedAt))}
          </p>
        </BotMessage>
      )}

      <div className={cn('flex flex-wrap justify-end gap-2.5', enter)}>
        <Link href="/" className={chipClass}>
          Back to the website
        </Link>
        <form action={signOut}>
          <button type="submit" className={chipClass}>
            Log out
          </button>
        </form>
      </div>
    </div>
  )
}
