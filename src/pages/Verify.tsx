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

type RlsStatusRow = {
  schemaname: string
  tablename: string
  rls_enabled: boolean
}

type PolicyRow = {
  schemaname: string
  tablename: string
  policyname: string
  cmd: string
  policy_using: string | null
  policy_with_check: string | null
}

type AuditRow = {
  id: string
  table_name: string
  record_id: string
  receipt_no: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  before_data: unknown
  after_data: unknown
  changed_by: string | null
  changed_at: string
}

type ConstraintRow = {
  table_name: string
  constraint_name: string
  constraint_type: string
  definition: string
}

type TabKey = 'data' | 'rls' | 'policy' | 'constraints' | 'audit'

export function Verify() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<TabKey>('data')

  // 탭 1: 접수 데이터
  const [receiptNo, setReceiptNo] = useState(searchParams.get('receipt') ?? '')
  const [row, setRow] = useState<VerifyRow | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataErr, setDataErr] = useState<string | null>(null)

  // 탭 2~3: RLS 정보 (페이지 진입 시 자동 로드)
  const [rlsStatus, setRlsStatus] = useState<RlsStatusRow[]>([])
  const [policies, setPolicies] = useState<PolicyRow[]>([])

  // 탭 4: 제약조건 (페이지 진입 시 자동 로드)
  const [constraints, setConstraints] = useState<ConstraintRow[]>([])

  // 탭 5: 감사 로그
  const [auditReceiptNo, setAuditReceiptNo] = useState('')
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditErr, setAuditErr] = useState<string | null>(null)
  const [auditSearched, setAuditSearched] = useState(false)

  const fetchRow = async (no: string) => {
    if (!no.trim()) return
    setDataLoading(true)
    setDataErr(null)
    setRow(null)
    const { data, error } = await supabase
      .from('verify_requests')
      .select('*')
      .eq('receipt_no', no.trim())
      .maybeSingle()
    setDataLoading(false)
    if (error) {
      setDataErr(error.message)
      return
    }
    if (!data) {
      setDataErr('해당 접수번호의 데이터가 없습니다.')
      return
    }
    setRow(data as VerifyRow)
  }

  const fetchAudit = async (no: string) => {
    if (!no.trim()) return
    setAuditLoading(true)
    setAuditErr(null)
    setAudit([])
    const { data, error } = await supabase
      .from('verify_audit_log')
      .select('*')
      .eq('receipt_no', no.trim())
      .order('changed_at', { ascending: false })
    setAuditLoading(false)
    setAuditSearched(true)
    if (error) {
      setAuditErr(error.message)
      return
    }
    setAudit((data as AuditRow[]) ?? [])
  }

  useEffect(() => {
    const initial = searchParams.get('receipt')
    if (initial) fetchRow(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    supabase
      .from('verify_rls_status')
      .select('*')
      .order('tablename')
      .then(({ data }) => setRlsStatus((data as RlsStatusRow[]) ?? []))

    supabase
      .from('verify_policies')
      .select('*')
      .order('tablename')
      .order('policyname')
      .then(({ data }) => setPolicies((data as PolicyRow[]) ?? []))

    supabase
      .from('verify_check_constraints')
      .select('*')
      .order('table_name')
      .order('constraint_type')
      .order('constraint_name')
      .then(({ data }) => setConstraints((data as ConstraintRow[]) ?? []))
  }, [])

  const onSubmitData = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ receipt: receiptNo })
    fetchRow(receiptNo)
  }

  const onSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAudit(auditReceiptNo)
  }

  return (
    <div className="bg-white p-6 rounded shadow-sm max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-2">DB 상세 조회</h1>
      <p className="text-sm text-slate-600 mb-4">
        시험 검증용 페이지. 접수 데이터·RLS 상태·정책·제약조건·감사 로그를 조회합니다.
      </p>

      <div className="flex gap-1 border-b mb-4 flex-wrap">
        <TabButton active={tab === 'data'} onClick={() => setTab('data')}>
          접수 데이터
        </TabButton>
        <TabButton active={tab === 'rls'} onClick={() => setTab('rls')}>
          RLS 상태
        </TabButton>
        <TabButton active={tab === 'policy'} onClick={() => setTab('policy')}>
          RLS 정책
        </TabButton>
        <TabButton active={tab === 'constraints'} onClick={() => setTab('constraints')}>
          제약조건
        </TabButton>
        <TabButton active={tab === 'audit'} onClick={() => setTab('audit')}>
          감사 로그
        </TabButton>
      </div>

      {tab === 'data' && (
        <div>
          <form onSubmit={onSubmitData} className="flex gap-2 mb-4">
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

          {dataLoading && <p className="text-slate-500">조회 중...</p>}
          {dataErr && <p className="text-red-600 text-sm">{dataErr}</p>}

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
        </div>
      )}

      {tab === 'rls' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            public 스키마의 각 테이블에 RLS(Row Level Security)가 활성화되어 있는지 확인합니다.
          </p>
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">스키마</th>
                <th className="text-left p-2">테이블</th>
                <th className="text-left p-2">RLS 활성</th>
              </tr>
            </thead>
            <tbody>
              {rlsStatus.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-mono">{r.schemaname}</td>
                  <td className="p-2 font-mono">{r.tablename}</td>
                  <td className="p-2">
                    <span
                      className={
                        'inline-block px-2 py-0.5 rounded text-xs ' +
                        (r.rls_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800')
                      }
                    >
                      {r.rls_enabled ? 'true' : 'false'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'policy' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            현재 public 스키마에 적용된 RLS 정책 전체 목록입니다.
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

      {tab === 'constraints' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            서버측 데이터 무결성 제약(CHECK, UNIQUE, PRIMARY KEY, FOREIGN KEY) 정의입니다.
            클라이언트 검증을 우회한 부적합 데이터가 DB에 저장되지 않도록 강제합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">테이블</th>
                  <th className="text-left p-2">제약명</th>
                  <th className="text-left p-2">유형</th>
                  <th className="text-left p-2">정의</th>
                </tr>
              </thead>
              <tbody>
                {constraints.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-mono">{c.table_name}</td>
                    <td className="p-2 font-mono">{c.constraint_name}</td>
                    <td className="p-2">
                      <span
                        className={
                          'inline-block px-2 py-0.5 rounded text-xs ' +
                          (c.constraint_type === 'CHECK'
                            ? 'bg-blue-100 text-blue-800'
                            : c.constraint_type === 'UNIQUE'
                              ? 'bg-purple-100 text-purple-800'
                              : c.constraint_type === 'PRIMARY KEY'
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-amber-100 text-amber-800')
                        }
                      >
                        {c.constraint_type}
                      </span>
                    </td>
                    <td className="p-2 font-mono break-all">{c.definition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            접수번호로 해당 신청 건의 변경 이력을 조회합니다.
          </p>

          <form onSubmit={onSubmitAudit} className="flex gap-2 mb-4">
            <input
              className={inputClass + ' flex-1'}
              placeholder="KAIC-YY-###"
              value={auditReceiptNo}
              onChange={(e) => setAuditReceiptNo(e.target.value)}
            />
            <button type="submit" className={primaryBtnClass}>
              조회
            </button>
          </form>

          {auditLoading && <p className="text-slate-500">조회 중...</p>}
          {auditErr && <p className="text-red-600 text-sm">{auditErr}</p>}

          {auditSearched && !auditLoading && !auditErr && audit.length === 0 && (
            <p className="text-slate-500 text-sm">해당 접수번호의 변경 이력이 없습니다.</p>
          )}

          {audit.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">시각</th>
                    <th className="text-left p-2">접수번호</th>
                    <th className="text-left p-2">동작</th>
                    <th className="text-left p-2">변경 전</th>
                    <th className="text-left p-2">변경 후</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id} className="border-t align-top">
                      <td className="p-2 font-mono whitespace-nowrap">
                        {new Date(a.changed_at).toLocaleString()}
                      </td>
                      <td className="p-2 font-mono">{a.receipt_no ?? '-'}</td>
                      <td className="p-2">
                        <span
                          className={
                            'inline-block px-2 py-0.5 rounded text-xs ' +
                            (a.action === 'INSERT'
                              ? 'bg-green-100 text-green-800'
                              : a.action === 'UPDATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800')
                          }
                        >
                          {a.action}
                        </span>
                      </td>
                      <td className="p-2 font-mono break-all max-w-xs">
                        {a.before_data ? (
                          <pre className="whitespace-pre-wrap text-[10px]">
                            {JSON.stringify(a.before_data, null, 2)}
                          </pre>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-2 font-mono break-all max-w-xs">
                        {a.after_data ? (
                          <pre className="whitespace-pre-wrap text-[10px]">
                            {JSON.stringify(a.after_data, null, 2)}
                          </pre>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2 text-sm font-medium -mb-px border-b-2 ' +
        (active
          ? 'border-slate-900 text-slate-900'
          : 'border-transparent text-slate-500 hover:text-slate-700')
      }
    >
      {children}
    </button>
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
