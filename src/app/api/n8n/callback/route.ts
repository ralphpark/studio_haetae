import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * n8n 콜백 API
 *
 * 2가지 용도:
 * 1. type="docs-ready": Notion에서 Ralph가 수정 완료 → 홈페이지에 기획서/견적서 반영 + 미팅 예약 활성화
 * 2. type="docs-generated": n8n이 AI 기획서/견적서 생성 완료 알림 (Supabase에 초안 저장)
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-n8n-secret");
    const expectedSecret = process.env.N8N_CALLBACK_SECRET;

    if (expectedSecret && authHeader !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { type, projectId } = data;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });
    }

    const supabase = createAdminClient(supabaseUrl, supabaseKey);

    if (type === "docs-generated") {
      // n8n이 AI로 기획서/견적서 초안 생성 완료 → Supabase에 저장 (Notion에도 이미 기록됨)
      const { planningDoc, estimate } = data;

      const { error } = await supabase
        .from("projects")
        .update({
          planning_doc: planningDoc || null,
          estimate: estimate || null,
          step: 2,
          status: "기획서 초안 생성 (Notion 수정 대기)",
        })
        .eq("id", projectId);

      if (error) {
        console.error("[N8N Callback] docs-generated error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("[N8N Callback] Draft docs saved for:", projectId);
    } else if (type === "docs-ready") {
      // Ralph가 Notion에서 수정 완료 → 확정된 기획서/견적서로 업데이트 + 미팅 활성화
      const { planningDoc, estimate } = data;

      const { error } = await supabase
        .from("projects")
        .update({
          planning_doc: planningDoc || null,
          estimate: estimate || null,
          step: 3,
          status: "기획서 확정 완료",
        })
        .eq("id", projectId);

      if (error) {
        console.error("[N8N Callback] docs-ready error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("[N8N Callback] Final docs confirmed for:", projectId);
    } else {
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[N8N Callback] Error:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}
