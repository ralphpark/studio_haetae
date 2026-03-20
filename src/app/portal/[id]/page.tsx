import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProposalView } from "@/components/portal/ProposalView";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    redirect("/portal");
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col gap-8">
      {/* Back + Header */}
      <div className="flex flex-col gap-4">
        <a
          href="/portal"
          className="text-white/40 text-sm hover:text-white/60 transition-colors w-fit"
        >
          ← 대시보드로 돌아가기
        </a>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">
            {project.project_name || `프로젝트 ${project.project_number}`}
          </h1>
          <span className="text-white/30 text-sm font-mono">
            #{String(project.project_number).padStart(3, "0")}
          </span>
        </div>
        <p className="text-white/50">
          {project.company} · {project.project_type} · {project.budget}
        </p>
      </div>

      {/* Proposal Section */}
      <ProposalView
        projectId={project.id}
        initialProposal={project.proposal}
        consultationSummary={{
          company: project.company,
          projectType: project.project_type,
          projectPurpose: project.project_purpose,
          targetUser: project.target_user,
          features: project.features,
          designStatus: project.design_status,
          budget: project.budget,
          timeline: project.timeline,
          maintenance: project.maintenance,
        }}
      />
    </div>
  );
}
