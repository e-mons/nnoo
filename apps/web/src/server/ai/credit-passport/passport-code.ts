import { randomBytes } from 'crypto';

/**
 * Generates an opaque, human-readable, non-guessable Passport Code.
 * Format: NNOO-CP-XXXXXXXX (8 uppercase alphanumeric chars, excluding ambiguous characters like 0, O, 1, I).
 */
export function generatePassportCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    const byte = bytes[i];
    code += alphabet[byte % alphabet.length];
  }
  return `NNOO-CP-${code}`;
}

/**
 * Validates a Passport Code format.
 */
export function isValidPassportCode(code: string): boolean {
  return /^NNOO-CP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code);
}
