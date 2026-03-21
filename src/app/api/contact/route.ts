import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { Client } from "@notionhq/client";
import { createNotionProjectPage } from "@/utils/notion";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      name, email, company, phone,
      projectType, projectPurpose, targetUser,
      features, designStatus,
      budget, timeline, maintenance,
      referenceUrl, message,
    } = data;

    const featuresText = Array.isArray(features) ? features.join(", ") : features || "";

    // 1. Save to Supabase (linked to authenticated user)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 유저 메타데이터에 연락처/회사 저장 (다음 상담 시 프리필용)
      await supabase.auth.updateUser({
        data: { phone: phone || undefined, company: company || undefined },
      });

      // Get next project number for this user
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const projectNumber = (count || 0) + 1;

      // Create Notion page for this project
      const notionPageId = await createNotionProjectPage({
        company,
        projectNumber,
        projectType,
        projectPurpose,
        targetUser,
        features: Array.isArray(features) ? features : [],
        designStatus,
        budget,
        timeline,
        maintenance,
        referenceUrl: referenceUrl || undefined,
        message: message || undefined,
        clientEmail: email,
        clientName: name,
      });

      if (!notionPageId) {
        console.warn("[CONTACT] Notion page creation failed for:", company, "user:", user.id);
      }

      const { error: insertError } = await supabase.from("projects").insert({
        user_id: user.id,
        project_number: projectNumber,
        name,
        email,
        company,
        phone: phone || null,
        project_type: projectType,
        project_purpose: projectPurpose,
        target_user: targetUser,
        features: Array.isArray(features) ? features : [],
        design_status: designStatus,
        budget,
        timeline,
        maintenance,
        reference_url: referenceUrl || null,
        message: message || null,
        notion_page_id: notionPageId,
      });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
      }
    }

    // 2. Send an email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Studio HaeTae <hello@haetae.studio>",
        to: email,
        subject: "[Studio HaeTae] 프로젝트 문의가 성공적으로 접수되었습니다.",
        html: `<h1>안녕하세요, ${name}님!</h1>
<p>스튜디오 해태 비즈니스 빌더 팀입니다. 남겨주신 ${company} 프로젝트 문의를 성공적으로 확인했습니다.</p>
<hr/>
<p><strong>프로젝트 유형:</strong> ${projectType}</p>
<p><strong>예산:</strong> ${budget} | <strong>일정:</strong> ${timeline}</p>
<p><strong>핵심 기능:</strong> ${featuresText}</p>`,
      });
    } else {
      console.log("[SIMULATION] Resend skipped (No API Key). Email simulated sent to", email);
    }

    // 3. Insert Lead into Notion DB
    if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
      const notion = new Client({ auth: process.env.NOTION_API_KEY });
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Email: { email: email },
          Company: { rich_text: [{ text: { content: company } }] },
          Budget: { select: { name: budget } },
          Status: { status: { name: "New Lead" } }
        },
      });
    } else {
      console.log("[SIMULATION] Notion skipped (No API Key). Lead simulated created for", name);
    }

    // 4. Webhook Alert to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚀 *New Lead Alert*\n*Name:* ${name}\n*Company:* ${company}\n*Type:* ${projectType}\n*Budget:* ${budget} | *Timeline:* ${timeline}\n*Features:* ${featuresText}\n*Email:* ${email}`,
        }),
      });
    } else {
      console.log("[SIMULATION] Slack skipped (No Webhook URL). Alert simulated for", company);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
