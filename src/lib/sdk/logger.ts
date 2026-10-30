import type { InferenceLog } from './types'

export function sendLog(log: InferenceLog, authToken?: string, logUrl?: string): void {
  const base = logUrl || process.env.NEXT_PUBLIC_APP_URL
  if (!base) return
  fetch(`${base}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: authToken } : {}) },
    body: JSON.stringify(log),
  }).catch(console.error)
}
