"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const TOTAL_STEPS = 5;

const inputClass =
  "px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all placeholder:text-white/20 w-full";

const selectClass =
  "px-4 py-3 bg-[#111] border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all text-white w-full";

const PROJECT_TYPES = [
  "웹사이트 (기업/브랜드)",
  "웹 애플리케이션 (SaaS)",
  "모바일 앱",
  "업무 자동화 (n8n)",
  "기존 서비스 리뉴얼",
  "기타",
];

const PROJECT_PURPOSES = [
  "신규 사업 런칭",
  "기존 시스템 교체",
  "서비스 확장/고도화",
  "MVP 검증",
  "기타",
];

const TARGET_USERS = ["B2B (기업 고객)", "B2C (일반 사용자)", "내부 직원용", "기타"];

const FEATURES = [
  "회원가입/로그인",
  "결제/구독",
  "관리자 페이지",
  "대시보드/통계",
  "게시판/커뮤니티",
  "채팅/메시징",
  "검색/필터",
  "알림 (이메일/푸시)",
  "파일 업로드/관리",
  "외부 API 연동",
];

const DESIGN_STATUSES = [
  "디자인 시안이 있어요",
  "레퍼런스/참고 사이트만 있어요",
  "디자인도 함께 의뢰할게요",
];

const BUDGETS = [
  "1천만 원 미만",
  "1천만 ~ 3천만 원",
  "3천만 ~ 5천만 원",
  "5천만 ~ 1억 원",
  "1억 원 이상",
  "협의 필요",
];

const TIMELINES = [
  "1개월 이내 (긴급)",
  "1 ~ 3개월",
  "3 ~ 6개월",
  "6개월 이상",
  "미정 (협의 필요)",
];

const MAINTENANCE_OPTIONS = [
  "유지보수 필요 (월 단위)",
  "유지보수 불필요 (납품 완료)",
  "논의 후 결정",
];

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  projectPurpose: string;
  targetUser: string;
  features: string[];
  designStatus: string;
  budget: string;
  timeline: string;
  maintenance: string;
  referenceUrl: string;
  message: string;
}

function ChipSelect({
  options,
  value,
  onChange,
  multiple = false,
}: {
  options: string[];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  multiple?: boolean;
}) {
  const handleClick = (option: string) => {
    if (multiple) {
      const arr = value as string[];
      onChange(
        arr.includes(option)
          ? arr.filter((v) => v !== option)
          : [...arr, option]
      );
    } else {
      onChange(option === value ? "" : option);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = multiple
          ? (value as string[]).includes(option)
          : value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleClick(option)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              isSelected
                ? "bg-white text-black border-white"
                : "bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white"
            }`}
          >
            {isSelected && multiple && (
              <span className="mr-1.5">&#10003;</span>
            )}
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function ContactForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    projectType: "",
    projectPurpose: "",
    targetUser: "",
    features: [],
    designStatus: "",
    budget: "",
    timeline: "",
    maintenance: "",
    referenceUrl: "",
    message: "",
  });

  // 로그인 상태면 유저 정보에서 프리필
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata || {};
      setFormData((prev) => ({
        ...prev,
        name: meta.name || prev.name,
        email: user.email || prev.email,
        phone: meta.phone || prev.phone,
        company: meta.company || prev.company,
      }));
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email && formData.company);
      case 2:
        return !!(formData.projectType && formData.projectPurpose && formData.targetUser);
      case 3:
        return !!(formData.features.length > 0 && formData.designStatus);
      case 4:
        return !!(formData.budget && formData.timeline && formData.maintenance);
      case 5:
        return true; // optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) setStep((p) => Math.min(p + 1, TOTAL_STEPS));
  };
  const handlePrev = () => setStep((p) => Math.max(p - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      sessionStorage.setItem("pendingConsultation", JSON.stringify(formData));
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepAnim = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative min-h-[460px]">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "20%" }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step indicator */}
      {!isSuccess && (
        <div className="flex justify-center gap-2 pt-8 pb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i + 1 === step
                  ? "bg-white w-6"
                  : i + 1 < step
                    ? "bg-white/60"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key={`step-${step}`}
            onSubmit={
              step === TOTAL_STEPS
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    handleNext();
                  }
            }
            className="px-8 pb-8 pt-4 sm:px-10 sm:pb-10 flex flex-col h-full justify-between"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-col gap-5">
              {/* Step 1: 기본 정보 */}
              {step === 1 && (
                <motion.div {...stepAnim} className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-2xl font-bold">1. 기본 정보</h3>
                    <p className="text-white/50 text-sm mt-1">
                      파트너님의 정보를 알려주세요.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-white/70">
                        담당자명 <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-white/70">
                        연락처
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="010-1234-5678"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/70">
                      이메일 <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="hello@company.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/70">
                      회사/서비스명 <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Company Inc."
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: 프로젝트 개요 */}
              {step === 2 && (
                <motion.div {...stepAnim} className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-2xl font-bold">2. 프로젝트 개요</h3>
                    <p className="text-white/50 text-sm mt-1">
                      어떤 프로젝트를 구상하고 계신가요?
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      프로젝트 유형 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={PROJECT_TYPES}
                      value={formData.projectType}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, projectType: v as string }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      프로젝트 목적 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={PROJECT_PURPOSES}
                      value={formData.projectPurpose}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, projectPurpose: v as string }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      주 사용자 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={TARGET_USERS}
                      value={formData.targetUser}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, targetUser: v as string }))
                      }
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: 기능 & 디자인 */}
              {step === 3 && (
                <motion.div {...stepAnim} className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-2xl font-bold">3. 기능 & 디자인</h3>
                    <p className="text-white/50 text-sm mt-1">
                      필요한 기능을 모두 선택해주세요.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      핵심 기능 <span className="text-white/40">(복수 선택)</span>{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={FEATURES}
                      value={formData.features}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, features: v as string[] }))
                      }
                      multiple
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      디자인 현황 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={DESIGN_STATUSES}
                      value={formData.designStatus}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, designStatus: v as string }))
                      }
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: 예산 & 일정 */}
              {step === 4 && (
                <motion.div {...stepAnim} className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-2xl font-bold">4. 예산 & 일정</h3>
                    <p className="text-white/50 text-sm mt-1">
                      프로젝트 예산과 일정을 알려주세요.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      예상 예산 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={BUDGETS}
                      value={formData.budget}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, budget: v as string }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      희망 일정 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={TIMELINES}
                      value={formData.timeline}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, timeline: v as string }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/70">
                      유지보수 <span className="text-red-400">*</span>
                    </label>
                    <ChipSelect
                      options={MAINTENANCE_OPTIONS}
                      value={formData.maintenance}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, maintenance: v as string }))
                      }
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 5: 추가 사항 */}
              {step === 5 && (
                <motion.div {...stepAnim} className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-2xl font-bold">5. 추가 사항</h3>
                    <p className="text-white/50 text-sm mt-1">
                      참고할 레퍼런스나 추가 요청이 있으면 알려주세요.{" "}
                      <span className="text-white/30">(선택)</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/70">
                      벤치마킹/레퍼런스 URL
                    </label>
                    <input
                      name="referenceUrl"
                      value={formData.referenceUrl}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/70">
                      추가 요청사항
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 outline-none transition-all placeholder:text-white/20 resize-none"
                      placeholder="차별화 포인트, 특수 요구사항, 법적/보안 제약 등 자유롭게 적어주세요."
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-10">
              <button
                type="button"
                onClick={handlePrev}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-opacity ${
                  step === 1
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100 hover:bg-white/10"
                }`}
              >
                이전
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isStepValid()}
                className="px-6 py-2 bg-white text-black rounded-full font-medium active:scale-95 transition-all outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === TOTAL_STEPS
                  ? isSubmitting
                    ? "처리 중..."
                    : "제출하기"
                  : "다음"}
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
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold">상담 내용이 작성되었습니다</h3>
            <p className="text-white/60">
              로그인 또는 회원가입을 완료하시면
              <br />
              상담 내용이 저장되고 전용 대시보드에서 확인하실 수 있습니다.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-2 px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 active:scale-95 transition-all"
            >
              로그인 / 회원가입
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
