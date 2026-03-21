import { NextResponse } from "next/server";
import { requireAdmin } from "@/utils/admin";

// POST: 관리자가 계약서 확정 (preparing → ready)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const body = await req.json();
  const { contract_html, admin_signature_data } = body;

  if (!contract_html) {
    return NextResponse.json(
      { error: "Contract HTML required" },
      { status: 400 }
    );
  }

  // Find contract for this project
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found" },
      { status: 404 }
    );
  }

  // Upload admin signature if provided
  let adminSignatureUrl: string | null = null;
  if (admin_signature_data) {
    const base64Data = admin_signature_data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const path = `signatures/${contract.id}/admin_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(path, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("contracts")
        .getPublicUrl(path);
      adminSignatureUrl = urlData.publicUrl;
    }
  }

  // Update contract to ready
  const updateData: Record<string, unknown> = {
    contract_html,
    status: "ready",
  };
  if (adminSignatureUrl) {
    updateData.admin_signature_url = adminSignatureUrl;
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update(updateData)
    .eq("id", contract.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
