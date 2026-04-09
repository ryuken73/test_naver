import { lazy, Suspense } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { AdvancedMetrics } from '@/types/api'
import { cn } from '@/lib/utils'

const ForceGraph2D = lazy(() => import('react-force-graph-2d'))

type Props = {
  advanced: AdvancedMetrics | null
  className?: string
}

export function AdvancedDashboard({ advanced, className }: Props) {
  if (!advanced) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]',
          className,
        )}
      >
        검색 후 심화 지표가 표시됩니다.
      </div>
    )
  }

  const { sentiment, fact_radar, cooccurrence } = advanced

  const gaugeData = [
    {
      name: '긍정 비율',
      value: sentiment.gauge_value,
      fill: '#8b5cf6',
    },
  ]

  const radarRows = [
    { subject: '숫자·수치', value: fact_radar.numeric_density, fullMark: 100 },
    { subject: '통계·비율', value: fact_radar.stat_terms, fullMark: 100 },
    { subject: '대규모 수치', value: fact_radar.large_numbers, fullMark: 100 },
    { subject: '날짜·기간', value: fact_radar.date_period, fullMark: 100 },
  ]

  const graphData = {
    nodes: cooccurrence.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      group: n.group,
      val: Math.max(1, n.val),
    })),
    links: cooccurrence.links.map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
    })),
  }

  const hasGraph = graphData.nodes.length > 0 && graphData.links.length > 0

  return (
    <section className={cn('space-y-8', className)}>
      <h2 className="text-lg font-semibold tracking-tight">심화 지표</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">
            프레이밍 · 감성 (사전 기반)
          </h3>
          <p className="mb-2 text-xs text-[var(--color-muted)]">
            긍정 {sentiment.positive_count} / 부정 {sentiment.negative_count} 매칭
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="95%"
                barSize={18}
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarGrid gridType="circle" radialLines={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
                <Tooltip formatter={(v) => [`${v}%`, '긍정 비율']} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm font-medium">
            긍정 비율 (충돌 시): {sentiment.positive_ratio}%
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
          <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">팩트 밀도 (레이더)</h3>
          <p className="mb-2 text-xs text-[var(--color-muted)]">
            종합: {fact_radar.overall_fact_score} / 100 (4축 평균)
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarRows}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar
                  name="점수"
                  dataKey="value"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
        <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">연관어 네트워크</h3>
        <p className="mb-2 text-xs text-[var(--color-muted)]">
          검색어 토큰과 동일 기사에 함께 등장한 명사 연결
        </p>
        {hasGraph ? (
          <div className="h-[480px] w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-zinc-50 dark:bg-zinc-900">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                  그래프 로딩 중…
                </div>
              }
            >
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="group"
                nodeVal="val"
                linkDirectionalParticles={1}
                linkDirectionalParticleWidth={2}
                linkWidth={(l) => Math.sqrt((l as { value?: number }).value ?? 1) * 0.4}
                cooldownTicks={120}
                onEngineStop={() => undefined}
              />
            </Suspense>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            연관 데이터가 부족합니다. 다른 키워드로 시도해 보세요.
          </p>
        )}
      </div>
    </section>
  )
}
