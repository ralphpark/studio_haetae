"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const inputClass =
  "px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all placeholder:text-white/20 w-full";

type Mode = "login" | "signup" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [hasPending, setHasPending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  useEffect(() => {
    const pending = sessionStorage.getItem("pendingConsultation");
    if (pending) {
      setHasPending(true);
      const data = JSON.parse(pending);
      setForm((prev) => ({ ...prev, name: data.name || "", email: data.email || "" }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // 인증 후 pending consultation 처리
  const handlePostAuth = async () => {
    const pending = sessionStorage.getItem("pendingConsultation");
    if (pending) {
      try {
        await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: pending,
        });
        sessionStorage.removeItem("pendingConsultation");
      } catch (err) {
        console.error("Failed to submit consultation:", err);
      }
    }
    router.push("/portal");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
      return;
    }

    await handlePostAuth();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (form.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // 이메일 확인이 꺼져있으면 바로 로그인 처리
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      // 이메일 확인이 켜져있는 경우
      setSuccessMsg("회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.");
      setMode("login");
      setIsLoading(false);
      return;
    }

    await handlePostAuth();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/login/reset`,
    });

    if (error) {
      setError("오류가 발생했습니다. 이메일 주소를 확인해주세요.");
    } else {
      setSuccessMsg("비밀번호 재설정 링크가 이메일로 발송되었습니다.");
    }
    setIsLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Pending consultation notice */}
      {hasPending && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm mb-4 p-3 bg-white/5 border border-white/10 rounded-xl text-center"
        >
          <p className="text-white/60 text-sm">
            작성하신 상담 내용이 있습니다.
            <br />
            로그인 또는 회원가입 후 자동으로 저장됩니다.
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* LOGIN */}
        {mode === "login" && (
          <motion.form
            key="login"
            onSubmit={handleLogin}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 w-full max-w-sm flex flex-col gap-6 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <div className="flex flex-col gap-2 text-center mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">Client Portal</h1>
              <p className="text-sm text-white/50">프로젝트 대시보드에 로그인하세요.</p>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
                {successMsg}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/70">이메일</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="client@company.com" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/70">비밀번호</label>
                <input name="password" type="password" required value={form.password} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 w-full px-4 py-3 text-sm font-semibold bg-white text-black rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? "로그인 중..." : "로그인"}
            </button>

            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={() => switchMode("signup")} className="text-white/50 text-sm hover:text-white/70 transition-colors">
                계정이 없으신가요? <span className="underline">회원가입</span>
              </button>
              <button type="button" onClick={() => switchMode("reset")} className="text-white/30 text-xs hover:text-white/50 transition-colors">
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </motion.form>
        )}

        {/* SIGNUP */}
        {mode === "signup" && (
          <motion.form
            key="signup"
            onSubmit={handleSignup}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 w-full max-w-sm flex flex-col gap-6 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <div className="flex flex-col gap-2 text-center mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
              <p className="text-sm text-white/50">프로젝트 대시보드 계정을 생성하세요.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/70">이름</label>
                <input name="name" required value={form.name} onChange={handleChange} className={inputClass} placeholder="홍길동" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/70">이메일</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="client@company.com" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/70">비밀번호 (6자 이상)</label>
                <input name="password" type="password" required value={form.password} onChange={handleChange} className={inputClass} placeholder="••••••••" minLength={6} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/70">비밀번호 확인</label>
                <input name="passwordConfirm" type="password" required value={form.passwordConfirm} onChange={handleChange} className={inputClass} placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 w-full px-4 py-3 text-sm font-semibold bg-white text-black rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? "처리 중..." : "회원가입"}
            </button>

            <button type="button" onClick={() => switchMode("login")} className="text-white/50 text-sm hover:text-white/70 transition-colors text-center">
              이미 계정이 있으신가요? <span className="underline">로그인</span>
            </button>
          </motion.form>
        )}

        {/* RESET PASSWORD */}
        {mode === "reset" && (
          <motion.form
            key="reset"
            onSubmit={handleResetPassword}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 w-full max-w-sm flex flex-col gap-6 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <div className="flex flex-col gap-2 text-center mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">비밀번호 찾기</h1>
              <p className="text-sm text-white/50">가입하신 이메일로 재설정 링크를 보내드립니다.</p>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
                {successMsg}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {!successMsg && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/70">이메일 주소</label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="client@company.com" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full px-4 py-3 text-sm font-semibold bg-white text-black rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
                  {isLoading ? "전송 중..." : "재설정 링크 보내기"}
                </button>
              </>
            )}

            <button type="button" onClick={() => switchMode("login")} className="text-white/40 text-sm hover:text-white/60 transition-colors text-center">
              ← 로그인으로 돌아가기
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
