"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

interface ProposalSection {
  id: string;
  title: string;
  content: string;
}

interface Proposal {
  title: string;
  sections: ProposalSection[];
}

const SECTION_NUMBERS: Record<string, string> = {
  analysis: "01",
  strategy: "02",
  scope: "03",
  schedule: "04",
  budget: "05",
  team: "06",
};

export function ProposalModal({
  proposal,
  onClose,
}: {
  proposal: Proposal;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-3xl mx-4 my-12 flex flex-col gap-4 pb-8"
      >
        {/* Header */}
        <div className="bg-[#0f1211] border border-white/10 rounded-2xl p-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-white/40 text-xs font-medium tracking-widest uppercase mb-3">
            Project Proposal
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">{proposal.title}</h2>
          <p className="text-white/30 text-sm mt-2">Studio HaeTae</p>
        </div>

        {/* Sections */}
        {proposal.sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#0f1211] border border-white/10 rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-white/10 text-3xl font-bold font-mono leading-none shrink-0">
                {SECTION_NUMBERS[section.id] || String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold">{section.title}</h3>
            </div>
            <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap pl-0 sm:pl-12">
              {section.content}
            </div>
          </motion.div>
        ))}

        {/* Close button at bottom */}
        <div className="flex justify-center pb-8">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 active:scale-95 transition-all"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
