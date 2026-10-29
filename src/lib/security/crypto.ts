const encoder = new TextEncoder()
const decoder = new TextDecoder()

function requireSecret() {
  const secret = process.env.AUTH_ENCRYPTION_KEY
  if (!secret || secret.length < 32) throw new Error('AUTH_ENCRYPTION_KEY must be configured with at least 32 characters.')
  return secret
}

async function encryptionKey() {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(requireSecret()))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

export async function encryptProviderKey(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(), encoder.encode(value))
  return { ciphertext: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv) }
}

export async function decryptProviderKey(ciphertext: string, iv: string) {
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, await encryptionKey(), fromBase64(ciphertext))
  return decoder.decode(decrypted)
}
