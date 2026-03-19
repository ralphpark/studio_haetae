@AGENTS.md

# Studio HaeTae 프로젝트 규칙

## 기본 정보
- **사이트**: https://haetae.studio
- **GitHub**: https://github.com/ralphpark/studio_haetae
- **스택**: Next.js 16 (Turbopack), Tailwind CSS v4, Framer Motion, Supabase, Vercel
- **Supabase**: uhqfdxuemhfxhwaydcol

## 핵심 규칙

### Next.js 16 컨벤션
- **미들웨어는 `src/proxy.ts`를 사용한다** (middleware.ts 아님! Next.js 16에서 변경됨)
- export 함수명도 `proxy`여야 함
- AGENTS.md의 Next.js 가이드 참조할 것

### 디자인 톤
- 다크 테마 기반 (#070808, #0f1211, #0a0b0a, black)
- 텍스트: #E7E5DF (크림화이트)
- 액센트: `text-accent` (CSS 변수)
- 폰트: font-display (Koulen), font-mono (Roboto Mono), font-sans (Inter)
- 애니메이션: Framer Motion useScroll/useTransform 패턴
- 각 섹션: min-h-screen + scroll-linked sticky Navbar (진입 시 나타남, 벗어나면 사라짐)
- Lenis 스무스 스크롤 적용 중

### 인증 플로우
- 상담 폼 → sessionStorage 임시 저장 → /login에서 로그인/회원가입
- 인증 후 sessionStorage 데이터를 /api/contact로 전송 → /portal 이동
- /portal 접근 시 proxy.ts에서 미인증이면 /login으로 redirect

### 커밋/푸시
- 한국어 대화, 영어 커밋 메시지
- 작업 완료 후 푸시 요청이 잦으므로 빠르게 대응

### 포트폴리오 데이터 소스
- Education LMS → /Users/ralphpark/CareerConsultingPortalMain
- Local Commerce → /Users/ralphpark/plantbid_new
- 이미지: public/ 폴더 (commerce, saas, lms, local, trading)

## 현재 진행 상황
- 메인 페이지 완성 (Hero, About, Portfolio, Process, Contact)
- 인증 완성 (로그인/회원가입/비밀번호찾기/로그아웃)
- **다음 작업**: 클라이언트 포털(대시보드) 고도화 - PRD 섹션 4.4 참조
