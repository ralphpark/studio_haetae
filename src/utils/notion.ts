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

/**
 * Step 4: 계약서 하위 페이지 생성 (AI 초안 + 대표 서명 이미지 영역)
 */
export async function createContractNotionPage(
  notionPageId: string,
  contractHtml: string,
  companyName: string
): Promise<string | null> {
  const notion = getNotionClient();
  if (!notion || !notionPageId) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    // HTML을 Notion 블록으로 파싱
    const htmlBlocks = parseHtmlToNotionBlocks(contractHtml);
    children.push(...htmlBlocks);

    // 대표 서명 영역 안내
    children.push(
      { object: "block", type: "divider", divider: {} },
      {
        object: "block",
        type: "callout",
        callout: {
          rich_text: [
            {
              text: {
                content:
                  "⬇️ 아래에 대표 서명 이미지를 추가해주세요.\n이미지 블록으로 서명 파일을 업로드하면 고객 계약서에 자동으로 반영됩니다.",
              },
            },
          ],
          icon: { type: "emoji", emoji: "✍️" },
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: "[여기에 서명 이미지를 삽입하세요]" } }],
        },
      },
      { object: "block", type: "divider", divider: {} },
      {
        object: "block",
        type: "callout",
        callout: {
          rich_text: [
            {
              text: {
                content:
                  "✅ 계약서 검토가 완료되면 상위 프로젝트 페이지의 '계약확정' 체크박스를 체크해주세요.",
              },
            },
          ],
          icon: { type: "emoji", emoji: "📋" },
        },
      }
    );

    const page = await notion.pages.create({
      parent: { page_id: notionPageId },
      icon: { type: "emoji", emoji: "📝" },
      properties: {
        title: {
          title: [{ text: { content: `계약서 - ${companyName}` } }],
        },
      },
      children,
    });

    return page.id;
  } catch (error) {
    console.error("[NOTION] Create contract page error:", error);
    return null;
  }
}

/**
 * 계약확정 체크 시: Notion 계약서 페이지에서 이미지 블록(서명)을 찾아 반환
 */
export async function getContractFromNotion(
  notionPageId: string
): Promise<{ contractText: string; adminSignatureUrl: string | null } | null> {
  const notion = getNotionClient();
  if (!notion || !notionPageId) return null;

  try {
    // 하위 페이지에서 계약서 페이지 찾기
    const children = await notion.blocks.children.list({
      block_id: notionPageId,
      page_size: 100,
    });

    let contractPageId: string | null = null;
    for (const block of children.results) {
      if ("type" in block && block.type === "child_page") {
        const title = (block as { child_page: { title: string } }).child_page.title;
        if (title.startsWith("계약서")) {
          contractPageId = block.id;
          break;
        }
      }
    }

    if (!contractPageId) return null;

    // 계약서 페이지의 블록들 읽기
    const contractBlocks = await notion.blocks.children.list({
      block_id: contractPageId,
      page_size: 100,
    });

    let contractText = "";
    let adminSignatureUrl: string | null = null;

    for (const block of contractBlocks.results) {
      if (!("type" in block)) continue;

      if (block.type === "paragraph") {
        const texts = (block as { paragraph: { rich_text: { plain_text: string }[] } }).paragraph.rich_text;
        const text = texts.map((t) => t.plain_text).join("");
        if (text !== "[여기에 서명 이미지를 삽입하세요]") {
          contractText += text + "\n";
        }
      } else if (block.type === "image") {
        const imageBlock = block as {
          image: {
            type: string;
            file?: { url: string };
            external?: { url: string };
          };
        };
        const url =
          imageBlock.image.type === "file"
            ? imageBlock.image.file?.url
            : imageBlock.image.external?.url;
        if (url) {
          adminSignatureUrl = url;
        }
      }
    }

    return { contractText: contractText.trim(), adminSignatureUrl };
  } catch (error) {
    console.error("[NOTION] Get contract error:", error);
    return null;
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

function stripTags(html: string): string {
  return html
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "$1")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "$1")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

type NotionBlock = {
  object: "block";
  type: string;
  [key: string]: unknown;
};

function parseHtmlToNotionBlocks(rawHtml: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  // 1. DOCTYPE, html, head, body 등 문서 래퍼 제거 → body 내용만 추출
  let html = rawHtml;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  } else {
    // body 태그가 없으면 문서 구조 태그만 제거
    html = html
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "");
  }
  html = html.trim();

  // 2. 테이블을 추출하여 플레이스홀더로 치환
  const tables: string[] = [];
  html = html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_m, content) => {
    tables.push(content);
    return `<p>__TABLE_${tables.length - 1}__</p>`;
  });

  // 3. 리스트를 추출하여 플레이스홀더로 치환
  const lists: string[] = [];
  html = html.replace(/<[ou]l[^>]*>([\s\S]*?)<\/[ou]l>/gi, (_m, content) => {
    lists.push(content);
    return `<p>__LIST_${lists.length - 1}__</p>`;
  });

  // 4. 블록 단위로 분리 — 태그가 있는 요소와 태그 없는 텍스트 모두 캡처
  const segments = html.split(/(<(?:h1|h2|h3|p|div)[^>]*>[\s\S]*?<\/(?:h1|h2|h3|p|div)>)/gi).filter(s => s.trim());

  for (const segment of segments) {
    // 태그로 감싼 블록인지 체크
    const tagMatch = segment.match(/^<(h1|h2|h3|p|div)[^>]*>([\s\S]*?)<\/\1>$/i);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : null;
    const content = tagMatch ? tagMatch[2].trim() : segment.trim();

    // 테이블 플레이스홀더 체크
    const tableMatch = content.match(/__TABLE_(\d+)__/);
    if (tableMatch) {
      const tableBlock = parseHtmlTable(tables[parseInt(tableMatch[1])]);
      if (tableBlock) blocks.push(tableBlock);
      continue;
    }

    // 리스트 플레이스홀더 체크
    const listMatch = content.match(/__LIST_(\d+)__/);
    if (listMatch) {
      const listHtml = lists[parseInt(listMatch[1])];
      const items = [...listHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      for (const item of items) {
        const text = stripTags(item[1]).slice(0, 2000);
        if (text) {
          blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ text: { content: text } }],
            },
          });
        }
      }
      continue;
    }

    const text = stripTags(content).slice(0, 2000);
    if (!text) continue;

    if (tag === "h1") {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ text: { content: text } }] },
      });
    } else if (tag === "h2") {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ text: { content: text } }] },
      });
    } else if (tag === "h3") {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ text: { content: text } }] },
      });
    } else {
      // tag === "p" | "div" | null (태그 없는 텍스트)
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: text } }],
        },
      });
    }
  }

  return blocks;
}

function parseHtmlTable(tableHtml: string): NotionBlock | null {
  const rows: string[][] = [];
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const rowMatch of rowMatches) {
    const cells: string[] = [];
    const cellMatches = [
      ...rowMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi),
    ];
    for (const cellMatch of cellMatches) {
      cells.push(stripTags(cellMatch[1]));
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return null;

  // Notion 테이블 최대 열 수 결정
  const maxCols = Math.max(...rows.map((r) => r.length));

  // 각 row의 열 수를 맞춤
  const normalizedRows = rows.map((row) => {
    while (row.length < maxCols) row.push("");
    return row;
  });

  return {
    object: "block",
    type: "table",
    table: {
      table_width: maxCols,
      has_column_header: true,
      children: normalizedRows.map((row) => ({
        object: "block" as const,
        type: "table_row" as const,
        table_row: {
          cells: row.map((cell) => [{ text: { content: cell.slice(0, 2000) } }]),
        },
      })),
    },
  };
}
