/**
 * Suppress repetitive Supabase connection errors in development mode
 * Prevents console spam while still allowing critical errors through
 */

if (typeof window === 'undefined') {
  // Server-side error suppression (Next.js server)
  const originalError = console.error;
  let lastErrorTime = 0;
  let errorCount = 0;

  console.error = (...args: any[]) => {
    const errorStr = String(args[0]);
    
    // Suppress repetitive Supabase connection timeout errors
    if (
      errorStr.includes('ConnectTimeoutError') ||
      errorStr.includes('fetch failed') ||
      errorStr.includes('UND_ERR_CONNECT_TIMEOUT') ||
      errorStr.includes('AuthRetryableFetchError')
    ) {
      // Only log once every 5 seconds to reduce spam
      const now = Date.now();
      if (now - lastErrorTime > 5000) {
        originalError('⚠️ Supabase connection timeout (suppressing further errors)');
        lastErrorTime = now;
        errorCount = 1;
      }
      return;
    }

    // Log all other errors normally
    originalError(...args);
  };
}
