// Generacion de salt y hash SHA-256 usando Web Crypto para no guardar contraseñas en texto plano en modo local
export function generateSalt() {
  const bytes = new Uint8Array(12)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const payload = encoder.encode(`${salt}:${password}`)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', payload)
  const hashHex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return `${salt}$${hashHex}`
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes('$')) return false
  const [salt] = storedHash.split('$')
  const computed = await hashPassword(password, salt)
  return computed === storedHash
}
