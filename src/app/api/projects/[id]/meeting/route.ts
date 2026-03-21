import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createMeetEvent } from "@/utils/google-calendar";
import { createProjectChannel } from "@/utils/discord";

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
