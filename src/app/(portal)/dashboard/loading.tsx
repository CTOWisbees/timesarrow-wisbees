/** Shown while a dashboard screen loads: grey blocks in the shape of the page, so nothing jumps. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="bg-mint-strong/50 h-9 w-64 animate-pulse rounded-xl" />
      <div className="bg-mint-strong/50 h-40 animate-pulse rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="bg-mint-strong/40 h-56 animate-pulse rounded-2xl" />
        <div className="bg-mint-strong/40 h-56 animate-pulse rounded-2xl" />
      </div>
    </div>
  )
}
