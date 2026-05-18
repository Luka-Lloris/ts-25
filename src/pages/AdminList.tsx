import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Request } from '../types'
import {
  REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL
} from '../lib/schemas'
import { inputClass, secondaryBtnClass } from '../components/FormField'

export function AdminList() {
  const [items, setItems] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = async () => {
    setLoading(true)
    let q = supabase.from('requests').select('*').order('created_at', { ascending: false })
    if (typeFilter) q = q.eq('request_type', typeFilter)
    if (statusFilter) q = q.eq('status', statusFilter)
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to + 'T23:59:59')
    const { data } = await q
    setItems((data as Request[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateStatus = async (id: string, status: 'new' | 'confirmed') => {
    const { error } = await supabase.from('requests').update({ status }).eq('id', id)
    if (!error) load()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">접수 내역 관리</h1>

      <div className="bg-white p-4 rounded shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">의뢰 종류</label>
          <select
            className={inputClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="test">시험</option>
            <option value="consulting">컨설팅</option>
            <option value="development">개발</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">상태</label>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="new">신규</option>
            <option value="confirmed">확인됨</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">접수일 From</label>
          <input
            type="date"
            className={inputClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">접수일 To</label>
          <input
            type="date"
            className={inputClass}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button onClick={load} className={secondaryBtnClass}>
          검색
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        {loading ? (
          <p>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">조건에 맞는 접수가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">접수번호</th>
                <th className="text-left p-2">종류</th>
                <th className="text-left p-2">기관명</th>
                <th className="text-left p-2">제목</th>
                <th className="text-left p-2">상태</th>
                <th className="text-left p-2">접수일</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.receipt_no}</td>
                  <td className="p-2">{REQUEST_TYPE_LABEL[r.request_type]}</td>
                  <td className="p-2">{r.org_name}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateStatus(r.id, e.target.value as 'new' | 'confirmed')
                      }
                      className="border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="new">{REQUEST_STATUS_LABEL.new}</option>
                      <option value="confirmed">{REQUEST_STATUS_LABEL.confirmed}</option>
                    </select>
                  </td>
                  <td className="p-2 text-xs">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    <Link to={`/admin/${r.id}`} className="text-slate-600 hover:underline">
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
