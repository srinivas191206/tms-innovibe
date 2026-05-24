/**
 * Pure JavaScript Implementation of TOTP (RFC 6238) using Web Crypto API.
 * 100% serverless, edge-safe, zero external npm dependencies!
 */

// Base32 decoding helper
function base32tohex(base32: string): string {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';

  const cleanBase32 = base32.replace(/=+$/, '').toUpperCase();

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = base32chars.indexOf(cleanBase32.charAt(i));
    if (val === -1) throw new Error('Invalid Base32 character');
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

// HMAC-SHA1 helper using modern Web Crypto API
async function hmacSha1(keyHex: string, messageHex: string): Promise<Uint8Array> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const msgBytes = new Uint8Array(messageHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  // Web Crypto API HMAC support
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
  return new Uint8Array(signature);
}

/** Generates a 16-character Base32 random secret key */
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  // Generate cryptographically secure random values
  const randomValues = new Uint32Array(16);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}

/**
 * Verifies a 6-digit TOTP passcode string against a Base32 secret.
 * Supports a clock skew window of +/- 1 time steps (30 seconds each).
 */
export async function verifyTOTPCode(secret: string, code: string): Promise<boolean> {
  try {
    if (!code || code.length !== 6 || isNaN(Number(code))) return false;

    const timeStep = 30; // seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const currentEpoch = Math.floor(currentTime / timeStep);

    // Allow +/- 1 window skew for clock offsets
    for (let skew = -1; skew <= 1; skew++) {
      const epoch = currentEpoch + skew;
      const timeHex = epoch.toString(16).padStart(16, '0');
      
      const keyHex = base32tohex(secret);
      const hmacResult = await hmacSha1(keyHex, timeHex);

      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const binary =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      if (otp === code) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('[TOTP VERIFICATION ERROR]', e);
    return false;
  }
}
