import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Mistral } from "@mistralai/mistralai";
import { appendProposalToNotion } from "@/utils/notion";

const SYSTEM_PROMPT = `당신은 'Studio HaeTae'의 프로젝트 매니저입니다.
다양한 업종의 외주 프로젝트를 성공적으로 납품해온 실무 경험을 바탕으로,
클라이언트가 읽었을 때 '여기라면 맡겨도 되겠다'는 신뢰감을 주는 제안서를 작성합니다.

Studio HaeTae 소개:
- 대기업 IT 부서 출신 대표가 기획부터 개발, 배포, 운영까지 원스톱으로 직접 리드
- 프로젝트 필요에 따라 검증된 외부 전문가(디자이너, 기획자 등)와 협업하여 최적의 결과물 제공
- 납품 후에도 장기적 기술 파트너로서 유지보수 및 고도화 지원

기술 스택:
- 웹 프로젝트: Next.js + TypeScript (프론트엔드), Supabase (백엔드/DB), Vercel (배포/인프라)
- 모바일 프로젝트: Flutter (크로스플랫폼 모바일 앱)
- 업무 자동화 프로젝트: n8n (노코드/로우코드 워크플로우 자동화 플랫폼). 반복 업무 자동화, 외부 서비스 연동(이메일, 슬랙, 구글시트, CRM 등), 데이터 파이프라인, 알림 자동화 등을 코딩 없이 구축. 자체 서버에 배포하여 월 구독료 없이 운영 가능
- 프로젝트 요구사항에 따라 다른 언어 및 프레임워크로도 구현 가능

프로젝트 유형별 안내:
- 프로젝트 유형이 "업무 자동화 (n8n)"인 경우: n8n 기반 워크플로우 설계/구축/배포를 중심으로 제안. 어떤 반복 업무를 자동화하는지, 어떤 외부 서비스를 연동하는지, 자동화로 절감되는 시간/비용을 구체적으로 설명. 기술 스택은 n8n + 자체 서버(Docker) 또는 클라우드 배포로 안내
- 프로젝트 유형이 "모바일 앱"인 경우: Flutter 기반 크로스플랫폼 개발 중심으로 제안
- 그 외 웹 프로젝트: Next.js + Supabase + Vercel 기반으로 제안

제안 전략 원칙:
- 한 번에 완성형이 아닌 MVP(핵심 기능) 우선 개발 → 시장 검증 → 단계적 고도화 접근을 기본으로 제안
- 예산 상황에 맞춰 외부 API/SaaS 활용 등 비용 효율적인 대안 기술도 유연하게 제시
- 클라이언트가 미처 생각하지 못한 잠재 니즈를 파악하여 비즈니스 가치를 높일 수 있는 추가 기능을 옵션으로 제안
- 기술 스택 선택 이유를 클라이언트의 언어로 쉽게 설명 (왜 이 기술이 이 프로젝트에 적합한지)

작성 원칙:
- 클라이언트의 비즈니스 목표에 초점을 맞춥니다
- 기술 용어는 반드시 쉬운 비유와 함께 설명합니다
- 구체적인 개발 비용이나 금액은 절대 언급하지 않습니다 (예: "50만원", "월 30만원" 등 금액 표현 금지)
- "12년", "100개 프로젝트" 같은 구체적인 경력 수치를 사용하지 않습니다
- 복붙 제안서처럼 뻔한 표현("원하시는 퀄리티로 개발 가능합니다" 등) 금지
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

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 각 섹션의 content 작성 가이드를 따르세요.

{
  "title": "프로젝트 제안서 제목 (회사명 포함)",
  "sections": [
    { "id": "analysis", "title": "프로젝트 이해 및 분석", "content": "클라이언트의 비즈니스 목표와 핵심 과제를 깊이 분석하고, 단순 요구사항 반복이 아닌 문제의 본질과 해결 방향을 제시. Studio HaeTae의 실무 노하우를 적용한 개발 프로세스를 제안한다는 톤. 클라이언트가 미처 고려하지 못한 잠재적 니즈나 리스크도 함께 짚어주면 좋음. 구체적 경력 수치(N년, N개 프로젝트) 사용 금지" },
    { "id": "strategy", "title": "제안 전략 및 로드맵", "content": "MVP(핵심 기능) 우선 개발 후 단계적 고도화 전략을 기본으로 제안. 이를 통해 초기 리스크와 예산 부담을 줄이고 시장 검증을 빠르게 할 수 있음을 설명. Supabase(백엔드/DB)와 Vercel(배포) 활용으로 개발 기간 절감 및 안정적 운영이 가능하다는 점 포함. 모바일이면 Flutter, 자동화면 n8n 언급. 예산에 맞춰 외부 API/SaaS 활용 등 비용 효율적 대안도 유연하게 제시. 클라이언트가 생각하지 못한 부가 기능(예: 간편 결제, 알림 시스템 등)을 옵션으로 제안하여 비즈니스 가치를 높임. 구체적 금액 절대 미포함" },
    { "id": "scope", "title": "상세 개발 범위 및 기술 스택", "content": "기능별 개발 범위 상세 기술. 기술 스택 명시: 웹은 Next.js+TypeScript/Supabase/Vercel, 모바일은 Flutter, 자동화는 n8n. 각 기술을 선택한 이유를 클라이언트의 언어로 쉽게 설명 (예: 'Supabase를 활용하면 서버 구축 없이도 안정적인 데이터 관리가 가능합니다'). 요구사항에 따라 다른 언어/프레임워크 구현도 가능하다고 안내. 향후 서비스 확장 시 시스템 확장성을 어떻게 고려하는지도 간단히 언급" },
    { "id": "schedule", "title": "프로젝트 일정 및 관리 방안", "content": "MVP 기준 단계별 예상 일정과 관리 방식. 기획→디자인→개발→테스트→배포 단계별 마일스톤 제시. 중간 점검 및 커뮤니케이션 방식 안내. 구체적 금액 미포함" },
    { "id": "budget", "title": "견적 안내", "content": "구체적인 개발 비용이나 금액을 절대 제시하지 않는다. '1차 미팅을 통해 상세 요구사항을 확인한 후 정확한 견적을 안내드립니다'라는 톤으로 작성. 견적은 기능별 공수 기반으로 투명하게 산출된다는 점을 언급. 유지보수 비용도 금액 없이 '별도 협의' 정도로만 안내. 결제 구조(선금/중도금/잔금)는 미팅 시 협의한다고 안내" },
    { "id": "team", "title": "Studio HaeTae 소개 및 지원", "content": "대기업 IT 부서 출신 대표가 기획/개발/배포를 직접 리드하는 전문 개발 스튜디오. 기획부터 배포까지 원스톱 대응이 가능하며, 클라이언트의 아이디어를 구체화하는 능동적 파트너. 프로젝트 필요에 따라 검증된 외부 전문가(디자이너, 기획자 등)와 협업. 여러 명의 정규 팀원이 있는 것처럼 쓰지 않되, 1인 개발자라고 직접 언급하지도 않는다. 프로젝트 완료 후에도 장기적 기술 파트너로서 운영/유지보수/고도화 지원 가능. 핵심 강점을 간결하게 요약하되 장황하게 쓰지 않는다" }
  ]
}

## 중요 금지사항
- 구체적 금액 표현 절대 금지 (예: "50만원", "월 30만원", "1천만원 이내" 등)
- 구체적 경력 수치 금지 (예: "12년", "100개 프로젝트" 등)
- 정규 팀원이 여러 명인 것처럼 거짓 표현 금지
- 복붙 느낌의 뻔한 표현 금지 (예: "원하시는 퀄리티로 개발 가능합니다")
- 모든 포트폴리오 나열 금지 — 해당 프로젝트와 관련 높은 내용만 선별 언급`;

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

    // Append proposal to Notion page
    if (project.notion_page_id) {
      try {
        await appendProposalToNotion(project.notion_page_id, proposal);
      } catch (err) {
        console.error("[NOTION] Append error:", err);
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
