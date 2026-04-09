import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { JournalistMetrics } from '@/types/api'
import { cn } from '@/lib/utils'

type Props = {
  journalist: JournalistMetrics | null
  className?: string
}

export function JournalistInsights({ journalist, className }: Props) {
  if (!journalist) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]',
          className,
        )}
      >
        검색 후 기자·데스크 인사이트가 표시됩니다.
      </div>
    )
  }

  const comp = journalist.competition
  const timing = journalist.timing
  const framing = journalist.framing
  const regional = journalist.regional_and_entities
  const evidence = journalist.evidence
  const follow = journalist.followup
  const risk = journalist.risk

  const topicChart = framing.topic_tags.map((t) => ({ name: t.tag, count: t.count }))
  const hourlyChart = timing.hourly.map((h) => ({ name: h.bucket.slice(5), count: h.count }))

  return (
    <section className={cn('space-y-8', className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">기자·데스크 인사이트</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          타이밍·경쟁·논점·엔티티·후속·출처 리스크를 한 번에 봅니다. (네이버 검색 표본 기준)
        </p>
      </div>

      {/* 경쟁: 관련도 vs 최신 제목 겹침 */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          검색 결과 구성 (정렬 비교)
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{comp.note}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/80">
            <dt className="text-xs text-[var(--color-muted)]">주 검색 정렬</dt>
            <dd className="font-mono font-medium">{comp.primary_sort}</dd>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/80">
            <dt className="text-xs text-[var(--color-muted)]">비교 정렬</dt>
            <dd className="font-mono font-medium">{comp.comparison_sort}</dd>
          </div>
          <div className="rounded-lg bg-violet-50 p-3 dark:bg-violet-950/30 sm:col-span-2">
            <dt className="text-xs text-violet-700 dark:text-violet-300">제목 Jaccard 겹침</dt>
            <dd className="text-2xl font-semibold tabular-nums text-violet-800 dark:text-violet-200">
              {(comp.title_overlap.jaccard * 100).toFixed(1)}%
            </dd>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              교집합 {comp.title_overlap.intersection}건 / 합집합 {comp.title_overlap.union_size}건
            </p>
          </div>
        </dl>
      </div>

      {/* 타이밍 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">표본 내 가장 이른 기사</h3>
          {timing.earliest ? (
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <span className="text-[var(--color-muted)]">시각</span>{' '}
                {timing.earliest.pub_date}
              </li>
              <li>
                <span className="text-[var(--color-muted)]">언론사</span> {timing.earliest.press}
              </li>
              <li className="line-clamp-2 text-zinc-700 dark:text-zinc-300">{timing.earliest.title}</li>
              <li className="text-xs text-[var(--color-muted)]">{timing.earliest.note}</li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-muted)]">날짜 정보가 부족합니다.</p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">보도 집중 시간대</h3>
          {timing.bursts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {timing.bursts.map((b) => (
                <li key={b.bucket} className="flex justify-between gap-2">
                  <span className="font-mono text-xs">{b.bucket}</span>
                  <span>{b.count}건</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-muted)]">뚜렷한 피크가 없습니다.</p>
          )}
        </div>
      </div>

      {hourlyChart.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="mb-2 text-sm font-semibold">시간대별 건수</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {timing.keyword_shift.note ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">초반 vs 후반 키워드 (시간 반분)</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{timing.keyword_shift.note}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">초반 상위</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {timing.keyword_shift.early_top.map((k) => (
                  <span
                    key={k.keyword}
                    className="rounded bg-emerald-50 px-2 py-0.5 text-xs dark:bg-emerald-950/50"
                  >
                    {k.keyword} ({k.count})
                  </span>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">후반 상위</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {timing.keyword_shift.late_top.map((k) => (
                  <span
                    key={k.keyword}
                    className="rounded bg-sky-50 px-2 py-0.5 text-xs dark:bg-sky-950/50"
                  >
                    {k.keyword} ({k.count})
                  </span>
                ))}
              </ul>
            </div>
          </div>
          {(timing.keyword_shift.emerging?.length ?? 0) > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">후반에 부상</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {timing.keyword_shift.emerging!.map((k) => (
                  <span
                    key={k.keyword}
                    className="rounded bg-amber-50 px-2 py-0.5 text-xs dark:bg-amber-950/40"
                  >
                    {k.keyword}
                  </span>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 논점 */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">논점·이슈 태그 (키워드 매칭)</h3>
        {framing.balance_note ? (
          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            {framing.balance_note}
          </p>
        ) : null}
        {topicChart.length > 0 ? (
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-muted)]">태그 매칭 결과가 없습니다.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">사건 유형 힌트</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {journalist.event_types.map((e) => (
              <li key={e.tag} className="flex justify-between">
                <span>{e.tag}</span>
                <span className="tabular-nums text-[var(--color-muted)]">{e.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">근거·수치 밀도</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{evidence.note}</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>숫자+기관·인사 단서 동시</dt>
              <dd className="font-medium tabular-nums">
                {(evidence.articles_with_number_and_org_cue_ratio * 100).toFixed(1)}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>기사당 숫자·비율 등 평균</dt>
              <dd className="font-medium tabular-nums">{evidence.avg_numbers_per_article}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">고유명사 (NNP) 상위</h3>
        <p className="text-xs text-[var(--color-muted)]">{regional.note}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {regional.proper_nouns_top.slice(0, 24).map((p) => (
            <span
              key={p.name}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            >
              {p.name}{' '}
              <span className="text-[var(--color-muted)]">({p.count})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">후속 취재 후보 (허브 연관)</h3>
        {follow.hub_keyword ? (
          <p className="text-xs text-[var(--color-muted)]">허브 키워드: {follow.hub_keyword}</p>
        ) : null}
        <ul className="mt-2 space-y-2 text-sm">
          {follow.peripheral_keywords.map((p) => (
            <li key={p.word} className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="font-medium">{p.word}</span>
              <span className="ml-2 text-xs text-[var(--color-muted)]">
                동시출현 {p.cooccur_with_hub} · 기사 {p.article_mentions} · 점수 {p.score}
              </span>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{p.hint}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">출처 다양성·유사 제목</h3>
        <p className="text-xs text-[var(--color-muted)]">{risk.note}</p>
        {risk.diversity_warning ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            소수 언론 비중이 큽니다 (1위 {risk.top_press_name} 약 {risk.top_press_share_pct}%, HHI{' '}
            {risk.press_hhi}).
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            1위 {risk.top_press_name} {risk.top_press_share_pct}% · HHI {risk.press_hhi}
          </p>
        )}
        {risk.similar_title_clusters.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-[var(--color-muted)]">유사 제목 묶음</p>
            {risk.similar_title_clusters.map((c, i) => (
              <div
                key={i}
                className="rounded border border-zinc-200 bg-zinc-50/50 p-2 text-xs dark:border-zinc-800"
              >
                <p className="font-medium">{c.representative_title}</p>
                <p className="text-[var(--color-muted)]">{c.count}건 유사</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
