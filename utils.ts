// Debounce function to limit how often a function can run.
export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
};

/**
 * Safely retrieves the API key from environment variables.
 * In browser environments like Vercel deployments without a specific build framework,
 * `process` is not defined, and trying to access `process.env` would throw a
 * runtime error, preventing the app from rendering. This function prevents that crash.
 * @returns The API key string if found, otherwise undefined.
 */
export const getApiKey = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};
