import { requireAdmin } from "@/utils/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminProjectActions } from "@/components/admin/AdminProjectActions";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) redirect("/admin");

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const features = Array.isArray(project.features)
    ? project.features.join(", ")
    : "";

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-24 flex flex-col gap-8">
      <Link
        href="/admin"
        className="text-white/40 text-sm hover:text-white/60 transition-colors w-fit"
      >
        ← 관리자 대시보드
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tighter">
          {project.project_name || `프로젝트 ${project.project_number}`}
        </h1>
        <p className="text-white/50 mt-1">
          {project.company} · {project.name} · {project.email}
        </p>
      </header>

      {/* 상담 정보 */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">상담 정보</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <Info label="프로젝트 유형" value={project.project_type} />
          <Info label="목적" value={project.project_purpose} />
          <Info label="타겟" value={project.target_user} />
          <Info label="예산" value={project.budget} />
          <Info label="일정" value={project.timeline} />
          <Info label="유지보수" value={project.maintenance} />
          <Info label="디자인" value={project.design_status} />
          <div className="col-span-2 sm:col-span-3">
            <Info label="핵심 기능" value={features} />
          </div>
          {project.reference_url && (
            <div className="col-span-2 sm:col-span-3">
              <Info label="레퍼런스" value={project.reference_url} />
            </div>
          )}
          {project.message && (
            <div className="col-span-2 sm:col-span-3">
              <Info label="추가 요청" value={project.message} />
            </div>
          )}
        </div>
      </section>

      {/* AI 제안서 */}
      {project.proposal && (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">AI 제안서</h2>
          <p className="text-sm text-white/50">
            {project.proposal.title} — {project.proposal.sections?.length || 0}개 섹션
          </p>
        </section>
      )}

      {/* 미팅 */}
      {meetings && meetings.length > 0 && (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">미팅 예약</h2>
          {meetings.map((m: Record<string, string>) => (
            <div key={m.id} className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Info label="날짜" value={m.preferred_date} />
              <Info label="시간" value={m.preferred_time} />
              <Info label="방법" value={m.method} />
              <Info label="연락처" value={m.contact_phone} />
            </div>
          ))}
        </section>
      )}

      {/* Notion & Actions */}
      <AdminProjectActions
        projectId={project.id}
        step={project.step}
        notionPageId={project.notion_page_id}
        documentUrls={project.document_urls}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/40 text-xs">{label}</span>
      <p className="text-white/80">{value}</p>
    </div>
  );
}
