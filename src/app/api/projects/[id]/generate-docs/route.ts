import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { appendDocumentsToNotion } from "@/utils/notion";

function parseAIJson(text: unknown) {
  const str = typeof text === "string" ? text : "";
  // Remove markdown code fences if present
  const cleaned = str.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
}

// content가 object면 문자열로 변환
function ensureString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project || !project.proposal) {
      return NextResponse.json({ error: "Project or proposal not found" }, { status: 404 });
    }

    // 이미 생성된 경우 중복 생성 방지
    if (project.planning_doc && project.estimate) {
      return NextResponse.json({ success: true, message: "Already generated" });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const features = Array.isArray(project.features) ? project.features.join(", ") : "";

    const proposalSummary = Array.isArray(project.proposal.sections)
      ? project.proposal.sections
          .map((s: { title: string; content: string }) =>
            `${ensureString(s.title)}: ${ensureString(s.content).substring(0, 150)}`
          ).join("\n")
      : "";

    const prompt = `당신은 Studio HaeTae의 프로젝트 매니저이자 풀스택 아키텍트입니다.
아래 프로젝트의 **상세 기획서**와 **견적서**를 작성해주세요.
반드시 한국어로, 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 반환하세요.
각 content 필드는 반드시 문자열(string)이어야 합니다.

## Studio HaeTae 기술 스택
- 웹: Next.js + TypeScript (프론트엔드), Supabase (백엔드/DB/인증), Vercel (배포/인프라)
- 모바일: Flutter (크로스플랫폼)
- 자동화: n8n (워크플로우 자동화)
- 요구사항에 따라 다른 언어/프레임워크도 구현 가능

## 프로젝트 정보
- 회사명: ${project.company}
- 유형: ${project.project_type}
- 목적: ${project.project_purpose}
- 타겟: ${project.target_user}
- 기능: ${features}
- 디자인: ${project.design_status}
- 예산: ${project.budget}
- 일정: ${project.timeline}
- 유지보수: ${project.maintenance}

## 제안서 요약
${proposalSummary}

## 상세 기획서 작성 원칙
1. **기능 명세는 최대한 세분화**: 각 기능을 하위 작업으로 분해 (예: '회원가입' → 폼 입력, 이메일 중복 확인, 비밀번호 암호화, DB 저장, 인증 이메일 발송). 각 기능별로 다음을 모두 기술:
   - 정상 흐름(Main Flow): 단계별 상세 동작
   - 대안 흐름(Alternative Flow): 정상 흐름에서 분기되는 케이스
   - 예외 흐름(Exception Flow): 에러/실패 시 처리
   - 입력 조건 및 유효성 검증 규칙, 출력 결과
   - 우선순위: MVP 필수(Must) / 권장(Should) / 옵션(Could)으로 분류
   - 인수 기준(Acceptance Criteria): 테스트 가능한 조건으로 명시
2. **비기능 요구사항 반드시 포함**: 성능(목표 응답 시간, 동시접속 처리), 보안(개인정보 암호화, 인증 토큰, XSS/CSRF 방어), 접근성(반응형, 웹 접근성 기준), SEO, 호환성(지원 브라우저/디바이스)
3. **데이터 모델은 테이블/엔티티 단위로 기술**: 주요 엔티티, 핵심 필드와 데이터 타입, 관계(1:N, N:M), 인덱스 전략, 예상 데이터량
4. **화면 흐름도 포함**: 주요 사용자 시나리오별 화면 이동 흐름과 조건부 분기(로그인 여부, 권한별 등). 각 화면의 핵심 구성 요소, 데이터 노출 조건, 빈 상태/에러 상태 처리
5. **API 설계 포함**: 주요 엔드포인트 목록, HTTP 메서드, URL 패턴, 요청/응답 데이터 구조, 인증 방식, 에러 응답 구조
6. **일정은 WBS 기반**: 기획/디자인/개발/테스트/배포 단계별 산출. 분석·설계, 실제 개발, 테스트, 버그 수정, 배포 설정, 커뮤니케이션 시간 모두 포함. 각 마일스톤 종료 시 클라이언트 리뷰 기간 반영. 버퍼 시간(1.2~1.5배) 반영
7. **변경 관리 절차 포함**: 요구사항 변경(Scope Creep) 발생 시 일정/비용 재산정 프로세스 안내
8. **커뮤니케이션 계획 포함**: 진행 보고 주기, 사용 도구(Discord 등), 피드백 반영 방식
9. **구체적 경력 수치 사용 금지**: "12년", "100개 프로젝트" 등 금지
10. **구체적 금액 사용 금지**: 원화 금액 표현 절대 금지

## 견적서 작성 원칙
- 클라이언트가 요청한 기능만 견적 항목에 포함. 요청하지 않은 기능은 넣지 않는다
- 아래 기능별 단가 기준표를 참조하여 공수와 금액을 산정
- price 필드에 금액(원), hours 필드에 예상 공수(시간)를 기재
- note 필드에 해당 항목의 작업 범위를 상세히 기술
- total에는 모든 항목의 price 합산 금액을 기재

## 기능별 단가 기준표 (1시간 = 1h, 1MD = 8h)
시간당 단가: 하/중 난이도 40,000원, 상 난이도 45,000원

### 회원/계정 관리
- 회원가입(이메일/비밀번호): 20h, 하, 800,000원
- SNS 간편 로그인(카카오/네이버/구글): 24h, 중, 1,008,000원
- 비밀번호 찾기/변경: 16h, 중, 640,000원
- 이메일 인증: 8h, 중, 320,000원
- 회원 탈퇴 처리: 8h, 하, 320,000원
- 마이페이지: 24h, 중, 960,000원

### 게시판/컨텐츠
- 게시판 CRUD: 32h, 중, 1,280,000원
- 댓글(대댓글 포함): 16h, 중, 640,000원
- 좋아요/북마크: 16h, 하, 640,000원
- 검색 기능: 20h, 중, 800,000원
- 필터링: 16h, 중, 640,000원
- 무한스크롤/페이지네이션: 4h, 중, 160,000원

### 채팅/알림
- 실시간 1:1 채팅(Socket): 40h, 상, 1,800,000원
- 그룹 채팅: 48h, 상, 2,160,000원
- 푸시 알림(Firebase): 8h, 중, 320,000원
- 웹 알림(웹푸시): 8h, 중, 320,000원

### 결제/정산
- 결제 연동(PG사): 24h, 상, 1,080,000원
- 정기결제(구독): 16h, 상, 720,000원
- 결제 취소/환불: 16h, 중, 640,000원
- 현금영수증/세금계산서: 16h, 중, 640,000원

### 관리자 페이지
- 관리자 로그인: 16h, 하, 640,000원
- 사용자 관리: 24h, 중, 960,000원
- 통계 대시보드: 20h, 상, 900,000원
- 게시물 관리: 16h, 중, 640,000원
- 신고/문의 처리: 16h, 중, 640,000원

### API/외부 서비스
- REST API 설계(Swagger): 10h, 중, 400,000원
- 외부 API 연동: 8h, 중, 320,000원
- OAuth 인증: 8h, 중, 320,000원

### 기타
- 반응형 UI/웹: 48h, 중, 1,920,000원
- SEO 최적화: 16h, 중, 640,000원
- 다국어 지원(i18n): 24h, 중, 960,000원

### 예약/스케줄링
- 예약 기능(달력 UI): 12h, 중, 480,000원
- 예약 변경/취소: 8h, 중, 320,000원
- 예약 알림: 8h, 중, 320,000원

위 기준표에 없는 기능은 난이도와 유사 기능을 참고하여 합리적으로 산정한다.

## 응답 형식 (JSON만 반환)
{
  "planningDoc": {
    "title": "상세 기획서 제목",
    "sections": [
      { "title": "프로젝트 개요 및 목표", "content": "프로젝트의 배경, 핵심 목표, 타겟 사용자 정의, 성공 지표(KPI)를 기술" },
      { "title": "기능 명세", "content": "각 기능을 하위 작업으로 세분화하여 기술. 기능별로 정상 흐름(단계별 동작), 대안 흐름(분기 케이스), 예외 흐름(에러 처리)을 모두 포함. 입력 조건과 유효성 검증 규칙, 출력 결과 명시. 우선순위를 MVP 필수(Must)/권장(Should)/옵션(Could)으로 분류. 각 기능의 인수 기준(Acceptance Criteria)을 테스트 가능한 형태로 기술" },
      { "title": "화면 흐름 및 UI/UX 설계", "content": "주요 사용자 시나리오별 화면 이동 흐름과 조건부 분기(로그인 여부, 권한별 등). 각 화면의 핵심 구성 요소(헤더, 폼, 리스트, 버튼 등)와 데이터 노출 조건. 각 화면의 4가지 상태(로딩/빈 상태/에러/데이터 있음) 처리 방안. 반응형 대응(모바일/태블릿/데스크톱)" },
      { "title": "기술 아키텍처", "content": "프론트엔드/백엔드/DB/인프라 구조. 프로젝트 유형에 맞는 기술 스택과 선택 이유를 쉬운 비유와 함께 설명. 외부 서비스 연동(결제, 이메일, 소셜 로그인 등) 포함" },
      { "title": "데이터베이스 설계", "content": "주요 엔티티(테이블)별 핵심 필드와 데이터 타입, 엔티티 간 관계(1:N, N:M), 인덱스 전략, 예상 데이터량과 확장 고려사항 기술" },
      { "title": "API 설계", "content": "주요 API 엔드포인트 목록. 각 API의 HTTP 메서드, URL 패턴, 요청/응답 데이터 구조, 인증 방식을 기술" },
      { "title": "비기능 요구사항", "content": "성능(목표 응답 시간, 동시접속 처리), 보안(인증/인가, 데이터 암호화, OWASP 대응), 접근성(반응형, 웹 접근성 기준), SEO, 모니터링/로깅 방안" },
      { "title": "개발 일정 (WBS)", "content": "WBS 기반 단계별 일정: 기획·설계 → 디자인 → 개발(프론트/백엔드) → 테스트·QA → 배포·안정화. 각 단계의 예상 소요 기간과 마일스톤. 버퍼 시간 반영" },
      { "title": "테스트 및 QA 전략", "content": "테스트 범위(기능/통합/성능/보안), 테스트 환경, QA 프로세스, 버그 리포팅 방식, 검수 기준 및 인수 절차" },
      { "title": "변경 관리 및 커뮤니케이션", "content": "요구사항 변경(Scope Creep) 발생 시 변경 요청(CR) 절차와 일정/비용 재산정 프로세스. 진행 보고 주기와 방식(Discord 채널, 주간 리포트 등). 피드백 반영 프로세스와 응답 기준 시간" },
      { "title": "운영 및 유지보수 계획", "content": "배포 후 모니터링 체계, 장애 대응 프로세스, 유지보수 범위와 하자보수 기간. 서비스 고도화 로드맵. 구체적 금액 미포함, 별도 협의 안내" }
    ]
  },
  "estimate": {
    "title": "${project.company} 프로젝트 견적서",
    "items": [
      { "name": "항목명", "hours": "예상 공수(시간)", "price": "금액(원)", "note": "작업 범위 상세 기술" }
    ],
    "total": "항목별 price 합산 금액 (원)"
  }
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const result = parseAIJson(text);

    if (!result) {
      console.error("[GENERATE-DOCS] Failed to parse:", text?.substring(0, 500));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // content가 객체인 경우 문자열로 변환
    const planningDoc = result.planningDoc || null;
    if (planningDoc?.sections) {
      for (const section of planningDoc.sections) {
        section.title = ensureString(section.title);
        section.content = ensureString(section.content);
      }
    }

    const estimate = result.estimate || null;
    if (estimate?.items) {
      for (const item of estimate.items) {
        item.name = ensureString(item.name);
        item.hours = ensureString(item.hours);
        item.price = ensureString(item.price);
        item.note = ensureString(item.note);
      }
      estimate.total = ensureString(estimate.total);
    }

    // Supabase 저장
    await supabase
      .from("projects")
      .update({
        planning_doc: planningDoc,
        estimate: estimate,
        step: 2,
        status: "기획서 초안 생성 완료",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    // Notion에 기록
    if (project.notion_page_id && (planningDoc || estimate)) {
      try {
        await appendDocumentsToNotion(project.notion_page_id, { planningDoc, estimate });
      } catch (err) {
        console.error("[NOTION] Docs append error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Generate docs error:", error);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
