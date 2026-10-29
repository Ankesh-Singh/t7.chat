import { describe, expect, it } from 'vitest'
import { decryptProviderKey, encryptProviderKey } from '@/lib/security/crypto'
import { validateProviderKey } from '@/lib/security/provider-key'

describe('provider key security', () => {
  it('rejects URLs and whitespace instead of treating them as keys', () => {
    expect(validateProviderKey('openai', 'https://api.openai.com/v1').valid).toBe(false)
    expect(validateProviderKey('openai', 'sk-valid-key-with spaces').valid).toBe(false)
    expect(validateProviderKey('openai', 'sk-valid-key/with-slash').valid).toBe(false)
  })

  it('accepts a valid opaque provider key', () => {
    expect(validateProviderKey('openai', 'sk-proj-1234567890abcdef').valid).toBe(true)
  })

  it('encrypts and decrypts provider keys with authenticated encryption', async () => {
    process.env.AUTH_ENCRYPTION_KEY = 'test-encryption-secret-that-is-long-enough-32'
    const encrypted = await encryptProviderKey('sk-proj-secret-value')
    expect(encrypted.ciphertext).not.toContain('sk-proj-secret-value')
    expect(await decryptProviderKey(encrypted.ciphertext, encrypted.iv)).toBe('sk-proj-secret-value')
  })
})
