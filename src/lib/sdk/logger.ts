import type { InferenceLog } from './types'

export function sendLog(log: InferenceLog): void {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) return
  fetch(`${base}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  }).catch(console.error)
}
