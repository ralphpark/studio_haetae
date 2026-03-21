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

  const prompt = `당신은 Studio HaeTae의 법무 담당입니다.
아래 프로젝트 정보를 기반으로 소프트웨어 개발 용역 계약서 초안을 작성해주세요.

## 계약서 요구사항
- 한국어로 작성
- HTML 형식으로 작성 (순수 HTML만, <style> 태그 없이)
- 법적 효력이 있는 형식 (갑/을 구분, 조항 번호)
- h1: 계약서 제목
- h2: 각 조항 (제1조, 제2조 ...)
- table: 견적 내역 포함
- 마지막에 서명란 (갑: Studio HaeTae 대표, 을: 고객)

## 필수 조항 (모든 조항에 반드시 2문장 이상의 구체적 내용을 포함할 것. 제목만 있는 빈 조항은 절대 불가)
1. 계약 목적 - 갑과 을의 용역 관계, 프로젝트 목적을 구체적으로 기술
2. 용역 범위 - 기능 목록을 <ul><li> 태그로 나열
3. 계약 금액 및 지급 조건 - 견적서 기반 총 금액, 계약금 40% / 중도금 30% / 잔금 30%, 지급 시기를 <table>로 표시
4. 개발 일정 - 착수일, 완료 예정일, 중간 점검 일정 등 구체적 기술
5. 검수 및 인수 - 검수 기간(7일), 하자 보수, 인수 절차를 구체적으로 기술
6. 지식재산권 - 개발 결과물의 소유권, 기존 기술 라이선스, 소스코드 귀속 등 구체적으로 기술
7. 비밀유지 - 비밀 범위, 유지 기간, 위반 시 책임을 구체적으로 기술
8. 계약 해지 - 해지 사유, 해지 절차, 해지 시 정산 방법을 구체적으로 기술
9. 손해배상 - 귀책사유, 배상 범위, 면책 조건을 구체적으로 기술
10. 기타 - 분쟁 해결 방법, 관할 법원, 계약서 효력 발생일 등을 구체적으로 기술
11. 서명란 - 갑/을 정보 <table>로 표시 (상호, 대표/담당자, 사업자번호/이메일, 서명란, 날짜)

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
<h1>으로 시작해서 바로 본문 내용만 작성하세요. 다른 텍스트 없이 HTML만 반환하세요.`;

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
