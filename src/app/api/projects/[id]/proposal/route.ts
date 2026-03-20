import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Mistral } from "@mistralai/mistralai";

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

    const userPrompt = `아래 상담 데이터를 기반으로 프로젝트 제안서를 작성해주세요.

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

## 섹션별 작성 지침
1. **프로젝트 이해 및 분석**: 클라이언트의 비즈니스 배경을 분석하고, 프로젝트가 해결할 핵심 문제와 기대 효과를 구체적으로 서술하세요.
2. **제안 전략 및 로드맵**: MVP 우선 전략으로 1차/2차/3차 오픈 범위를 나누고, 각 단계의 목표와 포함 기능을 명시하세요.
3. **상세 개발 범위 및 기술 스택**: 요청된 기능별 상세 명세를 작성하고, 기술 스택은 '왜 이 기술이 이 프로젝트에 적합한지' 클라이언트 관점으로 설명하세요.
4. **프로젝트 일정 및 관리 방안**: 희망 일정(${project.timeline}) 내에서 기획-디자인-개발-QA-배포 단계별 소요 기간을 제시하세요.
5. **견적 및 예산**: 예산(${project.budget}) 범위 내에서 '기본형'과 '확장형' 두 가지 옵션을 제시하세요. 비용 산정 근거를 간략히 설명하세요.
6. **팀 역량 및 지원**: Studio HaeTae의 강점과 유지보수(${project.maintenance}) 계획을 구체적으로 안내하세요.

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
}`;

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      responseFormat: { type: "json_object" },
    });

    const text = response.choices?.[0]?.message?.content || "";

    let proposal;
    try {
      proposal = JSON.parse(typeof text === "string" ? text : "");
    } catch {
      const jsonMatch = typeof text === "string" ? text.match(/\{[\s\S]*\}/) : null;
      if (jsonMatch) {
        proposal = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
    }

    // Save proposal + advance step
    const updateData: Record<string, unknown> = { proposal };
    if (project.step < 1) {
      updateData.step = 1;
    }

    await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Proposal generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
