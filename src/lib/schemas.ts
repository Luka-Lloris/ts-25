import { z } from 'zod'

// 인증 스키마
export const authSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '패스워드는 6자 이상이어야 합니다')
})
export type AuthInput = z.infer<typeof authSchema>

// 신청서 스키마
export const requestSchema = z
  .object({
    request_type: z.enum(['test', 'consulting', 'development'], {
      errorMap: () => ({ message: '의뢰 종류를 선택하세요' })
    }),
    org_name: z.string().min(1, '기관명을 입력하세요').max(100),
    manager_name: z.string().min(1, '담당자명을 입력하세요').max(50),
    manager_phone: z
      .string()
      .regex(/^[0-9-]+$/, '연락처는 숫자와 하이픈만 입력 가능합니다')
      .min(9, '연락처가 너무 짧습니다'),
    manager_email: z.string().email('올바른 이메일 형식이 아닙니다'),
    title: z.string().min(1, '의뢰 제목을 입력하세요').max(200),
    description: z.string().min(10, '의뢰 내용은 최소 10자 이상 입력하세요').max(5000),
    desired_start: z.string().min(1, '희망 시작일을 선택하세요'),
    desired_end: z.string().min(1, '희망 종료일을 선택하세요')
  })
  .refine((data) => new Date(data.desired_start) <= new Date(data.desired_end), {
    message: '시작일은 종료일보다 이전이어야 합니다',
    path: ['desired_end']
  })
  .refine(
    (data) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(data.desired_start) >= today
    },
    {
      message: '시작일은 오늘 이후로 선택하세요',
      path: ['desired_start']
    }
  )

export type RequestInput = z.infer<typeof requestSchema>

export const REQUEST_TYPE_LABEL: Record<RequestInput['request_type'], string> = {
  test: '시험',
  consulting: '컨설팅',
  development: '개발'
}

export const REQUEST_STATUS_LABEL: Record<'new' | 'confirmed', string> = {
  new: '신규',
  confirmed: '확인됨'
}
