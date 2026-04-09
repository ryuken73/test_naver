import { useState } from 'react'
import { searchNews } from '@/api/client'
import { AdvancedDashboard } from '@/components/AdvancedDashboard'
import { GeneralDashboard } from '@/components/GeneralDashboard'
import { JournalistInsights } from '@/components/JournalistInsights'
import { NewsList } from '@/components/NewsList'
import { SearchBox } from '@/components/SearchBox'
import type { SearchResponse } from '@/types/api'

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SearchResponse | null>(null)

  async function handleSearch(params: {
    query: string
    sort: 'sim' | 'date'
    display: number
  }) {
    setLoading(true)
    setError(null)
    try {
      const res = await searchNews(params)
      setData(res)
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : '요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          네이버 뉴스 검색 · 분석
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          네이버 뉴스 검색 API와 형태소·사전 기반 지표로 기사를 요약해 봅니다.
        </p>
      </header>

      <SearchBox loading={loading} onSearch={handleSearch} />

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}

      {data ? (
        <p className="text-sm text-[var(--color-muted)]">
          전체 검색 결과 약 <strong>{data.total.toLocaleString()}</strong>건 중{' '}
          <strong>{data.display}</strong>건을 분석했습니다.
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <NewsList items={data?.items ?? []} className="lg:sticky lg:top-6" />
        <div className="space-y-10">
          <JournalistInsights journalist={data?.metrics.journalist ?? null} />
          <GeneralDashboard basic={data?.metrics.basic ?? null} />
          <AdvancedDashboard advanced={data?.metrics.advanced ?? null} />
        </div>
      </div>
    </div>
  )
}

export default App
