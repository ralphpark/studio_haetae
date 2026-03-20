import { requireAdmin } from "@/utils/admin";
import Link from "next/link";

const STEP_LABELS: Record<number, string> = {
  0: "상담 완료",
  1: "제안서 확인",
  2: "미팅 예약",
  3: "기획서 대기",
  4: "킥오프 대기",
};

const STEP_COLORS: Record<number, string> = {
  0: "bg-white/10 text-white/50",
  1: "bg-blue-500/20 text-blue-400",
  2: "bg-yellow-500/20 text-yellow-400",
  3: "bg-purple-500/20 text-purple-400",
  4: "bg-green-500/20 text-green-400",
};

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, company, project_number, project_name, project_type, budget, step, status, created_at, name, email")
    .order("created_at", { ascending: false });

  const list = projects || [];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col gap-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">Admin Dashboard</h1>
          <p className="text-white/50 mt-1">전체 프로젝트 관리</p>
        </div>
        <Link
          href="/portal"
          className="px-4 py-2 text-sm text-white/50 hover:text-white/70 border border-white/10 rounded-full transition-colors"
        >
          클라이언트 포털
        </Link>
      </header>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <Stat label="전체" value={list.length} />
        <Stat label="미팅 대기" value={list.filter((p) => p.step === 2).length} />
        <Stat label="기획서 작성 필요" value={list.filter((p) => p.step === 2 || p.step === 3).length} />
      </div>

      {/* Project List */}
      <div className="flex flex-col gap-3">
        {list.map((project) => (
          <Link
            key={project.id}
            href={`/admin/${project.id}`}
            className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-white/20 text-sm font-mono shrink-0">
                #{String(project.project_number).padStart(3, "0")}
              </span>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {project.project_name || `프로젝트 ${project.project_number}`}
                </p>
                <p className="text-white/40 text-sm truncate">
                  {project.company} · {project.name} · {project.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-white/40 text-xs hidden sm:block">
                {project.project_type}
              </span>
              <span className="text-white/40 text-xs hidden sm:block">
                {project.budget}
              </span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${STEP_COLORS[project.step] || STEP_COLORS[0]}`}>
                {STEP_LABELS[project.step] || `Step ${project.step}`}
              </span>
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <p className="text-white/30 text-center py-12">프로젝트가 없습니다</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-white/50 text-sm ml-2">{label}</span>
    </div>
  );
}
