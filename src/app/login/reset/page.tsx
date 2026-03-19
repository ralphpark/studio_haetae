"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const inputClass =
  "px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all placeholder:text-white/20 w-full";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("success");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm flex flex-col gap-6 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl"
      >
        <div className="flex flex-col gap-2 text-center mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">새 비밀번호 설정</h1>
          <p className="text-sm text-white/50">새로 사용할 비밀번호를 입력해주세요.</p>
        </div>

        {status === "success" && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
            비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다...
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {status !== "success" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">새 비밀번호 (6자 이상)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                className={inputClass}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">비밀번호 확인</label>
              <input
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => { setPasswordConfirm(e.target.value); setErrorMsg(""); }}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full px-4 py-3 text-sm font-semibold bg-white text-black rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {status === "loading" ? "처리 중..." : "비밀번호 변경"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
