import { BookCall } from '@/components/sections/book-call/book-call'
import { Faq } from '@/components/sections/faq'
import { Gallery } from '@/components/sections/gallery'
import { Hero } from '@/components/sections/hero'
import { Highlights } from '@/components/sections/highlights'
import { IllustrationBand } from '@/components/sections/illustration-band'
import { ModelPortfolios } from '@/components/sections/model-portfolios'
import { SipCalculator } from '@/components/sections/sip-calculator/calculator'
import { getFaqs, getGalleryItems, getHomePage, getModelPortfolios } from '@/lib/queries'

// Payload hooks revalidate on publish; this is only a safety net.
export const revalidate = 3600

export default async function HomePage() {
  const [home, portfolios, faqs, gallery] = await Promise.all([
    getHomePage(),
    getModelPortfolios(),
    getFaqs(),
    getGalleryItems(),
  ])
  const on = (section?: { enabled?: boolean | null }) => section?.enabled !== false

  return (
    <>
      {on(home.hero) && <Hero data={home.hero} />}
      {on(home.highlights) && <Highlights data={home.highlights} />}
      {on(home.calculator) && <SipCalculator data={home.calculator} />}
      {home.illustration && on(home.illustration) && <IllustrationBand data={home.illustration} />}
      {on(home.portfolios) && <ModelPortfolios data={home.portfolios} portfolios={portfolios} />}
      {on(home.gallery) && <Gallery data={home.gallery} items={gallery} />}
      {on(home.faq) && <Faq data={home.faq} faqs={faqs} />}
      {on(home.bookCall) && <BookCall data={home.bookCall} />}
    </>
  )
}
