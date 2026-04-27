/**
 * Format an ISO date string to a human-readable format.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate a random UUID using the Web Crypto API.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Truncate a string to a given max length, appending "…" if needed.
 */
export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}
