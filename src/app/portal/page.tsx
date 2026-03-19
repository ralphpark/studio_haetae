import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/portal/LogoutButton";

interface Project {
  id: string;
  project_number: number;
  company: string;
  project_type: string;
  project_purpose: string;
  target_user: string;
  features: string[];
  design_status: string;
  budget: string;
  timeline: string;
  maintenance: string;
  reference_url: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  "상담 접수": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "기획 진행": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "개발 진행": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "완료": "bg-green-500/20 text-green-400 border-green-500/30",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "bg-white/10 text-white/60 border-white/20";
  return (
    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${color}`}>
      {status}
    </span>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const date = new Date(project.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">
              프로젝트 {project.project_number}
            </h3>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-white/40 text-sm">{date}</p>
        </div>
        <span className="text-white/20 text-sm font-mono">
          #{String(project.project_number).padStart(3, "0")}
        </span>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <InfoItem label="프로젝트 유형" value={project.project_type} />
        <InfoItem label="프로젝트 목적" value={project.project_purpose} />
        <InfoItem label="타겟 사용자" value={project.target_user} />
        <InfoItem label="예산" value={project.budget} />
        <InfoItem label="일정" value={project.timeline} />
        <InfoItem label="유지보수" value={project.maintenance} />
      </div>

      {/* Features */}
      <div className="mb-4">
        <p className="text-xs font-medium text-white/40 mb-2">핵심 기능</p>
        <div className="flex flex-wrap gap-1.5">
          {project.features.map((feat) => (
            <span
              key={feat}
              className="px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-white/70"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Design Status */}
      <div className="mb-4">
        <p className="text-xs font-medium text-white/40 mb-1">디자인</p>
        <p className="text-sm text-white/70">{project.design_status}</p>
      </div>

      {/* Optional fields */}
      {project.reference_url && (
        <div className="mb-4">
          <p className="text-xs font-medium text-white/40 mb-1">레퍼런스</p>
          <a
            href={project.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 underline hover:text-white transition-colors break-all"
          >
            {project.reference_url}
          </a>
        </div>
      )}

      {project.message && (
        <div>
          <p className="text-xs font-medium text-white/40 mb-1">추가 요청사항</p>
          <p className="text-sm text-white/60 whitespace-pre-wrap">{project.message}</p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-white/40">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">아직 등록된 프로젝트가 없습니다</h3>
      <p className="text-white/50 text-sm max-w-sm">
        메인 페이지에서 상담 폼을 작성하시면 여기에 프로젝트가 표시됩니다.
      </p>
      <a
        href="/#contact"
        className="mt-6 px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all"
      >
        상담 신청하기
      </a>
    </div>
  );
}

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user.user_metadata?.name || user.email;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const projectList = (projects || []) as Project[];

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col gap-10">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">
            Project Dashboard
          </h1>
          <p className="text-white/50 text-base">
            Welcome back, {userName}.
          </p>
        </div>
        <LogoutButton />
      </header>

      {/* Summary */}
      {projectList.length > 0 && (
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-2xl font-bold">{projectList.length}</span>
            <span className="text-white/50 text-sm ml-2">프로젝트</span>
          </div>
        </div>
      )}

      {/* Project List */}
      {projectList.length > 0 ? (
        <section className="flex flex-col gap-6">
          {projectList.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
