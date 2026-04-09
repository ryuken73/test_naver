import type { SearchResponse } from '@/types/api'

/** 로컬: Vite 프록시로 빈 문자열. 프로덕션(Vercel): 빌드 시 VITE_API_URL에 백엔드 origin */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** 로컬: 빈 값 → Vite 프록시. 프로덕션: 비우면 같은 origin(루트 Vercel에 FastAPI 같이 배포 시) */
function apiOrigin(): string {
  if (import.meta.env.DEV) return BASE
  return BASE
}

export async function searchNews(body: {
  query: string
  sort: 'sim' | 'date'
  display: number
}): Promise<SearchResponse> {
  const res = await fetch(`${apiOrigin()}/api/search`, {
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
