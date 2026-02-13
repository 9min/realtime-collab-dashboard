import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!keyHex) {
    console.warn(
      '[crypto] INTEGRATION_ENCRYPTION_KEY is not set — tokens will be stored in plaintext',
    )
    return null
  }

  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) {
    console.warn(
      '[crypto] INTEGRATION_ENCRYPTION_KEY must be 64 hex chars (32 bytes) — falling back to plaintext',
    )
    return null
  }

  return key
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  if (!key) return plaintext

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: base64(iv + authTag + encrypted)
  const combined = Buffer.concat([iv, authTag, encrypted])
  return `enc:${combined.toString('base64')}`
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith('enc:')) return ciphertext

  const key = getEncryptionKey()
  if (!key) return ciphertext

  const combined = Buffer.from(ciphertext.slice(4), 'base64')

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export function maskToken(token: string): string {
  if (!token) return ''
  // Show first 4 chars + masked rest
  const prefix = token.startsWith('enc:') ? '' : token.slice(0, 4)
  return prefix ? `${prefix}${'*'.repeat(Math.max(0, Math.min(token.length - 4, 20)))}` : '****'
}
