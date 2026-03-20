import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appendProposalToNotion } from "@/utils/notion";

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
      .select("notion_page_id, proposal")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project?.notion_page_id || !project?.proposal) {
      return NextResponse.json({ error: "Nothing to sync" }, { status: 400 });
    }

    await appendProposalToNotion(project.notion_page_id, project.proposal);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
