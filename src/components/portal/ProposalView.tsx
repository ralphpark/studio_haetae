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
        <p className="text-white/40 text-sm mt-2">Studio HaeTae</p>
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
            {error && (
              <div className="flex justify-center">
                <button
                  onClick={generate}
                  disabled={isGenerating}
                  className="px-6 py-2 text-sm text-white/40 hover:text-white/60 transition-colors disabled:opacity-30"
                >
                  {isGenerating ? "확인 중..." : "다시 확인하기"}
                </button>
              </div>
            )}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              제안서가 준비되었습니다
            </h3>
            <p className="text-white/50 text-sm max-w-sm mb-6">
              상담 내용을 기반으로 Studio HaeTae의 제안서를 확인해보세요.
            </p>
            {error && (
              <p className="text-white/50 text-sm mb-4">
                잠시 후 다시 확인해주세요.
              </p>
            )}
            <button
              onClick={generate}
              disabled={isGenerating}
              className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? "확인 중..." : "제안서 확인하기"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
