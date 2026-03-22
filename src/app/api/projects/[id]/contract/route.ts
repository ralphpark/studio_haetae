import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createContractNotionPage } from "@/utils/notion";

function parseAIText(text: unknown): string {
  const str = typeof text === "string" ? text : "";
  // Remove markdown code fences if present
  return str.replace(/```html\s*/g, "").replace(/```\s*/g, "").trim();
}

// GET: 계약서 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ contract: contract || null });
}

// POST: 계약서 생성 요청 (클라이언트가 "계약하기" 클릭)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify project belongs to user
  const { data: project } = await supabase
    .from("projects")
    .select("*, notion_page_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check if contract already exists
  const { data: existing } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ contract: existing });
  }

  // Create contract in "preparing" status
  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      project_id: id,
      user_id: user.id,
      status: "preparing",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Advance step to 5
  await supabase
    .from("projects")
    .update({ step: 5 })
    .eq("id", id)
    .eq("user_id", user.id);

  // Generate contract draft with AI (background, don't block response)
  generateContractDraft(project, contract.id, supabase).catch((err) =>
    console.error("[CONTRACT] Draft generation error:", err)
  );

  return NextResponse.json({ contract });
}

async function generateContractDraft(
  project: Record<string, unknown>,
  contractId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return;

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const features = Array.isArray(project.features)
    ? project.features.join(", ")
    : "";

  const estimateInfo = project.estimate
    ? JSON.stringify(project.estimate)
    : "견적 정보 없음";

  const today = new Date().toISOString().split("T")[0];

  const prompt = `당신은 Studio HaeTae의 법무 담당이자 외주 개발 계약 전문가입니다.
아래 프로젝트 정보를 기반으로 소프트웨어 개발 용역 계약서 초안을 작성해주세요.

## 계약서 형식 요구사항
- 한국어로 작성
- HTML 형식으로 작성 (순수 HTML만, <style> 태그 없이)
- 법적 효력이 있는 형식 (갑/을 구분, 조항 번호)
- h1: 계약서 제목
- h2: 각 조항 (제1조, 제2조 ...)
- 본문 텍스트는 반드시 <p> 태그로 감쌀 것 (태그 없는 텍스트 금지)
- 목록은 <ul><li> 태그 사용
- 표는 <table> 태그 사용
- 마지막에 서명란 (갑: Studio HaeTae 대표, 을: 고객)

## 작성 원칙
- 모든 조항에 반드시 3문장 이상의 구체적 내용을 포함할 것. 제목만 있는 빈 조항은 절대 불가
- 구체적 경력 수치("12년", "100개 프로젝트" 등) 사용 금지
- 모호한 표현("적절히", "합리적으로" 등) 대신 구체적 수치와 기간을 명시
- 분쟁 방지를 위해 책임 소재, 면책 조건, 기한을 명확히 기술

## 필수 조항 (총 15조)

### 제1조 (계약의 목적)
- 갑(Studio HaeTae)과 을(고객)의 소프트웨어 개발 용역 관계를 명확히 정의
- 프로젝트의 목적과 최종 산출물을 구체적으로 기술

### 제2조 (용역의 범위 및 산출물)
- 개발 기능 목록을 <ul><li>로 상세 나열
- 산출물 목록 명시: 소스코드, 설계 문서, API 문서, DB 스키마 등
- 용역 범위에 포함되는 것과 포함되지 않는 것(In/Out Scope)을 명확히 구분
- 범위 외 추가 요청은 별도 협의 및 변경 요청서(CR)를 통해 처리한다고 명시

### 제3조 (기술 스택 및 개발 환경)
- 프로젝트 유형에 따라 기술 스택을 명시:
  - 웹 프로젝트: 프론트엔드(Next.js + TypeScript), 백엔드/DB(Supabase), 배포/인프라(Vercel)
  - 모바일 프로젝트: Flutter (크로스플랫폼)
  - 업무 자동화 프로젝트: n8n (워크플로우 자동화 플랫폼), Docker 기반 자체 서버 배포. n8n을 통해 구축되는 자동화 워크플로우의 범위, 연동 서비스 목록, 트리거 조건을 명시. 자동화 워크플로우의 유지보수 및 모니터링 방안 포함
- 기술 스택 변경 시 양 당사자 서면 합의가 필요하며, 추가 비용이 발생할 수 있음을 명시
- 외부 API/서비스(결제, 소셜 로그인, 구글시트, 슬랙 등) 연동 시 해당 서비스의 장애는 갑의 책임 범위가 아님을 명시

### 제4조 (계약 금액 및 지급 조건)
- 견적서 기반 총 계약 금액을 명시
- 대금 지급 구조를 <table>로 표시: 계약금 40%(계약 체결 시), 중도금 30%(개발 50% 완료 시점), 잔금 30%(검수 완료 후 7일 이내)
- 지급은 산출물 기준으로 하며, 각 단계의 산출물을 명시
- 지급 지연 시 연 이자율(연 5%) 적용

### 제5조 (개발 일정)
- 을의 희망 일정(${project.timeline})을 기준으로 단계별 일정 초안을 <table>로 작성
- 테이블 컬럼: 단계, 기간, 주요 산출물
- 단계 구분: 기획·설계 → 디자인 → 프론트엔드 개발 → 백엔드 개발 → 테스트·QA → 배포·안정화
- 각 단계의 시작일과 종료일을 구체적 날짜(YYYY년 MM월 DD일)로 기재
- 착수일은 계약 체결일(${today})로부터 7일 이내로 설정
- 완료 예정일은 을의 희망 일정을 기준으로 산정
- <p> 태그로 다음 내용 추가: "상기 일정은 1차 미팅을 통해 확정되며, 양 당사자의 합의 하에 변경될 수 있다"
- 갑의 귀책 사유로 인한 지연 시 을에게 즉시 통보하고 일정을 재조정
- 을의 피드백/자료 제공 지연으로 인한 일정 지연은 갑의 책임이 아님을 명시

### 제6조 (변경 관리)
- 요구사항 변경은 반드시 서면(변경 요청서, CR)으로 접수
- 구두 요청은 공식 변경으로 인정하지 않음
- 변경 요청 시 갑은 추가 공수와 비용, 일정 영향을 산정하여 을에게 안내
- 을이 승인한 변경만 반영하며, 추가 비용은 별도 청구

### 제7조 (검수 및 인수)
- 갑은 개발 완료 후 을에게 결과물을 인도하고, 을은 인도일로부터 7영업일 이내 검수 완료
- 검수 기준은 사전 합의된 기능 명세서 및 인수 기준(Acceptance Criteria)에 따름
- 검수 기간 내 을이 서면 이의를 제기하지 않으면 검수 완료로 간주
- 검수 불합격 시 갑은 합리적 기간 내 보수하고 재검수 요청

### 제8조 (하자 보수)
- 검수 완료일로부터 3개월간 무상 하자 보수 제공
- 하자의 범위: 기능 명세서에 정의된 기능이 정상 작동하지 않는 경우
- 다음은 하자 보수 범위에 포함되지 않음:
  (1) 을이 제공한 정보의 오류로 인한 문제
  (2) 외부 API(결제, 소셜 로그인 등) 서비스의 장애
  (3) 을이 임의로 소스코드를 수정하여 발생한 문제
  (4) 계약 범위 외의 기능 추가/변경 요청
- 무상 하자 보수 기간 종료 후 유지보수는 별도 계약으로 진행

### 제9조 (지식재산권)
- 갑이 본 프로젝트를 위해 새로 개발한 결과물(소스코드, 디자인, 문서 등)의 지식재산권은 잔금 지급 완료 시 을에게 이전
- 갑이 기존에 보유한 기술, 라이브러리, 프레임워크의 지식재산권은 갑에게 귀속
- 오픈소스 라이선스가 적용된 부분은 해당 라이선스 조건을 따름
- 을은 갑의 사전 서면 동의 없이 결과물을 제3자에게 재판매하거나 재배포할 수 없음

### 제10조 (비밀유지)
- 갑과 을은 계약 이행 과정에서 취득한 상대방의 기술 정보, 영업 정보, 개인 정보 등을 비밀로 유지
- 비밀유지 의무는 계약 종료 후 3년간 존속
- 비밀정보의 범위: 서면, 구두, 전자적 형태를 포함한 모든 형태의 정보
- 법원 명령 등 법률에 의한 공개 요구 시 예외로 하되, 사전에 상대방에게 통보

### 제11조 (커뮤니케이션 및 프로젝트 관리)
- 프로젝트 진행 중 공식 소통 채널(Discord 전용 채널)을 통해 소통
- 갑은 주 1회 이상 진행 현황을 을에게 보고
- 을은 갑의 확인 요청에 대해 3영업일 이내 피드백을 제공
- 을의 피드백 지연으로 인한 일정 지연은 갑의 책임이 아님

### 제12조 (계약 해지)
- 다음 사유 발생 시 서면 통지 후 본 계약을 해지할 수 있음:
  (1) 상대방이 중요 조항을 위반하고 시정 요구 후 15일 이내 시정하지 않는 경우
  (2) 상대방이 파산, 회생절차 개시 등으로 계약 이행이 불가능한 경우
  (3) 갑의 귀책으로 완료 예정일로부터 30일 이상 지연되는 경우
  (4) 을의 대금 미지급이 30일 이상 지속되는 경우
- 해지 시 정산: 갑은 기성고에 따른 개발 비용을 산정하여 정산하며, 을은 이미 지급한 금액 중 기성고를 초과하는 금액을 반환받음
- 해지 책임이 있는 당사자는 상대방에게 발생한 직접 손해를 배상

### 제13조 (손해배상 및 지체 상금)
- 갑 또는 을의 귀책 사유로 상대방에게 손해가 발생한 경우 직접 손해에 한하여 배상
- 손해배상 한도는 총 계약 금액을 초과하지 않음
- 갑의 귀책 사유로 납기가 지연될 경우, 지연일수 x 계약 금액의 0.1%를 지체 상금으로 을에게 지급 (상한: 계약 금액의 10%)
- 간접 손해, 기대 이익 상실, 징벌적 손해는 배상 범위에 포함되지 않음
- 천재지변, 정부의 규제, 전쟁 등 불가항력 사유로 인한 손해는 면책

### 제14조 (일반 조항)
- 본 계약에 명시되지 않은 사항은 관련 법령 및 상관례에 따름
- 본 계약과 관련된 분쟁은 서울중앙지방법원을 관할 법원으로 함
- 본 계약은 갑과 을이 서명한 날부터 효력이 발생함
- 본 계약서는 2부를 작성하여 갑과 을이 각 1부씩 보관

### 제15조 (서명란)
- 갑/을 정보를 <table>로 표시 (구분, 상호, 대표/담당자, 사업자번호/이메일, 서명, 날짜)

## 프로젝트 정보
- 회사명: ${project.company}
- 프로젝트명: ${project.project_name || ""}
- 유형: ${project.project_type}
- 목적: ${project.project_purpose}
- 핵심 기능: ${features}
- 예산: ${project.budget}
- 일정: ${project.timeline}
- 유지보수: ${project.maintenance}
- 견적: ${estimateInfo}
- 계약 날짜: ${today}

## 갑 정보
- 상호: Studio HaeTae
- 대표: 박근수
- 사업자등록번호: 620-180707-491

## 을 정보
- 상호: ${project.company}
- 담당자: ${project.name}
- 이메일: ${project.email}

중요: <!DOCTYPE>, <html>, <head>, <body> 태그 없이 콘텐츠 HTML만 반환하세요.
<h1>으로 시작해서 바로 본문 내용만 작성하세요. 다른 텍스트 없이 HTML만 반환하세요.
모든 본문 텍스트는 반드시 <p> 태그로 감싸세요. 태그 없이 직접 쓰인 텍스트가 있으면 안 됩니다.`;

  const response = await model.generateContent(prompt);
  const contractHtml = parseAIText(response.response.text());

  if (!contractHtml) return;

  // Save draft to contract
  await supabase
    .from("contracts")
    .update({ contract_html: contractHtml })
    .eq("id", contractId);

  // Create Notion page
  const notionPageId = project.notion_page_id as string | null;
  if (notionPageId) {
    try {
      await createContractNotionPage(notionPageId, contractHtml, project.company as string);
    } catch (err) {
      console.error("[NOTION] Contract page creation error:", err);
    }
  }
}
