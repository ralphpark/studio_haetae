# Client Portal Flow - 완료 보고서

> **Feature**: 클라이언트 포털 프로젝트 진행 플로우
> **기간**: 2026-03-20 ~ 2026-03-21
> **상태**: Do 완료 (Check/Iterate 전)

---

## 1. 요약

상담 폼 제출부터 제안서 확인, 미팅 예약, 기획서/견적서 확인, 프로젝트 킥오프까지
전체 클라이언트 여정을 포털 대시보드 안에서 완결하는 Step 기반 플로우를 구현.
Notion을 중심 허브로 활용하여 상담→제안서→기획서/견적서가 자동으로 연동되는 구조.

---

## 2. 구현 내역

### 2-1. 상담 폼 5단계 고도화 (`17cfe4b`)
**변경 파일**: `src/components/home/ContactForm.tsx`

| 기존 (3단계) | 개선 (5단계) |
|---|---|
| 이름, 이메일 | 이름, 연락처, 이메일, 회사명 |
| 회사명, 예산 (드롭다운) | 프로젝트 유형/목적/타겟 (칩 선택식) |
| 자유 텍스트 1개 | 핵심 기능 체크박스 + 디자인 상태 |
| - | 예산/일정/유지보수 (칩 선택식) |
| - | 레퍼런스 URL + 추가 요청 (선택) |

- NotebookLM 외주 자료 참고하여 기획서 작성에 필요한 질문 구성
- `<select>` 드롭다운 → **ChipSelect 컴포넌트**로 UX 개선
- 단계별 유효성 검사 + dot indicator 진행 상태 시각화

### 2-2. Supabase 프로젝트 저장 + 대시보드 (`4bcc845`)
**변경 파일**: `src/app/api/contact/route.ts`, `src/app/portal/page.tsx`

- `projects` 테이블 생성 (RLS: 본인만 조회/생성)
- `/api/contact`에서 인증 사용자의 상담을 Supabase에 저장
- `project_number` 자동 증가 (같은 고객 다중 프로젝트)
- 포털 대시보드에서 프로젝트 카드 목록 표시

### 2-3. 프로젝트 카드 UX (`7102c59`)
**변경 파일**: `src/components/portal/ProjectCard.tsx`, `src/app/api/projects/[id]/route.ts`

- 요약 박스 제거 → 프로젝트 카드만 표시
- 프로젝트명 인라인 편집 (클릭 → 입력 → Enter 저장)
- "이름 변경" 힌트 텍스트
- "프로젝트 들어가기 →" 버튼
- PATCH API로 DB 업데이트

### 2-4. AI 제안서 생성 (`48c58a2`, `70693aa`)
**변경 파일**: `src/app/api/projects/[id]/proposal/route.ts`, `src/app/portal/[id]/page.tsx`, `src/components/portal/ProposalView.tsx`

- Mistral AI (`mistral-large-latest`) 기반 제안서 자동 생성
- NotebookLM 외주 자료 기반 6개 섹션 구성:
  1. 프로젝트 이해 및 분석
  2. 제안 전략 및 로드맵
  3. 상세 개발 범위 및 기술 스택
  4. 프로젝트 일정 및 관리 방안
  5. 견적 및 예산
  6. 팀 역량 및 지원
- `responseFormat: { type: "json_object" }` 안정적 JSON 파싱
- 시스템 프롬프트 분리 (Studio HaeTae PM 역할 설정)
- 섹션별 구체적 작성 지침 (예산/일정 맞춤 옵션)
- 생성된 제안서 `projects.proposal` jsonb 컬럼에 저장

### 2-5. 제안서 모달 + UI 문구 개선 (`777abc4`, `776b055`, `87ff138`)
**변경 파일**: `src/components/portal/ProposalModal.tsx`, `src/components/portal/ProposalView.tsx`

- 제안서를 모달로 전환 (기존: 아래로 펼침)
- 풀스크린 오버레이, ESC/배경 클릭 닫기
- AI 관련 문구 제거 ("AI 기획서 생성하기" → "제안서 확인하기")
- 버튼 상태: 미생성(투명) → 생성완료(흰색)
- 재확인 버튼은 오류 시에만 표시
- 모달 내부 스크롤 분리 (배경 스크롤 차단)

### 2-6. Step 기반 프로젝트 진행 플로우 (`87ff138`)
**변경 파일**: 다수

```
Step 0: 상담 요약 카드 (항상 표시)
Step 1: 제안서 확인하기 → 모달 표시, 버튼 색상 변경
Step 2: 1차 미팅 예약 카드 (제안서 확인 후 등장)
Step 3: 기획서/견적서 카드 (미팅 예약 후 등장, Notion 링크 대기)
Step 4: "프로젝트 진행을 원하시나요?" (관리자 작성완료 후 등장)
```

- `projects.step` 컬럼으로 진행 상태 관리
- 각 Step 완료 시 자동으로 다음 카드 등장
- `meetings` 테이블 생성 + 미팅 예약 API

### 2-7. 미팅 예약 카드 (`87ff138`)
**변경 파일**: `src/components/portal/MeetingCard.tsx`, `src/app/api/projects/[id]/meeting/route.ts`

- 희망 날짜 (달력) + 시간 (드롭다운, 10:00~17:00)
- 미팅 방법: 화상/전화/대면 (칩 선택)
- 연락처 + 추가 메모
- 예약 완료 시 상태 카드 표시 + "담당자가 곧 연락드리겠습니다"

### 2-8. Notion 자동 연동 (`20b6061`, `7610b35`, `8d6becc`, `e970840`, `e15d39d`)
**변경 파일**: `src/utils/notion.ts`

- **프로젝트 생성 시**: Notion DB에 프로젝트 페이지 자동 생성
  - 상담 정보 테이블 (담당자/이메일/유형/목적/타겟/기능/예산/일정 등)
  - AI 제안서 / 상세 기획서 / 견적서 섹션 자동 구조화
- **제안서 생성 시**: Notion 페이지에 AI 제안서 자동 기록
  - `after` 파라미터로 "AI 제안서" heading 바로 다음에 삽입
  - `await`로 Vercel 서버리스 환경 대응
  - content 2000자 제한 (Notion API 한도)
- **프로젝트명 변경 시**: Notion 페이지 제목 동기화
- **프로젝트 삭제 시**: Notion 페이지 아카이브

**버그 수정 이력**:
- DB 속성명 `Name` → `이름` (한국어 맞춤)
- heading 블록에 children append 불가 → 페이지에 직접 append
- fire-and-forget → await (Vercel 서버리스 중단 방지)
- 페이지 맨 끝 append → `after` 파라미터로 정확한 위치 삽입

### 2-9. 관리자 대시보드 (`20b6061`)
**변경 파일**: `src/app/admin/page.tsx`, `src/app/admin/[id]/page.tsx`, `src/components/admin/AdminProjectActions.tsx`

- `/admin`: 전체 프로젝트 목록 (step별 색상 배지, 통계)
- `/admin/[id]`: 프로젝트 상세 (상담 정보 + AI 제안서 + 미팅 + Notion 링크)
- **"작성완료" 트리거**: 기획서/견적서 Notion URL 입력 → step 4 활성화
- 진행 현황 시각화 (상담 → 제안서 → 미팅 → 기획서 → 킥오프)
- `admins` 테이블 + RLS 정책 (관리자만 전체 프로젝트 조회/수정)
- `proxy.ts`에서 `/admin` 경로 보호

### 2-10. 프로젝트 삭제 (`a55539b`, `9bfb053`)
**변경 파일**: `src/app/api/projects/[id]/route.ts`, `src/components/portal/ProjectCard.tsx`

- DELETE API 엔드포인트
- Supabase 삭제 (cascade로 미팅도 삭제) + Notion 페이지 아카이브
- 삭제 확인 다이얼로그
- 삭제 후 `router.refresh()`로 안전하게 페이지 새로고침

### 2-11. n8n MCP 설정
**변경 파일**: `.mcp.json`, `.gitignore`

- `n8n-mcp` 패키지로 n8n MCP 서버 설정
- n8n 셀프호스트 (n8n.alchemesh.com) 연동 준비
- `.mcp.json`을 `.gitignore`에 추가 (API 키 보호)

---

## 3. DB 스키마 변경

### 마이그레이션 목록
| 마이그레이션 | 내용 |
|---|---|
| `create_projects_table` | projects 테이블 + RLS |
| `add_project_name_column` | project_name 컬럼 + update 정책 |
| `add_proposal_column` | proposal jsonb 컬럼 |
| `add_step_and_meetings` | step, document_urls, notion_page_id 컬럼 + meetings 테이블 |
| `create_admins_table` | admins 테이블 + 관리자 RLS 정책 |
| `add_delete_policy` | projects delete 정책 |

### 최종 테이블 구조

**projects**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | auth.users 참조 |
| project_number | int | 자동 증가 |
| project_name | text | 사용자 편집 가능 |
| name, email, company, phone | text | 상담 기본 정보 |
| project_type, project_purpose, target_user | text | 프로젝트 개요 |
| features | text[] | 핵심 기능 목록 |
| design_status, budget, timeline, maintenance | text | 예산/일정 |
| reference_url, message | text | 선택 사항 |
| proposal | jsonb | AI 제안서 |
| step | int | 진행 단계 (0~4) |
| document_urls | jsonb | 기획서/견적서 Notion URL |
| notion_page_id | text | Notion 페이지 ID |
| status | text | 상태 텍스트 |
| created_at | timestamptz | |

**meetings**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid (FK) | projects 참조 |
| user_id | uuid (FK) | auth.users 참조 |
| preferred_date | date | 희망 날짜 |
| preferred_time | text | 희망 시간 |
| method | text | 미팅 방법 |
| contact_phone | text | 연락처 |
| memo | text | 추가 메모 |
| status | text | 예약 상태 |
| created_at | timestamptz | |

**admins**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | uuid (PK, FK) | auth.users 참조 |
| created_at | timestamptz | |

---

## 4. 파일 변경 총괄

### 신규 파일 (17개)
| 파일 | 역할 |
|---|---|
| `docs/01-plan/features/client-portal-flow.plan.md` | PDCA 계획서 |
| `src/app/admin/page.tsx` | 관리자 프로젝트 목록 |
| `src/app/admin/[id]/page.tsx` | 관리자 프로젝트 상세 |
| `src/app/api/admin/projects/[id]/complete-docs/route.ts` | 작성완료 API |
| `src/app/api/projects/[id]/route.ts` | 프로젝트 수정/삭제 API |
| `src/app/api/projects/[id]/meeting/route.ts` | 미팅 예약 API |
| `src/app/api/projects/[id]/proposal/route.ts` | AI 제안서 생성 API |
| `src/app/api/projects/[id]/proposal/sync-notion/route.ts` | Notion 동기화 API |
| `src/app/portal/[id]/page.tsx` | 프로젝트 상세 페이지 |
| `src/components/admin/AdminProjectActions.tsx` | 관리자 액션 컴포넌트 |
| `src/components/portal/MeetingCard.tsx` | 미팅 예약 카드 |
| `src/components/portal/ProjectCard.tsx` | 프로젝트 카드 |
| `src/components/portal/ProposalModal.tsx` | 제안서 모달 |
| `src/components/portal/ProposalView.tsx` | Step 기반 프로젝트 뷰 |
| `src/utils/admin.ts` | 관리자 인증 유틸 |
| `src/utils/notion.ts` | Notion API 유틸 |
| `.mcp.json` | n8n MCP 서버 설정 |

### 수정 파일 (7개)
| 파일 | 변경 내용 |
|---|---|
| `src/components/home/ContactForm.tsx` | 3단계 → 5단계 칩 선택식 |
| `src/app/api/contact/route.ts` | Supabase 저장 + Notion 연동 |
| `src/app/portal/page.tsx` | 프로젝트 카드 목록 |
| `src/utils/supabase/middleware.ts` | /admin 경로 보호 추가 |
| `.gitignore` | .mcp.json 추가 |
| `CLAUDE.md` | 프로젝트 현황 업데이트 |
| `package.json` | @mistralai/mistralai 추가 |

### 통계
- **총 커밋**: 19개 (기능 구현 관련)
- **추가**: 2,869줄
- **삭제**: 139줄
- **변경 파일**: 24개

---

## 5. 환경변수

| 변수 | 용도 | 설정 위치 |
|---|---|---|
| `MISTRAL_API_KEY` | AI 제안서 생성 | .env.local + Vercel |
| `NOTION_API_KEY` | Notion API 연동 | .env.local + Vercel |
| `NOTION_PROJECTS_DB_ID` | Notion 프로젝트 DB | .env.local + Vercel |
| `N8N_BASE_URL` | n8n 자동화 | .mcp.json |
| `N8N_API_KEY` | n8n API 인증 | .mcp.json |

---

## 6. 외부 서비스 연동

| 서비스 | 용도 | 상태 |
|---|---|---|
| **Supabase** | DB, 인증, RLS | ✅ 완료 |
| **Mistral AI** | 제안서 자동 생성 | ✅ 완료 |
| **Notion** | 프로젝트 문서 허브 | ✅ 완료 |
| **n8n** | 자동화 워크플로우 | 🔧 MCP 설정 완료, 워크플로우 구현 필요 |
| **Slack** | 프로젝트 킥오프 채널 | ⏳ Step 4 구현 시 |
| **Resend** | 이메일 알림 | ⏳ API 키 설정 시 |

---

## 7. 다음 작업

| 우선순위 | 항목 | 설명 |
|---|---|---|
| 1 | n8n 워크플로우 구현 | Notion 제안서 기록 → 기획서/견적서 자동 생성 → 완료 트리거 |
| 2 | Step 4 킥오프 | Slack 채널 자동 생성 + 클라이언트 초대 |
| 3 | 이메일 알림 | 상담 접수/제안서 완료/기획서 공유 시 이메일 발송 |
| 4 | 관리자 미팅 관리 | 미팅 상태 변경 (예약 대기 → 확정 → 완료) |
