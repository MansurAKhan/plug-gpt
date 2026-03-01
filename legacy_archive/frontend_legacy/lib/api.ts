import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatRequest {
  message: string
  subject?: string
  mode?: string
  context?: string
}

export interface ChatResponse {
  message: string
  error?: string
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/chat', request)
  return response.data
}
