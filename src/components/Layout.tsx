import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, isAdmin } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">
            TS-ware-25
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <Link to="/request" className="hover:underline">
                  신청하기
                </Link>
                <Link to="/my" className="hover:underline">
                  내 신청
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:underline text-amber-300">
                    어드민
                  </Link>
                )}
                <button onClick={onLogout} className="hover:underline">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">
                  로그인
                </Link>
                <Link to="/signup" className="hover:underline">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-slate-500 py-4">
        © KAIC. TS-ware-25 의뢰 접수 시스템
      </footer>
    </div>
  )
}
