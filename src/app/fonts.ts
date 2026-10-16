import { Inter, Lora } from 'next/font/google'

/** Shared by both root layouts: the website `(frontend)` and the app area `(app)`. */
export const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
export const serif = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })
