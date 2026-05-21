import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { REQUEST_TYPE_LABEL, REQUEST_STATUS_LABEL } from '../lib/schemas'
import { inputClass, primaryBtnClass } from '../components/FormField'

type VerifyRow = {
  id: string
  receipt_no: string
  user_id: string
  request_type: 'test' | 'consulting' | 'development'
  org_name: string
  manager_name: string
  manager_phone: string
  manager_email: string
  title: string
  description: string
  desired_start: string
  desired_end: string
  status: 'new' | 'confirmed'
  created_at: string
  updated_at: string
}

type PolicyRow = {
  schemaname: string
  tablename: string
  policyname: string
  cmd: string
  policy_using: string | null
  policy_with_check: string | null
}

export function Verify() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [receiptNo, setReceiptNo] = useState(searchParams.get('receipt') ?? '')
  const [row, setRow] = useState<VerifyRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [policies, setPolicies] = useState<PolicyRow[]>([])

  const fetchRow = async (no: string) => {
    if (!no.trim()) return
    setLoading(true)
    setErr(null)
    setRow(null)
    const { data, error } = await supabase
      .from('verify_requests')
      .select('*')
      .eq('receipt_no', no.trim())
      .maybeSingle()
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }
    if (!data) {
      setErr('해당 접수번호의 데이터가 없습니다.')
      return
    }
    setRow(data as VerifyRow)
  }

  useEffect(() => {
    const initial = searchParams.get('receipt')
    if (initial) fetchRow(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    supabase
      .from('verify_policies')
      .select('*')
      .order('tablename')
      .order('policyname')
      .then(({ data }) => setPolicies((data as PolicyRow[]) ?? []))
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ receipt: receiptNo })
    fetchRow(receiptNo)
  }

  return (
    <div className="bg-white p-6 rounded shadow-sm max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-2">DB 업데이트 확인</h1>
      <p className="text-sm text-slate-600 mb-4">
        접수번호로 DB 저장값을 조회하고, 적용된 RLS 정책을 확인합니다.
      </p>

      <form onSubmit={onSubmit} className="flex gap-2 mb-6">
        <input
          className={inputClass + ' flex-1'}
          placeholder="KAIC-YY-###"
          value={receiptNo}
          onChange={(e) => setReceiptNo(e.target.value)}
        />
        <button type="submit" className={primaryBtnClass}>
          조회
        </button>
      </form>

      {loading && <p className="text-slate-500">조회 중...</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}

      {row && (
        <div className="border rounded p-4 bg-slate-50">
          <h2 className="text-sm font-bold mb-3 text-slate-700">DB 저장값</h2>
          <dl className="text-sm space-y-1">
            <Row label="접수번호" value={<span className="font-mono">{row.receipt_no}</span>} />
            <Row label="레코드 ID" value={<span className="font-mono text-xs">{row.id}</span>} />
            <Row label="user_id" value={<span className="font-mono text-xs">{row.user_id}</span>} />
            <Row label="의뢰 종류" value={`${row.request_type} (${REQUEST_TYPE_LABEL[row.request_type]})`} />
            <Row label="기관명" value={row.org_name} />
            <Row label="담당자명" value={row.manager_name} />
            <Row label="연락처" value={row.manager_phone} />
            <Row label="담당자 이메일" value={row.manager_email} />
            <Row label="제목" value={row.title} />
            <Row label="내용" value={<pre className="whitespace-pre-wrap font-sans">{row.description}</pre>} />
            <Row label="희망 시작일" value={row.desired_start} />
            <Row label="희망 종료일" value={row.desired_end} />
            <Row label="상태" value={`${row.status} (${REQUEST_STATUS_LABEL[row.status]})`} />
            <Row label="created_at" value={<span className="font-mono text-xs">{row.created_at}</span>} />
            <Row label="updated_at" value={<span className="font-mono text-xs">{row.updated_at}</span>} />
          </dl>
        </div>
      )}

      {policies.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-sm font-bold mb-3 text-slate-700">RLS 정책 확인</h2>
          <p className="text-xs text-slate-500 mb-3">
            현재 public 스키마에 적용된 RLS 정책 전체 목록
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">테이블</th>
                  <th className="text-left p-2">정책명</th>
                  <th className="text-left p-2">명령</th>
                  <th className="text-left p-2">조건</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-mono">{p.tablename}</td>
                    <td className="p-2">{p.policyname}</td>
                    <td className="p-2">{p.cmd}</td>
                    <td className="p-2 font-mono break-all">
                      {p.policy_using || p.policy_with_check || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1 border-b last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 break-all">{value}</dd>
    </div>
  )
}