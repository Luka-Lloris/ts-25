# TS-ware-25

KAIC 의뢰 접수 시스템 — KS X ISO/IEC 25023:2016 숙련도 시험 대상 소프트웨어 (SUT)

## 개요

외부 의뢰인이 한국인공지능검증원(KAIC)에 시험·컨설팅·개발 의뢰를 1차 접수하는 시스템.

- 유저 페이지 (PWA): 신청서 작성/제출/조회
- 어드민 페이지 (PC): 접수 내역 관리, 통계 대시보드
- 백엔드: Supabase (Auth, DB, RLS, Realtime)
- 호스팅: GitHub Pages
- CI/CD: GitHub Actions

## 시험 대상 측정항목

### 1년차
- FAp-1-G 사용 목적의 기능 적절성
- PRu-2-G 평균 메모리 사용률
- UOp-1-G 작동 일관성

### 2년차
- FCr-1-G 기능 정확성
- UOp-5-S 모니터링 능력
- SIn-2-G 내부 데이터 위조 방지

---

## 시작하기

### 1. Supabase 프로젝트 준비

1. https://supabase.com 에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체를 복사하여 실행
3. 가입할 admin 계정으로 회원가입한 후, SQL Editor에서 아래 실행:

```sql
update public.profiles set role = 'admin' where email = 'your-admin@example.com';
```

4. Supabase Dashboard → Project Settings → API 에서 다음 두 값 확인:
   - Project URL
   - anon public key

### 2. 환경변수 설정

`.env` 파일 생성 (`.env.example` 참고):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 로컬 실행

```bash
npm install
npm run dev
```

### 4. 빌드 및 배포

```bash
npm run build
```

#### GitHub Pages 배포

1. GitHub 저장소 → Settings → Pages → Source를 **GitHub Actions**로 설정
2. Settings → Secrets and variables → Actions에 두 secret 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. main 브랜치에 push하면 자동 배포

---

## 디렉토리 구조

```
ts-ware-25/
├── public/                  # 정적 자산 (PWA 아이콘 등)
├── src/
│   ├── components/          # 공통 컴포넌트 (Layout, FormField)
│   ├── hooks/               # 커스텀 훅 (useAuth)
│   ├── lib/                 # supabase 클라이언트, Zod 스키마
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── RequestForm.tsx
│   │   ├── MyRequests.tsx
│   │   ├── RequestDetail.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── AdminList.tsx
│   ├── styles/              # 글로벌 CSS (Tailwind)
│   ├── types/               # 공통 타입
│   ├── App.tsx              # 라우팅
│   └── main.tsx             # 엔트리
├── supabase/
│   └── schema.sql           # DB 스키마 (전체)
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions 배포
├── index.html               # CSP meta 포함
├── package.json
├── vite.config.ts           # PWA 플러그인 포함
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## PWA 아이콘

`public/` 에 아래 파일을 직접 준비해야 PWA 설치 시 아이콘이 표시됩니다:
- `favicon.svg`
- `pwa-192x192.png`
- `pwa-512x512.png`

없어도 동작은 하지만 빌드 시 경고가 발생합니다.

---

## 측정항목별 구현 매핑

| 측정항목 | 관련 구현 |
|---------|---------|
| FAp-1-G | 가입/로그인/신청서 작성/제출/접수번호 발급/조회/어드민 검토 — 모든 사용 목적별 기능 |
| PRu-2-G | DevTools Performance Monitor + `performance.memory` API로 측정 |
| UOp-1-G | `components/FormField.tsx`의 일관된 입력·버튼·라벨 스타일, 모든 페이지에서 동일 적용 |
| FCr-1-G | DB 트리거 기반 접수번호 생성, Zod + DB constraint 다중 검증 |
| UOp-5-S | `pages/AdminDashboard.tsx` — Recharts 시각화, Supabase Realtime 자동 갱신, 알림 배지 |
| SIn-2-G | RLS 정책, JWT 검증, Zod 클라이언트 검증, DB 제약, HTTPS, CSP meta, audit_log 트리거 |
