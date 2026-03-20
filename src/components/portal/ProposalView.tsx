"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProposalSection {
  id: string;
  title: string;
  content: string;
}

interface Proposal {
  title: string;
  sections: ProposalSection[];
}

interface ConsultationSummary {
  company: string;
  projectType: string;
  projectPurpose: string;
  targetUser: string;
  features: string[];
  designStatus: string;
  budget: string;
  timeline: string;
  maintenance: string;
}

const SECTION_ICONS: Record<string, string> = {
  analysis: "01",
  strategy: "02",
  scope: "03",
  schedule: "04",
  budget: "05",
  team: "06",
};

function ProposalSections({ proposal }: { proposal: Proposal }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      {/* Title */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-white/40 text-xs font-medium tracking-widest uppercase mb-3">
          Project Proposal
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold">{proposal.title}</h2>
        <p className="text-white/40 text-sm mt-2">
          Powered by AI · Studio HaeTae
        </p>
      </div>

      {/* Sections */}
      {proposal.sections.map((section, i) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <span className="text-white/15 text-3xl font-bold font-mono leading-none shrink-0">
              {SECTION_ICONS[section.id] || String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-bold">{section.title}</h3>
          </div>
          <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap pl-0 sm:pl-12">
            {section.content}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ConsultationCard({ data }: { data: ConsultationSummary }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
      <h3 className="text-lg font-bold mb-4">상담 요약</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <Item label="프로젝트 유형" value={data.projectType} />
        <Item label="프로젝트 목적" value={data.projectPurpose} />
        <Item label="타겟 사용자" value={data.targetUser} />
        <Item label="예산" value={data.budget} />
        <Item label="일정" value={data.timeline} />
        <Item label="유지보수" value={data.maintenance} />
        <Item label="디자인" value={data.designStatus} />
        <div className="sm:col-span-2">
          <span className="text-white/40 text-xs">핵심 기능</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.features.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/60"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/40 text-xs">{label}</span>
      <p className="text-white/80">{value}</p>
    </div>
  );
}

export function ProposalView({
  projectId,
  initialProposal,
  consultationSummary,
}: {
  projectId: string;
  initialProposal: Proposal | null;
  consultationSummary: ConsultationSummary;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(initialProposal);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/proposal`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "생성 실패");
      }

      const { proposal: newProposal } = await res.json();
      setProposal(newProposal);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "기획서 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Consultation Summary (always visible) */}
      <ConsultationCard data={consultationSummary} />

      {/* Proposal */}
      <AnimatePresence mode="wait">
        {proposal ? (
          <div className="flex flex-col gap-6" key="proposal">
            <ProposalSections proposal={proposal} />
            <div className="flex justify-center">
              <button
                onClick={generate}
                disabled={isGenerating}
                className="px-6 py-2 text-sm text-white/40 hover:text-white/60 transition-colors disabled:opacity-30"
              >
                {isGenerating ? "재생성 중..." : "기획서 다시 생성하기"}
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center bg-white/5 border border-white/10 rounded-2xl"
          >
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              AI 기획서를 생성해보세요
            </h3>
            <p className="text-white/50 text-sm max-w-sm mb-6">
              상담 내용을 기반으로 프로젝트 제안서를 자동으로 작성합니다.
              <br />
              분석, 전략, 기술 스택, 일정, 견적까지 한번에.
            </p>
            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}
            <button
              onClick={generate}
              disabled={isGenerating}
              className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  기획서 생성 중...
                </span>
              ) : (
                "AI 기획서 생성하기"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
