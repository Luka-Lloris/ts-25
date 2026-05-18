import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Request, StatusHistory } from '../types'
import {
  REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL
} from '../lib/schemas'
import { secondaryBtnClass } from '../components/FormField'

export function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<Request | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('requests').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('request_status_history')
        .select('*')
        .eq('request_id', id)
        .order('changed_at', { ascending: true })
    ]).then(([rRes, hRes]) => {
      setItem((rRes.data as Request) ?? null)
      setHistory((hRes.data as StatusHistory[]) ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p>불러오는 중...</p>
  if (!item) return <p>신청 내역을 찾을 수 없습니다.</p>

  return (
    <div className="bg-white p-6 rounded shadow-sm max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className={secondaryBtnClass + ' mb-4'}>
        ← 목록으로
      </button>
      <h1 className="text-xl font-bold mb-4">신청 상세</h1>
      <dl className="text-sm space-y-2">
        <Row label="접수번호" value={<span className="font-mono">{item.receipt_no}</span>} />
        <Row label="의뢰 종류" value={REQUEST_TYPE_LABEL[item.request_type]} />
        <Row label="상태" value={REQUEST_STATUS_LABEL[item.status]} />
        <Row label="기관명" value={item.org_name} />
        <Row label="담당자" value={`${item.manager_name} (${item.manager_email})`} />
        <Row label="연락처" value={item.manager_phone} />
        <Row label="제목" value={item.title} />
        <Row label="내용" value={<pre className="whitespace-pre-wrap">{item.description}</pre>} />
        <Row label="희망 일정" value={`${item.desired_start} ~ ${item.desired_end}`} />
        <Row label="접수 시각" value={new Date(item.created_at).toLocaleString()} />
      </dl>

      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h2 className="text-sm font-bold mb-2">처리 이력</h2>
          <ul className="text-xs space-y-1">
            {history.map((h) => (
              <li key={h.id}>
                <span className="text-slate-500">
                  {new Date(h.changed_at).toLocaleString()}
                </span>{' '}
                — {h.prev_status ?? '(생성)'} → {h.new_status}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 py-1 border-b last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  )
}
