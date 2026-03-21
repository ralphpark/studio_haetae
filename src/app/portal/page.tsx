import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { Navbar } from "@/components/layout/Navbar";

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

  const projectList = projects || [];

  return (
    <>
      <Navbar />
      <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
        <header className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">
              Project Dashboard
            </h1>
            <p className="text-white/50 text-base">
              Welcome back, {userName}.
            </p>
          </div>
        </header>

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
    </>
  );
}
