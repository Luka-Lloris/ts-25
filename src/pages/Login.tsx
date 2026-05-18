import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { authSchema, type AuthInput } from '../lib/schemas'
import { FormField, inputClass, primaryBtnClass } from '../components/FormField'

export function Login() {
  const navigate = useNavigate()
  const [err, setErr] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthInput>({ resolver: zodResolver(authSchema) })

  const onSubmit = async (data: AuthInput) => {
    setErr(null)
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setErr(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded shadow-sm">
      <h1 className="text-xl font-bold mb-4">로그인</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="이메일" required error={errors.email?.message}>
          <input type="email" className={inputClass} {...register('email')} />
        </FormField>
        <FormField label="패스워드" required error={errors.password?.message}>
          <input type="password" className={inputClass} {...register('password')} />
        </FormField>
        {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
        <div className="flex justify-between items-center mt-4">
          <Link to="/signup" className="text-sm text-slate-600 hover:underline">
            회원가입
          </Link>
          <button type="submit" className={primaryBtnClass} disabled={isSubmitting}>
            로그인
          </button>
        </div>
      </form>
    </div>
  )
}
