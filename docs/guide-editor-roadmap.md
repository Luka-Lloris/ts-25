# 가이드 문서 편집·승인 시스템 로드맵

## 배경

`/admin/console/lm_guide` 경로의 가이드 문서는 현재 단순 읽기 모드로 운영된다. MD 파일을 직접 수정하려면 GitHub 리포에서 코드 수정 후 push해야 한다.

장기적으로는 어드민(시험원의 admin 권한 메일 계정)이 가이드 페이지 안에서 직접 수정 제안하고, 마스터 계정과 기술책임자가 승인하면 운영 버전에 반영되는 시스템을 구축한다.

## 목표

- 어드민이 GitHub UI 사용 없이 가이드 페이지에서 직접 수정 제안
- 마스터·기책 승인 워크플로우로 운영 버전 통제
- 이전 버전 자동 보존 및 롤백 가능

## 시스템 구성

### 1. MD 파일 저장소: Supabase 테이블

GitHub API 연동 대신 Supabase 테이블에 가이드 내용을 저장한다. 페이지 로드 시 DB에서 fetch하여 렌더링한다.

#### DB 스키마 (안)

```sql
-- 운영 버전 (사용자에게 보이는 것)
create table guide_main (
  slug text primary key,        -- 예: 'test-report-writing'
  content text not null,
  updated_at timestamptz default now(),
  updated_by text
);

-- 작업 중 버전 (draft, 어드민이 수정 제안)
create table guide_draft (
  slug text primary key,
  content text not null,
  updated_at timestamptz default now(),
  updated_by text
);

-- 버전 이력 (백업 + 롤백)
create table guide_history (
  id bigserial primary key,
  slug text not null,
  content text not null,
  version int not null,
  created_at timestamptz default now(),
  created_by text,
  note text                     -- 수정 메모
);
```

### 2. UI 모드

| 모드 | 권한 | 기능 |
|---|---|---|
| 읽기 모드 | 모든 admin | guide_main 내용 표시 (기본 모드) |
| 편집 모드 | 모든 admin | guide_draft를 편집·저장 |
| 검토 모드 | 마스터·기책 | guide_main vs guide_draft diff 표시 |
| 승인 | 마스터·기책 | guide_draft → guide_main 반영. 직전 guide_main은 guide_history에 자동 보존 |
| 이력 보기 | 마스터·기책 | guide_history 목록 + 특정 버전으로 복원 |
| 롤백 | 마스터 | guide_history 특정 버전을 guide_main에 복원 |

### 3. 권한 분리

UI에 노출되는 버튼이 권한별로 다름. 권한은 이메일 화이트리스트로 처리한다.

- **수정 권한** (편집·저장): 모든 admin 계정
- **승인 권한** (draft → main 머지): 마스터(admin01@test.ai) + 기책(bon@talpiot.or.kr)
- **롤백 권한** (history → main): 마스터만

권한 체크는 `useAuth()`에서 가져온 email을 화이트리스트와 비교하는 헬퍼 함수로 구현.

### 4. RLS 정책

```sql
-- guide_main: 어드민은 SELECT, UPDATE는 마스터·기책만
-- guide_draft: 어드민은 SELECT·UPDATE 모두 허용
-- guide_history: 어드민은 SELECT, INSERT는 승인 트리거로만, 직접 DELETE 불가
```

세부 정책은 구현 시점에 확정.

### 5. 핵심 동작

#### 저장 (draft 업데이트)
어드민이 편집 모드에서 "저장" 클릭 시 `guide_draft` upsert. `updated_by`에 본인 이메일 기록.

#### 승인 (draft → main + 자동 백업)
마스터·기책이 검토 모드에서 "승인" 클릭 시 트랜잭션으로:
1. 현재 `guide_main.content`를 `guide_history`에 새 row로 insert (version +1)
2. `guide_draft.content`를 `guide_main`에 update
3. `guide_main.updated_by`에 승인자 이메일 기록

#### 롤백
마스터가 이력에서 특정 version 선택 후 "복원" 클릭 시 트랜잭션으로:
1. 현재 `guide_main.content`를 `guide_history`에 보존
2. 선택된 version의 content를 `guide_main`에 update

## 추가 고려사항

### 동시 편집 충돌
여러 어드민이 동시에 draft 편집 시 마지막 저장이 이전 저장을 덮어쓴다. 단순한 last-write-wins 정책으로 시작하되, 충돌 빈발 시 낙관적 잠금(optimistic locking) 도입 검토.

### 미리보기
편집 중에도 우측에 ReactMarkdown 렌더링 실시간 표시. textarea와 렌더링을 좌우 분할 레이아웃.

### 다중 가이드 지원
`slug` 컬럼으로 여러 가이드 문서를 관리 가능하게 설계. 예: `test-report-writing`, `audit-checklist`, `tool-installation` 등.

### 알림
draft 업데이트 시 마스터·기책에게 이메일/Slack 알림 보내는 것은 별도 단계로 추진.

## 구현 우선순위

1. **1단계 (현재)**: 단순 읽기 모드 (Vite raw import 방식) — 완료
2. **2단계**: 읽기 모드를 Supabase 테이블 기반으로 전환 (가이드 본문 DB로 이전)
3. **3단계**: 편집 모드 + 저장 기능 추가
4. **4단계**: 검토 모드 + 승인 워크플로우
5. **5단계**: 이력·롤백 기능

각 단계는 독립적으로 배포 가능하므로 점진적으로 확장한다.

## 관련 파일

- `src/pages/LMGuide.tsx`: 가이드 뷰어 페이지 (1단계 구현체)
- `src/guides/test-report-writing.md`: 1단계의 raw import 대상 MD
- (예정) Supabase migration: `guide_main`, `guide_draft`, `guide_history` 테이블 생성
