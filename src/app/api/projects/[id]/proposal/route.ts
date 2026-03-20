import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

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

    // Fetch project data
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const features = Array.isArray(project.features)
      ? project.features.join(", ")
      : project.features || "";

    const prompt = `당신은 외주 개발 프로젝트 기획 전문가입니다. 아래 상담 데이터를 기반으로 클라이언트에게 제안할 프로젝트 기획서를 작성해주세요.

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

## 기획서 작성 규칙
1. 반드시 아래 JSON 형식으로만 응답해주세요 (마크다운이나 코드블록 없이 순수 JSON만).
2. 각 섹션의 content는 전문적이면서도 클라이언트가 이해하기 쉬운 언어로 작성하세요.
3. 기술 용어는 꼭 필요한 경우에만 사용하고, 비유나 쉬운 설명을 함께 제공하세요.
4. 구체적인 수치, 기간, 기능 목록을 포함하세요.

## JSON 응답 형식
{
  "title": "프로젝트 제안서 제목",
  "sections": [
    {
      "id": "analysis",
      "title": "프로젝트 이해 및 분석",
      "content": "프로젝트 배경, 목표, 해결할 문제점, 솔루션 방향을 서술"
    },
    {
      "id": "strategy",
      "title": "제안 전략 및 로드맵",
      "content": "MVP 범위 정의, 단계별 개발 로드맵, 차별화 포인트를 서술"
    },
    {
      "id": "scope",
      "title": "상세 개발 범위 및 기술 스택",
      "content": "기능별 상세 명세, 추천 기술 스택과 선정 이유, 아키텍처 개요를 서술"
    },
    {
      "id": "schedule",
      "title": "프로젝트 일정 및 관리 방안",
      "content": "단계별 일정(기획-디자인-개발-QA-배포), 커뮤니케이션 방법, 위험 관리를 서술"
    },
    {
      "id": "budget",
      "title": "견적 및 예산",
      "content": "예산 범위 내 비용 산정 근거, 대금 결제 조건, 예산 옵션을 서술"
    },
    {
      "id": "team",
      "title": "팀 역량 및 지원",
      "content": "Studio HaeTae의 강점, 유지보수 계획, 사후 지원 방안을 서술"
    }
  ]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let proposal;
    try {
      proposal = JSON.parse(text);
    } catch {
      // Try extracting JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        proposal = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
    }

    // Save to database
    const { error: updateError } = await supabase
      .from("projects")
      .update({ proposal })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
