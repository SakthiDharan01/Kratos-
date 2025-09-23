'use client'

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { withRetry, RetryError } from '@/lib/error-recovery'

interface UseApiCallOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  retryAttempts?: number
  showErrorToast?: boolean
  showSuccessToast?: boolean | string
}

interface ApiCallState {
  loading: boolean
  error: any | null
  data: any | null
}

export function useApiCall(options: UseApiCallOptions = {}) {
  const [state, setState] = useState<ApiCallState>({
    loading: false,
    error: null,
    data: null
  })

  const {
    onSuccess,
    onError,
    retryAttempts = 3,
    showErrorToast = true,
    showSuccessToast = false
  } = options

  const execute = useCallback(async (apiCall: () => Promise<any>) => {
    setState({ loading: true, error: null, data: null })

    try {
      const result = await withRetry(apiCall, {
        maxRetries: retryAttempts,
        delay: 1000,
        exponentialBackoff: true
      })
      
      setState({ loading: false, error: null, data: result })
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (showSuccessToast) {
        const message = typeof showSuccessToast === 'string' 
          ? showSuccessToast 
          : 'Operation completed successfully'
        toast.success(message)
      }
      
      return result
    } catch (error) {
      console.error('API call failed:', error)
      setState({ loading: false, error, data: null })
      
      if (onError) {
        onError(error)
      }
      
      if (showErrorToast) {
        let errorMessage = 'An unexpected error occurred'
        
        if (error instanceof RetryError) {
          errorMessage = `Failed after ${retryAttempts} attempts. Please try again later.`
        } else if (error instanceof Error && error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage, {
          duration: 5000,
          icon: '⚠️'
        })
      }
      
      throw error
    }
  }, [onSuccess, onError, retryAttempts, showErrorToast, showSuccessToast])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading
  }
}

// Specialized hooks for common patterns
export function usePaymentApi() {
  return useApiCall({
    retryAttempts: 3,
    showErrorToast: true,
    showSuccessToast: '🎉 Payment processed successfully!'
  })
}

export function useRegistrationApi() {
  return useApiCall({
    retryAttempts: 2,
    showErrorToast: true,
    showSuccessToast: '✅ Registration completed!'
  })
}

export function useProfileApi() {
  return useApiCall({
    retryAttempts: 2,
    showErrorToast: true,
    showSuccessToast: '💾 Profile updated successfully!'
  })
}

export function useEmailApi() {
  return useApiCall({
    retryAttempts: 3,
    showErrorToast: true,
    showSuccessToast: '📧 Email sent successfully!'
  })
}