# 위시캣 지원서 - 법률사무소 홈페이지 개발

---

## 프로젝트 진행 제안

Studio HaeTae | 12년 대기업 연구원 출신, 현재 스타트업 CTO 재직중

Next.js App Router 기반 자체 개발을 제안드립니다. 워드프레스 대비 페이지 로딩 속도, SEO 제어력, 커스텀 예약 시스템 구현에서 압도적으로 유리하며, Vercel 배포로 글로벌 CDN + 자동 SSL + 무중단 배포까지 확보됩니다.

**1단계 (1~2주): 기반 구축**
- Figma 디자인 분석 및 컴포넌트 구조 설계
- DB 스키마 설계 (변호사, 예약, 게시판, 회원)
- Supabase 프로젝트 세팅 (Auth, DB, Storage)
- SEO 기본 구조 설계 (메타태그, sitemap, robots.txt)

**2단계 (3~5주): 핵심 개발**
- Figma → 반응형 프론트엔드 퍼블리싱 (PC/모바일/태블릿)
- 상담 예약 시스템 (실시간 예약 + 관리자 승인 프로세스)
- SMS/이메일 알림 자동 발송 (예약 신청·확정·변경·취소)
- 법률 정보 게시판 CMS + 변호사 프로필 관리
- 관리자 대시보드 (예약 현황, 문의 건수, 콘텐츠 관리)

**3단계 (6~7주): SEO + 안정화**
- Schema 마크업 적용 (LegalService, Attorney, FAQ, Article)
- AEO 최적화 (FAQ 구조화 데이터, 질문-답변 스키마)
- GEO 최적화 (LocalBusiness 스키마, 네이버 지도 연동, 지역 키워드)
- Core Web Vitals 최적화 (LCP, FID, CLS)
- 크로스 브라우저/디바이스 QA

**4단계 (8주): 납품**
- 소스 코드 + ERD + API 명세서 + SEO 가이드 납품
- 관리자 사용 매뉴얼 및 교육

---

## 유사 프로젝트 진행 경험

**1. Studio HaeTae 에이전시 홈페이지 (haetae.studio)**
Next.js App Router + Supabase 기반 반응형 웹사이트를 직접 설계·개발·운영 중입니다. 상담 예약 폼, 로그인/회원가입, 클라이언트 포털까지 본 프로젝트와 동일한 구조이며, Vercel 배포로 Core Web Vitals 최적화를 달성했습니다.

**2. 한양대학교 취업상담 포털 (예약 시스템 + 관리자 대시보드)**
변호사별 상담 예약과 유사한 상담사별 예약 시스템을 구축했습니다. 실시간 예약, 관리자 승인/반려, 예약 변경/취소, FullCalendar 연동, WebSocket 알림까지 본 프로젝트의 예약 시스템 요건을 이미 구현한 경험입니다.

**3. 퍼포먼스 마케팅 SaaS (콘텐츠 관리 + SEO)**
게시판형 콘텐츠 관리 시스템과 메타태그/OG태그 동적 생성, Schema 마크업 적용 경험이 있습니다.

---

## 사용 기술과 툴

**프론트엔드**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Framer Motion
→ SSR/SSG로 SEO 완벽 대응. Figma 디자인을 픽셀 퍼펙트로 구현. 반응형 + 애니메이션.

**백엔드/DB**: Supabase (PostgreSQL + Auth + Edge Functions + Storage)
→ 예약 시스템, 회원 관리, CMS, 이미지 저장을 통합 제공. RLS(Row Level Security)로 개인정보 보호.

**SMS/이메일**: NHN Cloud SMS API + Resend(이메일)
→ 예약 신청·확정·변경·취소 시 자동 발송.

**SEO**: next-sitemap, Schema.org 구조화 데이터, 메타태그 동적 생성
→ LegalService, Attorney, FAQPage, Article 스키마 적용. 관리자 페이지에서 메타태그 직접 편집 가능.

**배포**: Vercel (글로벌 CDN + 자동 SSL + 무중단 배포)

**커뮤니케이션**: Slack 또는 카카오톡 + Notion + GitHub

---

## 관련 포트폴리오 설명 (2000자)

**1. Studio HaeTae 에이전시 홈페이지 (haetae.studio)**

현재 운영 중인 자체 에이전시 웹사이트로, 본 프로젝트와 기술 스택 및 기능 구조가 거의 동일합니다. Next.js App Router + Tailwind CSS v4 + Framer Motion으로 개발했으며, Supabase를 백엔드로 활용하고 Vercel에 배포하여 운영 중입니다.

다크 테마 기반의 프리미엄 디자인을 Figma에서 직접 설계하고 코드로 구현했으며, Hero, About, Portfolio, Process, Contact 섹션으로 구성된 원페이지 랜딩에 스크롤 기반 인터랙션(useScroll/useTransform), 스무스 스크롤(Lenis), 섹션 진입 시 나타나는 Sticky Navbar 등 몰입감 있는 UX를 적용했습니다. PC/모바일/태블릿 완전 반응형이며, Core Web Vitals(LCP, FID, CLS) 최적화를 달성했습니다.

상담 문의 폼 → sessionStorage 임시 저장 → 로그인/회원가입 → 인증 후 자동 전송 → 클라이언트 포털 이동이라는 상담 접수 플로우를 구현했으며, 이는 본 프로젝트의 상담 예약 신청 → 관리자 확인 → 예약 확정 플로우와 구조적으로 동일합니다. Supabase Auth 기반 인증(로그인/회원가입/비밀번호 찾기)과 미들웨어를 통한 미인증 사용자 리다이렉트도 구현되어 있습니다.

**2. 한양대학교 취업상담 포털 (예약 시스템 + CRM 대시보드)**

본 프로젝트의 핵심 기능인 상담 예약 시스템을 이미 구현한 프로젝트입니다. 900명+ 학생이 상담사별 가능 시간을 확인하고 실시간 예약하는 시스템으로, 법률사무소의 변호사별 상담 예약과 완전히 동일한 구조입니다.

관리자(코디네이터)가 예약 현황을 캘린더 및 리스트 형태로 조회하고, 승인/반려 상태를 변경하는 관리자 대시보드를 구축했습니다. 예약 신청·확정·변경·취소 시 WebSocket 기반 실시간 알림이 발송되며, 48시간 전 취소 규칙 등 복잡한 비즈니스 로직을 PostgreSQL 트랜잭션으로 처리하여 동시 예약 충돌을 방지했습니다. FullCalendar 연동으로 직관적인 일정 관리 UI를 제공하고, Zoom 화상상담 링크 자동 생성까지 통합했습니다.

관리자 대시보드에서는 일일 예약 현황, 월별 상담유형 통계, 상담사별 실적, 설문 응답 분석 등 다차원 데이터를 시각화하여 의사결정을 지원합니다. 본 프로젝트에서 요구하는 대시보드(일일 예약 현황, 신규 문의 건수 요약)와 예약 관리(캘린더/리스트 조회, 상태 변경) 기능을 이미 검증된 형태로 구현한 경험입니다.

**3. SEO/AEO/GEO 실무 적용 경험**

Studio HaeTae 웹사이트에 Technical SEO를 직접 적용하여 운영하고 있습니다. Next.js의 generateMetadata를 활용한 페이지별 동적 메타태그·OG태그 생성, next-sitemap을 통한 자동 사이트맵 관리, robots.txt 최적화를 구현했습니다. Schema.org 구조화 데이터(Organization, WebSite, Service) 마크업을 적용하여 검색엔진의 콘텐츠 이해도를 높였으며, 이미지 최적화(next/image + WebP), 폰트 최적화(next/font), 코드 스플리팅 등으로 Core Web Vitals를 최적화했습니다. 본 프로젝트에서는 LegalService, Attorney, FAQPage, Article 등 법률 분야 특화 스키마를 추가 적용하고, LocalBusiness 스키마와 네이버 지도 연동으로 지역 검색 최적화(GEO)까지 완벽하게 구현하겠습니다.
