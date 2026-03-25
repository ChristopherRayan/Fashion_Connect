import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

interface UseRetryReturn<T> {
  execute: (fn: () => Promise<T>) => Promise<T>;
  isRetrying: boolean;
  attemptCount: number;
  reset: () => void;
}

export function useRetry<T>({
  maxAttempts = 3,
  delay = 1000,
  backoff = true
}: UseRetryOptions = {}): UseRetryReturn<T> {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T> => {
    setIsRetrying(true);
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setAttemptCount(attempt);
        const result = await fn();
        setIsRetrying(false);
        setAttemptCount(0);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          setIsRetrying(false);
          setAttemptCount(0);
          throw lastError;
        }

        // Wait before retrying
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    setIsRetrying(false);
    setAttemptCount(0);
    throw lastError!;
  }, [maxAttempts, delay, backoff]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setAttemptCount(0);
  }, []);

  return {
    execute,
    isRetrying,
    attemptCount,
    reset
  };
}

// Hook specifically for message operations
export function useMessageRetry() {
  return useRetry({
    maxAttempts: 3,
    delay: 1000,
    backoff: true
  });
}
