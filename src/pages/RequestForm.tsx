import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  requestSchema,
  type RequestInput,
  REQUEST_TYPE_LABEL
} from '../lib/schemas'
import { FormField, inputClass, primaryBtnClass, secondaryBtnClass } from '../components/FormField'

export function RequestForm() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [receiptNo, setReceiptNo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema)
  })

  const requestType = watch('request_type')

  const onSubmit = async (data: RequestInput) => {
    setServerErr(null)
    if (!session?.user) {
      setServerErr('로그인이 필요합니다.')
      return
    }
    const { data: inserted, error } = await supabase
      .from('requests')
      .insert({ ...data, user_id: session.user.id })
      .select('receipt_no')
      .single()

    if (error) {
      setServerErr(error.message)
      return
    }
    setReceiptNo(inserted.receipt_no)
  }

  if (receiptNo) {
    return (
      <div className="bg-white p-8 rounded shadow-sm max-w-lg mx-auto text-center">
        <h2 className="text-xl font-bold mb-2">접수 완료</h2>
        <p className="text-slate-600 mb-4">아래 접수번호로 신청이 접수되었습니다.</p>
        <p className="text-2xl font-mono font-bold mb-6 text-slate-900">{receiptNo}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => navigate('/my')} className={primaryBtnClass}>
            내 신청 보기
          </button>
          <button onClick={() => navigate('/')} className={secondaryBtnClass}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded shadow-sm max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">신청서 작성</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="의뢰 종류" required error={errors.request_type?.message}>
          <div className="flex gap-4">
            {(['test', 'consulting', 'development'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="radio" value={t} {...register('request_type')} />
                {REQUEST_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </FormField>

        {requestType && (
          <>
            <fieldset className="border-t pt-4 mt-4">
              <legend className="text-sm font-bold text-slate-700">기관·담당자 정보</legend>
              <FormField label="기관명" required error={errors.org_name?.message}>
                <input className={inputClass} {...register('org_name')} />
              </FormField>
              <FormField label="담당자명" required error={errors.manager_name?.message}>
                <input className={inputClass} {...register('manager_name')} />
              </FormField>
              <FormField label="연락처" required error={errors.manager_phone?.message}>
                <input
                  className={inputClass}
                  placeholder="010-1234-5678"
                  {...register('manager_phone')}
                />
              </FormField>
              <FormField label="담당자 이메일" required error={errors.manager_email?.message}>
                <input type="email" className={inputClass} {...register('manager_email')} />
              </FormField>
            </fieldset>

            <fieldset className="border-t pt-4 mt-4">
              <legend className="text-sm font-bold text-slate-700">의뢰 상세</legend>
              <FormField label="의뢰 제목" required error={errors.title?.message}>
                <input className={inputClass} {...register('title')} />
              </FormField>
              <FormField label="의뢰 내용 (10자 이상)" required error={errors.description?.message}>
                <textarea
                  className={inputClass + ' min-h-[120px]'}
                  {...register('description')}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="희망 시작일" required error={errors.desired_start?.message}>
                  <input type="date" className={inputClass} {...register('desired_start')} />
                </FormField>
                <FormField label="희망 종료일" required error={errors.desired_end?.message}>
                  <input type="date" className={inputClass} {...register('desired_end')} />
                </FormField>
              </div>
            </fieldset>
          </>
        )}

        {serverErr && <p className="text-xs text-red-600 mb-2">{serverErr}</p>}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button type="button" onClick={() => navigate('/')} className={secondaryBtnClass}>
            취소
          </button>
          <button type="submit" className={primaryBtnClass} disabled={isSubmitting}>
            제출하기
          </button>
        </div>
      </form>
    </div>
  )
}
