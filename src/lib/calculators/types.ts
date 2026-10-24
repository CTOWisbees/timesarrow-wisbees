export type FieldFormat = 'inr' | 'percent' | 'years' | 'months' | 'number'

type Base = { id: string; label: string; hint?: string; showIf?: (v: Values) => boolean }

export type NumberField = Base & {
  kind: 'number'
  min: number
  max: number
  step: number
  default: number
  format: FieldFormat
}

export type ChoiceField = Base & {
  kind: 'choice'
  options: { value: string; label: string }[]
  default: string
  /** Toggle buttons for a few short options, a dropdown otherwise. */
  variant: 'toggle' | 'select'
}

export type Field = NumberField | ChoiceField
export type Values = Record<string, number | string>

export type Stat = { label: string; value: string; tone?: 'default' | 'primary' | 'accent' }
export type Tone = 'soft' | 'green' | 'amber'

export type ToolResult = {
  stats: Stat[]
  /** Share of the total, drawn as a donut with a legend. */
  donut?: { label: string; value: number; display: string; tone: Tone }[]
  /** Two stacked series per year (a below, b on top). */
  series?: { title: string; aLabel: string; bLabel: string; data: { label: string; a: number; b: number }[] }
  table?: { title: string; columns: string[]; rows: string[][] }
  notes?: string[]
}

export type CalculatorDef = {
  slug: string
  name: string
  /** One line for cards and the page subtitle. */
  summary: string
  fields: Field[]
  compute: (v: Values) => ToolResult
  /** Plain-language description of how the figures are worked out. */
  method: { intro: string; formulas: string[] }
  /** The formula worked out with the visitor's own inputs, one step per line. */
  worked: (v: Values) => string[]
}
