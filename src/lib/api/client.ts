import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

import type { ApiResponse } from '@/lib/api/types'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function apiRequest<T>(config: AxiosRequestConfig) {
  const response = await apiClient.request<ApiResponse<T>>(config)
  return response.data.data
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const message = payload.error
      if (typeof message === 'string') {
        return message
      }
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
