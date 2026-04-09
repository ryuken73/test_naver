import type { SearchResponse } from '@/types/api'

/** 로컬: Vite 프록시로 빈 문자열. 프로덕션(Vercel): 환경변수 VITE_API_URL에 백엔드 origin */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function searchNews(body: {
  query: string
  sort: 'sim' | 'date'
  display: number
}): Promise<SearchResponse> {
  const res = await fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<SearchResponse>
}
