import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { authSchema, type AuthInput } from '../lib/schemas'
import { FormField, inputClass, primaryBtnClass } from '../components/FormField'

export function Signup() {
  const navigate = useNavigate()
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthInput>({ resolver: zodResolver(authSchema) })

  const onSubmit = async (data: AuthInput) => {
    setErr(null)
    setMsg(null)
    const { error } = await supabase.auth.signUp(data)
    if (error) {
      setErr(error.message)
      return
    }
    setMsg('가입 확인 메일이 발송되었습니다. 메일을 확인해 주세요.')
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded shadow-sm">
      <h1 className="text-xl font-bold mb-4">회원가입</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="이메일" required error={errors.email?.message}>
          <input type="email" className={inputClass} {...register('email')} />
        </FormField>
        <FormField label="패스워드 (6자 이상)" required error={errors.password?.message}>
          <input type="password" className={inputClass} {...register('password')} />
        </FormField>
        {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
        {msg && <p className="text-xs text-green-700 mb-2">{msg}</p>}
        <div className="flex justify-between items-center mt-4">
          <Link to="/login" className="text-sm text-slate-600 hover:underline">
            로그인
          </Link>
          <button type="submit" className={primaryBtnClass} disabled={isSubmitting}>
            가입하기
          </button>
        </div>
      </form>
    </div>
  )
}
