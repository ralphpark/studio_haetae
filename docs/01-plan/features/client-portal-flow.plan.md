# Client Portal 프로젝트 진행 플로우

> **Feature**: 상담 → 제안서 → 미팅 → 기획서/견적서 → 프로젝트 킥오프
> **Phase**: Plan
> **Created**: 2026-03-20
> **Status**: Draft

---

## 1. 목표

클라이언트가 상담 후 프로젝트를 진행하기까지의 전체 플로우를 포털 대시보드에서 완결.
Notion을 중심 허브로 활용하여 상담→제안서→기획서/견적서가 자동으로 흘러가는 구조.

## 2. 전체 플로우

```
[상담 완료] → [제안서 확인] → [1차 미팅 예약] → [기획서/견적서 확인] → [프로젝트 킥오프]
   Step 0        Step 1          Step 2              Step 3                Step 4
```

### Notion 자동화 플로우 (백엔드)
```
고객이 프로젝트 생성
  → Notion에 해당 고객 프로젝트 페이지 자동 생성

고객이 "제안서 확인하기" 클릭
  → AI 제안서 생성 + Supabase 저장
  → 동시에 상담 데이터 + AI 제안서를 Notion 페이지에 자동 기록

관리자(Ralph)가 Notion에서 기획서/견적서 작성
  → Notion AI 활용하여 제안서 기반으로 상세 기획서/견적서 작성

관리자가 "작성완료" 트리거 (관리자 대시보드)
  → Notion 기획서/견적서 링크가 클라이언트 포털에 활성화
  → Step 4 "프로젝트 진행을 원하시나요?" 자동 등장
```

### Step 0: 상담 완료 (현재 구현됨)
- 상담 요약 카드 표시
- "제안서 확인하기" 버튼
- **Notion**: 프로젝트 생성 시점에 Notion 페이지 자동 생성 (상담 데이터 포함)

### Step 1: 제안서 확인
- **버튼 동작**: 클릭 → 백그라운드 AI 생성 → 완료 시 버튼 색상 변경
- **모달**: 제안서 6개 섹션을 모달로 표시
- **제안서 이미 생성됨**: 바로 모달 열기 (재생성 없음)
- **Notion 연동**: AI 제안서 생성과 동시에 Notion 페이지에 상담자료 + 제안서 자동 기록

### Step 2: 1차 미팅 예약
- **트리거**: 제안서 확인(모달 닫기) 후 아래에 새 카드 등장
- **카드 내용**: "제안서 내용을 바탕으로 1차 미팅을 진행합니다"
- **"1차 미팅 예약하기" 버튼** → 미팅 폼 모달:
  - 미팅 희망 일시: 날짜 선택 + 시간 선택 (드롭다운)
  - 미팅 방법: 대면 / 화상(Zoom/Google Meet) / 전화
  - 연락처: 전화번호 입력
  - 추가 메모 (선택사항)
- **확인 후**: 예약 내역 표시 + "담당자가 곧 연락드리겠습니다" 메시지
- **DB**: `meetings` 테이블에 저장

### Step 3: 기획서/견적서 확인
- **트리거**: 미팅 예약 완료 후 아래에 새 카드 등장
- **카드 내용**: "미팅 완료 후 상세 기획서와 견적서를 공유해드리겠습니다"
- **상태**:
  - 작성 전: "준비 중입니다" (비활성, 대기 상태)
  - 작성 완료: Notion 기획서/견적서 링크 버튼 활성화 → **Step 4 자동 등장**
- **활성화 조건**: 관리자가 `/admin`에서 "작성완료" 트리거
  → `projects.document_urls` 업데이트 + `step` 4로 전환
- **DB**: projects.document_urls jsonb `{ proposal_url: "notion_url", estimate_url: "notion_url" }`

### Step 4: 프로젝트 킥오프
- **트리거**: Step 3 기획서/견적서 활성화와 동시에 등장
- **카드 내용**: "프로젝트 진행을 원하시나요?"
- **"프로젝트 시작하기" 버튼** → 확인 모달:
  - 안내: 전용 Slack 채널이 생성되고 프로젝트가 시작됩니다
  - 이메일 주소 확인 (Slack 초대용)
- **확인 후 자동화**:
  - Slack: 전용 채널 생성 + 클라이언트 초대
  - Notion: 기존 프로젝트 페이지에 개발 진행 섹션 추가 + 공유
  - 프로젝트 status → "개발 진행"으로 업데이트
- **결과 카드**: Slack/Notion 링크 표시

## 3. DB 스키마 변경

### 3-1. projects 테이블 수정
```sql
ALTER TABLE projects ADD COLUMN step int DEFAULT 0;
-- 0: 상담완료, 1: 제안서확인, 2: 미팅예약, 3: 기획서/견적서, 4: 킥오프
ALTER TABLE projects ADD COLUMN document_urls jsonb;
-- { proposal_pdf: "...", estimate_pdf: "..." }
```

### 3-2. meetings 테이블 신규
```sql
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  method text NOT NULL, -- '대면', '화상', '전화'
  contact_phone text NOT NULL,
  memo text,
  status text DEFAULT '예약 대기',
  created_at timestamptz DEFAULT now()
);
```

## 4. 프롬프트 최적화

### 시스템 프롬프트
```
당신은 'Studio HaeTae'의 시니어 프로젝트 매니저입니다.
12년간 100개 이상의 외주 프로젝트를 성공적으로 납품한 경험이 있습니다.
클라이언트가 읽었을 때 '이 팀이라면 맡겨도 되겠다'는 신뢰감을 주는 제안서를 작성합니다.

작성 원칙:
- 클라이언트의 비즈니스 목표에 초점을 맞춥니다
- 기술 용어는 반드시 쉬운 비유와 함께 설명합니다
- 구체적인 수치와 기간을 포함합니다
- 예산 범위에 맞는 현실적인 제안을 합니다
- 항상 한국어로 응답합니다
```

### 유저 프롬프트 (개선)
```
아래 상담 데이터를 기반으로 프로젝트 제안서를 작성해주세요.

## 상담 데이터
[기존과 동일]

## 섹션별 작성 지침
1. **프로젝트 이해 및 분석**: 클라이언트의 비즈니스 배경을 분석하고,
   프로젝트가 해결할 핵심 문제와 기대 효과를 구체적으로 서술하세요.
2. **제안 전략 및 로드맵**: MVP 우선 전략으로 1차/2차/3차 오픈 범위를
   나누고, 각 단계의 목표와 포함 기능을 명시하세요.
3. **상세 개발 범위 및 기술 스택**: 요청된 기능별 상세 명세를 작성하고,
   기술 스택은 '왜 이 기술이 이 프로젝트에 적합한지' 클라이언트 관점으로 설명하세요.
4. **프로젝트 일정 및 관리 방안**: 희망 일정({timeline}) 내에서
   기획-디자인-개발-QA-배포 단계별 소요 기간을 제시하세요.
5. **견적 및 예산**: 예산({budget}) 범위 내에서 '기본형'과 '확장형'
   두 가지 옵션을 제시하세요. 비용 산정 근거를 간략히 설명하세요.
6. **팀 역량 및 지원**: Studio HaeTae의 강점과 유지보수({maintenance})
   계획을 구체적으로 안내하세요.

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요.
{JSON 스키마}
```

## 5. 관리자 대시보드 (`/admin`)

### 접근 제어
- Supabase `user_metadata.role = 'admin'` 또는 별도 `admins` 테이블로 권한 관리
- proxy.ts에서 `/admin` 경로 보호 (admin이 아니면 redirect)

### 관리자 기능
1. **프로젝트 목록**: 모든 클라이언트의 프로젝트 조회 (step, status별 필터)
2. **프로젝트 상세**: 상담 내용 + AI 제안서 + 미팅 예약 내역 + Notion 페이지 링크
3. **"작성완료" 트리거**: 기획서/견적서 작성 후 클릭 → Notion 링크 자동 연결 + step 4 활성화
4. **미팅 관리**: 미팅 상태 변경 (예약 대기 → 확정 → 완료)

### DB 추가
```sql
CREATE TABLE admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

### 파일 구조
- `src/app/admin/page.tsx` — 프로젝트 목록
- `src/app/admin/[id]/page.tsx` — 프로젝트 상세 + 작성완료 트리거
- `src/app/api/admin/projects/[id]/complete-docs/route.ts` — 작성완료 API (Notion 링크 + step 업데이트)
- `src/app/api/admin/projects/route.ts` — 전체 프로젝트 조회 API

## 6. Notion 자동화 상세

### 타이밍별 Notion API 호출

| 시점 | Notion 동작 | API |
|------|-------------|-----|
| 고객 프로젝트 생성 (`/api/contact`) | 프로젝트 페이지 생성 (상담 데이터 기록) | `notion.pages.create()` |
| 제안서 생성 (`/api/projects/[id]/proposal`) | 기존 페이지에 AI 제안서 내용 추가 | `notion.blocks.children.append()` |
| 관리자 "작성완료" 트리거 | 기획서/견적서 하위 페이지 URL 자동 수집 | `notion.blocks.children.list()` |

### Notion 페이지 구조 (자동 생성)
```
📁 Studio HaeTae Projects (DB)
  └── 📄 {company} - 프로젝트 {number}
        ├── 상담 정보
        │   ├── 프로젝트 유형 / 목적 / 타겟
        │   ├── 핵심 기능 / 디자인 현황
        │   └── 예산 / 일정 / 유지보수
        ├── AI 제안서 (자동 기록)
        │   ├── 프로젝트 이해 및 분석
        │   ├── 제안 전략 및 로드맵
        │   ├── ...6개 섹션
        │   └── (제안서 확인 시 자동 기록됨)
        ├── 📄 상세 기획서 (관리자 작성)
        └── 📄 견적서 (관리자 작성)
```

### 필요 환경변수
- `NOTION_API_KEY` — Notion Integration 토큰
- `NOTION_DATABASE_ID` — 프로젝트 DB ID (이미 .env에 설정 가능)

## 7. 구현 우선순위

| 순서 | 항목 | 난이도 | 비고 |
|------|------|--------|------|
| 1 | 프롬프트 최적화 | 낮음 | API 라우트만 수정 |
| 2 | 제안서 모달 전환 + 버튼 상태 | 중간 | ProposalView → Modal, 색상 변경 |
| 3 | Step 진행 시스템 | 중간 | projects.step 컬럼 + 조건부 카드 렌더링 |
| 4 | 미팅 예약 (Step 2) | 중간 | meetings 테이블 + 폼 모달 |
| 5 | Notion 자동 페이지 생성 (Step 0) | 중간 | 프로젝트 생성 시 Notion 페이지 자동 생성 |
| 6 | Notion 제안서 자동 기록 (Step 1) | 중간 | AI 제안서 생성과 동시에 Notion에 기록 |
| 7 | 관리자 대시보드 | 중간 | /admin 프로젝트 관리 + 작성완료 트리거 |
| 8 | 기획서/견적서 카드 (Step 3) | 낮음 | 관리자 작성완료 → Notion 링크 활성화 → Step 4 등장 |
| 9 | 프로젝트 킥오프 (Step 4) | 높음 | Slack 채널 생성 + Notion 공유 |

## 6. 파일 변경 예상

### 수정
- `src/app/api/projects/[id]/proposal/route.ts` — 프롬프트 최적화
- `src/components/portal/ProposalView.tsx` — 모달 전환 + 버튼 상태
- `src/app/portal/[id]/page.tsx` — Step 기반 카드 렌더링

### 신규
- `src/components/portal/ProposalModal.tsx` — 제안서 모달
- `src/components/portal/MeetingCard.tsx` — 미팅 예약 카드 + 폼
- `src/components/portal/DocumentCard.tsx` — 기획서/견적서 카드
- `src/components/portal/KickoffCard.tsx` — 프로젝트 킥오프 카드
- `src/app/api/projects/[id]/meeting/route.ts` — 미팅 예약 API
- `src/app/api/projects/[id]/kickoff/route.ts` — 킥오프 API (Slack/Notion)
- `src/app/admin/page.tsx` — 관리자 프로젝트 목록
- `src/app/admin/[id]/page.tsx` — 관리자 프로젝트 상세 + 업로드
- `src/app/api/admin/projects/[id]/documents/route.ts` — Notion 링크 등록 API

### DB 마이그레이션
- `add_step_to_projects` — step 컬럼, document_urls 컬럼
- `create_meetings_table` — 미팅 예약 테이블
