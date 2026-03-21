import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET: 계약서 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ contract: contract || null });
}

// POST: 계약서 생성 요청 (클라이언트가 "계약하기" 클릭)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify project belongs to user
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check if contract already exists
  const { data: existing } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ contract: existing });
  }

  // Create contract in "preparing" status
  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      project_id: id,
      user_id: user.id,
      status: "preparing",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Advance step to 5
  await supabase
    .from("projects")
    .update({ step: 5 })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ contract });
}
