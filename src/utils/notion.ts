import { Client } from "@notionhq/client";

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;
  return new Client({ auth: apiKey });
}

function getDatabaseId() {
  return process.env.NOTION_PROJECTS_DB_ID || "";
}

function ensureString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

interface ProjectData {
  company: string;
  projectNumber: number;
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
  clientEmail: string;
  clientName: string;
}

/**
 * Step 0: 프로젝트 생성 시 Notion 페이지 자동 생성 (상담 정보만)
 */
export async function createNotionProjectPage(data: ProjectData): Promise<string | null> {
  const notion = getNotionClient();
  if (!notion) {
    console.log("[NOTION] Skipped: No API key");
    return null;
  }

  const dbId = getDatabaseId();
  if (!dbId) {
    console.error("[NOTION] Skipped: NOTION_PROJECTS_DB_ID is not set");
    return null;
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: getDatabaseId() },
      properties: {
        "프로젝트명": {
          title: [{ text: { content: `${data.company} - 프로젝트 ${data.projectNumber}` } }],
        },
        "날짜": {
          date: { start: new Date().toISOString().split("T")[0] },
        },
        "신청자": {
          rich_text: [{ text: { content: data.clientName } }],
        },
        "이메일": {
          email: data.clientEmail,
        },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "📋 상담 정보" } }] },
        },
        {
          object: "block",
          type: "table",
          table: {
            table_width: 2,
            has_column_header: false,
            children: [
              tableRow("담당자", data.clientName),
              tableRow("이메일", data.clientEmail),
              tableRow("프로젝트 유형", data.projectType),
              tableRow("프로젝트 목적", data.projectPurpose),
              tableRow("타겟 사용자", data.targetUser),
              tableRow("핵심 기능", data.features.join(", ")),
              tableRow("디자인 현황", data.designStatus),
              tableRow("예산", data.budget),
              tableRow("일정", data.timeline),
              tableRow("유지보수", data.maintenance),
              ...(data.referenceUrl ? [tableRow("레퍼런스", data.referenceUrl)] : []),
              ...(data.message ? [tableRow("추가 요청", data.message)] : []),
            ],
          },
        },
        { object: "block", type: "divider", divider: {} },
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "📄 문서" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: "제안서 생성 시 하위 페이지로 자동 생성됩니다." } }] },
        },
      ],
    });

    return page.id;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[NOTION] Page creation error:", errMsg, "DB ID:", dbId.slice(0, 8) + "...");
    return null;
  }
}

/**
 * Step 1: AI 제안서를 별도 하위 페이지로 생성
 */
export async function appendProposalToNotion(
  notionPageId: string,
  proposal: { title: string; sections: { title: string; content: string }[] }
): Promise<boolean> {
  const notion = getNotionClient();
  if (!notion || !notionPageId) return false;

  try {
    // 제안서 하위 페이지 생성
    const children: Parameters<typeof notion.pages.create>[0]["children"] = [];

    for (const section of proposal.sections) {
      children.push(
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: ensureString(section.title) } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: ensureString(section.content).slice(0, 2000) } }],
          },
        },
        { object: "block", type: "divider", divider: {} }
      );
    }

    await notion.pages.create({
      parent: { page_id: notionPageId },
      icon: { type: "emoji", emoji: "📑" },
      properties: {
        title: {
          title: [{ text: { content: `제안서 - ${ensureString(proposal.title)}` } }],
        },
      },
      children,
    });

    return true;
  } catch (error) {
    console.error("[NOTION] Create proposal page error:", error);
    return false;
  }
}

/**
 * Step 2: 기획서/견적서를 각각 별도 하위 페이지로 생성
 */
export async function appendDocumentsToNotion(
  notionPageId: string,
  docs: {
    planningDoc?: { title: string; sections: { title: string; content: string }[] } | null;
    estimate?: { title: string; items: { name: string; price: string; note: string }[]; total: string } | null;
  }
): Promise<boolean> {
  const notion = getNotionClient();
  if (!notion || !notionPageId) return false;

  try {
    // 상세 기획서 하위 페이지 생성
    if (docs.planningDoc) {
      const planningChildren: Parameters<typeof notion.pages.create>[0]["children"] = [];

      for (const section of docs.planningDoc.sections) {
        planningChildren.push(
          {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: [{ text: { content: ensureString(section.title) } }] },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: ensureString(section.content).slice(0, 2000) } }],
            },
          },
          { object: "block", type: "divider", divider: {} }
        );
      }

      await notion.pages.create({
        parent: { page_id: notionPageId },
        icon: { type: "emoji", emoji: "📘" },
        properties: {
          title: {
            title: [{ text: { content: `상세 기획서 - ${ensureString(docs.planningDoc.title)}` } }],
          },
        },
        children: planningChildren,
      });
    }

    // 견적서 하위 페이지 생성
    if (docs.estimate) {
      const estimateChildren: Parameters<typeof notion.pages.create>[0]["children"] = [
        {
          object: "block",
          type: "table",
          table: {
            table_width: 3,
            has_column_header: true,
            children: [
              {
                object: "block",
                type: "table_row",
                table_row: {
                  cells: [
                    [{ text: { content: "항목" } }],
                    [{ text: { content: "비용" } }],
                    [{ text: { content: "비고" } }],
                  ],
                },
              },
              ...docs.estimate.items.map((item) => ({
                object: "block" as const,
                type: "table_row" as const,
                table_row: {
                  cells: [
                    [{ text: { content: ensureString(item.name) } }],
                    [{ text: { content: ensureString(item.price) } }],
                    [{ text: { content: ensureString(item.note) } }],
                  ],
                },
              })),
            ],
          },
        },
        { object: "block", type: "divider", divider: {} },
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ text: { content: `합계: ${ensureString(docs.estimate.total)}` } }] },
        },
      ];

      await notion.pages.create({
        parent: { page_id: notionPageId },
        icon: { type: "emoji", emoji: "💰" },
        properties: {
          title: {
            title: [{ text: { content: `견적서 - ${ensureString(docs.estimate.title)}` } }],
          },
        },
        children: estimateChildren,
      });
    }

    return true;
  } catch (error) {
    console.error("[NOTION] Create document pages error:", error);
    return false;
  }
}

function tableRow(key: string, value: string) {
  return {
    object: "block" as const,
    type: "table_row" as const,
    table_row: {
      cells: [
        [{ text: { content: key } }],
        [{ text: { content: value } }],
      ],
    },
  };
}
