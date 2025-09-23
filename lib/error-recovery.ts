// Error recovery utility functions
import toast from 'react-hot-toast'

export interface RetryOptions {
  maxRetries?: number
  delay?: number
  exponentialBackoff?: boolean
}

export class RetryError extends Error {
  constructor(message: string, public lastError: Error, public attemptCount: number) {
    super(message)
    this.name = 'RetryError'
  }
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { maxRetries = 3, delay = 1000, exponentialBackoff = true } = options
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt > maxRetries) {
        throw new RetryError(
          `Failed after ${maxRetries} retries: ${lastError.message}`,
          lastError,
          attempt
        )
      }
      
      const currentDelay = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      
      console.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms:`, error)
    }
  }
  
  throw lastError!
}

export const isOnline = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return true // Assume online in non-browser environments
}

export const showOfflineNotification = () => {
  toast.error('🌐 You are offline. Some features may not work properly.', {
    duration: 5000,
    id: 'offline-status'
  })
}

export const showOnlineNotification = () => {
  toast.success('🌐 You are back online!', {
    duration: 3000,
    id: 'online-status'
  })
}

export const handleNetworkError = (error: Error, context: string) => {
  if (!isOnline()) {
    showOfflineNotification()
    return
  }
  
  if (error.message.includes('fetch') || error.message.includes('network')) {
    toast.error(`🔌 Network error in ${context}. Check your connection and try again.`, {
      duration: 4000
    })
  } else {
    toast.error(`❌ Error in ${context}: ${error.message}`, {
      duration: 4000
    })
  }
}

export const createRetryableAPICall = <T>(
  apiCall: () => Promise<T>,
  context: string,
  options?: RetryOptions
) => {
  return async (): Promise<T> => {
    try {
      return await withRetry(apiCall, options)
    } catch (error) {
      handleNetworkError(error as Error, context)
      throw error
    }
  }
}

export const useOfflineDetection = () => {
  if (typeof window !== 'undefined') {
    const handleOnline = () => showOnlineNotification()
    const handleOffline = () => showOfflineNotification()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
  return () => {}
}