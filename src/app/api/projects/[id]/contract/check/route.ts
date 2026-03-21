import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { getContractFromNotion } from "@/utils/notion";

export async function GET(
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

    // Get contract
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, status, contract_html, admin_signature_url")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!contract) {
      return NextResponse.json({ ready: false });
    }

    // Already ready or signed
    if (contract.status === "ready" || contract.status === "signed") {
      return NextResponse.json({
        ready: true,
        contract,
      });
    }

    // Check if contract_html is generated (AI draft done)
    if (!contract.contract_html) {
      return NextResponse.json({ ready: false, status: "generating" });
    }

    // Check Notion "계약확정" checkbox
    const { data: project } = await supabase
      .from("projects")
      .select("notion_page_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project?.notion_page_id || !process.env.NOTION_API_KEY) {
      return NextResponse.json({ ready: false, status: "preparing" });
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const page = await notion.pages.retrieve({
      page_id: project.notion_page_id,
    });

    if (!("properties" in page)) {
      return NextResponse.json({ ready: false, status: "preparing" });
    }

    const checkboxProp = page.properties["계약확정"];
    const isConfirmed =
      checkboxProp?.type === "checkbox" && checkboxProp.checkbox === true;

    if (!isConfirmed) {
      return NextResponse.json({ ready: false, status: "preparing" });
    }

    // 계약확정 됨! Notion에서 서명 이미지 가져오기
    const notionData = await getContractFromNotion(project.notion_page_id);

    const updateData: Record<string, unknown> = {
      status: "ready",
    };

    // Notion에서 수정된 계약서 텍스트가 있으면 HTML 업데이트
    if (notionData?.contractText) {
      // 텍스트를 HTML로 변환
      const htmlContent = notionData.contractText
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          if (trimmed.startsWith("【") && trimmed.endsWith("】")) {
            return `<h1>${trimmed.slice(1, -1)}</h1>`;
          }
          if (trimmed.startsWith("■ ")) {
            return `<h2>${trimmed.slice(2)}</h2>`;
          }
          if (trimmed.startsWith("▸ ")) {
            return `<h3>${trimmed.slice(2)}</h3>`;
          }
          if (trimmed.startsWith("• ")) {
            return `<li>${trimmed.slice(2)}</li>`;
          }
          return `<p>${trimmed}</p>`;
        })
        .filter(Boolean)
        .join("\n");

      if (htmlContent) {
        updateData.contract_html = htmlContent;
      }
    }

    // Notion에서 서명 이미지 URL
    if (notionData?.adminSignatureUrl) {
      updateData.admin_signature_url = notionData.adminSignatureUrl;
    }

    await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contract.id);

    // Refetch updated contract
    const { data: updatedContract } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contract.id)
      .single();

    return NextResponse.json({
      ready: true,
      contract: updatedContract,
    });
  } catch (error) {
    console.error("Check contract error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
