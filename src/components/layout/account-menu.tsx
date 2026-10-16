'use client'

import { ChevronDown, FileText, Loader2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'

import { signOut } from '@/components/onboarding/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AccountSummary } from '@/lib/account'

/** Signed-in visitor's avatar in the site header, with their application and log out. */
export function AccountMenu({ account }: { account: AccountSummary }) {
  const [signingOut, startSignOut] = useTransition()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="hover:bg-mist focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-full p-1 pr-2 outline-none focus-visible:ring-3"
        aria-label={`Account menu for ${account.maskedName}`}
      >
        <Avatar className="size-9">
          {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback className="bg-primary text-sm font-semibold text-white">{account.initials}</AvatarFallback>
        </Avatar>
        <ChevronDown className="text-ink-soft size-4" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar className="size-10">
            {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-primary text-sm font-semibold text-white">{account.initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="text-ink block truncate text-sm font-semibold">{account.maskedName}</span>
            <span className="text-muted-foreground block truncate text-xs">{account.maskedEmail}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="items-start gap-3 px-2 py-2">
          <Link href="/onboarding">
            <FileText className="text-primary mt-0.5" aria-hidden />
            <span>
              <span className="text-ink block text-sm font-medium">My application</span>
              <span className="text-muted-foreground block text-xs">{account.statusLabel}</span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault()
            startSignOut(() => signOut())
          }}
          className="bg-destructive/10 justify-center gap-2 py-2 font-semibold"
        >
          {signingOut ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
