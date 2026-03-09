/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param fallbackValue Value to return on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  fallbackValue: T | null = null
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<T | null>((resolve) =>
      setTimeout(() => {
        console.log(`Promise timed out after ${timeoutMs}ms, using fallback`);
        resolve(fallbackValue);
      }, timeoutMs)
    ),
  ]);
}
