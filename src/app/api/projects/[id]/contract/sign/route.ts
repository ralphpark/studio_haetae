import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { join } from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Resend } from "resend";
import { createProjectChannel } from "@/utils/discord";

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
  const { data: project } = await supabase
    .from("projects")
    .select("company, project_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // Create Discord channel for project kickoff
  let discordInvite: string | null = null;
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
    try {
      const discord = await createProjectChannel({
        projectName: project?.project_name || "project",
        companyName: project?.company || undefined,
      });
      discordInvite = discord.inviteLink;

      await supabase
        .from("projects")
        .update({
          step: 6,
          discord_channel_id: discord.channelId,
          discord_invite: discord.inviteLink,
        })
        .eq("id", id)
        .eq("user_id", user.id);
    } catch (e) {
      console.error("[CONTRACT] Discord channel creation failed:", e);
      await supabase
        .from("projects")
        .update({ step: 6 })
        .eq("id", id)
        .eq("user_id", user.id);
    }
  } else {
    await supabase
      .from("projects")
      .update({ step: 6 })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  // Generate signed PDF and send email
  let pdfEmailError: string | null = null;
  try {
    await generateSignedPdfAndEmail({
      contractHtml: contract.contract_html || "",
      adminSignatureUrl: contract.admin_signature_url,
      clientSignatureData: signature_data,
      signerName: signer_name || "고객",
      userEmail: user.email || "",
      projectName: project?.project_name || project?.company || "프로젝트",
      signedAt: now,
      contractId: contract.id,
      supabase,
    });
  } catch (err) {
    pdfEmailError = err instanceof Error ? err.message : String(err);
    console.error("[CONTRACT] PDF/Email error:", pdfEmailError);
  }

  return NextResponse.json({
    success: true,
    signed_at: now,
    client_signature_url: urlData.publicUrl,
    ...(pdfEmailError ? { pdf_email_error: pdfEmailError } : {}),
  });
}

async function generateSignedPdfAndEmail({
  contractHtml,
  adminSignatureUrl,
  clientSignatureData,
  signerName,
  userEmail,
  projectName,
  signedAt,
  contractId,
  supabase,
}: {
  contractHtml: string;
  adminSignatureUrl: string | null;
  clientSignatureData: string;
  signerName: string;
  userEmail: string;
  projectName: string;
  signedAt: string;
  contractId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  // 1. Generate PDF with Korean font
  const pdf = await PDFDocument.create();

  // Load Korean font — try local file first, then fetch from own domain
  let font;
  let fontLoaded = false;

  // 1차: 로컬 파일 시스템 (여러 경로 시도)
  const fontPaths = [
    join(process.cwd(), "public", "fonts", "NotoSansKR-Subset.ttf"),
    join(process.cwd(), ".next", "static", "fonts", "NotoSansKR-Subset.ttf"),
    "/var/task/public/fonts/NotoSansKR-Subset.ttf",
  ];
  for (const fontPath of fontPaths) {
    try {
      const fontBytes = await readFile(fontPath);
      if (fontBytes.length > 1000) {
        font = await pdf.embedFont(fontBytes, { subset: true });
        fontLoaded = true;
        break;
      }
    } catch {
      continue;
    }
  }

  // 2차: 자기 도메인에서 fetch
  if (!fontLoaded) {
    const fontUrls = [
      "https://haetae.studio/fonts/NotoSansKR-Subset.ttf",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/fonts/NotoSansKR-Subset.ttf` : "",
    ].filter(Boolean);

    for (const url of fontUrls) {
      try {
        const fontRes = await fetch(url);
        if (fontRes.ok) {
          const fontBytes = new Uint8Array(await fontRes.arrayBuffer());
          if (fontBytes.length > 1000) {
            font = await pdf.embedFont(fontBytes, { subset: true });
            fontLoaded = true;
            break;
          }
        }
      } catch {
        continue;
      }
    }
  }

  // 3차: Fallback
  if (!fontLoaded) {
    console.error("[CONTRACT] All font loading methods failed, using Helvetica");
    font = await pdf.embedFont(StandardFonts.Helvetica);
  }

  const fontSize = 10;
  const margin = 50;

  // Strip HTML tags for PDF text
  const plainText = contractHtml
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n$1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n$1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n$1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n")
    .replace(/<td[^>]*>(.*?)<\/td>/gi, "$1 | ")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Split text into lines — estimate width per char (Korean ~10px at 10pt)
  const maxCharsPerLine = 45;
  const lines: string[] = [];
  for (const paragraph of plainText.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    for (let i = 0; i < paragraph.length; i += maxCharsPerLine) {
      lines.push(paragraph.slice(i, i + maxCharsPerLine));
    }
  }

  // Paginate
  const lineHeight = 16;
  const pageHeight = 841.89; // A4
  const pageWidth = 595.28;
  const usableHeight = pageHeight - margin * 2;
  const linesPerPage = Math.floor(usableHeight / lineHeight);

  for (let i = 0; i < lines.length; i += linesPerPage) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    const pageLines = lines.slice(i, i + linesPerPage);

    for (let j = 0; j < pageLines.length; j++) {
      try {
        page.drawText(pageLines[j], {
          x: margin,
          y: pageHeight - margin - j * lineHeight,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      } catch {
        // Skip lines with unsupported characters
      }
    }
  }

  // Add signature page
  const sigPage = pdf.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - margin;

  sigPage.drawText("서명", {
    x: margin,
    y: yPos,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  yPos -= 40;

  // Admin signature
  sigPage.drawText("갑 (Studio HaeTae) - 대표 박근수", {
    x: margin,
    y: yPos,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  yPos -= 15;

  if (adminSignatureUrl) {
    try {
      const sigRes = await fetch(adminSignatureUrl);
      const sigBytes = await sigRes.arrayBuffer();
      const sigImage = await pdf.embedPng(new Uint8Array(sigBytes));
      const sigDims = sigImage.scale(0.5);
      sigPage.drawImage(sigImage, {
        x: margin,
        y: yPos - Math.min(sigDims.height, 80),
        width: Math.min(sigDims.width, 200),
        height: Math.min(sigDims.height, 80),
      });
      yPos -= 100;
    } catch {
      yPos -= 20;
    }
  }

  yPos -= 30;

  // Client signature
  sigPage.drawText(`을 (고객) - ${signerName}`, {
    x: margin,
    y: yPos,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  yPos -= 15;

  try {
    const base64 = clientSignatureData.replace(/^data:image\/\w+;base64,/, "");
    const sigBytes = Buffer.from(base64, "base64");
    const sigImage = await pdf.embedPng(sigBytes);
    const sigDims = sigImage.scale(0.5);
    sigPage.drawImage(sigImage, {
      x: margin,
      y: yPos - Math.min(sigDims.height, 80),
      width: Math.min(sigDims.width, 200),
      height: Math.min(sigDims.height, 80),
    });
    yPos -= 100;
  } catch {
    yPos -= 20;
  }

  yPos -= 30;
  const dateStr = new Date(signedAt).toLocaleDateString("ko-KR");
  sigPage.drawText(`서명일: ${dateStr}`, {
    x: margin,
    y: yPos,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdf.save();

  // 2. Upload PDF to Supabase Storage
  const pdfPath = `signed/${contractId}/contract_${Date.now()}.pdf`;
  await supabase.storage
    .from("contracts")
    .upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  const { data: pdfUrlData } = supabase.storage
    .from("contracts")
    .getPublicUrl(pdfPath);

  // Update contract with PDF URL and final hash
  const signedHash = createHash("sha256")
    .update(Buffer.from(pdfBytes))
    .digest("hex");

  await supabase
    .from("contracts")
    .update({
      signed_pdf_url: pdfUrlData.publicUrl,
      signed_document_hash: signedHash,
    })
    .eq("id", contractId);

  // 3. Send email with PDF attachment
  if (process.env.RESEND_API_KEY && userEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Studio HaeTae <hello@haetae.studio>",
      to: userEmail,
      subject: `[Studio HaeTae] ${projectName} 계약서가 체결되었습니다`,
      html: `<h1>계약 체결 완료</h1>
<p>안녕하세요, ${signerName}님!</p>
<p><strong>${projectName}</strong> 프로젝트의 계약이 성공적으로 체결되었습니다.</p>
<p>서명이 완료된 계약서를 첨부파일로 보내드립니다.</p>
<table style="margin: 16px 0; border-collapse: collapse;">
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">계약 체결일</td><td style="padding: 8px 0; font-weight: 600;">${dateStr}</td></tr>
  <tr><td style="padding: 8px 16px 8px 0; color: #888;">프로젝트</td><td style="padding: 8px 0; font-weight: 600;">${projectName}</td></tr>
</table>
<p>계약서 원본은 포털에서도 다시 확인하실 수 있습니다.</p>
<p style="margin-top: 24px;">
  <a href="https://haetae.studio/portal" style="background: #fff; color: #000; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">포털에서 확인하기</a>
</p>
<hr style="margin-top: 32px; border: none; border-top: 1px solid #333;" />
<p style="color: #888; font-size: 12px;">Studio HaeTae | Guardians of Innovation, Architects of Scale.</p>`,
      attachments: [
        {
          filename: `계약서_${projectName}_${dateStr}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    });
  }
}
