import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Mistral } from "@mistralai/mistralai";
import { appendDocumentsToNotion } from "@/utils/notion";

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

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project || !project.proposal) {
      return NextResponse.json({ error: "Project or proposal not found" }, { status: 404 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });
    }

    const client = new Mistral({ apiKey });
    const features = Array.isArray(project.features) ? project.features.join(", ") : "";

    const proposalSummary = Array.isArray(project.proposal.sections)
      ? project.proposal.sections
          .map((s: { title: string; content: string }) =>
            `${String(s.title || "")}: ${String(s.content || "").substring(0, 150)}`
          ).join("\n")
      : "";

    // 한 번의 AI 호출로 기획서 + 견적서 동시 생성 (타임아웃 방지)
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `당신은 Studio HaeTae의 시니어 PM이자 비즈니스 매니저입니다. 상세 기획서와 견적서를 한 번에 작성합니다. 반드시 한국어, 요청된 JSON 형식으로만 응답하세요.`,
        },
        {
          role: "user",
          content: `아래 프로젝트의 상세 기획서와 견적서를 작성해주세요.

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

## 응답 형식 (반드시 이 JSON 구조로)
{
  "planningDoc": {
    "title": "상세 기획서 제목",
    "sections": [
      { "title": "기능 명세", "content": "각 기능별 상세 요구사항" },
      { "title": "기술 아키텍처", "content": "시스템 구조, 기술 스택" },
      { "title": "데이터베이스 설계", "content": "엔티티, 관계" },
      { "title": "UI/UX 설계 방향", "content": "화면 리스트, 플로우" },
      { "title": "개발 일정", "content": "마일스톤별 일정" },
      { "title": "테스트 및 QA", "content": "테스트 계획" }
    ]
  },
  "estimate": {
    "title": "${project.company} 프로젝트 견적서",
    "items": [
      { "name": "항목명", "price": "금액", "note": "비고" }
    ],
    "total": "총 견적 금액"
  }
}`,
        },
      ],
      responseFormat: { type: "json_object" },
    });

    const result = parseAIJson(response.choices?.[0]?.message?.content);

    if (!result) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const planningDoc = result.planningDoc || null;
    const estimate = result.estimate || null;

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
