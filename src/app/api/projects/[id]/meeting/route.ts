import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createMeetEvent } from "@/utils/google-calendar";
import { createProjectChannel } from "@/utils/discord";
import { Resend } from "resend";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { preferred_date, preferred_time, method, contact_phone, memo } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project belongs to user
    const { data: project } = await supabase
      .from("projects")
      .select("id, step, company, project_name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create Google Meet if method is 화상 미팅
    let meetLink: string | null = null;
    if (method?.includes("Google Meet")) {
      try {
        const result = await createMeetEvent({
          date: preferred_date,
          time: preferred_time,
          title: `Studio HaeTae 1차 미팅${project.company ? ` - ${project.company}` : ""}`,
          description: `프로젝트 미팅\n연락처: ${contact_phone}${memo ? `\n메모: ${memo}` : ""}`,
        });
        meetLink = result.meetLink;
      } catch (e) {
        console.error("Google Meet creation failed:", e);
      }
    }

    // Create Discord channel if method is 메신저 미팅
    let discordChannelId: string | null = null;
    let discordInvite: string | null = null;
    if (method?.includes("Discord")) {
      try {
        const discord = await createProjectChannel({
          projectName: project.project_name || id.slice(0, 8),
          companyName: project.company || undefined,
        });
        discordChannelId = discord.channelId;
        discordInvite = discord.inviteLink;
      } catch (e) {
        console.error("Discord channel creation failed:", e);
      }
    }

    // Create meeting
    const { error: insertError } = await supabase.from("meetings").insert({
      project_id: id,
      user_id: user.id,
      preferred_date,
      preferred_time,
      method,
      contact_phone,
      memo: memo || null,
      meet_link: meetLink,
      discord_channel_id: discordChannelId,
      discord_invite: discordInvite,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Advance step
    if (project.step < 4) {
      await supabase
        .from("projects")
        .update({ step: 4 })
        .eq("id", id)
        .eq("user_id", user.id);
    }

    // Send booking confirmation email
    if (process.env.RESEND_API_KEY && user.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const meetInfo = meetLink
          ? `<p><a href="${meetLink}" style="background: #fff; color: #000; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Google Meet 참여하기</a></p>`
          : discordInvite
          ? `<p><a href="${discordInvite}" style="background: #5865F2; color: #fff; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Discord 메신저 참여하기</a></p>`
          : "";

        await resend.emails.send({
          from: "Studio HaeTae <hello@haetae.studio>",
          to: user.email,
          subject: "[Studio HaeTae] 1차 미팅이 예약되었습니다",
          html: `<h1>1차 미팅 예약 확인</h1>
<p>안녕하세요! Studio HaeTae 비즈니스 빌더 팀입니다.</p>
<p>1차 미팅이 아래 일정으로 예약되었습니다.</p>
<table style="margin: 16px 0; border-collapse: collapse;">
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">날짜</td><td style="padding: 8px 0; font-weight: 600;">${preferred_date}</td></tr>
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">시간</td><td style="padding: 8px 0; font-weight: 600;">${preferred_time}</td></tr>
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">방법</td><td style="padding: 8px 0; font-weight: 600;">${method}</td></tr>
</table>
${meetInfo}
<hr style="margin-top: 32px; border: none; border-top: 1px solid #333;" />
<p style="color: #888; font-size: 12px;">Studio HaeTae | Guardians of Innovation, Architects of Scale.</p>`,
        });
      } catch (emailErr) {
        console.error("Meeting confirmation email failed:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      meet_link: meetLink,
      discord_invite: discordInvite,
    });
  } catch (error) {
    console.error("Meeting API error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
