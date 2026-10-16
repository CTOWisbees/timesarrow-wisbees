import { cloneElement } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Shared look of every text input in the onboarding flow. */
export const inputClass = 'bg-card h-11 rounded-lg px-3.5 text-[0.95rem] shadow-none short:h-10'

export function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="text-destructive">{children}</AlertDescription>
    </Alert>
  )
}

/** Label, control and error message, wired together for screen readers. */
export function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  error?: string
  children: React.ReactElement<React.ComponentProps<'input'>>
}) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-ink gap-1.5 text-sm font-medium">
        {label}
        {optional && <span className="text-muted-foreground font-normal">optional</span>}
      </Label>
      {cloneElement(children, {
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
        className: cn(inputClass, children.props.className),
      })}
      {error && (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

/** Indian mobile with a fixed +91 prefix. Takes the same props as an input (from `Field`). */
export function PhoneInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div
      className={cn(
        'bg-card focus-within:border-ring focus-within:ring-ring/50 flex h-11 short:h-10 items-center rounded-lg border transition-[box-shadow] focus-within:ring-3',
        props['aria-invalid'] && 'border-destructive',
      )}
    >
      <span className="text-ink-soft border-r px-3 text-[0.95rem] tabular-nums" aria-hidden>
        +91
      </span>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="98765 43210"
        {...props}
        className={cn(className, 'h-full rounded-l-none border-0 bg-transparent focus-visible:ring-0')}
      />
    </div>
  )
}
