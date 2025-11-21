/**
 * Utilities for formatting and parsing values in millions scale.
 *
 * When user enters "1", the system internally stores 1,000,000.
 * When displaying 1,000,000, the UI shows "1M".
 */

const MILLION = 1_000_000;

/**
 * Formats a numeric value to millions display format.
 * Examples:
 * - 1000000 -> "1M"
 * - 2500000 -> "2.5M"
 * - 279000000 -> "279M"
 * - 0 -> "0M"
 *
 * @param value - The numeric value to format (in actual units)
 * @returns Formatted string with "M" suffix, no thousand separators
 */
export function formatToMillions(value: number): string {
  if (value === 0) return '0M';

  const millions = value / MILLION;

  // Remove trailing zeros and decimal point if not needed
  const formatted = millions % 1 === 0
    ? millions.toString()
    : millions.toFixed(1).replace(/\.0$/, '');

  return `${formatted}M`;
}

/**
 * Parses a user input value (in millions) to actual numeric value.
 * Examples:
 * - "1" -> 1000000
 * - 1 -> 1000000
 * - "2.5" -> 2500000
 * - "279" -> 279000000
 *
 * @param input - The input value (string or number) representing millions
 * @returns The actual numeric value (millions * 1,000,000)
 */
export function parseFromMillions(input: string | number): number {
  const millions = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(millions)) return 0;

  return millions * MILLION;
}

/**
 * Converts an actual numeric value to millions for display in input fields.
 * Examples:
 * - 1000000 -> 1
 * - 2500000 -> 2.5
 * - 279000000 -> 279
 *
 * @param value - The actual numeric value
 * @returns The value in millions (for input fields)
 */
export function toMillionsInput(value: number): number {
  return value / MILLION;
}

/**
 * Formats a currency value with dollar sign and millions format.
 * Examples:
 * - 1000000 -> "$1M"
 * - 2500000 -> "$2.5M"
 * - 279000000 -> "$279M"
 *
 * @param value - The numeric value to format
 * @returns Formatted string with "$" prefix and "M" suffix
 */
export function formatCurrencyMillions(value: number): string {
  return `$${formatToMillions(value)}`;
}
