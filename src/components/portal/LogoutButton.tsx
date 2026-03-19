"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-white/10 rounded-full text-white/50 hover:text-white hover:border-white/30 transition-all active:scale-95"
    >
      Logout
    </button>
  );
}
