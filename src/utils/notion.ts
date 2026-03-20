import { Client } from "@notionhq/client";

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;
  return new Client({ auth: apiKey });
}

function getDatabaseId() {
  return process.env.NOTION_PROJECTS_DB_ID || "";
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
 * Step 0: 프로젝트 생성 시 Notion 페이지 자동 생성
 */
export async function createNotionProjectPage(data: ProjectData): Promise<string | null> {
  const notion = getNotionClient();
  if (!notion) {
    console.log("[NOTION] Skipped: No API key");
    return null;
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: getDatabaseId() },
      properties: {
        "이름": {
          title: [{ text: { content: `${data.company} - 프로젝트 ${data.projectNumber}` } }],
        },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "상담 정보" } }] },
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
          heading_2: { rich_text: [{ text: { content: "AI 제안서" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: "(제안서 생성 시 자동으로 기록됩니다)" } }] },
        },
        { object: "block", type: "divider", divider: {} },
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "상세 기획서" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: "" } }] },
        },
        { object: "block", type: "divider", divider: {} },
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "견적서" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: "" } }] },
        },
      ],
    });

    return page.id;
  } catch (error) {
    console.error("[NOTION] Page creation error:", error);
    return null;
  }
}

/**
 * Step 1: AI 제안서를 Notion 페이지에 기록
 */
export async function appendProposalToNotion(
  notionPageId: string,
  proposal: { title: string; sections: { title: string; content: string }[] }
): Promise<boolean> {
  const notion = getNotionClient();
  if (!notion || !notionPageId) return false;

  try {
    // Find "AI 제안서" heading block to append after
    const blocks = await notion.blocks.children.list({ block_id: notionPageId });
    let targetBlockId: string | null = null;

    for (const block of blocks.results) {
      if (
        "type" in block &&
        block.type === "heading_2" &&
        "heading_2" in block
      ) {
        const heading = block.heading_2 as { rich_text: Array<{ plain_text: string }> };
        if (heading.rich_text?.[0]?.plain_text === "AI 제안서") {
          targetBlockId = block.id;
          break;
        }
      }
    }

    if (!targetBlockId) return false;

    // Remove placeholder paragraph after heading
    const afterBlocks = await notion.blocks.children.list({ block_id: notionPageId });
    let foundHeading = false;
    for (const block of afterBlocks.results) {
      if ("id" in block && block.id === targetBlockId) {
        foundHeading = true;
        continue;
      }
      if (foundHeading && "type" in block && block.type === "paragraph") {
        await notion.blocks.delete({ block_id: block.id });
        break;
      }
      if (foundHeading && "type" in block && block.type !== "paragraph") break;
    }

    // Append proposal sections
    const children: Parameters<typeof notion.blocks.children.append>[0]["children"] = [
      {
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ text: { content: proposal.title } }] },
      },
    ];

    for (const section of proposal.sections) {
      children.push(
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ text: { content: section.title } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: section.content } }] },
        }
      );
    }

    await notion.blocks.children.append({
      block_id: targetBlockId,
      children,
    });

    return true;
  } catch (error) {
    console.error("[NOTION] Append proposal error:", error);
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
