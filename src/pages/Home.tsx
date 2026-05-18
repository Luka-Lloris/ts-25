import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { primaryBtnClass, secondaryBtnClass } from '../components/FormField'

export function Home() {
  const { session, isAdmin } = useAuth()
  return (
    <div className="bg-white p-8 rounded shadow-sm">
      <h1 className="text-2xl font-bold mb-2">KAIC 의뢰 접수</h1>
      <p className="text-slate-600 mb-6">
        한국인공지능검증원에 시험·컨설팅·개발 의뢰를 접수합니다.
      </p>
      <div className="flex gap-2">
        {session ? (
          <>
            <Link to="/request" className={primaryBtnClass}>
              신청서 작성
            </Link>
            <Link to="/my" className={secondaryBtnClass}>
              내 신청 내역
            </Link>
            {isAdmin && (
              <Link to="/admin" className={secondaryBtnClass}>
                어드민 페이지
              </Link>
            )}
          </>
        ) : (
          <>
            <Link to="/login" className={primaryBtnClass}>
              로그인
            </Link>
            <Link to="/signup" className={secondaryBtnClass}>
              회원가입
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
