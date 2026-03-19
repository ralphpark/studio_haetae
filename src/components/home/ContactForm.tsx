"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ContactForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => setStep((p) => Math.min(p + 1, 3));
  const handlePrev = () => setStep((p) => Math.max(p - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "33%" }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="form"
            onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
            className="p-10 flex flex-col h-full justify-between"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-col gap-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <h3 className="text-2xl font-bold">1. 기본 정보</h3>
                  <p className="text-white/60 text-sm">스튜디오 해태와 함께할 파트너님의 정보를 알려주세요.</p>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">담당자 / 대표자명</label>
                    <input name="name" required value={formData.name} onChange={handleChange} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all placeholder:text-white/20" placeholder="홍길동" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">이메일 주소</label>
                    <input name="email" type="email" required value={formData.email} onChange={handleChange} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all placeholder:text-white/20" placeholder="hello@company.com" />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <h3 className="text-2xl font-bold">2. 비즈니스 세부사항</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">회사 및 서비스명</label>
                    <input name="company" required value={formData.company} onChange={handleChange} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all placeholder:text-white/20" placeholder="Company Inc." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">프로젝트 예상 예산</label>
                    <select name="budget" required value={formData.budget} onChange={handleChange as any} className="px-4 py-3 bg-[#111] border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all text-white">
                      <option value="" disabled>예산을 선택해주세요</option>
                      <option value="1천만 원 이하">1천만 ~ 3천만 원</option>
                      <option value="3천만 ~ 5천만 원">3천만 ~ 5천만 원</option>
                      <option value="5천만 원 이상">5천만 원 이상 (엔터프라이즈)</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <h3 className="text-2xl font-bold">3. 프로젝트 내용</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">원하시는 방향성이나 레퍼런스가 있나요?</label>
                    <textarea name="message" required value={formData.message} onChange={handleChange} rows={5} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all placeholder:text-white/20 resize-none" placeholder="비즈니스 목표와 중요하게 생각하시는 기능들을 자유롭게 적어주세요." />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex justify-between mt-12">
              <button type="button" onClick={handlePrev} className={`px-6 py-2 rounded-full text-sm font-medium transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-white/10'}`}>
                이전
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-white text-black rounded-full font-medium active:scale-95 transition-all outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50">
                {step === 3 ? (isSubmitting ? "처리 중..." : "제출하기") : "다음"}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 flex flex-col items-center justify-center h-full text-center gap-6"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-3xl font-bold">전송 성공</h3>
            <p className="text-white/60">
              Notion 데이터베이스에 기획서 초안이 생성되었습니다.<br />
              입력해주신 이메일로 안내 메일이 발송되었습니다 확인해주세요.
            </p>
            <button onClick={() => setIsSuccess(false)} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-colors">
              다시 작성하기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
