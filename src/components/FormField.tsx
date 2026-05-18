import type { ReactNode } from 'react'

type Props = {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

// UOp-1-G 작동 일관성: 모든 입력 필드는 동일한 라벨·오류 메시지 레이아웃 사용
export function FormField({ label, required, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}

// 일관된 input 스타일
export const inputClass =
  'border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100'

// 일관된 버튼 스타일 (제출 = 우측 하단, primary)
export const primaryBtnClass =
  'bg-slate-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-700 disabled:opacity-50'

export const secondaryBtnClass =
  'bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded text-sm font-medium hover:bg-slate-50'
