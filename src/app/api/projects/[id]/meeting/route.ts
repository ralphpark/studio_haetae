import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
      .select("id, step")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Advance step
    if (project.step < 2) {
      await supabase
        .from("projects")
        .update({ step: 2 })
        .eq("id", id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meeting API error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
