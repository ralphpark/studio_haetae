/**
 * n8n Webhook 트리거 유틸리티
 * 제안서 생성 완료 시 n8n 워크플로우를 호출하여 기획서/견적서 자동 생성
 */

interface N8nProjectPayload {
  projectId: string;
  notionPageId: string | null;
  company: string;
  projectType: string;
  projectPurpose: string;
  targetUser: string;
  features: string[];
  designStatus: string;
  budget: string;
  timeline: string;
  maintenance: string;
  referenceUrl?: string;
  message?: string;
  clientName: string;
  clientEmail: string;
  proposalTitle?: string;
  proposalSections?: { id: string; title: string; content: string }[];
}

/**
 * n8n 워크플로우 webhook 호출
 * 제안서 완료 → 기획서/견적서 자동 생성 트리거
 */
export async function triggerN8nWorkflow(payload: N8nProjectPayload): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("[N8N] Skipped: No webhook URL configured");
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        triggeredAt: new Date().toISOString(),
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/n8n/callback`,
      }),
    });

    if (!res.ok) {
      console.error("[N8N] Webhook trigger failed:", res.status, await res.text());
      return false;
    }

    console.log("[N8N] Workflow triggered for project:", payload.projectId);
    return true;
  } catch (error) {
    console.error("[N8N] Webhook trigger error:", error);
    return false;
  }
}
