import type { SearchResponse } from '@/types/api'

/** 로컬: Vite 프록시로 빈 문자열. 프로덕션(Vercel): 빌드 시 VITE_API_URL에 백엔드 origin */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

function apiOrigin(): string {
  if (import.meta.env.DEV) return BASE
  if (!BASE) {
    throw new Error(
      'VITE_API_URL이 없습니다. Vercel → Environment Variables에 FastAPI 백엔드 URL(끝 / 없이)을 넣고 재배포하세요. ' +
        '비어 있으면 요청이 vercel.app/api 로 가서 405가 납니다.'
    )
  }
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
