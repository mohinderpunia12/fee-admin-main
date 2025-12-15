/**
 * Optional debug logging helper.
 * Sends logs to the configured ingest endpoint when provided via env.
 * No-ops in production when the env var is absent.
 */
export function debugLog(payload: unknown) {
  const endpoint = process.env.NEXT_PUBLIC_DEBUG_INGEST_URL;
  if (!endpoint) return;

  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Swallow errors to keep debug logging non-blocking
  }
}

