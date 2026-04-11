import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { getContractFromNotion } from "@/utils/notion";
import { Resend } from "resend";

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

    // Get contract — include signed fields so polling doesn't wipe out
    // client_name / client_signature_url / signed_at after signing.
    const { data: contract } = await supabase
      .from("contracts")
      .select(
        "id, status, contract_html, admin_signature_url, client_signature_url, client_name, signed_at"
      )
      .eq("project_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!contract) {
      return NextResponse.json({ ready: false });
    }

    // Check Notion "계약확정" checkbox — even for ready/signed contracts (admin may uncheck to re-edit)
    const { data: project } = await supabase
      .from("projects")
      .select("notion_page_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    const canCheckNotion = !!(project?.notion_page_id && process.env.NOTION_API_KEY);

    if (canCheckNotion) {
      const notion = new Client({ auth: process.env.NOTION_API_KEY! });
      const page = await notion.pages.retrieve({
        page_id: project!.notion_page_id,
      });

      if ("properties" in page) {
        const checkboxProp = page.properties["계약확정"];
        const isNotionConfirmed =
          checkboxProp?.type === "checkbox" && checkboxProp.checkbox === true;

        // Checkbox unchecked but contract was ready/signed → admin is re-editing, reset
        if (!isNotionConfirmed && (contract.status === "ready" || contract.status === "signed")) {
          const resetData: Record<string, unknown> = {
            status: "preparing",
          };

          // If was signed, also clear signature data
          if (contract.status === "signed") {
            resetData.client_signature_url = null;
            resetData.signed_at = null;
            resetData.signed_pdf_url = null;
            resetData.signed_document_hash = null;
          }

          await supabase
            .from("contracts")
            .update(resetData)
            .eq("id", contract.id);

          // Also reset project step
          await supabase
            .from("projects")
            .update({ step: 5, status: "계약서 수정 중" })
            .eq("id", id)
            .eq("user_id", user.id);

          return NextResponse.json({ ready: false, status: "preparing" });
        }

        // Already ready or signed AND checkbox still checked → return as-is
        if (isNotionConfirmed && (contract.status === "ready" || contract.status === "signed")) {
          return NextResponse.json({
            ready: true,
            contract,
          });
        }

        // Contract is preparing and checkbox not yet checked → still waiting
        if (!isNotionConfirmed) {
          return NextResponse.json({ ready: false, status: "preparing" });
        }

        // isNotionConfirmed && contract.status === "preparing" → fall through to confirmation logic below
      } else {
        // Can't read properties — fall back to cached state
        if (contract.status === "ready" || contract.status === "signed") {
          return NextResponse.json({ ready: true, contract });
        }
        return NextResponse.json({ ready: false, status: "preparing" });
      }
    } else {
      // No Notion connection — fall back to cached state
      if (contract.status === "ready" || contract.status === "signed") {
        return NextResponse.json({ ready: true, contract });
      }
    }

    // Check if contract_html is generated (AI draft done)
    if (!contract.contract_html) {
      return NextResponse.json({ ready: false, status: "generating" });
    }

    // 계약확정 됨! Notion에서 수정된 계약서 HTML + 대표 서명 이미지 가져오기
    const notionData = await getContractFromNotion(project!.notion_page_id);

    const updateData: Record<string, unknown> = {
      status: "ready",
    };

    // Notion에서 수정된 계약서 HTML 반영
    if (notionData?.contractHtml) {
      updateData.contract_html = notionData.contractHtml;
    }

    // Notion에서 서명 이미지 URL 가져오기
    if (notionData?.adminSignatureUrl) {
      updateData.admin_signature_url = notionData.adminSignatureUrl;
    }

    await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contract.id);

    // Send notification email
    if (process.env.RESEND_API_KEY && user.email) {
      try {
        const { data: proj } = await supabase
          .from("projects")
          .select("project_name, company")
          .eq("id", id)
          .single();

        const projName = proj?.project_name || proj?.company || "프로젝트";
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Studio HaeTae <hello@haetae.studio>",
          to: user.email,
          subject: `[Studio HaeTae] ${projName} 계약서가 준비되었습니다`,
          html: `<h1>계약서 준비 완료</h1>
<p>안녕하세요! Studio HaeTae 비즈니스 빌더 팀입니다.</p>
<p><strong>${projName}</strong> 프로젝트의 계약서가 준비되었습니다.</p>
<p>포털에서 계약서 내용을 확인하시고, 서명을 진행해주세요.</p>
<p style="margin-top: 24px;">
  <a href="https://haetae.studio/portal/${id}" style="background: #fff; color: #000; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">계약서 확인하고 서명하기</a>
</p>
<hr style="margin-top: 32px; border: none; border-top: 1px solid #333;" />
<p style="color: #888; font-size: 12px;">Studio HaeTae | Guardians of Innovation, Architects of Scale.</p>`,
        });
      } catch (emailErr) {
        console.error("Contract ready email failed:", emailErr);
      }
    }

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
