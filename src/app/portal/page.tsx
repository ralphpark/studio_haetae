import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tighter">Project Dashboard</h1>
        <p className="text-white/60 text-lg">
          Welcome back. Here is your project overview and progress.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="col-span-1 md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-6">Current Progress</h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <span className="text-sm text-white/70">Milestone 2: Frontend Development</span>
              <span className="text-2xl font-bold">45%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-1000 ease-out" 
                style={{ width: "45%" }} 
              />
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="col-span-1 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Documents</h2>
          <div className="flex flex-col gap-3">
            <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors">
              <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg">📄</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Project PRD</span>
                <span className="text-xs text-white/50">Updated 2 days ago</span>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors">
              <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg">📋</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Contract & Invoice</span>
                <span className="text-xs text-white/50">Paid</span>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
