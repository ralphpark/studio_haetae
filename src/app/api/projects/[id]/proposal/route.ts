import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Mistral } from "@mistralai/mistralai";
import { appendProposalToNotion, appendDocumentsToNotion } from "@/utils/notion";

export const maxDuration = 60;

const SYSTEM_PROMPT = `당신은 'Studio HaeTae'의 시니어 프로젝트 매니저입니다.
12년간 100개 이상의 외주 프로젝트를 성공적으로 납품한 경험이 있습니다.
클라이언트가 읽었을 때 '이 팀이라면 맡겨도 되겠다'는 신뢰감을 주는 제안서를 작성합니다.

작성 원칙:
- 클라이언트의 비즈니스 목표에 초점을 맞춥니다
- 기술 용어는 반드시 쉬운 비유와 함께 설명합니다
- 구체적인 수치와 기간을 포함합니다
- 예산 범위에 맞는 현실적인 제안을 합니다
- 항상 한국어로 응답합니다
- 반드시 요청된 JSON 형식으로만 응답합니다`;

const PLANNING_SYSTEM = `당신은 Studio HaeTae의 시니어 프로젝트 매니저입니다.
12년간 100개 이상의 외주 프로젝트를 성공적으로 납품한 경험이 있습니다.
상세 기획서를 작성합니다. 반드시 한국어, JSON 형식으로만 응답하세요.`;

const ESTIMATE_SYSTEM = `당신은 Studio HaeTae의 비즈니스 매니저입니다.
투명하고 합리적인 견적서를 작성합니다. 반드시 한국어, JSON 형식으로만 응답하세요.`;

function parseAIJson(text: unknown) {
  const str = typeof text === "string" ? text : "";
  try {
    return JSON.parse(str);
  } catch {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
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

    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    const client = new Mistral({ apiKey });

    const features = Array.isArray(project.features)
      ? project.features.join(", ")
      : project.features || "";

    // ===== 1. 제안서 생성 =====
    const proposalRes = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `아래 상담 데이터를 기반으로 프로젝트 제안서를 작성해주세요.

## 상담 데이터
- 회사명: ${project.company}
- 프로젝트 유형: ${project.project_type}
- 프로젝트 목적: ${project.project_purpose}
- 타겟 사용자: ${project.target_user}
- 핵심 기능: ${features}
- 디자인 현황: ${project.design_status}
- 예산: ${project.budget}
- 희망 일정: ${project.timeline}
- 유지보수: ${project.maintenance}
${project.reference_url ? `- 레퍼런스: ${project.reference_url}` : ""}
${project.message ? `- 추가 요청: ${project.message}` : ""}

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요.
{
  "title": "프로젝트 제안서 제목 (회사명 포함)",
  "sections": [
    { "id": "analysis", "title": "프로젝트 이해 및 분석", "content": "..." },
    { "id": "strategy", "title": "제안 전략 및 로드맵", "content": "..." },
    { "id": "scope", "title": "상세 개발 범위 및 기술 스택", "content": "..." },
    { "id": "schedule", "title": "프로젝트 일정 및 관리 방안", "content": "..." },
    { "id": "budget", "title": "견적 및 예산", "content": "..." },
    { "id": "team", "title": "팀 역량 및 지원", "content": "..." }
  ]
}` },
      ],
      responseFormat: { type: "json_object" },
    });

    const proposal = parseAIJson(proposalRes.choices?.[0]?.message?.content);
    if (!proposal) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // 제안서 저장
    await supabase
      .from("projects")
      .update({ proposal, step: 1 })
      .eq("id", id)
      .eq("user_id", user.id);

    // 제안서 Notion 기록
    if (project.notion_page_id) {
      try {
        await appendProposalToNotion(project.notion_page_id, proposal);
      } catch (err) {
        console.error("[NOTION] Proposal append error:", err);
      }
    }

    // ===== 2. 기획서 생성 =====
    const proposalSummary = Array.isArray(proposal.sections)
      ? proposal.sections.map((s: { title: string; content: string }) =>
          `${String(s.title || "")}: ${String(s.content || "").substring(0, 200)}`
        ).join("\n")
      : "";

    const planningRes = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: PLANNING_SYSTEM },
        { role: "user", content: `상세 기획서를 작성해주세요.

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

## 응답 형식
{
  "title": "상세 기획서 제목",
  "sections": [
    { "title": "기능 명세", "content": "각 기능별 상세 요구사항, 화면 구성, 데이터 흐름" },
    { "title": "기술 아키텍처", "content": "시스템 구조, 기술 스택, API 설계" },
    { "title": "데이터베이스 설계", "content": "엔티티, 관계, 스키마" },
    { "title": "UI/UX 설계 방향", "content": "화면 리스트, 플로우, 반응형" },
    { "title": "개발 일정", "content": "마일스톤별 세부 일정" },
    { "title": "테스트 및 QA", "content": "테스트 범위, 방법론" }
  ]
}` },
      ],
      responseFormat: { type: "json_object" },
    });

    const planningDoc = parseAIJson(planningRes.choices?.[0]?.message?.content);

    // ===== 3. 견적서 생성 =====
    const estimateRes = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: ESTIMATE_SYSTEM },
        { role: "user", content: `견적서를 작성해주세요.

## 프로젝트 정보
- 회사명: ${project.company}
- 유형: ${project.project_type}
- 기능: ${features}
- 디자인: ${project.design_status}
- 예산: ${project.budget}
- 일정: ${project.timeline}
- 유지보수: ${project.maintenance}

## 응답 형식
{
  "title": "${project.company} 프로젝트 견적서",
  "items": [
    { "name": "항목명", "price": "금액", "note": "비고" }
  ],
  "total": "총 견적 금액"
}` },
      ],
      responseFormat: { type: "json_object" },
    });

    const estimate = parseAIJson(estimateRes.choices?.[0]?.message?.content);

    // 기획서/견적서 Supabase 저장
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

    // 기획서/견적서 Notion 기록
    if (project.notion_page_id && (planningDoc || estimate)) {
      try {
        await appendDocumentsToNotion(project.notion_page_id, {
          planningDoc,
          estimate,
        });
      } catch (err) {
        console.error("[NOTION] Docs append error:", err);
      }
    }

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Proposal generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
