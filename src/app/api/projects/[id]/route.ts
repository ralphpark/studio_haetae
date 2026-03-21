import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { deleteMeetEvent } from "@/utils/google-calendar";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { project_name } = await req.json();

    if (!project_name || typeof project_name !== "string") {
      return NextResponse.json({ error: "Invalid project name" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project to find notion_page_id
    const { data: project } = await supabase
      .from("projects")
      .select("notion_page_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("projects")
      .update({ project_name: project_name.trim() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update Notion page title
    if (project?.notion_page_id && process.env.NOTION_API_KEY) {
      const notion = new Client({ auth: process.env.NOTION_API_KEY });
      notion.pages.update({
        page_id: project.notion_page_id,
        properties: {
          "이름": {
            title: [{ text: { content: project_name.trim() } }],
          },
        },
      }).catch((err) => console.error("[NOTION] Title update error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Get project to find notion_page_id
    const { data: project } = await supabase
      .from("projects")
      .select("notion_page_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete Google Calendar events for meetings
    const { data: meetings } = await supabase
      .from("meetings")
      .select("calendar_event_id")
      .eq("project_id", id);

    if (meetings) {
      for (const m of meetings) {
        if (m.calendar_event_id) {
          await deleteMeetEvent(m.calendar_event_id).catch((err) =>
            console.error("[CALENDAR] Event delete error:", err)
          );
        }
      }
    }

    // Archive Notion page BEFORE deleting from Supabase
    if (project.notion_page_id && process.env.NOTION_API_KEY) {
      try {
        const notion = new Client({ auth: process.env.NOTION_API_KEY });
        await notion.pages.update({
          page_id: project.notion_page_id,
          archived: true,
        });
        console.log("[NOTION] Archived page:", project.notion_page_id);
      } catch (err) {
        console.error("[NOTION] Archive error:", err);
      }
    }

    // Delete from Supabase (cascade deletes meetings too)
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
