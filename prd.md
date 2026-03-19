# [PRD] 스튜디오 해태 (Studio HaeTae) 공식 웹사이트 구축

## 1. 문서 개요 (Document Overview)
본 문서는 '스튜디오 해태 (Studio HaeTae)'의 공식 웹사이트 구축을 위한 요구사항 정의서(PRD)입니다. 웹사이트의 목적, 타겟 고객, 핵심 기능, 디자인 방향성 및 기술 스택을 명확히 하여 개발 및 디자인의 기준을 제시합니다.

## 2. 제품 비전 및 핵심 가치 (Product Vision & Core Values)
* **브랜드명:** 스튜디오 해태 (Studio HaeTae)
* **슬로건:** Guardians of Innovation, Architects of Scale. (비즈니스의 수호자, 기술의 완성)
* **제품 비전:** 단순한 외주 개발을 넘어, 클라이언트의 비즈니스를 성공으로 이끄는 '비즈니스 빌더(Business Builder)'로서의 역량을 증명하는 플랫폼 구현.
* **핵심 가치:**
  * **감각적인 디자인:** 글로벌 트렌드를 선도하는 미니멀리즘과 섬세한 인터랙션.
  * **압도적 기술력:** 12년 차 CTO의 경험을 바탕으로 한 확장 가능하고 견고한 아키텍처.
  * **비즈니스 파트너십:** 일회성 프로젝트가 아닌, 지속 가능한 성장을 함께하는 파트너.

## 3. 타겟 고객 및 포지셔닝 (Target Audience & Positioning)
* **Target:** 
  * 고도화된 기능(SaaS, 복잡한 결제 시스템 등)이 필요한 스타트업.
  * 브랜드 가치와 심미성을 중시하는 엔터프라이즈 및 프리미엄 브랜드.
* **Positioning:** 
  * 단순 외주(Agency)가 아닌 12년 대기업 경력의 커뮤니케이션 능력과 CTO급 기술력을 갖춘 **'프리미엄 비즈니스 파트너'**.

## 4. 기능 요구사항 (Functional Requirements)

### 4.1. 사용자 인터페이스 및 경험 (UI/UX)
* **디자인 테마:** Dark Mode 베이스 (`#0A0A0A` 중심의 깊이감 있는 배경).
* **디자인 레퍼런스:** Mason Wong 스타일의 미니멀리즘, 타이포그래피 거점의 레이아웃.
* **인터랙션 및 애니메이션:**
  * 커스텀 마우스 커서 적용 (요소의 성격에 따라 유동적으로 형태 변형).
  * 고급스러운 스크롤 애니메이션 (Framer Motion / Anti-gravity 기반의 Reveal, Parallax 효과).
* **반응형 웹:** 데스크탑의 '힙한' 감성과 유려함을 모바일 환경에서도 손실 없이 제공.

### 4.2. 포트폴리오 쇼케이스 (Portfolio Showcase)
최고 수준의 개발 역량을 보여주는 4대 핵심 프로젝트 상세 노출.
1. **Commerce:** 브랜드 D2C 쇼핑몰 (자체 PG 결제 연동 및 복잡한 장바구니/주문 로직).
2. **SaaS:** B2B 복잡한 데이터 대시보드 및 멀티 테넌트(Multi-tenant) 권한 관리 시스템.
3. **Education:** 대용량 동영상 스트리밍 및 학습 관리 시스템(LMS) 플랫폼.
4. **Local Commerce:** 위치 기반 서비스(LBS) 통합 및 실시간 예약/결제 시스템.

### 4.3. 독자적 비즈니스 자동화 시스템 (Custom Code Automation)
사용자가 웹사이트에서 직접 경험할 수 있는 '자동화 파이프라인 시연' 기능.
* **AI Consultation (상담 폼):** 예산, 일정, 요구 기능 등을 수집하는 대화형/인터랙티브 입력 폼.
* **Notion Integration:** 폼 제출 시 고객 데이터를 분석하여 Notion Database에 '기획서, 견적서, 계약서' 초안을 자동 생성.
* **Slack Webhook:** 새로운 리드 발생 시 즉각적인 내부 알림 전송.
* **Email Delivery:** Resend API를 활용, 스튜디오 해태의 브랜딩이 적용된 커스텀 HTML 기반 안내 이메일 자동 발송.
* **Growth Engine:** 
  * 동적 메타태그 및 구조화된 데이터를 통한 SEO 최적화.
  * Meta Graph API를 활용한 인스타그램/쓰레드 콘텐츠 자동 포스팅 자동화 시연(선택적).

### 4.4. 고객 전용 포털 (Client Portal)
단순한 에이전시를 넘어선 '프리미엄 비즈니스 파트너' 경험을 제공하기 위한 프라이빗 대시보드.
* **보안 로그인 (Auth):** Supabase Auth(매직 링크 또는 이메일 로그인)를 통해 계약된 고객 전용 계정 접속.
* **프로젝트 대시보드:** 현재 진행 중인 프로젝트의 마일스톤, 실시간 개발 진행 상황(Progress), 주간 리포트 중앙화.
* **문서 아카이브 (Docs & History):** Notion 및 Resend와 연동되어 발행된 기획서, 견적서, 인보이스, 계약서 히스토리를 앱 내 열람.

## 5. 정보 구조도 (Information Architecture - IA)

### 1) Hero Section
* **Copy:** "비즈니스의 수호자, 기술의 완성."
* **Visual:** 해태의 전통적인 이미지를 현대적/기하학적으로 재해석한 3D 또는 인터랙티브 애니메이션 요소.
* **Content:** 12년 경력 CTO의 약력 요약 및 방문자를 압도하는 퀄리티의 첫인상.

### 2) About Section
* **USP (Unique Selling Proposition):** 12년 대기업/시니어 레벨의 안정적이고 명확한 커뮤니케이션 스킬.
* **Philosophy:** "일회성 런칭이 아닌, 비즈니스 스케일업을 함께하는 파트너."

### 3) Service Section
핵심 서비스 영역 설명:
* Immersive Web (Web 3D/Interaction)
* SaaS & Commerce Build
* Business Automation (Notion/Slack/Resend 워크플로우 통합)
* Marketing Automation (SEO & SNS API 통합)

### 4) Portfolio Section
* **Layout:** 스케일감이 느껴지는 큼직한 카드 형태. 가로 스크롤(Horizontal Scroll) 또는 Masonry 레이아웃 적용.
* **Content:** 4대 핵심 포트폴리오의 비주얼, 해결한 비즈니스 문제, 적용된 기술 스택 명시.

### 5) AI Consult & Automation Section (CTA)
* **Function:** 리드 수집 및 자동화 프로세스를 실제 '시연'하는 구역.
* **Flow:** 폼 작성 ➡ 화면상 자동화 진행 상태 표시 ➡ "노션에 기획서가 생성되었습니다" / "입력하신 이메일로 제안서가 발송되었습니다" 메시지 표출 ➡ 사용자 이메일 열람 유도.

### 6) Client Portal (Private Area)
* **Function:** 신뢰도 높은 협업을 지원하는 고객 전용 실제 모니터링 포털.
* **Content:** 보안 로그인 화면, 프로젝트 마일스톤 타임라인, 피드백 채널 다이렉트 링크, 문서 보관함 뷰어.

## 6. 비기능 요구사항 (Non-Functional Requirements)
* **성능:** LCP(초기 로딩), CLS(레이아웃 이동) 최소화. 무거운 애니메이션 요소는 Lazy Loading 적용.
* **보안:** 상담 폼 입력 데이터의 안전한 처리 (서버리스 함수 환경에서 환경 변수로 API 키 관리).
* **접근성 및 SEO:** 시맨틱 마크업 준수, 각 포트폴리오 페이지별 메타 태그 최적화.

## 7. 기술 스택 (Technical Stack)

| 구분(Category) | 기술(Technology) | 적용 목적 및 특징 |
| :--- | :--- | :--- |
| **Design/Frontend** | Next.js, TypeScript, Anti-gravity (Framer Based), Framer Motion | 안정적이고 빠른 렌더링(SSR/SSG), 고도화된 마이크로 인터랙션 구현 |
| **Backend / DB** | Supabase, Notion API | 인증, 데이터베이스(PostgreSQL) 및 리드/계약 데이터 자동 생성 저장소 |
| **Deploy / Infra** | Vercel | Next.js 및 서버리스 함수의 안정적이고 빠른 호스팅 및 CI/CD |
| **Notification** | Slack Webhook | 내부 영업 파이프라인 실시간 트래킹 |
| **Email** | Resend | 높은 도달률과 커스텀 브랜딩이 가능한 이메일 발송 |
| **Social API** | Meta Graph API (Instagram, Threads) | 마케팅 자동화 기능 구현 |

## 8. 개발 로드맵 (Milestones)

* **Phase 1: Design & Prototyping**
  * Anti-gravity 기반 레이아웃 기획 및 핵심 인터랙션(Mason Wong 스타일) 프로토타이핑.
  * 반응형 디자인 가이드라인 수립.
* **Phase 2: Contents & Copywriting**
  * 브랜드 아이덴티티에 맞는 국/영문 메인 카피 및 마이크로 카피 작성.
  * CTO 이력 및 철학을 녹여낸 소개글 확정.
* **Phase 3: Backend & Automation Logic Setup**
  * Supabase 데이터베이스 및 인증 환경 세팅, Vercel 배포 환경 구축.
  * Notion API, Resend, Slack Webhook 연동 및 테스트.
* **Phase 4: Frontend Development & Portfolio Integration**
  * 전체 페이지 마크업 및 애니메이션 구현.
  * 4개 핵심 프로젝트 데이터(이미지, 텍스트, 스택) 연동.
  * 자동화 시연 폼(AI Consult) UI 연동.
* **Phase 5: Final QA & Launch**
  * 디바이스 및 브라우저 크로스 체킹.
  * 자동화 로직 End-to-End 테스트.
  * SEO 최적화 및 프로덕션 배포.
