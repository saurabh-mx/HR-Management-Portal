/**
 * Password Service
 * Client-side password policy validation and utilities.
 * Actual hashing is done server-side in Supabase Edge Functions.
 */

import { PASSWORD_POLICY } from './constants';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Validate a password against the security policy.
 * This is client-side validation — server performs the same checks as a second gate.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`Must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long.`);
  }

  if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
    errors.push(`Must be at most ${PASSWORD_POLICY.MAX_LENGTH} characters long.`);
  }

  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter.');
  }

  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter.');
  }

  if (PASSWORD_POLICY.REQUIRE_DIGIT && !/[0-9]/.test(password)) {
    errors.push('Must contain at least one digit.');
  }

  if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
    const specialRegex = new RegExp(`[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialRegex.test(password)) {
      errors.push(`Must contain at least one special character (${PASSWORD_POLICY.SPECIAL_CHARS}).`);
    }
  }

  // Calculate strength score
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (new RegExp(`[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) score++;
  if (password.length >= 20) score++;

  let strength: PasswordValidationResult['strength'] = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 4) strength = 'good';
  else if (score >= 3) strength = 'fair';

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Validate that old and new passwords meet the similarity requirement.
 * Uses a simplified Levenshtein distance check.
 */
export function validatePasswordDifference(oldPassword: string, newPassword: string): boolean {
  const distance = levenshteinDistance(oldPassword, newPassword);
  return distance >= PASSWORD_POLICY.MIN_LEVENSHTEIN_DISTANCE;
}

/**
 * Compute Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Generate a secure random password for initial credential issuance.
 * Uses Web Crypto API for cryptographic randomness.
 */
export function generateInitialPassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Ensure the generated password meets the policy
  const validation = validatePassword(password);
  if (!validation.valid) {
    // Force compliance by replacing first few chars
    password = password.slice(0, -4) + 'Aa1!';
  }

  return password;
}

/**
 * Get a human-readable password strength label with color class.
 */
export function getPasswordStrengthDisplay(strength: PasswordValidationResult['strength']): {
  label: string;
  colorClass: string;
  barWidth: string;
} {
  switch (strength) {
    case 'strong':
      return { label: 'Strong', colorClass: 'text-emerald-400 bg-emerald-500', barWidth: '100%' };
    case 'good':
      return { label: 'Good', colorClass: 'text-blue-400 bg-blue-500', barWidth: '75%' };
    case 'fair':
      return { label: 'Fair', colorClass: 'text-yellow-400 bg-yellow-500', barWidth: '50%' };
    case 'weak':
    default:
      return { label: 'Weak', colorClass: 'text-rose-400 bg-rose-500', barWidth: '25%' };
  }
}
