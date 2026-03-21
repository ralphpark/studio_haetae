import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get current time in KST (UTC+9)
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstIn15 = new Date(kstNow.getTime() + 15 * 60 * 1000);

  const todayStr = kstNow.toISOString().split("T")[0];
  const nowTime = kstNow.toTimeString().slice(0, 5);
  const in15Time = kstIn15.toTimeString().slice(0, 5);

  // Find meetings happening in the next 10-15 minutes that haven't been reminded
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, user_id, preferred_date, preferred_time, method, meet_link, discord_invite")
    .eq("preferred_date", todayStr)
    .gte("preferred_time", nowTime)
    .lte("preferred_time", in15Time)
    .eq("reminder_sent", false);

  if (!meetings || meetings.length === 0) {
    return NextResponse.json({ reminded: 0 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let reminded = 0;

  for (const meeting of meetings) {
    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(meeting.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    const meetInfo = meeting.meet_link
      ? `<p><a href="${meeting.meet_link}" style="background: #fff; color: #000; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Google Meet 참여하기</a></p>`
      : meeting.discord_invite
      ? `<p><a href="${meeting.discord_invite}" style="background: #5865F2; color: #fff; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Discord 메신저 참여하기</a></p>`
      : "";

    try {
      await resend.emails.send({
        from: "Studio HaeTae <hello@haetae.studio>",
        to: email,
        subject: "[Studio HaeTae] 미팅이 곧 시작됩니다!",
        html: `<h1>미팅 시작 10분 전 알림</h1>
<p>안녕하세요! 곧 Studio HaeTae 1차 미팅이 시작됩니다.</p>
<table style="margin: 16px 0; border-collapse: collapse;">
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">시간</td><td style="padding: 8px 0; font-weight: 600;">${meeting.preferred_time}</td></tr>
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">방법</td><td style="padding: 8px 0; font-weight: 600;">${meeting.method}</td></tr>
</table>
${meetInfo}
<hr style="margin-top: 32px; border: none; border-top: 1px solid #333;" />
<p style="color: #888; font-size: 12px;">Studio HaeTae | Guardians of Innovation, Architects of Scale.</p>`,
      });

      await supabase
        .from("meetings")
        .update({ reminder_sent: true })
        .eq("id", meeting.id);

      reminded++;
    } catch (e) {
      console.error("Reminder email failed for meeting:", meeting.id, e);
    }
  }

  return NextResponse.json({ reminded });
}
