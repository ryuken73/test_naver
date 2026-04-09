import { ExternalLink } from 'lucide-react'
import type { NewsItem } from '@/types/api'
import { cn } from '@/lib/utils'

type Props = {
  items: NewsItem[]
  className?: string
}

export function NewsList({ items, className }: Props) {
  if (!items.length) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]',
          className,
        )}
      >
        검색 결과가 없습니다. 키워드를 입력해 검색해 보세요.
      </div>
    )
  }

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg font-semibold tracking-tight">기사 목록</h2>
      <ul className="max-h-[min(42rem,70vh)] space-y-3 overflow-y-auto pr-1">
        {items.map((it, i) => (
          <li
            key={`${it.link}-${i}`}
            className="rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm shadow-sm dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {it.press}
              </span>
              <time className="text-xs text-[var(--color-muted)]">{it.pubDate}</time>
            </div>
            <a
              href={it.originallink || it.link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-start gap-2 font-medium text-zinc-900 hover:text-[var(--color-accent)] dark:text-zinc-50"
            >
              <span className="flex-1">{it.title}</span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden />
            </a>
            {it.summary ? (
              <div className="mt-3 rounded-lg border border-violet-200/80 bg-gradient-to-b from-violet-50/90 to-white p-3 text-left dark:border-violet-900/50 dark:from-violet-950/40 dark:to-zinc-950">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  요약
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-100">
                  <span className="font-semibold text-violet-700 dark:text-violet-300">핵심 한 줄</span>
                  <span className="mx-1.5 text-zinc-400">—</span>
                  {it.summary.headline}
                </p>
                {it.summary.bullets.length > 0 ? (
                  <div className="mt-3 border-t border-violet-100 pt-3 dark:border-violet-900/40">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      함께 보면 좋은 포인트
                    </p>
                    <ul className="mt-2 list-none space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {it.summary.bullets.map((line, j) => (
                        <li key={j} className="flex gap-2 pl-0">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                  onClick={() => {
                    void navigator.clipboard.writeText(it.summary.formatted)
                  }}
                >
                  요약 전체 복사
                </button>
              </div>
            ) : null}
            {it.description ? (
              <details className="mt-2 text-[var(--color-muted)]">
                <summary className="cursor-pointer text-xs font-medium hover:text-zinc-600 dark:hover:text-zinc-300">
                  네이버 미리보기 원문 보기
                </summary>
                <p className="mt-2 text-sm leading-relaxed">{it.description}</p>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
