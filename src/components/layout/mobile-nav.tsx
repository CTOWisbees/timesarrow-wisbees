'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { linkProps } from '@/lib/links'
import type { SiteSetting } from '@/payload-types'

type NavItem = NonNullable<SiteSetting['navItems']>[number]

export function MobileNav({
  logo,
  navItems,
  loginCta,
}: {
  logo: React.ReactNode
  navItems: NavItem[]
  loginCta?: SiteSetting['loginCta']
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(20rem,85vw)] flex-col gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div onClick={close}>{logo}</div>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.id ?? item.href}>
                <Link
                  href={item.href}
                  {...linkProps(item.href)}
                  onClick={close}
                  className="text-ink hover:bg-mint block rounded-md px-3 py-3 text-base font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {loginCta?.href && (
          // Tablets keep Login / Sign up in the header bar, so the drawer only repeats it on phones.
          <div className="border-t p-4 md:hidden">
            <Button asChild size="cta" className="w-full">
              <Link href={loginCta.href} {...linkProps(loginCta.href)} onClick={close}>
                {loginCta.label}
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
