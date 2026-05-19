import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { supabase } from '../lib/supabase'
import type { Request } from '../types'
import {
  REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL
} from '../lib/schemas'

export function AdminDashboard() {
  const [items, setItems] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
      setItems((data as Request[]) ?? [])
      setLoading(false)
    }
    load()

    // Realtime 구독: 신규 접수 발생 시 자동 갱신
    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests' },
        (payload) => {
          setItems((prev) => [payload.new as Request, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          setItems((prev) =>
            prev.map((r) => (r.id === (payload.new as Request).id ? (payload.new as Request) : r))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 최근 30일 일별 접수 건수
  const dailyData = useMemo(() => {
    const map = new Map<string, number>()
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      map.set(key, 0)
    }
    items.forEach((r) => {
      const key = r.created_at.slice(0, 10)
      if (map.has(key)) map.set(key, map.get(key)! + 1)
    })
    return Array.from(map.entries()).map(([date, count]) => ({
      date: date.slice(5),
      count
    }))
  }, [items])

  // 의뢰 종류별 분포
  const typeData = useMemo(() => {
    const counts: Record<string, number> = { test: 0, consulting: 0, development: 0 }
    items.forEach((r) => {
      counts[r.request_type] = (counts[r.request_type] || 0) + 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      name: REQUEST_TYPE_LABEL[key as keyof typeof REQUEST_TYPE_LABEL],
      value
    }))
  }, [items])

  // 상태별 현황
  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
      },
      { new: 0, confirmed: 0 } as Record<string, number>
    )
  }, [items])

  if (loading) return <p>불러오는 중...</p>

  const COLORS = ['#0f172a', '#475569', '#94a3b8']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">어드민 대시보드</h1>
        <Link
          to="/admin/verify"
          className="bg-slate-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-600"
        >
          DB 업데이트 확인
        </Link>
      </div>

      {/* 상태별 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card label="전체 접수" value={items.length} />
        <Card label="신규" value={statusCounts.new} accent="amber" />
        <Card label="확인됨" value={statusCounts.confirmed} accent="green" />
      </div>

      {/* 일별 접수 추이 */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h2 className="text-sm font-bold mb-2">최근 30일 일별 접수 건수</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0f172a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 의뢰 종류별 분포 */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h2 className="text-sm font-bold mb-2">의뢰 종류별 분포</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={70} label>
              {typeData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 최근 접수 목록 */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h2 className="text-sm font-bold mb-2">최근 접수 (최신 10건)</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">접수번호</th>
              <th className="text-left p-2">종류</th>
              <th className="text-left p-2">기관명</th>
              <th className="text-left p-2">상태</th>
              <th className="text-left p-2">접수 시각</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 10).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-mono">{r.receipt_no}</td>
                <td className="p-2">{REQUEST_TYPE_LABEL[r.request_type]}</td>
                <td className="p-2">{r.org_name}</td>
                <td className="p-2">{REQUEST_STATUS_LABEL[r.status]}</td>
                <td className="p-2 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-2">
                  <Link to={`/admin/${r.id}`} className="text-slate-600 hover:underline">
                    상세
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link to="/admin/list" className="text-sm text-slate-600 hover:underline mt-2 inline-block">
          전체 목록 →
        </Link>
      </div>
    </div>
  )
}

function Card({
  label,
  value,
  accent
}: {
  label: string
  value: number
  accent?: 'amber' | 'green'
}) {
  const accentClass =
    accent === 'amber'
      ? 'text-amber-700'
      : accent === 'green'
        ? 'text-green-700'
        : 'text-slate-900'
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={'text-2xl font-bold ' + accentClass}>{value}</div>
    </div>
  )
}