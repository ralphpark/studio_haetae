import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProposalView } from "@/components/portal/ProposalView";

export const dynamic = "force-dynamic";

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

  // Fetch meeting if exists
  const { data: meetings } = await supabase
    .from("meetings")
    .select("preferred_date, preferred_time, method, contact_phone, status, meet_link, discord_invite")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const meeting = meetings?.[0] || null;

  // Fetch contract if exists
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, status, contract_html, admin_signature_url, client_signature_url, client_name, signed_at")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const contract = contracts?.[0] || null;

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

      {/* Step-based flow */}
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
        step={project.step}
        meeting={meeting}
        documentUrls={project.document_urls}
        planningDoc={project.planning_doc}
        estimate={project.estimate}
        docsRequested={project.docs_requested ?? false}
        docsConfirmed={project.docs_confirmed ?? false}
        notionPublicUrl={project.notion_public_url}
        contract={contract}
      />
    </div>
  );
}
