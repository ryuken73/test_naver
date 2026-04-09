import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BasicMetrics } from '@/types/api'
import { cn } from '@/lib/utils'

const PIE_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
  '#84cc16',
]

type Props = {
  basic: BasicMetrics | null
  className?: string
}

export function GeneralDashboard({ basic, className }: Props) {
  if (!basic) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]',
          className,
        )}
      >
        검색 후 일반 지표가 표시됩니다.
      </div>
    )
  }

  const pieData = basic.press_share.map((p) => ({ name: p.name, value: p.value }))
  const lineData = basic.timeline
  const barData = basic.top_keywords.map((k) => ({
    name: k.keyword.length > 8 ? `${k.keyword.slice(0, 8)}…` : k.keyword,
    full: k.keyword,
    count: k.count,
  }))

  const emptyCharts = pieData.length === 0 && lineData.length === 0 && barData.length === 0

  return (
    <section className={cn('space-y-8', className)}>
      <h2 className="text-lg font-semibold tracking-tight">일반 지표</h2>

      {emptyCharts ? (
        <p className="text-sm text-[var(--color-muted)]">표시할 데이터가 없습니다.</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
              <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">언론사별 점유율</h3>
              <div className="h-[280px]">
                {pieData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                    데이터 없음
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}%`, '비율']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
              <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">일자별 기사 수</h3>
              <div className="h-[280px]">
                {lineData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                    데이터 없음
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm dark:bg-zinc-950">
            <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">상위 키워드 (명사)</h3>
            <div className="h-[300px]">
              {barData.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                  데이터 없음
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, _name, p) => [
                        value as number,
                        (p?.payload as { full?: string })?.full ?? '',
                      ]}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
