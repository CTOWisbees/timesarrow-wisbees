import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/utils'

export function RichText({ data, className }: { data?: SerializedEditorState | null; className?: string }) {
  if (!data) return null
  return (
    <LexicalRichText
      data={data}
      className={cn(
        'space-y-3 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc',
        '[&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:text-xl [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2',
        className,
      )}
    />
  )
}
