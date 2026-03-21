import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";

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
      .select("notion_page_id, docs_confirmed, notion_public_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Already confirmed
    if (project.docs_confirmed) {
      return NextResponse.json({
        confirmed: true,
        notionUrl: project.notion_public_url,
      });
    }

    // Check Notion checkbox
    if (!project.notion_page_id || !process.env.NOTION_API_KEY) {
      return NextResponse.json({ confirmed: false });
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });

    const page = await notion.pages.retrieve({
      page_id: project.notion_page_id,
    });

    // Type narrow: only DatabaseObjectResponse has properties
    if (!("properties" in page)) {
      return NextResponse.json({ confirmed: false });
    }

    const checkboxProp = page.properties["수정완료"];
    const isConfirmed =
      checkboxProp?.type === "checkbox" && checkboxProp.checkbox === true;

    if (isConfirmed) {
      // Get Notion public URL
      const notionUrl = page.url;

      await supabase
        .from("projects")
        .update({
          docs_confirmed: true,
          notion_public_url: notionUrl,
          step: 3,
          status: "기획서 확정 완료",
        })
        .eq("id", id)
        .eq("user_id", user.id);

      return NextResponse.json({ confirmed: true, notionUrl });
    }

    return NextResponse.json({ confirmed: false });
  } catch (error) {
    console.error("Check notion error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
