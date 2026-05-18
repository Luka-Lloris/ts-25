import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Request } from '../types'
import { REQUEST_TYPE_LABEL, REQUEST_STATUS_LABEL } from '../lib/schemas'

export function MyRequests() {
  const [items, setItems] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as Request[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p>불러오는 중...</p>

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <h1 className="text-xl font-bold mb-4">내 신청 내역</h1>
      {items.length === 0 ? (
        <p className="text-slate-500">신청 내역이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">접수번호</th>
              <th className="text-left p-2">의뢰 종류</th>
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
                <td className="p-2">{r.title}</td>
                <td className="p-2">
                  <span
                    className={
                      'inline-block px-2 py-0.5 rounded text-xs ' +
                      (r.status === 'new'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800')
                    }
                  >
                    {REQUEST_STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="p-2">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-2">
                  <Link to={`/my/${r.id}`} className="text-slate-600 hover:underline">
                    상세
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
