'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { SiteSetting } from '@/payload-types'

import { MobileNav } from './mobile-nav'

type NavItem = NonNullable<SiteSetting['navItems']>[number]

export function SiteHeader({
  logo,
  navItems,
  loginCta,
}: {
  logo: React.ReactNode
  navItems: NavItem[]
  loginCta?: SiteSetting['loginCta']
}) {
  const [scrolled, setScrolled] = useState(false)
  const activeId = useActiveSection(navItems)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-card/95 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-card/85',
        scrolled ? 'shadow-[0_1px_12px_rgb(16_34_27/0.08)]' : 'shadow-none',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-20">
        {logo}

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 lg:gap-3">
            {navItems.map((item) => {
              const active = item.href === `#${activeId}`
              return (
                <li key={item.id ?? item.href}>
                  <Link
                    href={item.href}
                    {...linkProps(item.href)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'text-ink relative rounded-md px-2 py-2 text-[0.95rem] font-medium transition-colors hover:text-primary',
                      'after:bg-primary after:absolute after:inset-x-2 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:transition-transform',
                      active && 'text-primary after:scale-x-100',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {loginCta?.href && (
            <Button asChild size="cta" className="hidden h-11 px-6 sm:inline-flex">
              <Link href={loginCta.href} {...linkProps(loginCta.href)}>
                {loginCta.label}
              </Link>
            </Button>
          )}
          <MobileNav logo={logo} navItems={navItems} loginCta={loginCta} />
        </div>
      </div>
    </header>
  )
}

/** Highlights the nav item whose #anchor section sits under the upper third of the viewport. */
function useActiveSection(navItems: NavItem[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const ids = navItems.filter((item) => item.href.startsWith('#')).map((item) => item.href.slice(1))
    if (!ids.length) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.35
        let current: string | null = null
        for (const id of ids) {
          const rect = document.getElementById(id)?.getBoundingClientRect()
          if (rect && rect.top <= line && rect.bottom > line) current = id
        }
        setActiveId(current)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [navItems])

  return activeId
}
