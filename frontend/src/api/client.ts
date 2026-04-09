import type { SearchResponse } from '@/types/api'

const BASE = ''

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
