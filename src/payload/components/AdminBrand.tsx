/* eslint-disable @next/next/no-img-element -- Payload admin graphics are plain server components. */

/** Full WisBees logo, shown on the admin login and create-first-user screens. */
export function AdminLogo() {
  return <img src="/brand/wisbees-logo.png" alt="WisBees" width={297} height={109} style={{ height: 56, width: 'auto' }} />
}

/** WisBees mark, shown in the admin nav and breadcrumbs. */
export function AdminIcon() {
  return <img src="/brand/wisbees-mark.png" alt="WisBees" width={512} height={512} style={{ height: 28, width: 28 }} />
}
