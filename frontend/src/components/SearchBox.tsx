import { Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  loading: boolean
  onSearch: (p: { query: string; sort: 'sim' | 'date'; display: number }) => void
  className?: string
}

export function SearchBox({ loading, onSearch, className }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'sim' | 'date'>('sim')
  const [display, setDisplay] = useState(50)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    onSearch({ query: q, sort, display })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950',
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          검색어
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 삼성전자, AI 규제"
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-base outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--color-accent)] dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:w-40">
          정렬
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'sim' | 'date')}
            className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 dark:bg-zinc-900"
          >
            <option value="sim">관련도순</option>
            <option value="date">최신순</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:w-32">
          건수
          <select
            value={display}
            onChange={(e) => setDisplay(Number(e.target.value))}
            className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 dark:bg-zinc-900"
          >
            {[10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}건
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={loading} className="shrink-0 sm:mb-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          검색
        </Button>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        네이버 뉴스 API 기준 최대 100건까지 분석합니다.
      </p>
    </form>
  )
}
