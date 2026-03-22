import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { Resend } from "resend";
import { getDocsFromNotion } from "@/utils/notion";

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

    const { data: project } = await supabase
      .from("projects")
      .select("notion_page_id, docs_confirmed, notion_public_url, document_urls, planning_doc, estimate")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check Notion checkbox (even if already confirmed — admin may uncheck to re-edit)
    if (!project.notion_page_id || !process.env.NOTION_API_KEY) {
      // No Notion page → fall back to cached state
      if (project.docs_confirmed) {
        return NextResponse.json({
          confirmed: true,
          planningDoc: project.planning_doc,
          estimate: project.estimate,
        });
      }
      return NextResponse.json({ confirmed: false });
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });

    const page = await notion.pages.retrieve({
      page_id: project.notion_page_id,
    });

    // Type narrow: only DatabaseObjectResponse has properties
    if (!("properties" in page)) {
      if (project.docs_confirmed) {
        return NextResponse.json({
          confirmed: true,
          planningDoc: project.planning_doc,
          estimate: project.estimate,
        });
      }
      return NextResponse.json({ confirmed: false });
    }

    const checkboxProp = page.properties["수정완료"];
    const isConfirmed =
      checkboxProp?.type === "checkbox" && checkboxProp.checkbox === true;

    // Checkbox unchecked but DB says confirmed → admin is re-editing, reset
    if (!isConfirmed && project.docs_confirmed) {
      await supabase
        .from("projects")
        .update({
          docs_confirmed: false,
          step: 2,
          status: "기획서 수정 중",
        })
        .eq("id", id)
        .eq("user_id", user.id);

      return NextResponse.json({ confirmed: false, step: 2 });
    }

    if (isConfirmed) {
      // Get Notion public URL
      const notionUrl = page.url;

      // Notion에서 수정된 기획서/견적서 내용 가져오기 (항상 최신 데이터 반영)
      const notionDocs = await getDocsFromNotion(project.notion_page_id);

      const wasAlreadyConfirmed = project.docs_confirmed;

      const updateData: Record<string, unknown> = {
        docs_confirmed: true,
        notion_public_url: notionUrl,
        step: 3,
        status: "기획서 확정 완료",
      };

      if (notionDocs?.planningDoc) {
        updateData.planning_doc = notionDocs.planningDoc;
      }
      if (notionDocs?.estimate) {
        updateData.estimate = notionDocs.estimate;
      }

      await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      // Send email notification only on first confirmation (not re-confirmations)
      if (!wasAlreadyConfirmed && process.env.RESEND_API_KEY && user.email) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Studio HaeTae <hello@haetae.studio>",
            to: user.email,
            subject: "[Studio HaeTae] 기획서와 견적서가 준비되었습니다",
            html: `<h1>기획서 & 견적서 확정 안내</h1>
<p>안녕하세요! Studio HaeTae 비즈니스 빌더 팀입니다.</p>
<p>요청하신 프로젝트의 <strong>기획서와 견적서</strong>가 확정되었습니다.</p>
<p>아래 링크에서 확인하시고, 1차 미팅을 예약해주세요.</p>
<p style="margin-top: 24px;">
  <a href="https://haetae.studio/portal/${id}" style="background: #fff; color: #000; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">포털에서 확인하기</a>
</p>
<hr style="margin-top: 32px; border: none; border-top: 1px solid #333;" />
<p style="color: #888; font-size: 12px;">Studio HaeTae | Guardians of Innovation, Architects of Scale.</p>`,
          });
        } catch (emailErr) {
          console.error("Email notification failed:", emailErr);
        }
      }

      return NextResponse.json({
        confirmed: true,
        planningDoc: notionDocs?.planningDoc || project.planning_doc,
        estimate: notionDocs?.estimate || project.estimate,
      });
    }

    return NextResponse.json({ confirmed: false });
  } catch (error) {
    console.error("Check notion error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
