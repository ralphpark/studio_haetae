import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createHash } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { signature_data, consent_given, signer_name } = body;

  if (!signature_data || !consent_given) {
    return NextResponse.json(
      { error: "Signature and consent required" },
      { status: 400 }
    );
  }

  // Get contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.status === "signed") {
    return NextResponse.json({ error: "Already signed" }, { status: 400 });
  }

  if (contract.status !== "ready") {
    return NextResponse.json(
      { error: "Contract not ready for signing" },
      { status: 400 }
    );
  }

  // Upload signature image to Supabase Storage
  const base64Data = signature_data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const signaturePath = `signatures/${contract.id}/client_${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(signaturePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Signature upload failed" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("contracts")
    .getPublicUrl(signaturePath);

  // Hash the contract content for integrity
  const contractHash = createHash("sha256")
    .update(contract.contract_html || "")
    .digest("hex");

  // Update contract with client signature
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      client_signature_url: urlData.publicUrl,
      client_name: signer_name || null,
      status: "signed",
      signed_at: now,
      document_hash: contractHash,
    })
    .eq("id", contract.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Contract update failed" },
      { status: 500 }
    );
  }

  // Record audit log
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  await supabase.from("signing_audit_log").insert({
    contract_id: contract.id,
    signer_type: "client",
    signer_email: user.email || "",
    signer_name: signer_name || user.email || "",
    signer_ip: ip === "unknown" ? null : ip,
    user_agent: userAgent,
    consent_given: true,
    consent_timestamp: now,
  });

  // Advance project step
  await supabase
    .from("projects")
    .update({ step: 6 })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({
    success: true,
    signed_at: now,
    client_signature_url: urlData.publicUrl,
  });
}
