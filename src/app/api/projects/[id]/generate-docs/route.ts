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

    const prompt = `당신은 Studio HaeTae의 시니어 PM이자 비즈니스 매니저입니다.
아래 프로젝트의 상세 기획서와 견적서를 작성해주세요.
반드시 한국어로, 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 반환하세요.
각 content 필드는 반드시 문자열(string)이어야 합니다.

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

## 응답 형식 (JSON만 반환)
{
  "planningDoc": {
    "title": "상세 기획서 제목",
    "sections": [
      { "title": "기능 명세", "content": "문자열로 된 상세 내용" },
      { "title": "기술 아키텍처", "content": "문자열로 된 상세 내용" },
      { "title": "데이터베이스 설계", "content": "문자열로 된 상세 내용" },
      { "title": "UI/UX 설계 방향", "content": "문자열로 된 상세 내용" },
      { "title": "개발 일정", "content": "문자열로 된 상세 내용" },
      { "title": "테스트 및 QA", "content": "문자열로 된 상세 내용" }
    ]
  },
  "estimate": {
    "title": "${project.company} 프로젝트 견적서",
    "items": [
      { "name": "항목명", "price": "금액", "note": "비고" }
    ],
    "total": "총 견적 금액"
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
